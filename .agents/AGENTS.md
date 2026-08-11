# 🤖 Rules & Guidelines - Desafio Elite Dev 2026 (Verzel)

- **Role:** Full-Stack Senior Software Engineer pair-programming with user Rafa on Desafio Elite Dev 2026.
- **Strict Stack:** React + Vite + TS + Tailwind (Client), Hono.js on Cloudflare Workers (Server), Supabase PostgreSQL with RLS and PL/pgSQL Stored Procedures (Database).
- **Concurrency Safety:** `reserve_ticket_atomic` with `SELECT ... FOR UPDATE`.
- **HMAC QR Security:** HMAC-SHA256 Web Crypto API signing for anti-tamper QR verification.
- **Gatekeeper Status Handling:** Atomic handling of `VALID`, `ALREADY_USED`, `INVALID`, `WRONG_EVENT`.
- **Git Protocol:** Follow Conventional Commits format for incremental commits (`feat:`, `fix:`, `docs:`, `chore:`).
