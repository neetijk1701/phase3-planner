# Phase 3 Planner

A student-built planner for WashU Medicine Phase 3. Students add the rotations they've done, registered for, or plan to take, and the site checks the plan against the graduation requirements: total weeks, ACRs, KISCs, electives, the Capstone, and limits such as Step study and away electives. It also flags overlapping rotations, a missing prerequisite (the Neurosurgery ACR needs the Neurosurgery elective first), and a fixed-length course planned twice.

Not an official WashU service. Workday and Keystone are the official record.

## Where things live

- **Students' plans** are saved only in their own browser (`localStorage`). Nothing about a student is sent anywhere. A backup code moves a plan to another device.
- **Requirements** live in the Google Sheet "Phase 3 Planner requirements" (ID in `wrangler.jsonc`), which must be shared as "Anyone with the link: Viewer". Tabs: How to edit, Settings, Requirements, Checklist, Dates, Notes. Edits reach the site within a few minutes.
- **Course list** is built into `public/index.html` (the `p3-catalog` block): every Phase 3 course in the public Washington University Bulletin 2026–27, with its weeks and type (`ACR`, `KISC`, `ELEC`, `TWOWO` 2-week only, `TWOWR` 2-week repeatable, `FOURWO` 4-week only, `FOURWR` 4-week repeatable). Update it when the bulletin changes.

## How the requirements are read

`src/worker.js` serves `/api/rules`, which reads each sheet tab as CSV (cached about 2 minutes). The app checks every row:

- A Requirements row needs an ID, a name, Type "At least" or "At most", whole-number Weeks, and something to count (Every rotation, ACRs, KISCs, Electives, or course codes like `MEDICINE 9100`). A row that fails keeps its last good version by ID; a new row that fails is skipped.
- A tab whose headers don't match, or that can't be read, keeps its last good version.
- The last good rules are saved on each device, and the version built into `index.html` is the fallback.

Keep Requirement IDs stable.

## Hosting

Cloudflare Workers (static assets plus the worker), connected to this repo. Push to `main` to go live; other branches such as `dev` get a preview link. `wrangler.jsonc` needs `"previews": {}` for branch previews. Bump `VERSION` in `public/sw.js` when publishing changes so phones pick up the new files.
