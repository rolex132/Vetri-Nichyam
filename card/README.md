# Card Showcase

This is a small React + Vite demo that reads `newData.json` (already present in the project root) and displays interactive profile cards with animations (powered by `framer-motion`).

Quick start (Windows PowerShell):

```powershell
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

Features implemented:
- Search by name, email, or city (debounced input)
- Gender filter
- Card flip animation with keyboard support (Enter / Space)
- Like button persisted to `localStorage` across page reloads
- Shuffle visible cards (Shuffle button)
- Image loading skeleton and avatar fallback when images fail to load

Accessibility & notes:
- Cards are focusable and respond to keyboard activation.
- Likes are stored in `localStorage` under the key `card_showcase_likes_v1`.

If you want further upgrades I can:
- Persist more state (sorting or filters), add paging/infinite scroll, or
- Add a modal detail view and tests, or convert the project to TypeScript.
