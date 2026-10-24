# 01 · Discussion — the problem, the thesis, the choices

**Project:** Ve-AP, the Vehicle Agentic Platform. The architecture is called VE-MAP.
**Tagline:** *Bounded authority and measured refusal for in-vehicle agents.*

## Part 1 — The problem

Language-model agents are arriving in cars. Vendor architectures show *where* an agent sits: above the
vehicle's service layer, on a high-performance computer or telematics unit. They leave three questions open:

1. **What may the agent do, and who decides?** A tool list says what an agent *can* call. It does not say
   what the agent is *allowed* to call, in this state of the car, for this occupant, with this evidence.
2. **How do we know a refusal works?** A safety rule that has never refused anything has never been shown to
   work. An earlier evaluation by the author found a "repeated-failure ceiling" that fired **zero times in
   nineteen runs**. The table read `ceiling triggered: 0`. That looked like evidence the ceiling was rarely
   needed; in fact the test set never created the event. A predicate with eight conditions has eight ways to
   make that mistake.
3. **How does an agent reach hardware without speaking protocols?** If the model can emit a CAN ID or a
   diagnostic service number, every guard above it can be bypassed by one clever string.
   `send_uds(0x19, 0x02)` is the failure this project is designed to prevent.

The author's earlier architecture paper (V-RAI) proposed an answer and stated its own gap: *"Evaluation is
therefore specified as a test plan."* **This capstone is the other half: build the reference implementation,
and run the evaluation the paper deferred.** It is not a second architecture.

## Part 2 — The thesis

> Every action an in-vehicle agent takes passes one admissibility predicate. Each of the predicate's eight
> conditions can refuse on its own, names itself when it does, and leaves evidence that can be checked
> afterwards. Refusal is measured, not assumed.

The predicate is

```
Allow(q) = Auth(i,t) ∧ Schema(x) ∧ Fresh(s) ∧ Pre_t(s) ∧ Risk(t,s) ≤ Permit(i)
           ∧ Consent(q) ∧ Budget(q) ∧ Before(τ)
```

| Conjunct | Asks | Refuses with |
|---|---|---|
| Auth | Is this capability in this agent's manifest? | `NOT_IN_MANIFEST` |
| Schema | Are the arguments well formed? | `SCHEMA_INVALID` |
| Fresh | Is the evidence young enough to act on? | `STALE_EVIDENCE` |
| Pre | Do the capability's preconditions hold in this state? | `PRECONDITION_UNMET` |
| Risk ≤ Permit | Is the action's class within what this agent is permitted? | `RISK_EXCEEDS_PERMIT` |
| Consent | Has the occupant consented to this use of their data? | `REDACTION_UNAVAILABLE` |
| Budget | Are calls and cost still within budget? | `BUDGET_EXHAUSTED` |
| Before | Is the answer still inside its deadline? | `DEADLINE_EXCEEDED` |

**The standard each conjunct has to meet:** it must deny independently, name which conjunct denied, and prove
it afterwards. A conjunct with no scenario that makes it deny has never been shown to work. Every one of the
eight has such a scenario, and it runs on every check (see [08](08-unit-test-results.md)).

## Part 3 — The choices, and why

| Choice | Alternative rejected | Why |
|---|---|---|
| **One governed, read-only agent** live in the car | A roster of eight cooperating agents | The thesis is about authority. One agent with a proven gate is evidence; eight agents with no gate are a demo. The roster stays in the design. |
| **No cloud** | Cloud model, cloud orchestration | An external orchestrator with authority over in-vehicle workloads never passes the gate. Everything runs on two small boards in the car. |
| **The model is the last resort** | Every question goes to a large model | A small classifier (~130 ms warm) picks the reading, and a template answers. The model is used only when reasoning is needed. Median answer time fell from 19.7 s to 0.86 s. |
| **Two paths** | Let the agent raise alerts | Safety alerts (coolant hot, door open while moving) are deterministic rules with no model. The agent may *explain* an alert and can never clear one. |
| **Derived state only** from the driver camera | Stream or store the face | The driver monitor emits numbers (eyes closed, yawns, head angle). No frame leaves it, so there is nothing to redact. |
| **Hardware facts are data (MHS)** | One tool and one code path per device | A new sensor is a registry entry, not new agent code. The core knows no vehicle and no pin, and a test fails if one appears. |
| **Refusals are evidence** | Log the successes | Every decision, refusals included, is a line in a hash-chained journal that a verifier can re-check. |
| **Reuse the ecosystem** | Build everything | KUKSA (vehicle signals), ASAM SOVD (diagnostics API), openpilot (lane model), whisper.cpp and Piper (speech), S17Code (agent runtime), Flutter (cabin display). Ve-AP builds only what does not exist: the gate, MHS, the evidence and the refusal discipline. |

## Part 4 — Autonomy classes

| Class | Meaning | How it is allowed |
|---|---|---|
| **C0** observe | read signals, explain | automatic |
| **C1** recommend / comfort | climate, lights, lock | automatic, through the gate |
| **C2** controlled recovery | windows, clearing fault codes, reconnecting | a single-use **writ** + **physical presence** (the press that proves presence is the press that opens the microphone) + the car **stationary** |
| **C3** safety-critical | raw CAN frames, ECU memory, installing software, identifying the driver, reading emotion | **in no manifest, ever.** These names exist only so they can be refused by name |

The live in-car agent holds a **C0** permit. The C2 machinery (writs, presence, stationary) is built and
tested in a proof of concept, not on the live path. [11](11-limits-and-future.md) says so plainly.

## Honest limits

- The thesis is shown on a bench and in one car with a **simulated** vehicle bus. Reading the car's own OBD-II
  port is the next stage.
- "Each conjunct can deny" is proven by a scenario per conjunct. It is not a proof that the conjuncts are
  *sufficient*; no formal verification is claimed.
- No ISO 26262 or ISO/SAE 21434 claim is made.
