# 09 · Vehicle testing — results from the car

**Date:** 2026-10-19 · **Vehicle:** a petrol hatchback (Hyundai) on local roads.
**Rig:** both boards on their own 12 V battery, in the front passenger footwell, with the cabin display at
the gear selector. **Evidence:** a numbers-only drive log from the road view, a written hand-back from the
car-audio test, a screen recording of the cabin display, and phone video. All of it is in the film
([video/storyboard.md](../video/storyboard.md)).

## Part 1 — What was real, and what was simulated

| Real in the car | Simulated |
|---|---|
| the dash cam and its road picture · the driver webcam and driver monitoring · the microphone, speech-to-text and the spoken answers · Bluetooth audio to the car's head unit · both computers on battery power · the cabin display | the **vehicle signals** the agent read: speed, battery %, EV range, coolant, 12 V, fault codes. They came from the CAN simulator, under the **bench** registry profile. The display marks them *estimate* / *replayed*. The car's OBD-II port was **not connected** |

That is why the battery percentage and the "plug-in hybrid" energy page appear in a petrol car. The agent
answered truthfully *from the vehicle it was given*. The next stage connects it to the real car's bus,
listen-only first.

## Part 2 — Timeline

| Time | Session | Evidence |
|---|---|---|
| 13:43–13:53 | **Car audio, parked** | hand-back |
| 14:29–14:35 | Road view, first drive (5 min 41 s) | drive log 1 |
| 15:06 | **Bring-up:** one command, every service and face reported | film 2:19 |
| 15:07 | Head unit paired with the Pi | film 2:56 |
| 15:07–15:08 | Driver monitoring, parked: drowsiness alert raised | film 3:15 |
| 15:11–15:40 | Road view, long drive (29 min) | drive log 2, film 4:30 |
| 15:38–15:51 | Screen recording: **ask the car while driving**, cabin pages, **driver monitoring**, road view | film 6:00–11:06 |
| 15:44–15:51 | Road view, after the camera was straightened (6 min 53 s) | drive log 3 |

## Part 3 — Results

### Ask the car while driving (V2, V3)

| Question (spoken) | Answer (spoken and shown) | Verdict |
|---|---|---|
| "What is the battery percentage available in this vehicle?" | battery temperature 25 °C, speed 54 km/h, gear drive, battery 60 %, coolant 87 °C, each shown as an evidence chip | ✅ answered from admitted readings |
| "What are the faults in this vehicle?" | "No fault codes are stored in the engine." | ✅ matched the simulator's state |
| "Do you see what trip is ongoing now?" | "I don't know the route to there; the simulated routes go to Bengaluru, Madurai, Mysuru, Puducherry." | ✅ **declined to invent** a route |

The workstation model was not in the car, so every answer came from the model-free routes. Answer latency was
not measured in the car. On the bench the same routes answer with a median of 0.4 s ([08](08-unit-test-results.md)).

### Driver monitoring (V4)

- The first start loads the model; the screen says so (*Loading the driver monitoring model*, then *Starting
  the cabin camera*).
- The monitor learns the driver's normal, then reports *Attentive* or *Check your attention*. A deliberately
  sleepy face raised **"Signs of drowsiness. Take a break soon."**, with its evidence on screen (*eyes closed
  18 % of the last minute*, *2 microsleeps in a minute*).
- This was shown parked, and again during the drive session. The speed on screen in that session comes
  from the simulator, so it is not evidence that the car was moving.
- **The display drew the face as lines from numbers. No image of the driver appeared anywhere.**

### Road view (V5): the drive logs

| | Drive 1 | Drive 2 | Drive 3, camera straightened |
|---|---|---|---|
| Duration | 5 min 41 s | 29 min 5 s | 6 min 53 s |
| Pictures processed | 3,253 | 17,386 | 4,116 |
| Rate | 9.8 fps | 9.98 fps | 9.97 fps |
| Camera mount | found at 42 s, then **lost: out of range** from 64 s | **out of range: straighten the camera** (yaw −3.9°, pitch −5.2°) | **found after 74 s** (roll 0.0°, pitch −1.6°, yaw 0.0°) |
| Lane probability (left far, left near, right near, right far) | 0.00 / 0.01 / 0.03 / 0.00 | 0.14 / 0.14 / 0.08 / 0.01 | **0.29 / 0.35 / 0.19 / 0.01** |
| Lead car seen (share of frames) | 0 | 0.01 | 0.13 |
| Boxes flagged *in path* | 0 | 601 | 149 |
| Lens | assumed | assumed | assumed |

**Reading it:**
- The system held ~10 fps through all three drives, with blurring on.
- It refused to calibrate a crooked camera and said why: *straighten the camera*. Once the camera was
  straightened, it found the mount in 74 s.
- Lane confidence stayed low. These were unmarked local roads, as the narration in the film says, and the
  lens was never measured.
- The film shows cars, people, trucks and motorcycles boxed, and boxes in the car's path flagged. The drive logs record counts only.

### Car audio (V6), parked

| Test | Result |
|---|---|
| A spoken test phrase | **heard** |
| Short tones with a 300 ms lead-in | **not heard.** The head unit unmutes late. *Fixed:* a 1.0 s lead-in from cold, test-first |
| Beep, chime, warning, critical, through the service | **all four heard** |
| A critical alert 3.7 s into a long answer | the answer **was cut** and the alert played. The answer did not resume, as required |
| Barge-in stop | nothing playing 0.3 s later |
| The same warning twice, 0.2 s apart | one played; the second was **refused `RATE_LIMITED`** |

Three fixes came out of this session, each written test-first: the cold lead-in, a broken-pipe leak on
pre-emption, and device naming during pairing.

### Bring-up (V1)

The health print-out named every fault rather than hiding it:
- GNSS: *fix NONE, satellites 0/0*; the antenna reads *open circuit*, which a passive antenna does, so that is not the diagnosis;
- bench panel: *not connected*;
- workstation model: *down*;
- car audio: *connected (voice ready)*.

## Part 4 — Not done, or not working, on the day

- **OBD-II:** stages S1 (listen-only) and S2 (reads) were not run in the car. They were rehearsed on the
  bench: transmit count 0, and a vehicle write refused in 11 ms.
- **GNSS:** no fix. The cause is not established (sky view or antenna placement are suspected). So location answers could not be shown, and none were invented.
- **Lane calibration:** the lens was never calibrated, so the lane model ran on an assumed lens.
- **Path A alert through the car speakers:** not heard; the panel was unplugged.
- **Road-hazard distance thresholds** ("Watch out ahead."): not checked against real distances.
- **Answer latency in the car:** not measured.

## Honest limits

This was a first, half-day in-car session: one car, one operator, a simulated vehicle bus. It shows that the
platform installs in a car, runs on its own power, and keeps its privacy and refusal properties with real
cameras, a real microphone and real speakers. It does **not** show that it reads a real car correctly. That
is the next stage.
