# MECO Mobile

Expo/React Native starter for the MECO Robotics project-management and manufacturing workflow app.

## What this repo covers

- Mobile dashboard for subsystem status, blockers, and priority work.
- Task workflow states: not started, in progress, waiting for QA, complete.
- Meeting RSVP, attendance, and required work-log visibility.
- Manufacturing and purchase queues with mentor review checkpoints.
- QA outcomes that separate minor rework from iteration-worthy failures.
- Planning metrics surfaced from the same operational data.

## Why this is separate from the hosted backend

The mobile client is built with Expo/React Native. The companion `meco-platform` repo is the piece intended for DigitalOcean hosting and database management.

## Local commands

```bash
npm install
npm run start
npm run typecheck
```

## Next product steps

1. Replace the mock snapshot in `src/data/mockData.ts` with API calls to `meco-platform`.
2. Add auth and role-aware views for students, mentors, and admins.
3. Connect meeting sign-in, work-log submission, and QA forms to the backend.
