# Project: Template Creator

## 1. Overview

This project is a web application built with Next.js that integrates GrapeJS as a web editor. The primary goal is to provide a tool for creating, managing, and utilizing templates to generate dynamic forms and documents. Appwrite is used as the Backend-as-a-Service (BaaS) to handle data persistence for templates and form data.

## 2. Core Features

*   **Template Creation:** Users can design and build reusable templates using the GrapeJS editor.
*   **Template Storage:** Templates are saved and managed through Appwrite's database and storage services.
*   **Dynamic Form Generation:** The application will interpret the saved templates to dynamically render forms for data entry.
*   **Document Generation:** Based on the submitted form data, the application will generate documents from the original templates.

## 3. Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Web Editor:** [GrapeJS](https://grapesjs.com/)
*   **Backend:** [Appwrite](https://appwrite.io/)

## 4. Project Structure

The project follows the standard Next.js App Router directory structure.

```
/
|-- app/                  # Main application folder
|   |-- page.tsx          # Main page
|   |-- layout.tsx        # Root layout
|   `-- globals.css       # Global styles
|-- public/               # Static assets
|-- lib/                  # Utility functions
|-- components/           # Reusable components
`-- ...                   # Configuration files
```

This document will be updated as the project evolves.
