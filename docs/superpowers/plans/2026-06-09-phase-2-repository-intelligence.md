# Phase 2 Repository Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen repository search, year filtering, supervisor-name normalization, and duplicate/similarity detection so search works by people and metadata rather than only project titles.

**Architecture:** Keep Firestore as the source of truth but improve client-side search/filter behavior and similarity scoring in the project services layer. Add duplicate analysis as a focused admin-facing capability rather than spreading duplicate logic across every page.

**Tech Stack:** React 19, TypeScript, Firestore, Redux Toolkit, Vitest

---

## File Structure Map

**Create**

- `src/features/projects/__tests__/projectService.test.ts`
- `src/features/projects/__tests__/vectorSearchService.test.ts`
- `src/features/projects/duplicateService.ts`

**Modify**

- `src/features/projects/projectService.ts`
- `src/features/projects/vectorSearchService.ts`
- `src/pages/ProjectsPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/types/project.ts`
- `src/lib/constants.ts`
- `src/pages/AdminUsersPage.tsx` or a new admin duplicate surface if separation is cleaner

## Task Summary

### Task 1: Expand project search coverage
- [ ] Add failing tests for matching by `studentName`, `supervisor`, title, abstract, and keywords.
- [ ] Update `applyClientFilters` in `projectService.ts` to search across all required fields with normalized case-insensitive matching.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 2: Replace static year options with dynamic future-safe options
- [ ] Add failing tests for year option generation including `2027`.
- [ ] Add a small helper that derives descending year options from project data and extends the upper bound to `max(currentYear, 2027)`.
- [ ] Use the helper in `ProjectsPage.tsx` and `DashboardPage.tsx`.
- [ ] Verify tests/build pass.
- [ ] Commit.

### Task 3: Normalize supervisor filter values
- [ ] Add failing tests for duplicate supervisor names caused by casing/spacing differences.
- [ ] Introduce normalization helpers in `projectService.ts` or a small adjacent helper.
- [ ] Ensure supervisor filter options collapse trivial duplicates while preserving original display labels.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 4: Tighten similarity scoring
- [ ] Add failing tests for:
  - exact normalized title matches scoring near-duplicate/high-confidence
  - semantically weak but title-similar records
  - people-name differences not dominating project similarity
- [ ] Strengthen `vectorSearchService.ts` by increasing lexical penalties/rewards around exact-title, title token overlap, and abstract overlap.
- [ ] Keep embedding fallback behavior intact.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 5: Add admin duplicate analysis entry point
- [ ] Add failing tests for exact-title duplicate grouping and high-score semantic duplicate suggestions.
- [ ] Implement `duplicateService.ts` to return exact-title groups and near-duplicate pairs from project data.
- [ ] Expose the results in an admin-facing screen section with simple inspect/delete navigation.
- [ ] Verify tests/build pass.
- [ ] Commit.

## Verification

- [ ] `cmd /c pnpm exec vitest run src/features/projects/__tests__/projectService.test.ts src/features/projects/__tests__/vectorSearchService.test.ts --reporter verbose`
- [ ] `cmd /c pnpm build`
- [ ] Manual checks:
  - repository search finds projects by supervisor name
  - repository search finds projects by student name
  - year filters include `2027`
  - supervisor dropdown does not repeat trivial name variants
  - duplicate analysis identifies exact-title duplicates and likely semantic duplicates
