# Phase 1 Auth and Supervisor Eligibility Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make email/password the reliable primary sign-in path, add a working forgot-password flow, and let existing supervisors recover eligibility in-app by updating staff ID and requesting a CU email change.

**Architecture:** Keep the existing Firebase Auth + Firestore architecture and add the smallest set of new auth/profile helpers needed to support password reset, user-facing auth errors, and profile-email synchronization after verified auth email changes. Limit data model changes in this phase to identity recovery behavior; upload routing and repository changes remain in later phase plans.

**Tech Stack:** React 19, TypeScript, Redux Toolkit, Firebase Auth, Firestore, Vite, Vitest, React Testing Library

---

## File Structure Map

**Create**

- `src/features/auth/authError.ts`
  - Centralize Firebase auth error-code to user-message mapping.
- `src/test/setup.ts`
  - Register `@testing-library/jest-dom` once for Vitest.
- `src/test/renderWithProviders.tsx`
  - Shared RTL wrapper for Redux-backed component tests.
- `src/features/auth/__tests__/authError.test.ts`
  - Unit tests for auth error mapping.
- `src/features/auth/__tests__/authService.test.ts`
  - Unit tests for password reset and auth email change helper behavior.
- `src/pages/__tests__/SettingsProfilePage.test.tsx`
  - Component tests for supervisor eligibility editing.

**Modify**

- `package.json`
  - Add `test` script and test dependencies.
- `vite.config.ts`
  - Add Vitest config with `jsdom` environment and shared setup file.
- `src/features/auth/authService.ts`
  - Add password reset helper, CU email change helper, and user-friendly error handling.
- `src/features/auth/authSlice.ts`
  - Ensure auth thunk rejections use mapped messages instead of raw Firebase errors.
- `src/features/auth/profileService.ts`
  - Add owner-safe profile update helpers and auth-email sync helper.
- `src/hooks/useAuthBootstrap.ts`
  - Sync Firestore profile email to the verified Firebase auth email when they differ.
- `src/lib/authz.ts`
  - Add helper that explains which supervisor-eligibility requirement is missing.
- `src/pages/LoginPage.tsx`
  - Add working forgot-password flow and make password login visually primary.
- `src/pages/RegisterPage.tsx`
  - De-emphasize Google so email/password remains the primary onboarding path.
- `src/pages/SettingsProfilePage.tsx`
  - Add supervisor eligibility edit form and actionable recovery status.
- `firestore.rules`
  - Allow an authenticated owner to sync `users.email` to their actual auth email without opening broader profile mutation.

## Task 1: Add the test harness needed for Phase 1

**Files:**
- Create: `src/test/setup.ts`
- Create: `src/test/renderWithProviders.tsx`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Test: `src/features/auth/__tests__/authError.test.ts`

- [ ] **Step 1: Add failing test coverage for auth error mapping**

```ts
// src/features/auth/__tests__/authError.test.ts
import { describe, expect, it } from 'vitest'
import { toUserFacingAuthError } from '../authError'

describe('toUserFacingAuthError', () => {
  it('maps invalid credentials to a password-first login message', () => {
    expect(toUserFacingAuthError({ code: 'auth/invalid-credential' })).toBe(
      'Incorrect email or password. Check your details and try again.',
    )
  })

  it('maps recent-login requirement to a reauthentication message', () => {
    expect(toUserFacingAuthError({ code: 'auth/requires-recent-login' })).toBe(
      'For security, sign in again before changing your institutional email.',
    )
  })
})
```

- [ ] **Step 2: Run the new test before any implementation**

Run: `cmd /c pnpm exec vitest run src/features/auth/__tests__/authError.test.ts --reporter verbose`

Expected: FAIL with module-not-found for `../authError` and missing Vitest setup.

- [ ] **Step 3: Add the minimal test tooling**

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiDevApiPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom'
```

```tsx
// src/test/renderWithProviders.tsx
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { render } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import profileReducer from '../features/auth/profileSlice'
import projectFilterReducer from '../features/projects/projectFilterSlice'
import topicCheckerReducer from '../features/topicChecker/topicCheckerSlice'

