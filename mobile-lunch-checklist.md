# Mobile Production Readiness Checklist

Use this checklist before promoting the mobile app to production or publishing an
EAS/GitHub Release build for iOS and Android. Complete every status line with the date, command,
environment, and owner initials for the release.

## Release Summary

- Release candidate:
- Release owner:
- Target branch or tag:
- Production API target:
- Checklist completed on:

## Typecheck And Build Status

- [ ] `npm run typecheck` passes.
  - Status:
  - Run date:
  - Evidence:
- [ ] iOS production build is complete or queued in EAS/GitHub Actions.
  - Status:
  - Build link:
  - Build profile:
- [ ] Android production build is complete or queued in EAS/GitHub Actions.
  - Status:
  - Build link:
  - Build profile:
 - [ ] Required GitHub checks are passing before promotion.
  - `merge-requirements`:
  - `ci-validate`:
  - `snapshot-validate`:
  - `cross-repo-production-gate`, for `main` promotions:

## Auth Status

- [ ] Login flow works for a valid production-ready user.
- [ ] Invalid credentials show a recoverable error and do not enter the app.
- [ ] Session restore works after closing and reopening the app.
- [ ] Logout clears the session and returns to the unauthenticated state.
- [ ] Role-aware views match the expected permissions for student, mentor, and admin users.
- Notes:

## Backend Compatibility

- [ ] `EXPO_PUBLIC_API_BASE_URL` points to the intended hosted backend.
- [ ] The mobile app version is compatible with the deployed backend version.
- [ ] Dashboard, tasks, meetings, manufacturing, purchase, QA, and planning data load without schema errors.
- [ ] Empty, loading, and failed API states render correctly.
- [ ] Any backend migrations or feature flags required by this release are already deployed.
- Backend version or commit:
- Compatibility notes:

## iOS Smoke Test

- [ ] Install the release candidate on a physical iOS device or representative simulator.
- [ ] App launches cleanly without a crash.
- [ ] Login, session restore, and logout work.
- [ ] Dashboard loads current subsystem status, blockers, and priority work.
- [ ] Task workflow can display not started, in progress, waiting for QA, and complete states.
- [ ] Meeting RSVP, attendance, and required work-log views open successfully.
- [ ] Manufacturing and purchase queues render with mentor review checkpoints.
- [ ] QA outcomes render minor rework and iteration-worthy failure states.
- [ ] Planning metrics display from backend data.
- [ ] App recovers gracefully after backgrounding, foregrounding, and network loss.
- Device or simulator:
- iOS version:
- Tester:
- Notes:

## Android Smoke Test

- [ ] Install the release candidate on a physical Android device or representative emulator.
- [ ] App launches cleanly without a crash.
- [ ] Login, session restore, and logout work.
- [ ] Dashboard loads current subsystem status, blockers, and priority work.
- [ ] Task workflow can display not started, in progress, waiting for QA, and complete states.
- [ ] Meeting RSVP, attendance, and required work-log views open successfully.
- [ ] Manufacturing and purchase queues render with mentor review checkpoints.
- [ ] QA outcomes render minor rework and iteration-worthy failure states.
- [ ] Planning metrics display from backend data.
- [ ] App recovers gracefully after backgrounding, foregrounding, and network loss.
- Device or emulator:
- Android version:
- Tester:
- Notes:

## Promotion PR

- Promotion PR:
- Status:
- Base branch:
- Head branch:
- Required before merge:
  - [ ] Checklist completed.
  - [ ] Required checks are green.
  - [ ] Required approvals are present.
  - [ ] Conversation resolution is complete.

## Rollback Or Revert Path

- [ ] Identify the exact release tag, GitHub Release, EAS build, or merge commit being rolled back.
- [ ] If the promotion PR is not merged, close or supersede the PR and keep production on the current `main`.
- [ ] If the promotion PR is merged but no mobile release is published, revert the merge commit on `main` with a hotfix PR.
- [ ] If a mobile release is published, publish the last known-good release build again or submit a hotfix build from `main`.
- [ ] Confirm `EXPO_PUBLIC_API_BASE_URL` and any release secrets still point to the intended production backend.
- [ ] Re-run iOS and Android smoke tests after rollback or hotfix publication.
- Last known-good release:
- Revert PR or hotfix PR:
- Rollback owner:
