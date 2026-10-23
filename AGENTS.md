# AGENTS.md — AI Coding Assistant Operating Guardrails
**CampusCycle | Google Gemini Hackathon (Industry & Innovation Track)**  
**Team: Codebreak Crew**  
**Role: Authoritative Operating Manual & Workflow Guardrails for AI Assistants**  
**Last Updated: 2026-10-23**

---

## 1. Project Identity & Source of Truth

**CampusCycle** is an AI-powered, peer-to-peer campus rental web platform enabling university students to rent academic and campus equipment (calculators, lab coats, blazers, electronics) from peers.

### 1.1 Single Source of Truth: `PROJECT_PLAN.md`
- **[PROJECT_PLAN.md](file:///c:/Users/hp/OneDrive/Desktop/Campus%20Cycle/PROJECT_PLAN.md)** is the authoritative master reference for all product requirements, technical architecture, database schemas, API contracts, pricing math, rental lifecycle rules, hackathon schedules, and roadmaps.
- **`AGENTS.md` (This File)** defines durable operating instructions, security rules, coding standards, testing criteria, and agent workflow guardrails.
- **Rule:** Before planning or implementing any task, **always inspect `PROJECT_PLAN.md` first**. Never introduce architectural changes, new endpoints, modified payload shapes, or schema deviations without first updating and aligning with `PROJECT_PLAN.md`.

---

## 2. Mandatory Implementation Workflow: One Small Task at a Time

> [!CAUTION]
> **CRITICAL RULE: WORK EXACTLY ONE SMALL TASK AT A TIME.**  
> Never perform massive multi-file rewrites across frontend and backend in a single turn.

Every AI assistant turn must strictly follow this 8-step cycle:

1. **Inspect First:** View `PROJECT_PLAN.md` and inspect the target files in the repository before writing code.
2. **State Scope:** Explicitly declare the exact task being executed and the specific files to be created or modified.
3. **Execute Atomically:** Implement only the declared task. Avoid touching unrelated files or functions.
4. **Inspect Diffs:** Verify that changes are tight, clean, and free of accidental edits or cosmetic whitespace churn.
5. **Execute Self-Verification:** Run terminal build, lint, type-check, or test commands (e.g., `npm run build`, `npm test`, or cURL) to verify correctness.
6. **Fix Issues Immediately:** If any check fails, resolve the issue before proceeding.
7. **Report & Update:** Report what changed, which checks passed/failed, and update deliverable status in `PROJECT_PLAN.md` (`PLANNED` $\rightarrow$ `IMPLEMENTED` $\rightarrow$ `TESTED`).
8. **STOP & Await Approval:** **Do not start the next independent task.** Wait for explicit user review and approval.

---

## 3. Core Coding Standards & Modular Architecture

### 3.1 Project Structure
Maintain strict modular isolation between `/backend` and `/frontend`:
- **Backend:** `src/config/`, `src/controllers/`, `src/middleware/`, `src/routes/`, `src/services/`, `src/types/`, `src/utils/`.
- **Frontend:** `src/components/`, `src/context/`, `src/hooks/`, `src/pages/`, `src/services/`, `src/types/`, `src/utils/`.

### 3.2 Code Quality Standards
- **Separation of Concerns:** Business logic (pricing math, date conflict checks, Firestore mutations, Gemini calls) belongs strictly in `/services`, not inside route controllers.
- **Fail-Safe Date Parsing:** Dates must always be handled as canonical `YYYY-MM-DD` strings to avoid UTC-to-local timezone shift errors.
- **Strict Typing:** Write clean TypeScript with explicit interfaces. Avoid `any` unless absolutely necessary for third-party SDK edge cases.
- **Zero Hallucinated Dependencies:** Only install established, verified packages documented in `PROJECT_PLAN.md` (`express`, `cors`, `dotenv`, `helmet`, `firebase-admin`, `@google/genai` or `@google/generative-ai`, `zod`).

---

## 4. Security Invariants & Secret Handling

1. **Never Trust Client Claims:** Never rely on client-supplied `userId`, `ownerId`, `totalPrice`, `isAvailable`, or `status`. Authenticated identity must always be extracted from `req.user.uid` following cryptographic verification by Firebase Admin (`verifyAuth` middleware).
2. **Server-Side Pricing Authority:** The frontend never submits `totalPrice`. The backend computes rental amounts deterministically using stored pricing models and the validated date range.
3. **Strict Resource Ownership:**
   - Only the item owner (`ownerId === req.user.uid`) can edit items, approve/reject rental requests, or confirm physical returns.
   - Only the booking renter (`renterId === req.user.uid`) can cancel a `pending` request.
   - An owner cannot rent their own item (`req.user.uid !== item.ownerId`).
4. **Backend-Only AI & Admin Credentials:** Google Gemini API keys (`GEMINI_API_KEY`) and Firebase Admin credentials (`FIREBASE_PRIVATE_KEY` / `serviceAccountKey.json`) must remain strictly on the backend. The frontend never calls Gemini directly.
5. **No Secrets in Source Control:** Never commit `.env`, `.env.local`, or private key files. Always supply a sanitized `.env.example` with placeholder values.
6. **Information Disclosure Prevention:** Public API error responses must adhere to the standard envelope `{ success: false, error: { code, message } }`. Never leak stack traces, database internals, or environment variables to clients.
7. **Concurrency Safety:** Approving a rental request must execute inside an atomic Firestore transaction (`runTransaction`) to prevent double-booking race conditions.

---

## 5. Testing & Verification Requirements

Every agent completing a module must execute and report testing across these dimensions:
- **Unit & Logic Checks:** Verify pricing calculations (daily, weekly, monthly pro-rata with 1-day minimum) and interval overlap detection ($S_1 \le E_2 \land S_2 \le E_1$).
- **Security & Permissions:** Verify unauthenticated requests return `401 Unauthorized`, unauthorized mutations return `403 Forbidden`, and invalid inputs return `400 Bad Request`.
- **Concurrency Verification:** Verify that two overlapping requests cannot both be approved concurrently.
- **AI Resilience & Fallbacks:** Verify that Gemini recommendations are grounded strictly in active Firestore listings (rejecting hallucinated IDs), and that the system gracefully falls back to keyword matching when Gemini API quotas are exhausted or offline.
- **End-to-End Loop:** Verify the full rental cycle: `Register/Login` $\rightarrow$ `List Item` $\rightarrow$ `Search/Filter` $\rightarrow$ `Request Booking` $\rightarrow$ `Owner Approves` $\rightarrow$ `Effective Status Active` $\rightarrow$ `Owner Confirms Return`.
- **Honest Reporting:** If a test cannot be executed (e.g., missing API key or external service offline), explicitly state it as unverified rather than fabricating test success.

---

## 6. Git & Team Collaboration Guardrails

1. **Ownership Boundaries:**
   - Backend Teammate owns `/backend`, Express routes, Firestore schemas, and Gemini integration.
   - Frontend Teammate owns `/frontend`, React components, Tailwind styling, and UI state.
2. **Contract Coordination:** If an API endpoint, field name, or payload must change, update `PROJECT_PLAN.md` and obtain agreement before modifying code. Never introduce breaking API changes silently.
3. **Branch Protection:** Keep `main` deployable. Develop in feature branches (`feat/be-*`, `feat/fe-*`) and integrate into `develop`.
4. **Clean Diffs:** Avoid mass cosmetic reformatting or lint-fixing on untouched files. Keep commits reviewable.
5. **Secret Hygiene:** Verify `.gitignore` contains `.env`, `serviceAccountKey.json`, and `node_modules`.

---

## 7. Documentation Maintenance & Status Tracking

1. **Keep Synced with `PROJECT_PLAN.md`:** When an approved technical decision changes, update `PROJECT_PLAN.md` immediately. Do not duplicate project planning tables or roadmaps inside `AGENTS.md`.
2. **Never Settle Decisions Twice:** Settled technical decisions (e.g., Firebase Firestore, unified student role, backend-only Gemini calls) must not be repeatedly reopened.
3. **Accurate Status Tracking:** Update the master deliverable matrix in `PROJECT_PLAN.md` using the standard lifecycle:
   $$\text{PLANNED} \longrightarrow \text{IMPLEMENTED} \longrightarrow \text{TESTED} \longrightarrow \text{DEPLOYED}$$
   Never mark an item `IMPLEMENTED` or `TESTED` without verified code and passing checks.

---
*End of AGENTS.md — AI Coding Assistant Operating Guardrails*
