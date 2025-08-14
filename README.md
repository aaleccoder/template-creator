# Template Creator

A Next.js application to create documents from pre-defined templates stored in PocketBase. Users can fill dynamic forms generated from a JSON schema, preview the resulting HTML (compiled with Handlebars), and generate or view cached PDFs. Images are uploaded and stored as assets in PocketBase. Robust client- and server-side validations are in place.

## Table of Contents
- Overview
- Key Features
- Tech Stack
- Project Structure
- Core Architecture
- Data Model (PocketBase)
- API Routes
- Frontend Flows
- Template Schema Specification
- Validations
- PDF Generation and Caching
- Image Upload Flow
- Authentication and Routing
- Local Development
- How to Add a New Template
- Known Limitations and Future Improvements
- File Index

## Overview
This project evolved from an initial GrapeJS + Appwrite editor concept into a streamlined system focused on:
- Using pre-defined templates stored in PocketBase
- Generating dynamic forms from a JSON schema
- Compiling templates with Handlebars (#if, #each) so optional sections render only when data exists
- Generating and caching PDFs on-demand using Puppeteer
- Strong validations for input types, email format, numerical ranges, and images

The current codebase is centered around PocketBase as backend and no longer uses Appwrite in runtime paths. The original README references Appwrite and GrapeJS; use this updated document going forward.

## Key Features
- Template hub for each template ID with:
  - List of generated documents
  - Creation of new documents via a form
  - Edit and Delete actions per document
  - Click on a document card to open/view its PDF (generate if not cached)
- Dynamic form rendering from schema with:
  - Support for a "fields" array schema format and a legacy flat-object schema
  - Field types: text, textarea, number, date, select, image, array (repeating group)
  - Client-side validations (required, type checking, pattern, min/max, minLength/maxLength, email, select options, array size)
  - Real-time error messages and disabled submit button until valid
- Image uploads:
  - Client validation of MIME and file size (configurable)
  - Server validation to enforce image types and size limits
  - Uploaded images stored in PocketBase assets
- PDF generation:
  - A4 PDFs via Puppeteer with printBackground
  - Caching in PocketBase assets per-document; re-use on subsequent view
- Conditional rendering (Handlebars):
  - Optional fields wrapped in {{#if}} blocks
  - Arrays rendered with {{#each}}; omitted when empty

## Tech Stack
- Framework: Next.js 15 (App Router) + React 19
- Language: TypeScript
- Styling/UI: Tailwind CSS + shadcn/ui components
- Backend: PocketBase (self-hosted)
- PDF: Puppeteer
- Templates: Handlebars runtime on the client for preview

## Project Structure
- Next.js App Router layout
- Key directories:
  - app/api: REST endpoints for templates, documents, PDFs, and assets
  - app/templates/[id]: Template hub page (client component)
  - app/documents/[id]/edit: Document editor page (server+client composition)
  - components: FormRenderer, ImageUploader, UI components
  - lib: PocketBase client, PDF utilities
  - templates-examples: Example HTML and schema

## Core Architecture
- Templates stored in PocketBase hold:
  - html: the Handlebars-capable HTML body
  - css: CSS string injected into preview
  - schema: JSON that defines the form
- Client-side:
  - FormRenderer builds form from schema, validates, and produces formData
  - Handlebars.compile is used to merge formData into HTML preview
- Persisting a document:
  - POST /api/documents saves name, template id, data, and rendered_html
  - GET /api/documents/[id]/pdf returns a redirect to an existing PDF file or generates one if missing
- Assets:
  - Uploaded images and generated PDFs are stored in PocketBase assets collection
  - PDFs are tagged with usage = "generated_pdf" and linked to their document id

## Data Model (PocketBase)
Expected collections and key fields:
- templates:
  - name, description, html, css, schema (JSON)
- generated_documents:
  - name, template (relation), data (JSON), rendered_html (text), owner, status, created
- assets:
  - file (file), owner (relation), document (relation), usage (text: "template_image" or "generated_pdf"), filename

Rules/Permissions:
- Users must be authenticated to create/list/edit/delete documents and upload/view assets according to ownership.

## API Routes
- Templates
  - GET [GET](app/api/templates/[id]/route.ts:10) → returns a template record
- Documents collection
  - GET [GET](app/api/documents/route.ts:4) with query ?template=ID → list generated documents for a template
  - POST [POST](app/api/documents/route.ts:39) → create a document (name, template, data, rendered_html)
- Single document
  - GET/PATCH/DELETE [GET|PATCH|DELETE](app/api/documents/[id]/route.ts:1)
    - Ownership enforced
- PDF (generate or serve):
  - GET [GET](app/api/documents/[id]/pdf/route.ts:1) → if cached asset exists, redirect; else generate PDF and upload, then redirect
- Asset uploads (images):
  - POST [POST](app/api/assets/route.ts:1) → multipart upload. Auth required. Server-side checks for content-type and size

## Frontend Flows
- Template Hub
  - Page: [TemplatePage](app/templates/[id]/page.tsx:33)
  - Fetches template and generated docs
  - Lists documents; clicking a card opens the PDF via /api/documents/[id]/pdf
  - Button toggles to form view to create new document
- Document Editor
  - Page: [Edit Document Page](app/documents/[id]/edit/page.tsx:1)
  - Client: [DocumentEditor](components/document-editor.tsx:33)
    - On submit: Handlebars.compile(template.html) with current formData
    - Renders preview with injected <style> template.css
    - Save performs PATCH /api/documents/[id] with updated data and rendered_html

## Template Schema Specification
Schemas can be in two formats:
1) Preferred: object with a fields array
2) Legacy: flat object keyed by field names

Example (fields array):
```
{
  "title": "Ficha de Producto",
  "description": "Formulario de ejemplo",
  "fields": [
    { "name": "productName", "label": "Nombre", "type": "text", "required": true, "minLength": 2, "maxLength": 100 },
    { "name": "price", "label": "Precio", "type": "number", "required": true, "min": 0, "step": 0.01 },
    { "name": "contactEmail", "label": "Email", "type": "text", "format": "email", "required": true },
    { "name": "availability", "label": "Disponibilidad", "type": "select",
      "options": [
        { "value": "In Stock", "label": "En Stock" },
        { "value": "Out of Stock", "label": "Agotado" }
      ],
      "required": true
    },
    { "name": "photo", "label": "Foto", "type": "image", "acceptMime": "image/*", "maxSizeMB": 5, "required": false },
    { "name": "specs", "label": "Especificaciones", "type": "array", "minItems": 1, "itemFields": [
        { "name": "specName", "label": "Nombre", "type": "text", "required": true },
        { "name": "specValue", "label": "Valor", "type": "text", "required": true }
    ]}
  ]
}
```

Supported field keys:
- name, label, type: "text" | "textarea" | "number" | "date" | "select" | "image" | "array"
- required: boolean
- placeholder: string
- format: "email"
- pattern: regex string
- min, max (for number)
- minLength, maxLength (for text/textarea)
- integer: true to require integers for number
- step: number step, e.g. 0.01
- options: [{ value, label }] (for select)
- image constraints: acceptMime (default image/*), maxSizeMB (default 5)
- array constraints: minItems, maxItems, itemFields (array of FormField definitions)

## Validations
Client-side validations are implemented in:
- [FormRenderer()](components/form-renderer.tsx:54)
  - Normalizes schema (fields array or legacy) to a single normalizedFields array
  - Validates onChange and onSubmit using validateField
  - Inline error messages are shown per field and array group
  - Submit button is disabled if any field is invalid
- Image uploader:
  - [ImageUploader](components/image-uploader.tsx:1) validates MIME and size before POST /api/assets

Server-side validations:
- [POST /api/assets](app/api/assets/route.ts:1) rejects non-image files and those exceeding 5MB

## PDF Generation and Caching
- Utility: [generatePdfFromHtml()](lib/pdf.ts:8)
  - Puppeteer headless, A4, printBackground = true
- Endpoint: [GET](app/api/documents/[id]/pdf/route.ts:5)
  - Looks up existing asset for documentId, owner, usage = "generated_pdf"
  - If found, redirects to pb.getFileUrl(record, record.file)
  - If not found:
    - Fetches document.rendered_html
    - Generates PDF
    - Uploads to assets with usage = "generated_pdf" and document = ID
    - Redirects to new file URL

## Image Upload Flow
- UI: [ImageUploader](components/image-uploader.tsx:1)
  - File input shows preview after successful upload
  - On file change: POST /api/assets with FormData { file }
  - On success: returns absolute file URL; stored into formData for the template (e.g., logoUrl)
- Server: [POST](app/api/assets/route.ts:4)
  - Auth required
  - Validates content type and size
  - Stores asset and returns absolute URL (pb.getFileUrl)

## Authentication and Routing
- PocketBase SDK used on server routes by loading cookie:
  - pb.authStore.loadFromCookie
- Middleware: [middleware.ts](middleware.ts:1)
  - Protects /dashboard route
  - Redirects '/' → '/dashboard' if logged in; otherwise allows public home
- PocketBase client:
  - [lib/pocketbase.ts](lib/pocketbase.ts:1) uses base URL http://127.0.0.1:8090 and disables autoCancellation

## Local Development
Prerequisites:
- Node.js or Bun
- PocketBase running locally at http://127.0.0.1:8090

Install dependencies:
- npm: npm install
- bun: bun install

Run dev server:
- npm: npm run dev
- bun: bun run dev
  - Dev server: http://localhost:3000

Run PocketBase:
- Download binary from pocketbase.io
- Start with: ./pocketbase serve
- Create collections: templates, generated_documents, assets
- Configure access rules as needed:
  - Allow authenticated users to create/update their own documents
  - Limit asset uploads to authenticated users
  - Ensure read access is appropriate for files you intend to serve

Environment:
- PocketBase URL is currently hardcoded in [lib/pocketbase.ts](lib/pocketbase.ts:5)
  - Consider switching to environment variables in a future improvement

## How to Add a New Template
1) Prepare HTML with Handlebars:
- Wrap optional blocks with {{#if field}} ... {{/if}}
- Use {{#each items}} ... {{/each}} for arrays
- Prefer {{{imageUrl}}} for image src (avoids escaping)

2) Prepare form schema (see “Template Schema Specification”):
- Use "fields" array
- Include validation metadata (required, format, min, max, etc.)

3) Insert into PocketBase:
- Create a record in templates with fields:
  - name, description
  - html (full HTML body of template)
  - css (style block to inject in preview)
  - schema (JSON)

4) Test:
- Visit /templates/[templateId]
- Fill the form; ensure preview matches expectations
- Save document; open PDF via the document card

Example template and schema:
- HTML: [product-sheet.html](templates-examples/product-sheet.html:1)
- Schema: [product-sheet.json](templates-examples/product-sheet.json:1)

## Known Limitations and Future Improvements
- PocketBase URL currently hardcoded; switch to env var
- PDF generation assumes images are publicly accessible by Puppeteer
- Consider server-side HTML compilation with Handlebars for uniformity with client
- Expand template helpers if needed (e.g., custom Handlebars helpers)
- Add more server-side validations for /api/documents POST/PATCH as needed

## File Index
- Core pages and components:
  - Template hub: [TemplatePage](app/templates/[id]/page.tsx:33)
  - Editor (client): [DocumentEditor](components/document-editor.tsx:33)
  - Form renderer: [FormRenderer](components/form-renderer.tsx:54)
  - Image upload: [ImageUploader](components/image-uploader.tsx:1)
- APIs:
  - Templates: [GET](app/api/templates/[id]/route.ts:10)
  - Documents list/create: [GET|POST](app/api/documents/route.ts:4)
  - Document by id: [GET|PATCH|DELETE](app/api/documents/[id]/route.ts:1)
  - PDF: [GET](app/api/documents/[id]/pdf/route.ts:5)
  - Assets upload: [POST](app/api/assets/route.ts:4)
- Utilities:
  - PDF generation: [generatePdfFromHtml()](lib/pdf.ts:8)
  - PocketBase client: [lib/pocketbase.ts](lib/pocketbase.ts:1)
