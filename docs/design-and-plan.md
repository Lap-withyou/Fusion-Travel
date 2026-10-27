# 托卡马克：从燃料到一盏灯

## Design
Browser-native Three.js prototype with nine simultaneously visible 3D stations, serpentine numbered connections, and a distinct fuel return loop. Navy laboratory, cyan accents, legible Chinese typography. A left journey list and bottom color key orient visitors. Selecting any station smoothly moves the perspective camera; the detail panel contains two or three grounded educational sentences and selectable parts for a second inspection level. Orbit, wheel/pinch zoom, overview reset, playback pause, and a guided tour remain available.

The nine stations illustrate a conceptual future D–T power plant. Fuel recovery is a side cycle, not a thermal stage required to generate electricity. Clearly disclose that fusion electricity generation here is a conceptual prototype rather than an operating commercial plant.

## Architecture contracts
- `dist/js/steps.js`: export STEPS, CONCEPTS, SOURCES; each step has id (1–9), title, shortTitle, english, color, position [x,y,z], summary (2–3 strings), principle, metric {value,label}, partNotes keyed by model part IDs.
- `dist/js/models.js`: export buildModel(id); imports THREE from ../vendor/three.module.js. Returns {group, parts:[{id,label,description,object}], update(time,delta)}. Model fits radius 1.7, height 0–3; parts belong to group.
- `dist/js/scene.js`: all scene construction, raycasting, camera transitions, flow animation and projection. Export createExperience(container,{onSelect,onPart,onReady,onError}); return selectStep(id), focusPart(id), overview(), zoom(factor), setPaused(bool), setLayer(name,bool), resize(), getState().
- `dist/js/app.js`: data-driven DOM, state, tour, responsive controls, help dialog.
- `dist/styles.css`, `dist/index.html`: responsive presentation and document shell.
- Self-contained local vendor modules; no runtime remote dependency.

## Execution and acceptance
- [x] Write behavioral acceptance tests for all nine steps, valid scene links, step selection, detail/part/overview state and pause/zoom.
- [x] Build independent model and educational content packets in parallel.
- [x] Build scene, transitions, explicit fuel return loop and animated energy links.
- [x] Integrate UI with all nine accessible buttons and a readable detail view.
- [x] Browser-check desktop and narrow widths, nine scenes, component focus, zoom, reset, pause, tour and console.
- [x] Package complete source, document local run and extension interfaces. Sites did not return a project identity; deliver complete local artifacts.
