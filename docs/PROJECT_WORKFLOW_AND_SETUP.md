# Project Repository AI: Complete Setup, Security, and Operations Guide

This guide explains everything needed to run this project end-to-end with Firebase Auth, Firestore, Cloudinary uploads, and Gemini-powered recommendations.

## 1. Architecture Summary

Project Repository AI is a frontend application with a serverless Gemini proxy endpoint.

- UI: Vite + React + TypeScript + Tailwind + Redux Toolkit
- Auth: Firebase Authentication (Email/Password and optional Google)
- Data: Firestore (`users`, `projects`)
- Files: Cloudinary unsigned browser upload (PDF only)
- AI: Gemini API via server-side `/api/gemini` proxy
- Similarity: Firestore vector search (with client cosine fallback)

There is no long-running Node/Express backend in this version.

## 2. Prerequisites

- Node.js 20+
- pnpm
- Firebase project
- Cloudinary account
- Gemini API key
- Firebase CLI (`npm i -g firebase-tools`) if you want to deploy rules/indexes by command line

## 3. Environment Variables

Create `.env` from `.env.example`.

Required variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `GEMINI_API_KEY` (server-side only)

Important:

- Do not commit `.env`
- Do not expose Gemini or Cloudinary secrets in browser code
- Do not expose Cloudinary API secret in frontend code
- Unsigned upload presets are prototype/demo-friendly, not enterprise-grade by default

## 4. Firebase Project Setup

### 4.1 Create and register app

1. Open Firebase Console.
2. Create/select project.
3. Add Web App.
4. Copy config values into `.env`.

### 4.2 Enable Authentication providers

1. Go to Authentication -> Sign-in method.
2. Enable Email/Password.
3. Optionally enable Google sign-in.
4. For Google provider setup:
- Set project support email.
- Set public-facing project name.
- Save.

### 4.3 Create Firestore database

1. Firestore Database -> Create database.
2. Start in production mode (recommended) or test mode for quick local trial.
3. Choose database region close to users.

## 5. Firestore Rules (Implemented)

This repository now includes hardened rules in:

- `firestore.rules`

Core behavior:

- Only authenticated users can read projects.
- Only admins can create/update/delete projects.
- Users can read own profile.
- Admin can list/read all users.
- Users can create/update their own profile but cannot escalate role.
- Data shape validation is enforced for `users` and `projects` documents.

### 5.1 Deploy rules

Use Firebase CLI:

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

Or paste contents of `firestore.rules` into Firebase Console -> Firestore -> Rules and publish.

## 6. Firestore Indexes (Implemented)

This repository now includes composite indexes in:

- `firestore.indexes.json`

These indexes support filter combinations used in the app (`department`, `year`, `supervisor`, `status`).

### 6.1 Deploy indexes

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:indexes
```

Index builds can take minutes. During build time, queries may fail with index errors.

## 7. Firestore Vector Index (Required for nearest-neighbor search)

Composite indexes and vector indexes are separate concerns.

You must also create a vector index for nearest-neighbor lookup on `projects.embedding`.

Steps in Firebase/GCP console:

1. Open Firestore -> Indexes.
2. Open Vector indexes tab.
3. Create index:
- Collection: `projects`
- Field path: `embedding`
- Distance metric: Cosine
- Dimensions: must match embedding vectors stored in your data

Important consistency rule:

- All `embedding` arrays must have the same dimension.
- If you change embedding model dimension, regenerate old embeddings.

## 8. Users and Roles Model

Collection: `users`

Required fields:

- `uid`
- `email`
- `fullName`
- `department`
- `role`: `student` | `supervisor` | `admin`
- `createdAt`
- `updatedAt`

### 8.1 First admin bootstrap

Because role elevation is restricted, set the first admin manually in Firestore:

1. Register a normal account in the app.
2. Go to Firestore -> `users/{uid}`.
3. Change `role` to `admin` manually.
4. Refresh app and continue admin operations there.

## 9. Projects Data Model

Collection: `projects`

Required fields:

- `title`
- `abstract`
- `keywords` (list)
- `department`
- `year` (int)
- `supervisor`
- `studentName`
- `fileUrl`
- `filePublicId`
- `status` (`approved` | `pending` | `rejected`)
- `embedding` (numeric vector)
- `createdAt`
- `updatedAt`

## 10. Cloudinary Setup

1. Create upload preset in Cloudinary.
2. Set preset to unsigned.
3. Restrict to PDF formats where possible.
4. Set folder optional: `project-repository-ai`.
5. Configure:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

This app uploads PDFs directly from browser and stores returned `secure_url` and `public_id` in Firestore.

## 11. Gemini Setup

1. Create Gemini API key.
2. Add `GEMINI_API_KEY` in your server environment (for example, Vercel project environment variables).
3. Ensure API quota and billing are configured.

Topic checker flow:

1. Create proposal embedding.
2. Retrieve similar project candidates.
3. Calculate risk.
4. Generate grounded recommendation using only retrieved context.

## 12. Local Development Commands

```bash
pnpm install
pnpm dev
pnpm build
```

Optional lint:

```bash
pnpm lint
```

## 13. Production Deployment Checklist

- `firestore.rules` deployed
- `firestore.indexes.json` deployed
- vector index created for `projects.embedding`
- Email/Password enabled
- Google provider enabled (if using Google sign-in)
- all required environment variables set
- Cloudinary upload preset configured and tested
- first admin role assigned
- test CRUD, topic check, and file upload flows

## 14. Troubleshooting

### Error: Missing or insufficient permissions

- Check user has profile document in `users`.
- Verify profile role for admin-only operations.
- Confirm latest rules are deployed.

### Error: Query requires an index

- Deploy `firestore.indexes.json`.
- Wait for index build completion.

### Error: Vector search fails

- Verify vector index exists.
- Verify embeddings are non-empty and same dimension.

### Error: Cloudinary upload rejected

- Confirm unsigned preset exists.
- Confirm preset accepts PDF/raw uploads.
- Confirm env variable values are correct.

### Error: Gemini call fails

- Verify key validity.
- Check quota/billing.
- Inspect `/api/gemini` network response and serverless function logs.

## 15. Security Notes

This is a frontend-only architecture for speed and simplicity. For stronger production hardening, consider:

- server-mediated signed upload flow for Cloudinary
- server-side proxy for AI calls with request shaping and rate limiting
- role assignment workflows backed by trusted server logic
- monitoring, alerting, and audit logging
