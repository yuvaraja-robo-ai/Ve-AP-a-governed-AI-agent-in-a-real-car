# 08 · Unit, integration and evaluation results

Every number below comes from a dated run of the private repository's own checks. Suites overlap (the T1
tier includes most MHS tests), so the counts are **not summed**.

## Part 1 — Check-all, 2026-10-19 (offline, 14 min 40 s)

**Result: 18 sections PASS · 0 FAIL · 0 SKIP.**

| Section | Result |
|---|---|
| Traceability | 424 requirements, 8 conjuncts, 9 gates, 45 reason codes, 53 intents, all linked |
| Message catalogues | every message the UI, voice and agent can show exists in every declared language |
| Invariants I1–I7 | all held |
| Bench, compute and car registries | each compiles and checks. Bench: 154 capabilities, 139 active, 0 callable C3 |
| Car profile | identical to what the generator makes from the bench profile; nobody hand-edited it |
| **Reachability** | **8 of 8 conjuncts deny with their own code** |
| **Agent journal** | **intact: 1,950 decisions verified** |
| T1, pure logic | **983 passed**, 52 skipped (each with a reason) |
| MHS | **481 passed**, 2 skipped |
| SOVD north face | **104 passed**, 3 skipped |
| Voice (push-to-talk, speak predicate, admission POC) | **335 passed**, 19 skipped |
| Engineering console | **42 passed** |
| Vision (driver monitoring, road view) | **121 passed**, 3 skipped |
| T4 governed agent | **146 passed**, 12 skipped |
| Cabin display | `flutter analyze` clean; **278 widget tests passed** |

## Part 2 — Evaluations

| Eval | Date | Result |
|---|---|---|
| Answers, live agent | 2026-10-19 | **12 / 12**, score 1.0. Median **400 ms**, slowest 1.6 s |
| Answers, workstation model **switched off** | 2026-10-12 | **11 / 11**. Median **382 ms**, slowest 819 ms |
| Fast route, before and after | 2026-10-04 | median answer **19.7 s → 0.86 s**, all eval questions still correct |
| Turn stress, model off | 2026-10-12 | sequential 20/20; 10 interleaved pairs with **0 out of order** and **0 stale answers**; 4 parallel sessions 20/20 |
| Reachability | every run | 8/8 |

## Part 3 — Perception, on the bench

| Measure | Date | Result |
|---|---|---|
| openpilot lane model on the Jetson | 2026-10-13 | **20 ms per frame** against a 50 ms budget |
| Road view on a recorded drive (detector + openpilot) | 2026-10-13 | **9.1 fps**, 26 objects tracked |
| Camera mount found by driving (recorded drive) | 2026-10-14 | narrow camera: found at 36 s, pitch matching the recording's own calibration (2.80°). Wide camera: found at 39 s, pitch 0.7° off, yaw about 1° off |
| Driver monitoring | every run | no frame emitted: the probe asserts zero image bytes leave |

## Part 4 — Feature workflows on the bench, 2026-10-18

| Feature | Scenario | Answer time |
|---|---|---|
| Vehicle health | 12 V battery falling from 12.6 to 11.5 V | **887 ms**; the inspection booking was approved through the approval message on the bench, not by a hand on the screen |
| Diagnostics | an intermittent fault that sets and clears | **414–631 ms**; each return counted |
| Trip readiness | destination in the question | **≈ 0.8 s** |
| Breakdown | engine overheat, car stopped | **538 ms**. Location **refused**: no consent, and the answer says so |

## Part 5 — Live full test, 2026-10-19 (the system running on both boards)

**18 pass, 6 fail.** Five failures were an absent device or machine; one was a display socket taken over by a newer connection. Each was named in the report:

| Failed check | Why |
|---|---|
| Services and health | the workstation model was down |
| Model chat through the gateway | the workstation was off |
| Panel serial ready | the Uno was unplugged |
| Panel through SOVD | the Uno was unplugged (timeout) |
| Capability sweep | 64 allowed and 13 refused as declared; the panel reads were unavailable, and GNSS had no fix |
| Road replay socket | taken over by a newer display connection |

Passes included answers 12/12, reachability 8/8, an intact journal, CAN speed, GNSS diagnosis, the console, and every Pi service with the cabin display.

## Honest limits

- These are the project's own tests, run by the project's own scripts. No third party has reproduced them.
- Skipped tests are skipped *with reasons*, and the run's log lists each one. A skip is not counted as a pass.
- The answer eval has 12 questions, a small set.
