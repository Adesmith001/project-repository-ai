# Phased Recovery Design for Project Repository AI

## Summary

This design defines a phased correction program for the current repository so the system can be stabilized without mixing unrelated regressions into one large patch set. The work is grouped into four phases:

1. Auth and onboarding recovery
2. Repository intelligence and duplicate control
3. Supervisor and admin workflow repair
4. Dashboard, navigation, and notification polish

The scope is limited to repository changes only. Firebase console changes, provider configuration, and other external setup changes are out of scope, though the implementation may surface clearer in-app errors when those external settings are wrong.

The product decisions locked for this design are:

- Supervisor mode remains restricted to `@covenantuniversity.edu.ng` accounts plus staff ID.
- Existing supervisors must be able to add or update their CU email and staff ID in-app.
- Email/password becomes the primary sign-in path. Google sign-in remains optional.
- Students can type any supervisor name during upload, with live suggestions from known supervisors.
- If the typed supervisor is not linked to an existing supervisor account, the project goes directly to admin review.
- Duplicate handling uses both exact-title detection and semantic near-duplicate detection.

## Current-State Findings

The current codebase already explains many reported issues:

- Supervisor access is intentionally downgraded to student-level authorization when the profile lacks both a CU email and a staff ID.
- The settings page is read-only, so existing supervisors cannot repair their own eligibility data.
- Forgot password is not implemented; the login page uses a dead `href="#"`.
- Google sign-in uses popup auth only and is visually co-equal with email/password.
- Repository search currently matches only title, abstract, and keywords in the main listing.
- Repository year filtering is hard-coded to a small static range and does not extend to `2027`.
- Supervisor names are stored as plain strings, so duplicates caused by spelling or formatting differences are not normalized.
- The notification bell is a static button with no behavior.
- The desktop topbar profile area shows a chevron but has no dropdown behavior.
- The dashboard "Overview / Repository / Topic Checker / Insights" strip is decorative only.
- Supervisor dashboard counts are not connected to drill-down views.
- PDF access is "Open PDF" only and only shown for non-students; there is no explicit download action.

## Target Design

### 1. Auth and Onboarding Recovery

The auth surface will be rebalanced around email/password. The login page will keep email/password as the primary action, reduce reliance on Google for ordinary sign-in, and expose a real forgot-password flow. The implementation will remain repository-only, so it will use Firebase client APIs already available in the app rather than introducing a backend auth service.

Supervisor eligibility remains strict. The difference is that the system will no longer strand an existing supervisor behind a passive "Supervisor restricted" message. The settings/profile experience will allow a supervisor profile to update the editable identity fields needed for eligibility recovery, specifically institutional email and staff ID, and will immediately reflect whether supervisor mode is restored. If the signed-in auth email cannot itself be changed from the client flow in a safe repo-only manner, the UI must clearly distinguish between editable profile metadata and auth-provider email limitations instead of silently failing.

The app will also present clearer error states for common auth failures so password sign-in problems are diagnosable from inside the repo even when the external Firebase configuration is wrong.

### 2. Repository Intelligence and Duplicate Control

Search and filtering will be broadened across all repository-oriented screens. Users must be able to search by title, abstract, keywords, supervisor name, student name, and other stored identity strings without needing to already know the exact project title. Filtering by year must be generated from live data with a future-safe range that includes `2027` at minimum.

Similarity logic will be tightened instead of relying on the current loose blend. Exact normalized title matches will be treated as strong duplicate signals. Semantic near-duplicates will remain supported, but lexical weighting will be strengthened so the system becomes less permissive when title framing, keywords, and abstract language overlap heavily. Duplicate review is an admin function: uploads should surface strong duplicate warnings, and admin should have a way to inspect likely duplicates and remove bad or redundant records intentionally.

Supervisor name handling must be normalized for search and filtering. The repository will continue storing the human-readable supervisor name used for the project record, but the search/filter layer must avoid presenting the same lecturer repeatedly when the only differences are casing, spacing, or duplicate project usage.

### 3. Supervisor and Admin Workflow Repair

Student upload must stop forcing a single locked supervisor name when the product expectation is broader. The upload form will provide supervisor suggestions sourced from existing supervisor profiles and previously used supervisor names, while still allowing free-text entry. The data model must distinguish between:

- `supervisorName`: the visible supervisor text stored on the project
- `supervisorUid`: the linked supervisor account when one exists
- `reviewRoute`: whether the record should enter supervisor review or admin review first

If the entered supervisor matches a known eligible supervisor account selected from suggestions, the project enters the normal supervisor review queue. If the student submits a free-text name with no linked account, the project bypasses supervisor review and enters admin review directly.

Supervisor review permissions remain account-bound. A supervisor can only review records linked to their own account. Free-text names alone must never grant review access.

Supervisor-facing repository and dashboard views must become inspectable rather than summary-only. Count cards such as total, approved, pending, and rejected must lead to filtered record lists so supervisors can see which specific submissions are in each state.

