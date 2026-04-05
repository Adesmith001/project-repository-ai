# Project Repository AI

Project Repository AI is a frontend-only intelligent project repository and recommendation system for university students, supervisors, and administrators.

It helps students avoid duplicate final-year project topics by combining:

- Firestore project records
- Cloudinary PDF uploads
- Semantic similarity checks with Firestore vector search
- Gemini recommendations grounded in retrieved similar projects

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Firebase Auth
- Firestore
- Cloudinary (unsigned upload preset)
- Gemini API via `@google/genai`
- Firestore vector search

## Architecture

This implementation is intentionally frontend-only:

- No Node/Express backend
- No custom API server
- Firebase modular SDK patterns (`firebase/auth`, `firebase/firestore`)
- Cloudinary browser upload with unsigned preset
- Gemini called from frontend

### Important prototype warning

This app is configured for demo/prototype use. Frontend-exposed API keys and unsigned Cloudinary uploads are **not** sufficient for hardened production security.

## Features

1. Authentication
- Email/password signup/login
- User roles: `student`, `supervisor`, `admin`
- Protected routes and role-based navigation

2. Project Repository
- Firestore `projects` collection
- List, filter, detail, create, edit, delete
- Filters: department, year, supervisor, status, search

3. PDF Upload
- Browser direct upload to Cloudinary unsigned preset
- PDF-only restriction in UI and helper validation
- Persist `secure_url` and `public_id` in Firestore

4. Semantic Topic Checker
- Proposal input (title, description, optional keywords)
- Embedding generation for query and project records
- Firestore vector search attempt with cosine fallback
- Duplication risk output: `low`, `medium`, `high`

5. Gemini Grounded Recommendations
- Uses retrieved similar projects as context
- Structured output:
  - `noveltyAssessment`
  - `overlapExplanation`
  - `refinementSuggestions[]`
  - `alternativeTopics[]`
  - `researchGaps[]`

6. Dashboards
- Student dashboard
- Supervisor dashboard
- Admin dashboard

## Routes

- `/login`
- `/register`
- `/dashboard`
- `/projects`
- `/projects/:id`
- `/upload-project` (admin)
- `/check-topic` (student/admin)
- `/admin/users` (admin)

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required keys:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_GEMINI_API_KEY`

## Local Setup

1. Install dependencies

```bash
pnpm install
```

2. Add environment values in `.env`

3. Run development server

```bash
pnpm dev
```

4. Build

```bash
pnpm build
```

## Firestore Data Model

Collection: `projects`

Fields per document:

- `id`
- `title`
- `abstract`
- `keywords[]`
- `department`
- `year`
- `supervisor`
- `studentName`
- `fileUrl`
- `filePublicId`
- `status`
- `embedding` (number array)
- `createdAt`
- `updatedAt`

Collection: `users`

Fields:

- `uid`
- `email`
- `fullName`
- `department`
- `role`
- `createdAt`
- `updatedAt`

## Firestore Index Notes

Create composite indexes to support filter combinations used by repository listing. Typical examples:

- `projects(department ASC, status ASC)`
- `projects(supervisor ASC, status ASC)`
- `projects(year ASC, status ASC)`

### Firestore vector index note

Create a vector index on `projects.embedding` using Firestore vector search tooling in the Firebase/Google Cloud console.

Recommended setup:

- Collection: `projects`
- Field: `embedding`
- Vector dimensions: use the embedding dimension returned by your embedding model
- Distance: cosine

If vector query APIs are unavailable, the app gracefully falls back to client-side cosine similarity over stored embeddings.

## Firestore Security Rules Notes (Prototype)

Use strict role-aware rules. Example strategy:

- Auth required for all reads/writes
- `users/{uid}` readable by owner and admin
- Only admin can create/update/delete `projects`
- Students/supervisors can read `projects`

Suggested rule sketch:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && isAdmin();
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Adjust these for your exact institutional policy.

## Cloudinary Unsigned Upload Setup

1. In Cloudinary dashboard, create an upload preset.
2. Set preset mode to unsigned.
3. Restrict allowed formats to `pdf` where possible.
4. Optionally enforce folder path `project-repository-ai`.
5. Add values to:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`

The app uploads with `resource_type=raw` and blocks non-PDF files in UI.

## Gemini API Setup

1. Create a Gemini API key from Google AI Studio / Google Cloud.
2. Add `VITE_GEMINI_API_KEY` in `.env`.
3. Ensure billing/quota allows embedding and generation calls.

Prompting in this app is grounded: Gemini is called only after similar project retrieval.

## Project Structure

```txt
src/
  app/
  components/
  features/
    auth/
    projects/
    topicChecker/
    dashboard/
  hooks/
  lib/
  pages/
  routes/
  types/
  utils/
```

## Notes

- Keep admin role assignment controlled by institution policy.
- For production, move sensitive AI/upload operations behind trusted server functions.
- Add Cloudinary signature flow and backend token exchange for hardened deployments.
