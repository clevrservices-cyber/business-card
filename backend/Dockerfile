FROM oven/bun:1-alpine

WORKDIR /app/backend

COPY package.json bun.lock* ./
RUN bun install

COPY . .

EXPOSE 8090

CMD ["bun", "src/main.ts"]
