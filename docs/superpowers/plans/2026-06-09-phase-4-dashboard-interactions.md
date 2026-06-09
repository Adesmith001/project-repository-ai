# Phase 4 Dashboard, Dropdown, Notification, and PDF Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the decorative dashboard and topbar interactions into working navigation and inspection flows, and add direct PDF download for eligible roles.

**Architecture:** Keep all interaction changes inside the existing page/component structure. Add lightweight local state for dashboard tab switching and a small in-app notification surface rather than introducing a full notification backend in this phase.

**Tech Stack:** React 19, TypeScript, React Router, Firebase-backed project data, Vitest

---

## File Structure Map

**Create**

- `src/components/layout/__tests__/Topbar.test.tsx`
- `src/pages/__tests__/DashboardPage.test.tsx`
- `src/features/notifications/notificationService.ts`

**Modify**

- `src/components/layout/Topbar.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/ProjectDetailPage.tsx`
- `src/pages/ProjectsPage.tsx`
- `src/utils/date.ts` if additional formatting helpers are needed

## Task Summary

### Task 1: Make the desktop topbar dropdown real
- [ ] Add failing tests for opening the desktop menu and using settings/logout links.
- [ ] Reuse the existing mobile menu behavior in `Topbar.tsx` for desktop mode.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 2: Add lightweight notification behavior
- [ ] Add failing tests for opening/closing the bell panel.
- [ ] Implement `notificationService.ts` as a lightweight derived feed from pending/recent project events already available in the app.
- [ ] Wire the bell button to show useful content.
- [ ] Verify tests/build pass.
- [ ] Commit.

### Task 3: Make dashboard section controls interactive
- [ ] Add failing tests for switching between Overview, Repository, Topic Checker, and Insights content.
- [ ] Replace decorative badges in `DashboardPage.tsx` with interactive section controls or tabs.
- [ ] Ensure the selected section changes visible content on the page.
- [ ] Verify tests pass.
- [ ] Commit.

### Task 4: Add drill-down from supervisor/admin summary cards
- [ ] Add failing tests for opening filtered lists from count cards.
- [ ] Wire summary cards and/or “pending/approved/rejected” affordances to route into `ProjectsPage.tsx` with preloaded filters.
- [ ] Ensure the filtered record set matches the clicked summary.
- [ ] Verify tests/build pass.
- [ ] Commit.

### Task 5: Add PDF download action
- [ ] Add failing tests or minimal UI assertions for the presence of a download action when a file exists.
- [ ] Update `ProjectDetailPage.tsx` to expose both open and download links for eligible roles.
- [ ] Keep student access behavior aligned with current authorization assumptions.
- [ ] Verify tests/build pass.
- [ ] Commit.

## Verification

- [ ] `cmd /c pnpm exec vitest run src/components/layout/__tests__/Topbar.test.tsx src/pages/__tests__/DashboardPage.test.tsx --reporter verbose`
- [ ] `cmd /c pnpm build`
- [ ] Manual checks:
  - desktop profile dropdown opens and closes
  - notification bell opens a usable panel
  - dashboard section controls switch content
  - clicking pending/approved style summaries reveals the corresponding project list
  - project detail exposes a direct PDF download action
