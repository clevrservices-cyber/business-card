# Card Capture

Build a modern, clean Business Card Scanner frontend.

IMPORTANT ARCHITECTURAL RULE:

This is a FRONTEND-ONLY task.

Do NOT create:

Database tables

Supabase schema

Database migrations

Backend services

Edge functions

Server-side OCR

AI API integrations

Authentication

Persistent business-card storage

CRM integrations

Business-card database models

Any backend architecture

The backend/application logic will be implemented separately by Claude Code. The frontend must therefore remain completely independent of any database or backend implementation.

PURPOSE

The application allows a user to photograph or upload a business card and extract contact information from it using AI.

A business card can have:

Front side only

Front + back side

The user should be able to provide both sides when necessary.

The frontend should eventually communicate with a backend API, but for now create the UI and clean API integration placeholders/interfaces only.

MAIN USER FLOW

Step 1 — Scan Business Card

Create a main screen titled:

"Scan Business Card"

Provide two clear options:

"Take Photo"

"Upload Image"

The interface should work well on:

Desktop

Tablet

Mobile

For mobile, the camera/upload experience should feel natural.

Allow the user to capture or select the front of the business card.

After the front image is selected, show a high-quality preview.

Step 2 — Ask About Back Side

After the front image is provided, show:

"Does this business card have information on the back?"

Options:

"Yes, scan back"

"No, continue"

If the user chooses "Yes", allow them to take/upload the back-side image.

Display both images clearly:

FRONT
[image preview]

BACK
[image preview]

Allow the user to retake/replace either image.

Step 3 — Review Before Processing

Show a review screen containing:

Front image

Back image if provided

"Scan Business Card" button

The user should be able to go back and replace either image.

Step 4 — Processing State

When processing starts, show a professional processing screen.

Example:

"Analyzing your business card..."

Show progress stages such as:

Reading card

Detecting contact information

Identifying name and company

Validating contact details

Preparing contact

The progress indicators should be visual but should NOT pretend to report actual backend progress unless such progress is later provided by the API.

For now, these can be simulated frontend states.

Step 5 — Results Screen

Create a clean contact-information results interface.

The result screen should be designed to display the following possible fields:

Person

First name

Middle name

Last name

Full name

Job title

Department

Company

Company name

Company website

Company tagline

Phone

Support multiple numbers and types:

Mobile

Direct

Office

Home

Fax

Other

Email

Support multiple email addresses.

Address

Support:

Street

Building

Suite

Floor

City

State/Province

Postal code

Country

Online / Social

Support:

LinkedIn

X/Twitter

Facebook

Instagram

GitHub

Other URLs

QR / Barcode

If a QR code or barcode is detected, provide a section showing that it was detected and the decoded content when available.

Notes

Allow additional extracted text or notes to be displayed.

IMPORTANT: EXTRACTION CONFIDENCE

The backend may eventually return confidence information for individual fields.

Design the frontend so fields can optionally display a confidence indicator.

For example:

Name John Smith ✓
Company ABC Robotics ✓
Phone +66... ⚠ Review

Do not implement the confidence calculation. The frontend should only be capable of displaying confidence information supplied by the backend.

EDITING EXTRACTED INFORMATION

The results screen must allow the user to edit extracted fields before accepting them.

Use a clean form layout.

Each field should be editable.

Allow:

Add phone

Remove phone

Add email

Remove email

Add website

Remove website

Edit address

Edit name

Edit company

Edit job title

Do not implement database saving.

The UI should have a clear:

"Confirm Contact"

button.

For now this button can simply represent the point where the frontend would send the finalized contact object to the backend.

ORIGINAL CARD REFERENCE

Keep the scanned business-card images accessible from the results screen.

Provide an option such as:

"View Original Card"

The user should be able to see:

Front

Back if available

This is important because users may want to verify information against the original card.

RESPONSIVE DESIGN

Design this as a polished production application.

Prioritize:

Mobile-first interaction

Large touch targets

Simple navigation

Minimal clutter

Clear visual hierarchy

Fast scanning workflow

The scanner should feel similar to a modern document-scanning application.

COMPONENT STRUCTURE

Create reusable frontend components where appropriate, for example:

BusinessCardScanner

ImageCapture

ImageUpload

CardPreview

SideSelector

ScanReview

ProcessingState

ContactResults

ContactField

PhoneList

EmailList

AddressForm

SocialLinks

OriginalCardViewer

Names can be adjusted if better conventions are used.

FRONTEND DATA CONTRACT

Do NOT create a database schema.

However, design the frontend so it can consume a future API response.

Use a temporary/mock TypeScript interface or mock data structure purely for frontend development.

The eventual backend may return something conceptually similar to:

{
"front_image": "...",
"back_image": "...",
"contact": {
"first_name": "...",
"middle_name": "...",
"last_name": "...",
"full_name": "...",
"job_title": "...",
"department": "...",
"company": "...",
"emails": [],
"phones": [],
"websites": [],
"address": {},
"social_links": [],
"qr_codes": [],
"tagline": "...",
"notes": "..."
},
"confidence": {}
}

This is ONLY a temporary frontend contract.

Do not create database tables or backend models from it.

API PLACEHOLDER

Create a clean abstraction for the future backend call, for example:

scanBusinessCard(frontImage, backImage?)

The implementation can initially use mock data.

The architecture should make it easy for Claude Code to later replace the mock implementation with the real API.

Do not choose or implement the backend technology.

Do not implement OpenAI, Claude, Gemini, OCR, OpenCV, PaddleOCR, or any other AI service.

ERROR STATES

Create professional UI states for:

Image too blurry

Image cannot be processed

Unsupported image format

Upload failed

Scan failed

No contact information detected

Only partial information detected

The frontend should display errors supplied by the backend without deciding why the scan failed.

IMPORTANT UX DETAIL

The user should NEVER be forced to scan the back side.

The back side is optional.

The ideal flow is:

Scan Front
→ Ask "Does it have a back?"
→ Scan Back OR Skip
→ Review
→ Analyze
→ Review extracted contact
→ Edit if necessary
→ Confirm

VISUAL STYLE

Use a professional, modern SaaS/mobile-app aesthetic.

Avoid excessive decoration.

The primary focus should be:

Business-card image

Scanning action

Extracted contact information

Use smooth transitions and subtle animations where appropriate.

The application should feel like a serious professional contact-management tool rather than a demo.

CRITICAL HANDOFF REQUIREMENT

Keep the frontend/backend boundary extremely clean.

Claude Code will implement:

Backend

AI/VLM processing

OCR if required

Image preprocessing

QR detection

Entity extraction

Validation

API

Data persistence

Future CRM integration

Lovable must NOT implement those parts.

Build the frontend so Claude Code can later connect its own backend without needing to restructure the application.

At the end, provide a clear explanation of:

Which frontend components were created

Where the mock API/interface is located

Where Claude Code should connect the real backend

What API response structure the frontend currently expects

Do not create any database or persistent storage.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://business-card-joy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/afbc06ff-449b-4a04-86c6-feb636797ab0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
