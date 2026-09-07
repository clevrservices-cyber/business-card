# Production frontend image. Builds a plain Node-runnable server (Nitro's
# node-server preset) instead of the Cloudflare target this template defaults
# to — NITRO_PRESET is read by Nitro itself before the Lovable build-config
# wrapper's Cloudflare default applies, so no vite.config.ts edit is needed.
# NODE_ENV=production at build time matters: without it the SSR bundle picks
# React's dev JSX transform (jsx-dev-runtime), which isn't included in this
# preset's traced output and fails at request time with
# "jsxDEV is not a function" — found by actually booting the build, not assumed.
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN bun run build

# Nitro's node-server preset traces and bundles its own runtime deps into
# .output/server/node_modules, so the runtime image just needs that directory
# copied over — no second install.
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production
ENV PORT=3020
EXPOSE 3020
CMD ["bun", ".output/server/index.mjs"]
