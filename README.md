# Arnold + PPL Bulk Tracker — V3

Mobile-first React/Vite project with a six-day lifting plan, a rest day, local workout logging, body/nutrition tracking, charts, a 13-week progression view, JSON backups, and a clinician-entered cervical rehab checklist.

## Run locally

```bash
npm install
npm run dev
```

## Build for deployment

```bash
npm run build
```

Upload the contents of `dist/` to a static HTTPS host such as Vercel or Netlify. The PWA install prompt/“Add to Home Screen” behavior requires a deployed HTTPS URL. This project has not yet been deployed to a public URL.

## iPhone

Open the deployed URL in Safari → Share → Add to Home Screen.

## Data and safety notes

- Workout, body, nutrition, and rehab data are stored in this browser's local storage; they do not sync automatically between devices. Export backups regularly.
- Rehab exercises are intentionally not pre-filled. Add only movements and dosage approved by your clinician.
- Training notes are not medical advice. Stop exercises that aggravate symptoms and follow clinician guidance.
