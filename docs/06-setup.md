# 06 · Setup — hardware, wiring, bring-up

## Part 1 — Hardware

| Part | Role |
|---|---|
| NVIDIA **Jetson Orin Nano Super** 8 GB | compute node: agent, voice, driver monitoring, road view |
| **Raspberry Pi 5** + official 7-inch touch display | vehicle node and cabin display |
| USB webcam with microphone | driver camera and voice microphone |
| Wi-Fi **dash cam** | road camera |
| GNSS receiver (Quectel L89, serial) | position and time |
| **Arduino Uno** + multi-function shield | bench panel: buttons, LEDs, buzzer, display |
| USB-CAN adapter and an SPI CAN controller | CAN interfaces (the car stage uses the OBD-II port) |
| Separate 12 V battery + DC-DC converters | powers both boards in the car, independently of the car's electrics |
| GPU workstation (optional) | larger model for reasoning questions. Bench only |
| The car's head unit | speakers, over Bluetooth |

## Part 2 — Wiring (block level)

![Deployment](../diagrams/svg/D03-deployment.svg)

- **Jetson ↔ Pi:** a direct Ethernet cable. The cabin display reaches the Jetson only over this link, never
  over Wi-Fi.
- **Webcam → Jetson** (USB). It is the only microphone.
- **GNSS and Uno → Pi** (serial). Each serial device has exactly **one owner process**; other readers use its
  snapshot.
- **Dash cam → Pi** over the dash cam's own Wi-Fi. The Pi relays frames to the Jetson over the wired link.
- **Pi → head unit** over Bluetooth audio.
- **OBD-II (car stage):** pin 6 CAN-H, pin 14 CAN-L, pin 5 signal ground, bus terminator off. The adapter
  starts **listen-only**.
- **Bench GPIO:** four lamps, a status LED, a presence button and a horn. The Pi 5 opens its GPIO chip by
  label, never by index.

## Part 3 — Bring-up

1. **Power both boards** from the rig battery. The cabin display comes up on its own.
2. **One command starts everything**, on both boards, in dependency order. It then prints three blocks:
   - each service, *active* or not;
   - each face (SOVD + MCP, cabin bridge, car audio, dash cam gateway), with *ok* or the failure;
   - each device, with what it actually reports, for example *GNSS: fix NONE* or
     *bench panel: not connected*.
3. **Check the registry.** The hardware description of each node is compiled and checked, and its **digest is
   pinned** on the other node. If the registry changes, the digest moves, and every read is refused
   `REGISTRY_CHANGED` until both sides are re-pinned and restarted. This is deliberate.
4. **Run the checks.** One script runs every suite offline and writes one report. A second script tests the
   live system feature by feature.

No credential is stored in any file.

## Part 4 — From bench to car

| Step | Bench | Car |
|---|---|---|
| Registry profile | bench profile | **car profile, generated from the bench profile** and never hand-edited. The signal broker is marked physical, and every vehicle write refuses at once |
| Road camera | replayed drive | live dash cam |
| Audio | desk speaker | the car's head unit |
| Vehicle bus | CAN simulator | **S0** no bus → **S1** listen-only (transmit count must stay 0) → **S2** OBD-II reads, services 01/03/09 only, on the operator's go |
| Rollback | — | one command returns both boards to the bench profile |

**The order for the first car session:**
- start the rig;
- sit parked for about 10 minutes while the lens and the cabin views are checked;
- drive straight at 15 mph or more until the lane model calibrates;
- check that warnings are heard through the car's speakers.

## Honest limits

- The drive on 2026-10-19 ran the **bench profile with the CAN simulator** (the display's status bar reads
  *bench · simulated*). It had no connection to the car's bus. The car profile and stages S1 and S2 were
  rehearsed on the bench only.
- GNSS had no fix on the day. The antenna reads open circuit, which a passive antenna does, so the cause is not established (sky view or placement are suspected). The bench panel was not plugged in.
- The car audio service and the dash cam gateway were started by hand; neither starts at boot yet.