export function renderWithProviders(ui: ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
      projectFilters: projectFilterReducer,
      topicChecker: topicCheckerReducer,
    },
  })

  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper }),
  }
}
```

- [ ] **Step 4: Re-run the test harness to verify it now executes and still fails for the missing implementation**

Run: `cmd /c pnpm exec vitest run src/features/auth/__tests__/authError.test.ts --reporter verbose`

Expected: FAIL with `Cannot find module '../authError'` only.

- [ ] **Step 5: Commit the harness**

```bash
git add package.json vite.config.ts src/test/setup.ts src/test/renderWithProviders.tsx src/features/auth/__tests__/authError.test.ts
git commit -m "test: add vitest harness for auth recovery"
```

## Task 2: Add user-facing auth error mapping and password-reset support

**Files:**
- Create: `src/features/auth/authError.ts`
- Modify: `src/features/auth/authService.ts`
- Modify: `src/features/auth/authSlice.ts`
- Test: `src/features/auth/__tests__/authError.test.ts`
- Test: `src/features/auth/__tests__/authService.test.ts`

- [ ] **Step 1: Add failing service tests for password reset and institutional email change**

```ts
// src/features/auth/__tests__/authService.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestPasswordReset, requestSupervisorEmailChange } from '../authService'

const sendPasswordResetEmail = vi.fn()
const verifyBeforeUpdateEmail = vi.fn()

vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
  verifyBeforeUpdateEmail: (...args: unknown[]) => verifyBeforeUpdateEmail(...args),
}))

vi.mock('../../../lib/firebase', () => ({
  auth: { currentUser: { email: 'old@example.com' } },
}))

