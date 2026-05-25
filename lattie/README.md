# Lattie

Your busy-body project organizer. One loop for newsletter, podcast, speaker engagements, AI/video skills, and the work AI initiative — with an agent coach that knows your projects and nudges you around your workday.

## Setup

```bash
cd lattie
npm install
cp .env.example .env.local
# add your Anthropic API key to .env.local
npm run dev
```

Open http://localhost:3000.

## What's in here

- **Today** — schedule view for the current day, slotted around your 10–6:30 workday.
- **Projects** — five seeded projects (Newsletter, Podcast, Speaker Engagements, AI Skills, Work AI Initiative). Add/edit/complete tasks under each.
- **Coach** — chat with an agent that has full context of your projects and pending tasks. Powered by Claude Opus 4.7.
- **Briefing** — proactive morning/afternoon summaries the coach writes for you.
- **Alerts** — browser notifications for tasks coming up.

## Data

Stored as JSON at `data/lattie.json`. Single-user, single-machine. Back up by copying the file.

## Configuration

- `LATTIE_WORK_START` / `LATTIE_WORK_END` — your workday window (defaults 10:00 / 18:30)
- `LATTIE_TIMEZONE` — IANA timezone (defaults to America/New_York)
- `ANTHROPIC_API_KEY` — required for the coach chat and briefings
