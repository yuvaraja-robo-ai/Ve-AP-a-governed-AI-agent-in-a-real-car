# YouTube upload sheet

**File:** `video/out/Ve-AP-capstone-film.mp4` (1080p30, H.264/AAC, metadata stripped). It is not in git, because
of its size.
**Captions:** upload [`captions.srt`](captions.srt) as English subtitles. The same text is burned into the film.
**Thumbnail:** [`thumbnail.png`](thumbnail.png) (1280×720).
**Visibility:** the author decides. **Category:** Science & Technology. **Licence:** Standard YouTube licence;
the repository's documents are CC BY-NC-ND 4.0.

## Title

Ve-AP: a governed AI agent in a real car | capstone 2026

## Description

```
Ve-AP is an AI agent that answers questions about a car while it is driven, on two small boards in the car, with no cloud.

The point is not the answers. Every call the agent makes to the vehicle passes an eight-condition authority predicate, Allow(q). Each condition can refuse on its own and names itself when it does, and every decision, refusals included, is written to a hash-chained journal. The agent reaches hardware only through MHS, a hardware layer where every device fact is checked data and no model ever speaks a protocol.

The film opens with the idea in twelve slides, then shows the system in a car on 19 October 2026:
- one-command bring-up on the car's own power
- driver-drowsiness warnings from derived state only (no image of the driver leaves the camera box)
- a road view from the dash cam, blurred before it reaches the screen, with openpilot's lane model
- questions asked by voice while driving, answered with their evidence and spoken through the car's speakers

What is real and what is simulated: the cameras, microphone, speech and car audio were real. The vehicle signals came from a CAN simulator, and the screen marks them "estimate" / "replayed". Reading the car's own OBD-II bus is the next stage.

Documents, diagrams and slides (CC BY-NC-ND 4.0): <repository link>

Chapters
0:00 The idea, in twelve slides
2:15 In the car
2:19 1 · Rig and bring-up
3:15 2 · Driver monitoring, parked
4:30 3 · Road view, long drive
6:00 4 · Ask the car, while driving
7:54 5 · Driver attention, drive session
9:21 6 · Road view, camera straightened
11:06 Results, limits and next

Built on Jetson Orin Nano Super + Raspberry Pi 5 · Eclipse KUKSA · ASAM SOVD-style API · openpilot · whisper.cpp · Piper · Flutter. Privacy: terminal output, a street scene and paired-device names are blurred by hand; the road view's own blur covers the faces and number plates its detector finds. File metadata is removed.
```

## Tags

software-defined vehicle, SDV, AI agent, agentic AI, automotive, in-vehicle AI, Jetson Orin Nano, Raspberry Pi 5,
KUKSA, VSS, SOVD, MCP, openpilot, driver monitoring, drowsiness detection, edge AI, AI safety, guardrails,
capstone project

## Before publishing

- [ ] Replace `<repository link>` with the GitHub URL, and add the YouTube link to the README.
- [ ] Watch the whole film once at full screen. Check the blurs at 2:22–2:30, 2:52–2:59 and 3:08–3:13, and
      that captions stay in sync.