describe('authService helpers', () => {
  beforeEach(() => {
    sendPasswordResetEmail.mockReset()
    verifyBeforeUpdateEmail.mockReset()
  })

  it('sends reset email through Firebase Auth', async () => {
    await requestPasswordReset('user@example.com')
    expect(sendPasswordResetEmail).toHaveBeenCalled()
  })

  it('requests a verified auth email change for supervisors', async () => {
    await requestSupervisorEmailChange('new@covenantuniversity.edu.ng')
    expect(verifyBeforeUpdateEmail).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the targeted tests**

Run: `cmd /c pnpm exec vitest run src/features/auth/__tests__/authError.test.ts src/features/auth/__tests__/authService.test.ts --reporter verbose`

Expected: FAIL because `authError.ts`, `requestPasswordReset`, and `requestSupervisorEmailChange` do not exist yet.

- [ ] **Step 3: Implement the auth error mapper and new auth service helpers**

```ts
// src/features/auth/authError.ts
type FirebaseLikeError = {
  code?: string
  message?: string
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password. Check your details and try again.',
  'auth/user-not-found': 'Incorrect email or password. Check your details and try again.',
  'auth/wrong-password': 'Incorrect email or password. Check your details and try again.',
  'auth/too-many-requests': 'Too many sign-in attempts. Wait a moment and try again.',
  'auth/requires-recent-login': 'For security, sign in again before changing your institutional email.',
  'auth/invalid-email': 'Enter a valid email address and try again.',
}

export function toUserFacingAuthError(error: FirebaseLikeError, fallback = 'Unable to complete the authentication request.') {
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code]
  }

  return error.message?.trim() || fallback
}
```

```ts
// src/features/auth/authService.ts
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { toUserFacingAuthError } from './authError'

export async function requestPasswordReset(email: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  try {
    await sendPasswordResetEmail(auth, email.trim())
  } catch (error) {
    throw new Error(toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to send reset email.'))
  }
}

export async function requestSupervisorEmailChange(nextEmail: string) {
  if (!auth?.currentUser) {
    throw new Error('Sign in again before updating your institutional email.')
  }

  try {
    await verifyBeforeUpdateEmail(auth.currentUser, nextEmail.trim().toLowerCase())
  } catch (error) {
    throw new Error(toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to start institutional email update.'))
  }
}
```

```ts
// src/features/auth/authSlice.ts
import { toUserFacingAuthError } from './authError'

.addCase(loginThunk.rejected, (state, action) => {
  state.error = toUserFacingAuthError(
    { message: action.error.message },
    'Unable to login.',
  )
  state.status = 'unauthenticated'
})
```

- [ ] **Step 4: Run the targeted tests again**

Run: `cmd /c pnpm exec vitest run src/features/auth/__tests__/authError.test.ts src/features/auth/__tests__/authService.test.ts --reporter verbose`

Expected: PASS for all auth helper tests.

- [ ] **Step 5: Commit the auth helper layer**

```bash
git add src/features/auth/authError.ts src/features/auth/authService.ts src/features/auth/authSlice.ts src/features/auth/__tests__/authError.test.ts src/features/auth/__tests__/authService.test.ts
git commit -m "feat: add auth recovery helpers"
```

## Task 3: Allow staff-ID updates and safe profile-email synchronization

**Files:**
- Modify: `src/features/auth/profileService.ts`
- Modify: `src/hooks/useAuthBootstrap.ts`
- Modify: `src/lib/authz.ts`
- Modify: `firestore.rules`
- Test: `src/features/auth/__tests__/authService.test.ts`

- [ ] **Step 1: Add a failing helper test for eligibility explanation**

```ts
// append to src/features/auth/__tests__/authService.test.ts
import { describe, expect, it } from 'vitest'
import { getSupervisorEligibilityIssues } from '../../../lib/authz'

it('reports both missing CU email and staff ID for restricted supervisors', () => {
  expect(
    getSupervisorEligibilityIssues({
      role: 'supervisor',
      email: 'someone@gmail.com',
      staffId: '',
    }),
  ).toEqual(['missing_cu_email', 'missing_staff_id'])
})
```

- [ ] **Step 2: Run the auth test file**

Run: `cmd /c pnpm exec vitest run src/features/auth/__tests__/authService.test.ts --reporter verbose`

Expected: FAIL because `getSupervisorEligibilityIssues` does not exist.

- [ ] **Step 3: Implement the smallest profile-sync and eligibility helpers**

```ts
// src/lib/authz.ts
export type SupervisorEligibilityIssue = 'missing_cu_email' | 'missing_staff_id'

export function getSupervisorEligibilityIssues(profile: SupervisorIdentity | null | undefined) {
  if (!profile || profile.role !== 'supervisor') {
    return [] as SupervisorEligibilityIssue[]
  }

  const issues: SupervisorEligibilityIssue[] = []

  if (!hasCuSupervisorEmail(profile.email)) {
    issues.push('missing_cu_email')
  }

  if (!hasCuStaffId(profile.staffId)) {
    issues.push('missing_staff_id')
  }

  return issues
}
```

```ts
// src/features/auth/profileService.ts
export async function updateOwnSupervisorProfile(payload: {
  uid: string
  fullName: string
  department: string
  staffId: string
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  await updateDoc(doc(db, 'users', payload.uid), {
    fullName: payload.fullName.trim(),
    department: payload.department,
    staffId: payload.staffId.trim(),
    updatedAt: now,
  })
}

export async function syncOwnProfileEmailFromAuth(payload: {
  uid: string
  email: string
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  await updateDoc(doc(db, 'users', payload.uid), {
    email: payload.email.trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
  })
}
```

```ts
// src/hooks/useAuthBootstrap.ts
import { syncOwnProfileEmailFromAuth } from '../features/auth/profileService'

void dispatch(fetchProfileThunk(user.uid)).unwrap().then((profile) => {
  if (profile && profile.email !== user.email) {
    return syncOwnProfileEmailFromAuth({
      uid: user.uid,
      email: user.email,
    }).then(() => dispatch(fetchProfileThunk(user.uid)))
  }

  return profile
})
```

```txt
// firestore.rules
allow update: if (
  isOwner(userId)
  && isValidUserProfile(request.resource.data, userId)
  && request.resource.data.uid == resource.data.uid
  && request.resource.data.role == resource.data.role
  && request.resource.data.assignedSupervisorUid == resource.data.assignedSupervisorUid
  && request.resource.data.assignedSupervisorName == resource.data.assignedSupervisorName
  && request.resource.data.uploadCleared == resource.data.uploadCleared
  && request.resource.data.clearedBySupervisorUid == resource.data.clearedBySupervisorUid
  && request.resource.data.clearedBySupervisorName == resource.data.clearedBySupervisorName
  && request.resource.data.clearanceUpdatedAt == resource.data.clearanceUpdatedAt
  && request.resource.data.createdAt == resource.data.createdAt
  && request.resource.data.email == request.auth.token.email
)
```

- [ ] **Step 4: Re-run the auth tests and a production build**

Run: `cmd /c pnpm exec vitest run src/features/auth/__tests__/authService.test.ts --reporter verbose`
Expected: PASS

Run: `cmd /c pnpm build`
Expected: PASS

- [ ] **Step 5: Commit the profile-sync foundation**

```bash
git add src/features/auth/profileService.ts src/hooks/useAuthBootstrap.ts src/lib/authz.ts firestore.rules src/features/auth/__tests__/authService.test.ts
git commit -m "feat: sync supervisor profile eligibility data"
```

## Task 4: Rebuild the login and settings UI around password-first recovery

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/RegisterPage.tsx`
- Modify: `src/pages/SettingsProfilePage.tsx`
- Test: `src/pages/__tests__/SettingsProfilePage.test.tsx`

- [ ] **Step 1: Add a failing component test for supervisor recovery UI**

```tsx
// src/pages/__tests__/SettingsProfilePage.test.tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SettingsProfilePage } from '../SettingsProfilePage'

vi.mock('../../hooks/useAppStore', async () => {
  const actual = await vi.importActual('../../hooks/useAppStore')
  return {
    ...actual,
    useAppSelector: (selector: (state: any) => any) =>
      selector({
        profile: {
          profile: {
            uid: 'u1',
            fullName: 'Supervisor User',
            email: 'supervisor@gmail.com',
            department: 'Computer Science',
            role: 'supervisor',
            staffId: '',
            assignedSupervisorUid: '',
            assignedSupervisorName: '',
            uploadCleared: true,
            clearedBySupervisorUid: '',
            clearedBySupervisorName: '',
            clearanceUpdatedAt: '',
            createdAt: '',
            updatedAt: '',
          },
        },
      }),
  }
})

describe('SettingsProfilePage', () => {
  it('shows editable supervisor recovery controls', async () => {
    renderWithProviders(<SettingsProfilePage />)

    expect(screen.getByLabelText(/CU staff ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/institutional email/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/CU staff ID/i), 'CU/STAFF/0042')
    expect(screen.getByDisplayValue('CU/STAFF/0042')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the component test**

Run: `cmd /c pnpm exec vitest run src/pages/__tests__/SettingsProfilePage.test.tsx --reporter verbose`

Expected: FAIL because the settings page is still read-only.

- [ ] **Step 3: Implement the password-first and supervisor-recovery UI**

```tsx
// src/pages/LoginPage.tsx
const [resettingPassword, setResettingPassword] = useState(false)
const [resetInfo, setResetInfo] = useState('')

async function onForgotPassword() {
  if (!email.trim()) {
    setLocalError('Enter your email first, then use forgot password.')
    return
  }

  try {
    setResettingPassword(true)
    setResetInfo('')
    await requestPasswordReset(email)
    setResetInfo('Password reset email sent. Check your inbox and spam folder.')
  } catch (submitError) {
    setLocalError(submitError instanceof Error ? submitError.message : 'Unable to send reset email.')
  } finally {
    setResettingPassword(false)
  }
}

<button type="button" onClick={() => void onForgotPassword()}>
  {resettingPassword ? 'Sending...' : 'Forgot password?'}
</button>
```

```tsx
// src/pages/RegisterPage.tsx
<div className="mt-6 auth-divider">or use Google if your institution requires it</div>
```

```tsx
// src/pages/SettingsProfilePage.tsx
const [staffIdDraft, setStaffIdDraft] = useState(profile?.staffId || '')
const [institutionalEmailDraft, setInstitutionalEmailDraft] = useState(profile?.email || '')
const [saving, setSaving] = useState(false)
const [info, setInfo] = useState('')

async function onSaveSupervisorRecovery(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (!profile) {
    return
  }

  setSaving(true)
  setInfo('')
  try {
    await updateOwnSupervisorProfile({
      uid: profile.uid,
      fullName: profile.fullName,
      department: profile.department,
      staffId: staffIdDraft,
    })

    if (institutionalEmailDraft.trim().toLowerCase() !== profile.email.toLowerCase()) {
      await requestSupervisorEmailChange(institutionalEmailDraft)
      setInfo('Verification sent to your institutional email. Complete verification, then sign in again.')
    } else {
      setInfo('Supervisor profile updated.')
    }
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 4: Re-run the component test and build**

Run: `cmd /c pnpm exec vitest run src/pages/__tests__/SettingsProfilePage.test.tsx --reporter verbose`
Expected: PASS

Run: `cmd /c pnpm build`
Expected: PASS

- [ ] **Step 5: Commit the UI recovery layer**

```bash
git add src/pages/LoginPage.tsx src/pages/RegisterPage.tsx src/pages/SettingsProfilePage.tsx src/pages/__tests__/SettingsProfilePage.test.tsx
git commit -m "feat: add supervisor eligibility recovery UI"
```

## Task 5: Run the end-to-end verification for Phase 1

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_WORKFLOW_AND_SETUP.md`

- [ ] **Step 1: Document the new password reset and supervisor recovery behavior**

```md
// README.md
- Password reset from the login page
- Supervisor eligibility recovery from Settings using CU staff ID plus verified institutional email
```

```md
// docs/PROJECT_WORKFLOW_AND_SETUP.md
### Supervisor eligibility recovery

Existing supervisors can recover supervisor mode in-app by:

1. Signing in with email/password
2. Opening Settings
3. Saving a valid CU staff ID
4. Requesting a verified change to a `@covenantuniversity.edu.ng` email
5. Completing the verification link and signing in again
```

- [ ] **Step 2: Run the full Phase 1 checks**

Run: `cmd /c pnpm test`
Expected: PASS

Run: `cmd /c pnpm build`
Expected: PASS

Run manual checks:

```txt
1. Sign in with email/password using a non-Google account.
2. Click Forgot password with a valid email and confirm the success banner appears.
3. Sign in as a restricted supervisor and confirm Settings shows editable CU staff ID and institutional email fields.
4. Save a staff ID only and confirm the restriction message updates correctly.
5. Request an institutional email change and confirm the verification instruction appears.
6. After verifying and signing in again, confirm Firestore profile email matches Firebase auth email and supervisor mode is restored.
```

- [ ] **Step 3: Commit the docs and verification pass**

```bash
git add README.md docs/PROJECT_WORKFLOW_AND_SETUP.md
git commit -m "docs: record phase 1 auth recovery workflow"
```

## Self-Review Notes

- Spec coverage for Phase 1 is complete: password-first auth, forgot password, actionable supervisor recovery, and profile email sync are all mapped to tasks.
- No placeholders remain in the plan.
- Type names are consistent across tasks:
  - `requestPasswordReset`
  - `requestSupervisorEmailChange`
  - `updateOwnSupervisorProfile`
  - `syncOwnProfileEmailFromAuth`
  - `getSupervisorEligibilityIssues`
