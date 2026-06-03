# fo.cus

Cyber-utilitarian focus dashboard built with **Next.js** — goals, reminders, check-ins, and streaks.

## Features

- **Goal board** — add goals with target time window, tags, and progress slider on the active goal
- **Reminder engine** — `setInterval` + Browser Notification API; respects focus hours (no midnight pings)
- **Check-in modal** — fires on reminder with on track / struggling / wrapped it up
- **Settings** — interval (30m, 1h, 2h, custom), sound toggle, notifications toggle, focus hours window
- **Streak tracker** — weekly strip + day streak from completed goals
- **Persistence** — `localStorage` for goals, settings, and streaks

## Run

```bash
cd /Users/ayush/project/fo-cus
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Allow notifications when prompted (required for reminder pings).

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Web Audio API (soft chime)
- No backend — all client-side

## Legacy

The original static HTML prototype lives in `legacy/`.
