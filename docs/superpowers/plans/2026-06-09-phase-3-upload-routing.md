# Phase 3 Upload Routing and Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students type any supervisor name with suggestions, route unmatched supervisors directly to admin review, and preserve strict supervisor review permissions for linked accounts only.

**Architecture:** Extend project workflow state with the minimum extra metadata needed to distinguish human-readable supervisor text from linked supervisor accounts and review routing. Keep Firestore rules strict by permitting student uploads that either match the assigned supervisor account or intentionally enter the admin path.

**Tech Stack:** React 19, TypeScript, Firestore, Firebase rules, Vitest

---

## File Structure Map

**Create**

- `src/features/projects/__tests__/uploadRouting.test.ts`
- `src/features/auth/supervisorLookupService.ts`

**Modify**

- `src/types/project.ts`
- `src/lib/constants.ts`
- `src/features/projects/projectService.ts`
- `src/pages/UploadProjectPage.tsx`
- `src/pages/ProjectsPage.tsx`
- `src/pages/ProjectDetailPage.tsx`
- `src/features/auth/profileService.ts`
- `firestore.rules`

## Task Summary

### Task 1: Extend project workflow metadata
- [ ] Add failing tests for new route-aware project records.
- [ ] Extend project types with:
  - human-readable supervisor name field semantics
  - optional linked `supervisorUid`
  - explicit review-route or equivalent status support for direct-admin review
- [ ] Update normalization helpers and constants.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 2: Add supervisor suggestion lookup
- [ ] Add failing tests for suggestion ranking and unmatched free-text behavior.
- [ ] Implement `supervisorLookupService.ts` using existing supervisor profiles plus historical supervisor names.
- [ ] Keep matches normalized but display labels user-friendly.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 3: Rework the upload form
- [ ] Add failing component/service tests for:
  - selecting a suggested supervisor account
  - typing an unmatched supervisor and continuing
  - routing unmatched supervisors to admin review
- [ ] Replace the locked student supervisor field in `UploadProjectPage.tsx` with a searchable free-text control plus suggestions.
- [ ] On submit:
  - matched account -> supervisor review route
  - unmatched text -> admin review route
- [ ] Preserve stored supervisor name in both cases.
- [ ] Verify tests/build pass.
- [ ] Commit.

### Task 4: Update project review and detail surfaces
- [ ] Add failing tests for supervisor-only review permission on linked records.
- [ ] Update `projectService.ts` review logic so supervisors can review only linked-account records and admins can review both paths.
- [ ] Update project list/detail UI to show route-aware states clearly.
- [ ] Verify tests/build pass.
- [ ] Commit.

### Task 5: Align Firestore rules
- [ ] Add rules-focused regression tests if a lightweight harness is practical; otherwise document exact manual rule checks.
- [ ] Modify `firestore.rules` so student project creation is valid for:
  - assigned supervisor account route
  - unmatched free-text direct-admin route
- [ ] Preserve strict supervisor review ownership checks.
- [ ] Verify build and manual flows pass.
- [ ] Commit.

## Verification

- [ ] `cmd /c pnpm exec vitest run src/features/projects/__tests__/uploadRouting.test.ts --reporter verbose`
- [ ] `cmd /c pnpm build`
- [ ] Manual checks:
  - student sees supervisor suggestions while typing
  - selecting a known supervisor enters supervisor review
  - entering an unknown supervisor name still submits
  - unknown supervisor submission lands in admin review
  - supervisors cannot review unmatched free-text records unless linked to them
