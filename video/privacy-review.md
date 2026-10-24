# Privacy review of the footage

Before anything was published, the footage was sampled at one frame per 5 s, and at one frame per second
around each hit. Each blur below was previewed as a still and confirmed by the author before rendering.

| Id | Clip | Time | What is visible | Treatment |
|---|---|---|---|---|
| B1 | A | 0:00–0:08 | terminal output with network and account details | full-frame blur; subtitle explains what it shows (every service active) |
| B2 | A | 0:30.5–0:37 | street through the windscreen: pedestrians, parked scooters, a house | full-frame blur. A region blur that kept the webcam sharp was tried and rejected: the hand-held camera moved and exposed the street at 0:35 |
| B3 | A | 0:46.5–0:51 | the head unit's list of paired devices (personal device names) | blur the head-unit screen |
| — | B, C, D | throughout | the road picture inside the Camera view | the system's own blur (*Live · blurred*), which covers what its detector finds; spot-checked, and no legible face or plate was found at display size |
| — | C | 0:00–3:45 | reflections in the display glass | checked; only hands and the cabin show, no face |
| — | all | — | file metadata (phone model, creation time, any location track) | removed on export; only one video stream and one audio stream remain |

The driver-attention screens need no treatment. By design they draw the face as a few lines from derived
numbers (eyes open, mouth, head angle). No camera picture of the driver is ever shown or stored.
