# CampusCycle Frontend Rules

## PRIORITY
- Frontend only.
- The site is named "CampusCycle" everywhere.
- No tests.
- No stopping for approval.
- Install only necessary dependencies (`react-router-dom`, `firebase`, `tailwind`).
- Every visible button, link, and form must work, with loading, empty, and error states.

## SECURITY
1. The client NEVER sends `userId`, `ownerId`, `renterId`, `totalPrice`, `isAvailable`, or `status`. Identity comes only from the Firebase ID token in the `Authorization` header.
2. Pricing is server-side only: show costs from backend responses and never compute or submit `totalPrice`.
3. Only the item owner sees Edit, Approve, Reject, and Confirm Return; only the renter sees Cancel, and only on pending bookings; owners cannot request their own item (disable the button and explain why).
4. The frontend NEVER calls Gemini directly and contains no Gemini or Firebase Admin keys; only the public `VITE_FIREBASE_*` web config is allowed.
5. Provide `.env.example` with placeholders and ensure `.gitignore` covers `.env`, `.env.local`, `serviceAccountKey.json`, and `node_modules`.
6. The backend error envelope is `{ success: false, error: { code, message } }`: show `error.message` nicely, never stack traces; handle 400 (field messages), 401 (redirect to `/login`), 403 (permission message), overlap/conflict errors, and network failure (retry state).

## CODE
- Stack: React + Vite + TypeScript + Tailwind.
- Folders under `/frontend/src`: `components`, `context`, `hooks`, `pages`, `services`, `types`, `utils`.
- All API calls live in `services`, never inside components.
- Explicit TypeScript interfaces; avoid `any`.
- Dates are ALWAYS canonical `YYYY-MM-DD` strings (no timezone-shifting Date conversions).
- Keep diffs tight.

## BOOKING STATUSES
Statuses are distinct and never merged:
- `pending` (requested)
- `approved`
- `active` (approved and period started)
- `completed` (owner confirmed return)
- `cancelled` (and rejected if the backend has it)
Use the exact values the backend returns, each with its own color and label.

## HONESTY
- Do not invent users, transactions, testimonials, ratings, environmental savings, or statistics.
- Impact numbers must be computed only from real returned data, with assumptions shown (hide the section if there is no data).
- Label anything not implemented (payments, insurance, ID verification, dispute resolution) as "Not yet available".
- Show plain-language cancellation, late return, and damage policies.
- Show "Report listing" only if the backend supports it, otherwise "Coming soon".
- Do not expose contact details; communication is via booking requests.

## GEMINI
- AI output is labeled "AI suggested" and stays user-controllable and editable.
- Recommendations may only show items that exist in the backend's real item list.
- If the AI call fails or quota is exhausted, fall back to keyword search and tell the user.
- Show a `<GeminiBadge>` ("Powered by Gemini Flash-Lite" plus model name and response time when available).
- The intended backend model is `gemini-3.5-flash-lite`; if the backend returns a model name, display that instead.

## VISUAL
- Polished, restrained, professional, trustworthy.
- Inter font, indigo primary, neutral grays, rounded-xl cards, consistent spacing, strong hierarchy, subtle transitions, no heavy gradients.
- Fully responsive with complete mobile functionality.
- Accessible (labels, focus states, alt text, contrast).

## SCOPE
3 core features only:
1. Browse with Gemini smart search
2. Item page with booking request
3. Dashboard for renter and owner
Plus a minimal login and a homepage.
