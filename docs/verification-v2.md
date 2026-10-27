# Integrated plant verification — 2026-10-26

## User requirements addressed

1. Industrial system rather than isolated display toys: one site with shared tokamak, civil works, steel frames, service platforms, process skids, pipe bridges, turbine hall, crane, switchyard and load building. Approximately 384k model triangles, 499 model draw objects and over 6,000 instanced hardware pieces before scene effects. These are visual models rather than dimensionally validated engineering components.
2. Integrated physical connections and retained disassembly: 12 route definitions drive both physical pipes/cable ducts and directional overlays; 27 unique installed parts map to all nine educational steps. Core sectors, magnets, solenoid and blanket move deterministically and reassemble; individual component observation can temporarily remove surrounding meshes.
3. Energy supports continued operation and has a large scale: alpha heat and electrical recirculation are separate. External startup supply, fusion onset and generator ramp are explicit. Steady and phase display balances distinguish grid import, zero exchange and export. Sliders adjust plant assumptions and mass-based energy comparisons.

## Automated evidence

`node --test tests/*.test.mjs`: 30 passed, 0 failed.

- 17 energy/phase tests cover alpha/neutron split, conservation, positive/zero/negative net electricity, startup import, auxiliary heat recovered once, gross versus net distinction, all-reacted fuel energy and assumptions.
- Plant tests instantiate one complete plant, find actual installed parts for all nine chapters, verify finite normal/exploded geometry, reversible disassembly, alpha visibility and external lighting in startup/zero/positive power conditions.
- Navigation, time handling, legacy geometry/camera regression and standalone script/resource checks also pass.
- Model authors independently checked normal/half/full disassembly, repeated-state determinism, maximum extents and custom surface winding.

## Browser evidence

- Actual WebGL render of industrial plant and all nine system callouts.
- Selected all nine systems: component entry counts 2/4/3/4/3/4/4/4/3; unique physical part count is 27 because some systems share components.
- Inspected neutral-beam component, enabled independent component viewing, restored surrounding plant and used whole-core disassembly.
- Verified net deficit case 500 MW fusion / 400 MW auxiliary / 30% conversion gives −650 MWe, correct external-supply text and 30%-dependent fuel comparison.
- Verified exact balance case 500 / 50 / 40% gives zero exchange and balance text. Restored the default 520 MWe net output.
- Paused cold startup at external supply: alpha 0 MWth, plant demand 120 MWe, external import 120 MWe. Independent model/phase tests verify lights and fusion particles do not start early.
- Narrow layout at a 390 CSS-pixel viewport had no horizontal overflow; stage 378×520 and all nine system labels present, inside the stage and without overlaps.
- Startup completed to sustained running in the browser; live labels read alpha 398 MWth, factory supply 320 MWe and net export 520 MWe.
- Single-file offline artifact is syntax checked and executed through local HTTP without remote runtime assets.

## Boundaries

The browser tool permits HTTP/HTTPS and blocks file URLs, so direct `file:` automation is not claimed. The same embedded offline file is verified through local HTTP. No hosted production deployment is claimed. Source and complete standalone files are delivered locally.

This is an industrial visual science prototype, not a validated digital twin, licensed process design, commercial reactor performance forecast or plasma stability simulation. ITER itself does not supply electricity to the grid. Times, geometry, materials and operating values are illustrative; fuel remains consumed and heat remains rejected.
