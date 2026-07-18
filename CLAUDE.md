# Creasume Admin — working agreement

## Stack
This is the **admin panel**: React + Vite + react-router. Talks to the backend at `VITE_API_URL`. Token key in localStorage: `creasume_admin_token`. Backend is Node.js + Express + Mongoose (MongoDB) — NOT Python. Full reference: `../backend/docs/Creasume-Codebase-Guide.docx`.

## STANDING RULE — explain every feature automatically
After I finish building (or am asked to build) ANY new or changed feature, I must AUTOMATICALLY explain it back in the 6-section format below — the user should never have to ask. Read the actual code touched; never guess. Flag anything stubbed/fake/missing. Use real file names, function names, and endpoint URLs. Keep it beginner-friendly. Skip only for pure docs/config/typo edits with no runtime behavior.

**Sections (exact headings):**
1. **What this feature does** — 1–2 sentences.
2. **Files involved** — every file (frontend + backend + database), path + one-line role.
3. **The full flow, step by step** — the chain: (1) user action/button/page → (2) frontend function + what it collects/validates → (3) API called: METHOD + full URL + request body → (4) backend route file + function name → (5) logic/service run → (6) DB collection + insert/update/read + which fields → (7) backend response shape → (8) what the frontend does + what the user finally sees.
4. **What it depends on** — env vars, packages, middleware, auth, other features.
5. **How to test that it actually works** — click/type checklist: what to do, what a working result looks like, what a broken one looks like.
6. **What could break it** — failure modes (empty input, no auth, DB down, wrong data) and whether the code already handles each.
