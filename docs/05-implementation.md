# 05 · Implementation — what was built, at block level

The source code is private. This page describes what each part does and what it is built from, not how it is
coded.

## Part 1 — Size and shape

| | |
|---|---|
| Duration | 2026-09-03 → 2026-10-19 (seven weeks) |
| Commits | 212, of which 204 were co-authored with an AI coding agent ([10](10-ai-sdlc.md)) |
| Code | ~58k lines of Python, ~17k lines of Dart (cabin display), Arduino C for the bench panel |
| Documents | 54 intents, 47 specifications, 10 executable plans, 424 traced requirements (2026-10-19) |
| Packages | one per layer or seam: agent, voice, vision, MHS, SOVD server, vehicle providers, cabin display, console, libraries, firmware |

## Part 2 — Components

| Component | Layer | Runs on | What it does |
|---|---|---|---|
| **Vehicle agent** | L6–L7 | Jetson | Read-only agent on the S17Code runtime. Fast route → template answer, or planner → executor. Every vehicle call goes through the live `Allow(q)` guard and the hash-chained journal. Also does knowledge retrieval over a document library |
| **Fast-route classifier** | L7 | Jetson | A small model (~130 ms warm) that maps a question to the one reading that answers it |
| **AI gateway** | L8 | Jetson | One local gateway for every model call, with budgets, timeouts and telemetry. No cloud key is used |
| **Voice** | L5–L8 | Jetson | Push-to-talk. Speech-to-text is whisper.cpp held resident on the GPU; text-to-speech is Piper. A speak predicate and an admission proof of concept with writs and C2 |
| **Driver monitoring** | L0/L5 | Jetson | Face landmarks become derived state: eyes, yawns, head angle, a 0..1 outline. No frame leaves the process |
| **Road view** | L5 | Jetson | Dash cam frames go through a YOLO-family detector, the openpilot lane and path model, own-bonnet filtering and blurring of heads and plates. Output is ≤ 10 fps. A numbers-only drive log |
| **MHS** | L3 seam | Pi | The hardware layer: registry, resolver, adapters, device interlock, lenses, leases ([03](03-innovations.md)) |
| **SOVD edge server** | L3 north face | Pi | A diagnostic REST API in the ASAM SOVD style (60 paths, server-sent events) plus MCP on one server. A consumer of MHS |
| **Signal broker** | L2 | Pi | Eclipse KUKSA databroker with the VSS signal model. Providers are the only publishers |
| **CAN** | L2 | Pi | A virtual CAN bus with a scenario-driven simulator (city drive, parked, weak battery, overheat) and a diagnostic ECU simulator. A listen-first OBD-II provider for the real car (services 01/03/09 only) |
| **Cabin display** | L8 | Pi | Flutter on the 7-inch touchscreen: road view, attention, climate, lights, energy, health, software, V2X. Motion lockout, Path A alerts |
| **Car audio** | L8 | Pi | Bluetooth audio to the car's head unit. An arbiter with priorities, pre-emption (100 ms bound), rate limits and dropping of stale answers |
| **Dash cam gateway** | L2 | Pi | Joins the dash cam's Wi-Fi and relays its stream to the Jetson over the wired link |
| **Engineering console** | L8 | Jetson | Read-only web UI with five tabs: live event stream with re-verified journal, checks, vehicle, agent, knowledge. It names no write verb |
| **Bench panel** | device | Arduino Uno | Buttons, LEDs, buzzer and display over the `mhs-line/1` serial grammar |
| **NMEA library** | library | — | NMEA 0183 decoding into one GNSS snapshot. It imports nothing from the project, so both MHS and the providers can use it |

## Part 3 — Reused, not rebuilt

| Need | Reused | Notes |
|---|---|---|
| Agent runtime: planner, executor, graph journal, human approval | **S17Code** (course framework) | one governed agent; no multi-agent protocol |
| Vehicle signals | **Eclipse KUKSA** databroker, **COVESA VSS** | one value per signal, so writes are verified by reading back |
| Diagnostics API shape | **ASAM SOVD** | the server is our own; it claims no certification |
| Lane and path model | **openpilot** (comma.ai) | ran at 20 ms per frame against a 50 ms budget on the Jetson |
| Speech | **whisper.cpp**, **Piper** | on-device |
| Object detection | YOLO family | on-device |
| Larger model | an open-weights model through **Ollama** on the workstation | optional; the car works without it |
| Cabin UI | **Flutter** | — |

**What Ve-AP itself builds:** the L4 gate and the eight-conjunct predicate; MHS; physical presence and writs;
the journal and its verifier; refusal by name; the two-path design; derived-state-only sensing; the fast
route; the car audio arbiter; the evidence and test discipline.

## Part 4 — Request lifecycle

1. **Admission before reasoning.** A command, or a C3 name, is refused before any model runs.
2. **Routing.** The words select a feature workflow, the fast route, or the planner.
3. **Execution.** Every vehicle read or write is a request `q` that goes through `Allow(q)`, and then the
   journal.
4. **MHS.** An admitted request is resolved to a binding and an adapter. A write is checked by the interlock
   and read back afterwards.
5. **Answer.** The answer carries its evidence: which readings it used, their age and source, and what could
   not be read.
6. **Output.** The answer goes on screen and through car audio, where the arbiter decides what is spoken and when.

## Honest limits

- The planner and answerer need the workstation model, and that machine was not in the car. In-car answers
  used the fast route, the feature workflows and templates.
- The OBD-II provider is built and was rehearsed on the bench, listen-only. It has not been connected to the car.
- Several components (car audio, the dash cam gateway) start by hand and are not yet enabled at boot.
