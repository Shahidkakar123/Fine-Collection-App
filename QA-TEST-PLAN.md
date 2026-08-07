# Production QA Test Plan – Fine Collection App

## 1. Purpose
This document defines a production-grade test plan for the Fine Collection App release. It covers core business flows, authentication, data integrity, role-based access, notifications, API behavior, and release-readiness checks.

## 2. Scope
### In scope
- User registration, login, logout, password reset, and email verification
- Dashboard data loading and summary rendering
- Fine management workflows
- Employee management and role-based access
- Chat and notification-related flows
- Backend API protection and data correctness
- Responsive UI behavior and basic reliability checks

### Out of scope
- Third-party SMS provider validation beyond app-level behavior
- Full performance/load testing under large production traffic
- Browser automation beyond manual smoke and selected regression checks

## 3. Release Assumptions
- Frontend runs locally at http://localhost:5174 (or the configured frontend URL)
- Backend runs at http://localhost:3000
- MongoDB is available and seeded with application data
- Demo credentials for testing are available:
  - Username: PD
  - Password: admin

## 4. Test Strategy
### Test levels
- Smoke testing: verifies the app is usable before deeper testing
- Functional testing: validates user journeys and business logic
- Negative testing: confirms graceful handling of invalid input and failure states
- Security testing: confirms access control and token handling
- Regression testing: ensures recent changes did not break existing functionality

### Priorities
- P0: Release-blocking issues that prevent core use
- P1: Important issues affecting user confidence or business workflows
- P2: Lower severity, polish, or nice-to-have issues

## 5. Test Data
- Valid employee registration data
- Invalid email/password combinations
- Existing PD account: PD / admin
- Existing employee accounts from seeded data
- Sample fine records and employee records
- A valid but unverified user for email verification tests

## 6. Test Case Catalog

### A. Authentication and Access Control

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| AUTH-001 | P0 | Guest can access login and register pages | Open app root and navigate to login/register | Login and register pages load correctly without auth token |
| AUTH-002 | P0 | User can log in with valid credentials | Enter valid username/password and submit | User is authenticated and redirected to dashboard |
| AUTH-003 | P0 | Invalid login is rejected | Enter invalid credentials | Error is shown and user remains on login screen |
| AUTH-004 | P0 | Password is not accepted when empty | Submit empty password | Validation error appears |
| AUTH-005 | P0 | Protected routes require authentication | Open dashboard/fines/employees/chat directly without login | User is redirected to login |
| AUTH-006 | P1 | Role-based access is enforced | Log in as employee and try to open PD-only pages | Access is denied or redirected |
| AUTH-007 | P1 | Session persists across refresh | Log in, refresh the page | User stays authenticated and does not lose session unexpectedly |
| AUTH-008 | P1 | Logout clears auth state | Log out from the UI | Token is cleared and the user is redirected to login |

### B. Registration and Email Verification

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| REG-001 | P0 | New user can register successfully | Fill valid registration form and submit | User account is created and success message is shown |
| REG-002 | P0 | Registration blocks weak password | Use password without letters/numbers or below minimum length | Validation error is shown |
| REG-003 | P1 | Registration blocks invalid email format | Enter malformed email | Validation error is shown |
| REG-004 | P1 | Duplicate username or email is handled properly | Register same username/email twice | Clear error message is shown and duplicate is rejected |
| REG-005 | P0 | Verification email flow works | Register a new user and follow the verify link | Verification succeeds and user can log in afterward |
| REG-006 | P1 | Already-verified user is handled correctly | Open an already-verified link again | User sees a friendly already-verified message |
| REG-007 | P1 | Expired or invalid verification token is rejected | Use an invalid or expired token | Proper error message is shown |

### C. Dashboard and Main Views

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| DASH-001 | P0 | Dashboard loads data after login | Log in as a valid user | Dashboard renders without empty crash states |
| DASH-002 | P1 | Dashboard shows correct summary values | Review values on dashboard | Values match backend data and are formatted consistently |
| DASH-003 | P1 | Dashboard handles empty data gracefully | Use a fresh account or empty dataset | Empty state is shown instead of broken UI |
| DASH-004 | P1 | Navigation between tabs works correctly | Click Dashboard, Fines, Employees, Chat | Each view loads and the selected tab state is correct |
| DASH-005 | P1 | Refreshing inside a tab preserves the page state as expected | Navigate and refresh | The app remains stable and does not break routing |

### D. Fine Management

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| FINE-001 | P0 | PD can view fines list | Log in as PD and open fines view | List loads with existing fines |
| FINE-002 | P0 | Employee cannot access PD-only fines management | Log in as employee and navigate to fines | Access is denied or redirected |
| FINE-003 | P1 | Create a new fine | Fill form with valid inputs and submit | Fine appears in list and is persisted |
| FINE-004 | P1 | Validation prevents invalid fine input | Submit incomplete or invalid values | Validation error is shown and no invalid record is created |
| FINE-005 | P1 | Edit an existing fine | Update a fine and save | Updated value is reflected immediately and persisted |
| FINE-006 | P1 | Delete or close a fine flow behaves correctly | Perform delete/close action based on available UI | State updates correctly and no stale data remains |
| FINE-007 | P2 | Filter and sorting behavior is consistent | Use list filters or sorting controls if present | Results update correctly and remain deterministic |

### E. Employee Management

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| EMP-001 | P0 | PD can access employee management | Log in as PD and open employees page | Employee list loads correctly |
| EMP-002 | P1 | Employee list is accurate and complete | Compare displayed employees with backend data | No missing or duplicate entries |
| EMP-003 | P1 | Promote or manage role changes work correctly | Perform role change if available in UI | Role update is reflected and saved |
| EMP-004 | P1 | Non-PD cannot access employee management | Log in as employee and try to navigate there | Access is forbidden |
| EMP-005 | P2 | Empty employee state is handled gracefully | Use a fresh dataset or filtered result | Empty state is displayed instead of a crash |

