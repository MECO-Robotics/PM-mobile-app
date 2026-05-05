### General Principles

* Prefer small, cohesive files and directories.
* Optimize for separation of responsibilities, not just size limits.
* Use numeric thresholds to trigger refactoring, not just hard caps.
* Never ask to show the implementation when you can just implement the requested change.
* Do not stop to recommend changes unless you were explicitly asked to recommend options; implement the requested change instead.

---

### Development Workflow

* Branch model:
  * `main`: production-ready only
  * `development`: integration branch for active work
  * `feature/*`: short-lived feature branches
  * `fix/*`: short-lived bugfix branches
  * `hotfix/*`: emergency production fixes
* PR flow:
  * Merge `feature/*` and `fix/*` into `development` by PR only.
  * Merge `hotfix/*` into `development` or `main` by PR only.
  * Merge into `main` only from `development` or `hotfix/*` by PR only.
* Protected branch requirements:
  * `development`: required checks `ci-validate` and `snapshot-validate`, at least 1 approval.
  * `main`: required checks `ci-validate`, `snapshot-validate`, and `cross-repo-production-gate`, at least 2 approvals.
  * Keep conversation resolution, linear history, and admin enforcement enabled on both protected branches.
* Release safety requirements:
  * Validate sanitized production-like snapshots before merge.
  * Enforce stricter cross-repo validation before `main` merges.
  * Publish mobile releases only from `main`, `release-*` tags, or a release manifest.
  * Mobile release target is GitHub Releases/EAS builds, not the VPS.
* Do not introduce or rely on a permanent live staging environment. There is one production VPS for web/server only.

---

### File Size Rules (React Native / TypeScript)

**Measurement**

* Count only implementation lines.
* Exclude:

  * import statements
  * comments
  * blank lines
  * type-only declarations

**Limits**

* Target: <150 implementation lines
* Refactor trigger: >220 implementation lines
* Hard max: 300 implementation lines (must not exceed)

**Enforcement**

* If a file exceeds 220 lines, split into:

  * components
  * hooks
  * utility modules

**Additional Constraints**

* Each file must export one primary component, hook, or module.
* If a file imports CRUD or logic for more than 3 domain entities, extract into a hook (e.g. `useWorkspaceMutations`).

---

### Import Rules

* Imports do not count toward file size limits.
* Target: <60 import lines
* Review trigger: >100 import lines
* Hard max: 150 import lines (only allowed for root, registry, or generated files)

**Enforcement**

* If imports exceed 80 lines:

  * introduce barrel files (`index.ts`)
  * group imports by feature/module
* If imports exceed 150 lines:

  * file must be reviewed for decomposition

---

### Directory Size Rules

**Measurement**

* Count files directly inside the directory, not recursively.

**Limits**

* Target: 5-10 files
* Refactor trigger: >12 files
* Hard max: 20 files

**Enforcement**

* If a directory exceeds 12 files:

  * create subdirectories grouped by responsibility:

    * components/
    * hooks/
    * api/
    * model/
* If a directory exceeds 20 files:

  * must be split into multiple feature or domain directories

**Additional Constraints**

* A directory must represent a single feature or domain concept.
* Avoid flat directories with mixed responsibilities.

---

### Style Rules

**Measurement**

* Count only style rule and declaration lines in `StyleSheet.create`, CSS, or theme files.
* Exclude:

  * comments
  * imports

**Limits**

* Target: <120 lines
* Refactor trigger: >150 lines
* Hard max: 220 lines

**Scope**

* Each style file must map to exactly one component or feature.
* No global styles except:

  * reset
  * theme
  * typography
* If limits are exceeded:

  * split by component or responsibility

---

### Structural Rules

* Each React Native screen or component should keep styles scoped to the feature or colocated in a dedicated style module when that improves readability.
* Do not create large shared style files with mixed responsibilities.
* Prefer feature-based directory structure.

---

### Exceptions

Allowed to exceed limits ONLY for:

* App root files (App.tsx, main.tsx, index.ts)
* Route registries
* Generated files
* Type definition aggregators
* Icon maps or constant registries

These must still be reviewed if they exceed:

* 400 implementation lines
* 200 import lines

---

### Summary (Strict Mode)

* Max file size: 300 implementation lines
* Max directory size: 20 files
* Max style size: 220 lines
* Max imports: 150 lines

Exceeding any hard limit is not allowed.
