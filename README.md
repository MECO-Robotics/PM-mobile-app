# MECO Mission Control Mobile

Expo/React Native mobile client for MECO Mission Control manufacturing, planning, and operations workflows.

## What this repo covers

- Mobile dashboard for subsystem status, blockers, and priority work.
- Task workflow states: not started, in progress, waiting for QA, complete.
- Meeting RSVP, attendance, and required work-log visibility.
- Manufacturing and purchase queues with mentor review checkpoints.
- QA outcomes that separate minor rework from iteration-worthy failures.
- Planning metrics surfaced from the same operational data.
- Google and email sign-in flows backed by the platform auth configuration.
- Work-log timer persistence with local notification reminders.
- Materials, parts, purchases, manufacturing, risks, roster, and subsystem management screens.

## Documentation

Detailed app documentation lives in [`docs/`](docs/):

- [`docs/overview.md`](docs/overview.md) - product purpose, users, and core workflows.
- [`docs/features.md`](docs/features.md) - screen-by-screen behavior and expected actions.
- [`docs/architecture.md`](docs/architecture.md) - source layout, state ownership, UI structure, and services.
- [`docs/api-integration.md`](docs/api-integration.md) - backend configuration, auth, bootstrap data, and mutation endpoints.
- [`docs/data-model.md`](docs/data-model.md) - domain entities and status lifecycles.
- [`docs/development.md`](docs/development.md) - local setup, scripts, simulators, and environment variables.
- [`docs/release.md`](docs/release.md) - branch policy, CI, EAS release expectations, and production safety.

## Why this is separate from the hosted backend

The mobile client is built with Expo/React Native. The companion `meco-mission-control-platform` repo is the piece intended for DigitalOcean hosting and database management.

The `meco-mission-control-web` repo complements this app with browser-first dashboards for mentors and admin workflows.

## Local commands

Use Node 22 LTS for local Expo development:

```bash
nvm use
```

```bash
npm install
npm run sim:reset
npm run start
npm run ios
npm run android
npm run lint
npm run typecheck
npm test
```

`npm run dev` is an Android-focused shortcut that runs `script/build_and_run.sh --android`.

Do not run Expo or npm scripts with `sudo`. If `node_modules` or `.expo` become owned by `root`, fix ownership from the repo root before starting the app:

```bash
sudo chown -R "$USER":staff .expo node_modules
```

For the Android simulator on Windows, this repo also has Codex actions wired through
`script/build_and_run.ps1`. Use `Run Android` in Codex or run:

```powershell
powershell -ExecutionPolicy Bypass -File ./script/build_and_run.ps1 --android
```

The Android launcher uses `10.0.2.2` as the emulator route back to the Windows
host and keeps `adb reverse tcp:8081 tcp:8081` refreshed before Expo opens.
The local Android simulator uses `.env.local` with
`EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080` so it can reach a backend running
on the Windows host.

## Release automation

- `CI` workflow runs `npm run typecheck` on pull requests and `main`.
- `Mobile Release` workflow builds iOS + Android via EAS after `CI` succeeds on `main`, or manually via `workflow_dispatch`.
- Set GitHub repository secret `EXPO_TOKEN` before running release builds.
- Set GitHub repository secret `EXPO_PUBLIC_API_BASE_URL` so production builds point at the hosted API.
- Ensure `expo.ios.bundleIdentifier` and `expo.android.package` are set in `app.json` for non-interactive EAS builds.
- Production EAS builds use `eas.json` profile `production`, with Android output as an app bundle.

## Next product steps

1. Replace the mock snapshot in `src/data/mockData.ts` with API calls to `meco-mission-control-platform`.
2. Add auth and role-aware views for students, mentors, and admins.
3. Connect meeting sign-in, work-log submission, and QA forms to the backend.