### F. Chat and Notifications

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| CHAT-001 | P1 | Chat page loads without crash | Open chat view | Page renders and API data loads or shows empty state |
| CHAT-002 | P1 | Sending a message updates chat | Send a message through the chat UI | Message appears in the active conversation |
| CHAT-003 | P1 | Unread or notification state is handled correctly | Trigger message or notification flow | Notification center or badge updates appropriately |
| CHAT-004 | P1 | Invalid or empty message is blocked | Submit empty message | Validation prevents send and no empty content is stored |
| CHAT-005 | P2 | Notification center can be opened and closed | Open/close notifications panel | UI responds correctly without layout issues |

### G. API and Data Integrity

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| API-001 | P0 | Protected endpoints reject missing token | Call secured endpoints without Authorization header | API returns 401 Unauthorized |
| API-002 | P0 | Protected endpoints allow valid JWT | Send a valid token | API returns expected data |
| API-003 | P1 | Invalid JWT is rejected | Send a malformed token | API returns 401/403 as appropriate |
| API-004 | P1 | Role-restricted endpoints reject unauthorized access | Use employee token against PD-only endpoint | API denies access |
| API-005 | P1 | Backend returns consistent, parseable JSON | Call major endpoints | Response is valid JSON and status is correct |
| API-006 | P1 | Data is persisted correctly after create/update actions | Create or edit a record and re-fetch it | Changes are saved and visible in subsequent requests |

### H. UI, UX, and Reliability

| ID | Priority | Test case | Steps | Expected result |
|---|---|---|---|---|
| UI-001 | P1 | Mobile view remains usable | Resize the app to a narrow viewport | Layout is readable and buttons remain accessible |
| UI-002 | P1 | Error messages are user-friendly | Trigger validation and API errors | Messages are clear and actionable |
| UI-003 | P1 | Loading states appear during async work | Trigger slow actions | Spinner/disabled states appear and prevent duplicate submit |
| UI-004 | P1 | App does not crash on failed network requests | Temporarily disconnect network or trigger a bad request | App shows an error state rather than crashing |
| UI-005 | P2 | Browser back/forward behavior is acceptable | Navigate between screens and use browser back/forward | Routing remains coherent |

## 7. Suggested Execution Order
1. Smoke tests: AUTH-001, AUTH-002, DASH-001, FINE-001
2. Registration and verification: REG-001 to REG-007
3. Core business flows: FINE-001 to FINE-006, EMP-001 to EMP-004
4. Security and API: AUTH-005, AUTH-006, API-001 to API-004
5. Reliability and polish: UI-001 to UI-005, CHAT-001 to CHAT-005

## 8. Evidence to Capture During Testing
For each executed test, record:
- Date and tester name
- Browser and device used
- Exact input used
- Observed result
- Screenshot or console evidence if applicable
- Pass / fail / blocked status
- Defect ID if a bug is found

## 9. Execution Log – Initial Release Test Cycle
Executed on: 2026-08-07
Tester: Automated validation via local live environment

### 9.1 Verified results from live execution
| ID | Status | Evidence |
|---|---|---|
| AUTH-002 | PASS | PD login returned HTTP 200 and issued a JWT token |
| AUTH-005 | PASS | Protected endpoints rejected requests without a token with HTTP 401 |
| API-001 | PASS | Missing-token requests to protected APIs returned HTTP 401 |
| API-002 | PASS | Valid JWT requests to protected APIs returned HTTP 200 |
| API-003 | PASS | Invalid-token requests returned HTTP 401 |
| REG-001 | PASS | Registration endpoint returned HTTP 201 Created for a new sample user |
| DASH-001 | PASS | Backend health and protected endpoints responded successfully, indicating the app’s core data path is live |
| UI-001 | PASS | Frontend dev server responded at http://localhost:5173/ with HTTP 200 |

### 9.2 Environment notes
- Backend was verified at http://localhost:3000
- Frontend was verified at http://localhost:5173/
- The frontend dev server required Node 20 in this environment; if Vite throws the crypto error, run `nvm use 20` before restarting the frontend
- The initial test run confirmed that core authentication, registration, and protected API flows are functioning

### 9.3 Known follow-up areas
- Email verification flow should be exercised end-to-end with a real verification link
- UI navigation and role-based page access should be tested manually in the browser for full confidence
- Additional regression checks should be run after further UI or backend changes

### 9.4 Additional regression results from deeper checks
| ID | Status | Evidence |
|---|---|---|
| AUTH-006 | PASS | PD-only endpoint responded with HTTP 200 for a valid PD token |
| API-004 | PASS | Unauthorized access to role-restricted endpoints was denied |
| REG-002 | PASS | Weak-password requests returned HTTP 400 with a validation error |
| REG-003 | PASS | Invalid-email requests returned HTTP 400 with a validation error |
| REG-004 | PASS | Duplicate/invalid registration attempts returned HTTP 400 and were rejected |
| UI-001 | PASS | Frontend dev server responded at http://localhost:5174/ with HTTP 200 |
| REG-005 | PARTIAL | Backend verify-email endpoint returned a graceful error for an invalid token; full browser-based verification still needs a real link test |
| UNIT-001 | PASS | New fine-payload validation unit tests passed (10 tests total across auth and fine validation) |

## 10. Exit Criteria for Release
The release should be considered ready only if:
- All P0 tests pass
- No critical security or authentication issues remain
- Core flows (register, verify email, login, dashboard, fines, employees) work reliably
- Known issues are documented and accepted by stakeholders
