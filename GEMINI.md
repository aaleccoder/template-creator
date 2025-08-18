# Project Overview

This is a Next.js 15 application built with TypeScript and React 19. It serves as a "Template Creator," allowing users to generate documents from pre-defined templates. The backend is powered by PocketBase, which stores templates, generated documents, and assets like images and PDFs. The application features a dynamic form renderer that builds forms from a JSON schema, client-side validation, and PDF generation using Gotenberg.

## Key Technologies

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **UI:** React 19, Tailwind CSS, shadcn/ui
*   **Backend:** PocketBase
*   **PDF Generation:** Gotenberg (via `gotenberg-js` client)
*   **Templating:** Handlebars

# Building and Running

## Prerequisites

*   Node.js or Bun
*   PocketBase running locally (default: `http://127.0.0.1:8090`)
*   Gotenberg running locally

## Installation

```bash
# Using npm
npm install

# Using bun
bun install
```

## Running the Development Server

```bash
# Using npm
npm run dev

# Using bun
bun run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

```bash
npm run build
```

## Running in Production

```bash
npm run start
```

# Development Conventions

## Code Style

The project uses ESLint and Prettier for code linting and formatting. The configuration can be found in `.eslintrc.json` and `.prettierrc`. It is recommended to use an editor extension to automatically format code on save.

## Testing

There are no testing frameworks configured in `package.json`.

## Environment Variables

The application uses environment variables to configure the PocketBase and Gotenberg URLs. These are hardcoded in the respective library files (`lib/pocketbase.ts` and `lib/pdf.ts`) and should be refactored to use a `.env` file.

*   `POCKETBASE_URL`: The URL of the PocketBase instance.
*   `GOTENBERG_ENDPOINT`: The URL of the Gotenberg instance.

## PocketBase Setup

The application expects the following collections to be present in the PocketBase instance:

*   `templates`: Stores the templates, including the HTML, CSS, and JSON schema.
*   `generated_documents`: Stores the generated documents, including the form data and rendered HTML.
*   `assets`: Stores uploaded images and generated PDFs.

## API Routes

The application exposes several API routes under `app/api`:

*   `/api/templates/[id]`: Fetches a template by ID.
*   `/api/documents`: Lists and creates generated documents.
*   `/api/documents/[id]`: Fetches, updates, and deletes a document by ID.
*   `/api/documents/[id]/pdf`: Generates or serves a cached PDF for a document.
*   `/api/assets`: Handles image uploads.
