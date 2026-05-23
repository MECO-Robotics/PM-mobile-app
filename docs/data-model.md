# Data Model

Domain types live in `src/types/domain.ts`. This document summarizes the entities that matter to mobile workflows.

## People

`Member` represents a workspace person.

Roles:

- student
- lead
- mentor
- admin

Members can be linked to tasks as owners or mentors, manufacturing/purchase requests as requesters, work logs as participants, and subsystems as responsible engineers or mentors.

## Subsystems And Design Structure

`Subsystem` represents a robot/system area. It can have a parent subsystem, responsible engineer, mentor IDs, and risk notes.

`Discipline` represents work type, such as mechanical, electrical, software, integration, or QA/test.

`Mechanism` belongs to a subsystem and provides a more specific design/work area.

`Requirement` belongs to a subsystem and tracks MoSCoW priority plus requirement status.

## Tasks

`Task` is the core execution unit.

Important fields:

- title and summary
- subsystem, discipline, mechanism, requirement, part, and target event links
- owner and mentor
- start date and due date
- priority
- status
- dependency IDs
- checklist items
- blockers and `isBlocked`
- linked manufacturing and purchase IDs
- estimated and actual hours
- documentation requirements

Task statuses:

- `not-started`
- `in-progress`
- `waiting-for-qa`
- `complete`

Task priorities:

- `critical`
- `high`
- `medium`
- `low`

## Events And Milestones

`Event` represents calendar items visible to planning flows.

Event types:

- drive practice
- competition
- deadline
- internal review
- demo

`BootstrapMilestone` is the server-side milestone shape that can be mapped into mobile events.

## Work Logs And Attendance

`WorkLog` links date, hours, participants, notes, and a task.

`AttendanceRecord` links a member, date, and total hours.

The app also keeps meeting RSVP/sign-in status for attendance views.

## Manufacturing

`ManufacturingItem` represents work that needs to be made by CNC, 3D printing, or fabrication.

Manufacturing statuses:

- `requested`
- `approved`
- `in-progress`
- `qa`
- `complete`

Manufacturing process values:

- `3d-print`
- `cnc`
- `fabrication`

Mentor review is tracked with `mentorReviewed`.

## Inventory And Purchases

`PartDefinition` describes a reusable part, including name, part number, revision, type, source, material, and description.

`PartInstance` places a part definition into a subsystem/mechanism context with quantity and lifecycle status.

Part instance statuses:

- `planned`
- `needed`
- `available`
- `installed`
- `retired`

`PurchaseItem` tracks vendor, quantity, estimated/final cost, mentor approval, and delivery state.

Purchase statuses:

- `requested`
- `approved`
- `purchased`
- `shipped`
- `delivered`

## QA

`QaRequest` asks a mentor to review a task or subject.

`QaReview` records the result, participants, mentor approval, notes, and evidence notes.

QA results:

- `pass`
- `minor-fix`
- `iteration-worthy`

Iteration-worthy findings can drive follow-up task creation.

## Bootstrap Payload

`PlatformBootstrapPayload` is intentionally optional by field so the app can accept partial server snapshots during development. Missing collections are filled from local defaults or treated as empty depending on the workflow.

