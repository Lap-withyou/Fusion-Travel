# Integrated fusion power station — revision 2

Upgrade requested: replace disconnected toy stations with an industrial visual system; maintain part inspection/explosion; show alpha self-heating and electrical recirculation; quantify large fusion energy with an explicit energy balance.

## Acceptance
- One continuous plant on a common civil foundation: central tokamak, fuel storage, vacuum/heating auxiliaries, fuel recovery, heat exchangers, steam turbine/generator, electrical substation, external load.
- Detailed segmented vessels/coils, flanges/bolts, pipe racks and supports, access decks, handrails, cable trays, pumps, motor housings, halls/gantries; restrained metal and concrete materials, shadows and cutaway architecture.
- Nine numbered educational callouts remain visible in overview; 2/3/4/5/6 refer to systems on the same tokamak rather than duplicate reactors.
- Selection focuses an actual assembly while preserving the surrounding plant. Component inspection and continuous explode/reassemble toggle.
- Distinct physical fuel, coolant, steam, recovery, electricity and internal feedback routes with animated direction.
- Cold startup uses external power; sustained operation shows alpha heating plus recirculating electrical power to auxiliaries. No perpetual motion implication; fuel is consumed and losses remain visible.
- Quantitative panel: fusion thermal power, alpha/neutron split, auxiliary heating, thermal conversion, gross/internal/net electrical power; mass-based D–T energy comparison, with assumptions visible.
- Browser-local operation, responsive controls, reusable component registry and shared layout data. Preserve v1 as a separate backup.

## Interfaces
`layout.js`: physical positions, step bindings and named connected flow routes.
`reactor.js`: buildReactor() => {group,parts,update(time,delta,{activity,explode,power})}; parts have id,label,description,object,stepIds. Center at local [0,0,0], radius ≤5.5, height ≤7. Reactor installed at PLANT_LAYOUT.reactor.
`plant.js`: buildPlant() => {group,parts,update(time,delta,state)}. Imports reactor builder and layout; creates factory auxiliaries and all physical pipe routes. Parts carry stepIds for nine-step navigation. State has activity,explode,power,phase ('startup'/'running'/'standby').
`energy.js`: grounded pure educational energy accounting and mass conversion functions. UI parameters are declared assumptions, not engineering predictions.
`scene.js`: single plant, lighting, shadows, object picks, camera, callout collision handling, animated flow paths and core/city feedback.
`app.js`, HTML/CSS: operating modes, startup sequence, step/component explorer and energy panel.

## Verification
Test net-power conservation and alpha/neutron split, mass energy units, all nine actual part bindings, finite model geometry, startup/running state, pause and camera fit. Browser QA for overview, explosion/reassembly, alpha/auxiliary feedback, quantitative controls and desktop/narrow layout. Rebuild the standalone only after source checks.