### 4. Dashboard, Navigation, and Notifications

The desktop role/profile area will gain a real dropdown matching the existing mobile behavior. The notification bell will become functional, even if the first version is a lightweight in-app notification center sourced from repository and review events already present in the data model.

The dashboard navigation strip labeled "Overview," "Repository," "Topic Checker," and "Insights" will become an actual view switch or anchored tab system rather than static badges. Each section must control visible content on the page so users understand that the element is interactive.

PDF access will support direct download for eligible roles wherever a project document is already accessible. The project detail view should expose both open and download actions rather than only an external open action.

## Public Interface and Data Changes

The implementation should preserve existing route structure where possible, but the following behavior-level interface changes are required:

- Login page:
  - Primary CTA remains email/password login.
  - Secondary Google action remains available.
  - Forgot-password becomes a working action.
- Settings/profile page:
  - Existing supervisors can edit staff ID and eligibility-related profile fields.
  - The UI explains current eligibility state explicitly.
- Project upload:
  - Supervisor input becomes searchable free text with suggestions.
  - Submission logic determines review routing from the selected or typed supervisor.
- Project data model:
  - Keep human-readable supervisor text.
  - Preserve linked supervisor UID only when a real account match exists.
  - Add or derive a route/state that distinguishes direct-admin review from supervisor-first review.
- Repository search/filter:
  - Search must cover supervisor and student names in addition to title/abstract/keywords.
  - Year options must be dynamic and include future values through at least `2027`.
- Admin duplicate tooling:
  - Add a duplicate inspection surface based on exact and semantic matches.

If the current status enum cannot represent "direct to admin because supervisor account is unresolved," the implementation should extend the status or add a separate routing field rather than overloading existing meanings.

## Phase Plan

### Phase 1: Auth and Eligibility

- Implement forgot-password flow in the login experience.
- Rework auth page hierarchy so email/password is clearly primary.
- Add editable supervisor eligibility fields in settings/profile.
- Replace passive "Supervisor restricted" messaging with actionable remediation UI.
- Normalize auth error handling for password-first sign-in.

### Phase 2: Search, Similarity, and Duplicates

- Expand repository search coverage to names plus metadata.
- Replace static year filter options with generated options through live/future range.
- Tighten similarity scoring with exact-title detection and stronger lexical weighting.
- Add admin duplicate visibility and review entry points.
- Normalize supervisor filter options to avoid repeated equivalent names.

### Phase 3: Upload and Review Routing

- Convert student supervisor field to suggestible free text.
- Match known supervisors to accounts when available.
- Route unmatched supervisors directly to admin review.
- Preserve account-bound supervisor review permissions.
- Ensure supervisor and admin record states remain understandable in the UI.

### Phase 4: Dashboard and Interaction Polish

- Make summary cards drill into filtered repository views.
- Make the dashboard section strip interactive.
- Implement the desktop profile dropdown.
- Implement the notification bell behavior.
- Add direct PDF download affordances.

## Testing Strategy

### Auth and Eligibility

- Existing supervisor without staff ID sees restricted state, can add staff ID, and regains supervisor mode without data corruption.
- Invalid non-CU supervisor email continues to fail eligibility.
- Email/password login works without requiring prior Google login.
- Forgot-password action triggers the expected reset flow and user feedback.

### Repository and Similarity

- Repository search returns results for supervisor names, student names, titles, keywords, and abstract text.
- Year filter includes `2027` and does not regress existing project years.
- Exact title duplicates are flagged as high confidence.
- Strong semantic near-duplicates rank above loosely related records.
- Supervisor filter list does not show trivial duplicate variants of the same name.

### Upload and Routing

- Student selects a known supervisor suggestion and the project enters supervisor review.
- Student types an unknown supervisor and the project enters admin review directly.
- Free-text supervisor submission still stores the entered name on the record.
- Supervisors cannot review projects that are not linked to their account.

### Dashboard and UI

- Notification bell opens usable content.
- Desktop profile dropdown opens and supports settings/logout.
- Dashboard tabs switch content correctly.
- Supervisor summary cards open filtered lists showing the actual records behind the counts.
- Eligible roles can download PDFs from project detail.

## Chapter 3-5 Roadmap Framing

This correction program can be explained academically as:

- Chapter 3:
  - phased corrective system design
  - role-based workflow redesign
  - retrieval and duplicate-detection strengthening
- Chapter 4:
  - implementation by phase
  - UI and data-flow changes for auth, upload routing, search, and review
- Chapter 5:
  - evaluation of usability recovery
  - search quality improvement
  - duplicate prevention improvement
  - workflow reliability improvement

## Assumptions

- No external Firebase console changes are part of this work.
- Existing Firestore-backed routes and collections remain the main architecture.
- It is acceptable to extend project review state semantics if the current status model cannot safely represent the new admin-routing behavior.
- Notification behavior can start as in-app repository/review activity rather than a full messaging system.
