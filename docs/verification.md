# Prototype verification — 2026-10-26

## Automated checks

`node --test tests/*.test.mjs`: 10 passed, 0 failed.

Coverage: all nine navigation targets, material/heat loop graph, part/step/overview transitions, retained unique visits, explicit pause state, invalid input, all 25 selectable animated parts and finite model bounds, seven distinct concept keys, camera projection for every part at aspect ratios 0.55/0.7/1/1.8, first-frame timestamp handling, and offline single-file syntax/resource inclusion.

Model author additionally checked 720 animated model frames and transformed mesh bounds. Independent review found and verified repairs to camera boundary jumps, narrow viewport part clipping, decorative sprites intercepting clicks, and excessive line raycasting radius.

## Browser checks

- Actual Three.js/WebGL canvas renders; nine station labels appear in default overview.
- Clicked all nine steps in sequence. Each produced its correct title, 2–3 explanatory paragraphs, and 2–3 part controls (25 total).
- Inspected neutral-beam and turbine components; validated the part explanation and return controls.
- Checked zoom controls, pause/resume and overview return. Automatic tour advanced through four stations before being stopped.
- Dragged the 3D view and confirmed the projected station coordinates changed, then restored the default view.
- Checked desktop and narrow viewport layout and measured absence of horizontal document overflow.
- Full offline HTML was loaded and operated through the local preview server; it contains no external stylesheet or module requests.
- Final standalone reload and interaction cycle produced no new console warnings or errors. The first-frame negative timestamp case found during QA has a regression test and is fixed.

The browser automation policy only allows HTTP/HTTPS and blocked a `file:` navigation. Therefore direct double-click access was not exercised by automation; the offline artifact was instead checked for syntax, embedded resources and actual rendering via local HTTP. No browser security policy was bypassed.

## Deployment

Sites creation did not return a usable project identity. No hosted publication is claimed. The complete standalone HTML and modular source are the deliverables.
