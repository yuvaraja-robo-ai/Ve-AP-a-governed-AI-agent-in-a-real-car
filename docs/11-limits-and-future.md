# 11 · Honest limits and future work

Overclaiming is worth less than not claiming. This page collects every limit in one place.

## Part 1 — Limits

**The vehicle**
- The vehicle signals the agent reads come from a **CAN simulator**. In the car on 2026-10-19 they were still
  simulated. The OBD-II provider (services 01/03/09, listen-first) is built and rehearsed on the bench, but
  has not been connected to a car.
- Only one car, one session, one operator.

**Authority**
- The live agent's permit is **C0** (read-only). Writs, physical presence and C2 are proven in a proof of
  concept, not on the live path; the live writ issuer is not built.
- The predicate's conjuncts are each shown to deny. That does not prove they are sufficient. No formal
  verification is claimed.
- Of the seventeen inventions, one is fully built, nine are partial, one is a proof of concept, and six are
  design only ([03](03-innovations.md)).

**Evidence**
- The journal is **tamper-evident, not tamper-proof**. Its head is not anchored outside the machine, and its
  lines are not signed.
- There is no hardware root of trust. The MHS device interlock runs in the same process as MHS.

**Perception**
- Driver monitoring has not been validated on drowsy drivers. It was shown with a deliberately sleepy face.
- The road camera's lens was never calibrated, and lane confidence on unmarked roads was low.
- GNSS had no fix on the day of the drive; the cause is not established.

**Agents and models**
- One agent is built; the multi-agent roster is design. Questions that need reasoning need the workstation
  model, which was not in the car.
- The answer eval has 12 questions.

**Standards**
- The diagnostic API follows the ASAM SOVD shape and is not certified. MHS claims shape alignment only with
  the standard its name follows.
- **No ISO 26262 (functional safety) or ISO/SAE 21434 (cybersecurity) claim is made.**

## Part 2 — Next

| # | Step | Why |
|---|---|---|
| 1 | **OBD-II in the car**: S1 listen-only (transmit count must stay 0), then S2 reads | the agent reads the real car |
| 2 | Calibrate the lens, then drive a marked road | lane confidence, and "Watch out ahead" thresholds against real distances |
| 3 | Get a GNSS fix (sky view, antenna placement); show location answers *with consent* | the consent conjunct, admitting live |
| 4 | Live writ issuer → C2 on the live path, starting with connectivity self-recovery | the full authority chain on real hardware |
| 5 | Anchor the journal head and sign receipts | tamper-proof, verifiable by a third party |
| 6 | Wire the verdict-sequence shadow gate | regressions caught as verdict diffs |
| 7 | Service and ownership workflows | the remaining features |
| 8 | Joules per answer from the Jetson's power rails | energy as a first-class cost |
| 9 | The refusal counterfactual on a digital twin | a measured prevented-harm rate |
| 10 | Release MHS on its own, with its paper | the hardware layer is useful beyond this project |

## Part 3 — What the code release looks like

The full source stays private. Generic parts that import nothing from the project are candidates for a
separate release, if the author chooses: the NMEA library, the car audio library, the `mhs-line/1` serial
grammar, and the message and capability schemas. This repository is the open record of the project:
concept, design, evidence and film.
