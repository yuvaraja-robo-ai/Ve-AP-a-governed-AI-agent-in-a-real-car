#!/usr/bin/env python3
"""Cut the Ve-AP film from the drive footage: slides first, then the car, subtitles burned in.

    pdftoppm -png -scale-to-x 1920 -scale-to-y 1080 presentation/Ve-AP-capstone.pdf <scratch dir>/slides/s
    python3 video/build_film.py --src <folder with the four source clips> --work <scratch dir> --out video/out

Writes <out>/Ve-AP-capstone-film.mp4 and video/captions.srt (the same subtitles, for YouTube CC), and prints
the chapter list for video/youtube.md. The blurs are the ones confirmed in video/privacy-review.md.
"""
import argparse
import hashlib
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"
NAVY = "0x0E1A2B"
A, B, C, D = "AI_CAPSTONE.MOV", "AI_CAPSTONE_1.MOV", "AI_CAPSTONE_2.MOV", "veap-demo-20261019-153839.mp4"
# Clip C runs 43 s behind the screen recording D, for C 0:00-3:15 (C has a cut after that). Matched on events
# both clips show: page switches (Climate C 96 -> D 139, Lights 100 -> 143, Attention 110 -> 153) and the
# drowsiness banner (C 189 -> D 232). Spoken answers lag their on-screen text by 0.5-3 s (synthesis + lead-in).
D0, D_RATE = 43.0, 1.0

# ---- the cut: (kind, args, duration, chapter, subtitles[(start, end, text)]) ----
SLIDES_INTRO = [
    (1, 7, [(0, 7, "Ve-AP: an AI agent for the car that has to earn every action.")]),
    (2, 12, [(0, 6, "Agents are coming to cars. A tool list says what they can call, not what they may."),
             (6, 12, "And a safety rule that has never refused anything has never been shown to work.")]),
    (3, 14, [(0, 7, "One predicate guards every vehicle call: eight conditions, each able to refuse on its own."),
             (7, 14, "Each refusal names itself, and all eight are made to refuse on every test run.")]),
    (4, 11, [(0, 11, "Models live above layer 4, protocols below it. Only bounded operations cross.")]),
    (6, 11, [(0, 11, "Two boards in the car, a Jetson and a Raspberry Pi 5, and no cloud.")]),
    (7, 13, [(0, 7, "MHS, the hardware layer: every hardware fact is checked data, not code."),
             (7, 13, "The agent never names a pin, a CAN ID or a diagnostic service.")]),
    (8, 13, [(0, 7, "MHS decides no authority: it can verify an admission, never mint one."),
             (7, 13, "And the device interlock can still refuse a write the gate allowed.")]),
    (9, 11, [(0, 6, "Safety alerts never wait for a model. The agent may explain them, never clear them."),
             (6, 11, "Dangerous capabilities are named only so they can be refused by name.")]),
    (10, 11, [(0, 11, "The face leaves as numbers. The road picture leaves blurred, or not at all.")]),
    (11, 12, [(0, 12, "Nine ideas, each with its evidence: a test count, an eval, or the car.")]),
    (15, 10, [(0, 10, "The model is the last resort: the median answer went from 19.7 s to 0.86 s.")]),
    (17, 10, [(0, 10, "On 19 October every check passed, all eight conditions refused on cue, and the journal was intact.")]),
]
SLIDES_END = [
    (18, 10, [(0, 10, "Real: cameras, microphone, speech, car audio. Simulated: the vehicle signals. The car's own bus is next.")]),
    (19, 10, [(0, 10, "The road view held about 10 fps. It refused a crooked camera, then found the mount in 74 s.")]),
    (21, 10, [(0, 10, "Limits are stated, not hidden. Next: the car's own OBD-II bus, listen-only first.")]),
    (22, 8, [(0, 8, "Docs, diagrams, slides and this film: the ve-ap-capstone repository. Thank you.")]),
]

CHAPTERS = [
    ("card", ("In the car", "19 October 2026 · a petrol hatchback on local roads", "Sound on: the narration and the AI's spoken answers"), 4, None, []),
    ("card", ("1 · Rig and bring-up", "One command starts both boards", "Phone camera"), 3, None, []),
    ("clipA", (0.0, 53.0), 53, "1 · Rig and bring-up", [
        (0.0, 4.0, "We are starting the Ve-AP framework in the car.\n[Terminal blurred: it lists every service as active]"),
        (4.0, 7.0, "[Terminal blurred: it lists every service as active]"),
        (7.0, 13.0, "A separate battery powers the Jetson Orin Nano"),
        (13.0, 19.0, "and the Raspberry Pi, the two compute modules,"),
        (19.0, 29.0, "running the vehicle controls, the car views and the camera views."),
        (29.0, 37.0, "The road camera is a dash cam, and this is the driver-monitoring camera.\n[Street blurred for privacy]"),
        (37.0, 45.0, "It is connected over Bluetooth to the car's own audio system."),
        (45.0, 53.0, "The car's head unit is paired with the Pi.\n[Device names blurred]"),
    ]),
    ("card", ("2 · Driver monitoring, parked", "Derived state only: no picture of the driver leaves the camera box", "Phone camera"), 3, None, []),
    ("clipA", (53.0, 72.0), 72, "2 · Driver monitoring, parked", [
        (0.0, 16.0, "Here the driver-monitoring model is loading. Once it has loaded, monitoring starts."),
        (16.0, 21.0, "This is the GNSS receiver, a Quectel L89."),
        (21.0, 25.0, "It gives position and speed. [No fix on the day; cause not established]"),
        (25.0, 40.0, "Now the attention view has loaded."),
        (40.0, 53.0, "It monitors drowsiness. I am acting sleepy on purpose."),
        (53.0, 62.0, "It detects it: \"Signs of drowsiness. Take a break soon.\""),
        (62.0, 72.0, "[The face is drawn as lines from numbers. No image of the driver is shown or stored]"),
    ]),
    ("card", ("3 · Road view, long drive", "Dash cam → Pi → Jetson: detections, lane model, privacy blur", "Phone camera"), 3, None, []),
    ("clipB", (0.0, 87.0), 87, "3 · Road view, long drive", [
        (0.0, 9.0, "This is the road view. The dash cam connects to the Pi over Wi-Fi."),
        (9.0, 16.0, "It shows the objects ahead and the road guidance."),
        (16.0, 25.0, "The lane model is openpilot, from comma.ai, integrated here."),
        (25.0, 29.0, "While driving we can see the detail."),
        (29.0, 44.0, "[Ve-AP blurs the picture before it reaches the screen. Detected objects are boxed]"),
        (44.0, 59.0, "[On this drive the camera sat crooked. Ve-AP refused to calibrate and said: straighten the camera]"),
        (59.0, 74.0, "Lane lines show when the road has markings. This road has none."),
        (74.0, 87.0, "It is a normal local road. On a marked main road the lanes will show."),
    ]),
    ("card", ("4 · Ask the car, while driving", "Every reading passes Allow(q) and is journalled", "Screen recording + phone view with sound"), 3, None, []),
    ("pip", (0.0, 111.0), 111, "4 · Ask the car", [
        (0.0, 16.6, "Driver: What is the battery percentage available in this vehicle?"),
        (16.6, 17.5, "[Thinking]"),
        (17.5, 27.0, "Ve-AP: The battery temperature is 25 degrees Celsius; the speed is 54 kilometres per hour;"),
        (27.0, 34.0, "the gear is drive; the battery level is 60 percent; the coolant is 87 degrees Celsius."),
        (34.0, 43.0, "Driver: What are the faults in this vehicle?"),
        (43.0, 57.0, "[Fault codes are read through the gate. In this build the vehicle signals come from a CAN simulator]"),
        (57.0, 61.0, "Ve-AP: No fault codes are stored in the engine."),
        (64.0, 71.0, "Driver: Do you see what trip is ongoing now?"),
        (71.0, 86.0, "[No route is set. The agent will not invent one]"),
        (86.0, 93.0, "Ve-AP: I don't know the route to there. The simulated routes go to Bengaluru, Madurai, Mysuru, Puducherry."),
        (93.0, 101.0, "These are the light controls, the battery and energy, and vehicle health."),
        (101.0, 107.0, "This is software status [read-only: installing is refused by design]."),
        (107.0, 111.0, "And this is driver attention."),
    ]),
    ("card", ("5 · Driver attention, drive session", "It learns this driver's normal first", "Screen recording + phone view with sound"), 3, None, []),
    ("pip", (111.0, 84.0), 84, "5 · Driver attention", [
        (0.0, 6.0, "We enable the cabin camera and open the live view."),
        (6.0, 30.0, "It is loading the camera model. It is a separate model, so the first load takes time."),
        (30.0, 33.0, "We are starting the cabin camera."),
        (33.0, 43.0, "[It learns this driver's normal first]"),
        (43.0, 47.0, "Ve-AP: \"Stay alert.\""),
        (47.0, 78.0, "[Eyes closed on purpose: closure is judged against this driver's normal]"),
        (78.0, 84.0, "Ve-AP: \"Stay alert.\"\n[On screen: \"Signs of drowsiness. Take a break soon.\"]"),
    ]),
    ("card", ("6 · Road view, camera straightened", "Mount found by driving, in 74 s", "Screen recording"), 3, None, []),
    ("donly", (330.0, 60.0), 60, "6 · Road view", [
        (0.0, 10.0, "[The camera was straightened between drives. The mount was found by driving, in 74 s]"),
        (10.0, 22.0, "[The picture is blurred by Ve-AP before it reaches the screen]"),
        (22.0, 36.0, "[Cars, people and trucks are tracked. The lane model draws the path ahead]"),
        (36.0, 50.0, "[\"Lens uncalibrated\" is shown, not hidden: the lens was never measured]"),
        (50.0, 60.0, "[About 10 frames per second, all through the drive]"),
    ]),
    ("donly", (720.0, 42.0), 42, "6 · Road view", [
        (0.0, 14.0, "[Later in the same drive]"),
        (14.0, 28.0, "[Objects in the car's path are flagged \"in path\"]"),
        (28.0, 42.0, "[A close hazard in path can be spoken: \"Watch out ahead.\" Its distance thresholds are not yet checked]"),
    ]),
]

SUB_STYLE = ("FontName=Liberation Sans,FontSize=11,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H90000000,"
             "BorderStyle=3,Outline=2,Shadow=0,MarginV=14,Alignment=2")
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
       "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-map_metadata", "-1", "-movflags", "+faststart"]
SILENT = ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"]
LOUD = "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000"


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_srt(path, subs, offset=0.0):
    lines = []
    for i, (a, b, t) in enumerate(subs, 1):
        lines += [str(i), f"{ts(a + offset)} --> {ts(b + offset)}", t, ""]
    Path(path).write_text("\n".join(lines))


def _key(cmd):
    # A segment is re-rendered only when its command or one of the files it reads changes.
    h = hashlib.sha1(" ".join(cmd).encode())
    for f in sorted(set(re.findall(r"/[^\s:,'\[\]]+\.(?:srt|txt|png|jpg|MOV|mp4)", " ".join(cmd[:-1])))):
        q = Path(f)
        if q.exists():
            h.update(q.read_bytes() if q.suffix in (".srt", ".txt") else f"{q.stat().st_size}:{q.stat().st_mtime_ns}".encode())
    return h.hexdigest()


def run(cmd):
    out, key = Path(cmd[-1]), _key(cmd)
    stamp = out.with_suffix(".key")
    if out.suffix == ".mp4" and out.exists() and stamp.exists() and stamp.read_text() == key:
        return
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("ffmpeg failed:\n" + " ".join(cmd) + "\n" + r.stderr[-2000:])
    stamp.write_text(key)


def textfile(work, name, text):
    p = work / f"{name}.txt"
    p.write_text(text)
    return str(p)


def label(work, name, text):
    # chapter label, top left
    return (f"drawtext=fontfile={FONT}:textfile={textfile(work, name, 'Ve-AP · ' + text)}:x=36:y=30:fontsize=30:"
            f"fontcolor=white:box=1:boxcolor={NAVY}@0.8:boxborderw=12")


def subs_filter(srt):
    return f"subtitles={srt}:original_size=1920x1080:force_style='{SUB_STYLE}'"


def build(src, work, out):
    work.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    segs, all_subs, chapters, t0 = [], [], [], 0.0
    slides = work / "slides"

    def add(path, dur, subs, chapter=None):
        nonlocal t0
        if chapter:
            chapters.append((t0, chapter))
        all_subs.extend((a + t0, b + t0, t) for a, b, t in subs)
        segs.append(path)
        t0 += dur

    def slide(n, dur, subs, i):
        p = work / f"seg{i:02d}.mp4"
        srt = work / f"seg{i:02d}.srt"
        write_srt(srt, subs)
        vf = (f"[0:v]scale=1680:945,pad=1920:1080:120:0:color={NAVY},setsar=1,fps=30,{subs_filter(srt)}[v]")
        run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-t", str(dur), "-i", str(slides / f"s-{n:02d}.png"), *SILENT,
             "-filter_complex", vf, "-map", "[v]", "-map", "1:a", "-t", str(dur), *ENC, str(p)])
        return p

    def card(lines, dur, i):
        p = work / f"seg{i:02d}.mp4"
        big, sub, small = lines
        vf = (f"drawtext=fontfile={FONT}:textfile={textfile(work, f'c{i}a', big)}:x=120:y=420:fontsize=84:fontcolor=white,"
              f"drawtext=fontfile={FONT_REG}:textfile={textfile(work, f'c{i}b', sub)}:x=124:y=545:fontsize=40:fontcolor=0xEEF2F7,"
              f"drawtext=fontfile={FONT}:textfile={textfile(work, f'c{i}c', small)}:x=124:y=620:fontsize=30:fontcolor=0xF2A900")
        run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color=c={NAVY}:s=1920x1080:r=30:d={dur}", *SILENT,
             "-vf", vf, "-map", "0:v", "-map", "1:a", "-t", str(dur), *ENC, str(p)])
        return p

    def clip_a(start, dur, chap, subs, i):
        # Blurs B1-B3 from video/privacy-review.md, in clip A's own time (t = start + segment time).
        p = work / f"seg{i:02d}.mp4"
        srt = work / f"seg{i:02d}.srt"
        write_srt(srt, subs)
        T = lambda a, b: f"between(t+{start},{a},{b})"
        # B2 is full frame: a region blur cannot follow the hand-held camera (it exposed the street at 0:35).
        vf = (f"[0:v]boxblur=40:3:enable='{T(0, 8.1)}+{T(30.5, 37.1)}'[b0];"
              f"[b0]split=2[m][c4];[c4]crop=1500:560:0:0,boxblur=30:3[r4];"
              f"[m][r4]overlay=0:0:enable='{T(46.3, 51.3)}'[o4];"
              f"[o4]scale=1920:1080,setsar=1,fps=30,{label(work, f'l{i}', chap)},{subs_filter(srt)}[v];[0:a:0]{LOUD}[a]")
        run(["ffmpeg", "-y", "-v", "error", "-ss", str(start), "-t", str(dur), "-i", str(src / A),
             "-filter_complex", vf, "-map", "[v]", "-map", "[a]", "-t", str(dur), *ENC, str(p)])
        return p

    def clip_plain(name, start, dur, chap, subs, i):
        p = work / f"seg{i:02d}.mp4"
        srt = work / f"seg{i:02d}.srt"
        write_srt(srt, subs)
        vf = f"[0:v]scale=1920:1080,setsar=1,fps=30,{label(work, f'l{i}', chap)},{subs_filter(srt)}[v];[0:a:0]{LOUD}[a]"
        run(["ffmpeg", "-y", "-v", "error", "-ss", str(start), "-t", str(dur), "-i", str(src / name),
             "-filter_complex", vf, "-map", "[v]", "-map", "[a]", "-t", str(dur), *ENC, str(p)])
        return p

    def pip(c_start, dur, chap, subs, i):
        p = work / f"seg{i:02d}.mp4"
        srt = work / f"seg{i:02d}.srt"
        write_srt(srt, subs)
        cap = textfile(work, f'p{i}', "Phone view, in the car (sound)")
        vf = (f"color=c={NAVY}:s=1920x1080:r=30:d={dur}[bg];"
              f"[0:v]setpts=(PTS-STARTPTS)/{D_RATE},fps=30,scale=1440:864:flags=lanczos,setsar=1[d];"
              f"[1:v]fps=30,scale=400:225,setsar=1[c];"
              f"[bg][d]overlay=40:60[t1];[t1][c]overlay=1490:60[t2];"
              f"[t2]drawtext=fontfile={FONT_REG}:textfile={cap}:x=1490:y=296:fontsize=24:fontcolor=0xEEF2F7,"
              f"drawtext=fontfile={FONT}:textfile={textfile(work, f'pl{i}', chap)}:x=1490:y=350:fontsize=34:fontcolor=0xF2A900,"
              f"{subs_filter(srt)}[v];[1:a:0]{LOUD}[a]")
        run(["ffmpeg", "-y", "-v", "error", "-ss", f"{D0 + D_RATE * c_start:.3f}", "-t", f"{D_RATE * dur + 0.5:.3f}", "-i", str(src / D),
             "-ss", str(c_start), "-t", str(dur), "-i", str(src / C),
             "-filter_complex", vf, "-map", "[v]", "-map", "[a]", "-t", str(dur), *ENC, str(p)])
        return p

    def donly(d_start, dur, chap, subs, i):
        p = work / f"seg{i:02d}.mp4"
        srt = work / f"seg{i:02d}.srt"
        write_srt(srt, subs)
        vf = (f"color=c={NAVY}:s=1920x1080:r=30:d={dur}[bg];[0:v]fps=30,scale=1500:900:flags=lanczos,setsar=1[d];"
              f"[bg][d]overlay=210:76,{label(work, f'l{i}', chap).replace(':y=30:', ':y=12:')},{subs_filter(srt)}[v]")
        run(["ffmpeg", "-y", "-v", "error", "-ss", str(d_start), "-t", str(dur), "-i", str(src / D), *SILENT,
             "-filter_complex", vf, "-map", "[v]", "-map", "1:a", "-t", str(dur), *ENC, str(p)])
        return p

    i = 0
    for k, (n, dur, subs) in enumerate(SLIDES_INTRO):
        add(slide(n, dur, subs, i), dur, subs, "The idea, in twelve slides" if k == 0 else None); i += 1
    for kind, args, dur, chap, subs in CHAPTERS:
        if kind == "card":
            add(card(args, dur, i), dur, [], args[0]); i += 1
            continue
        if kind == "clipA":
            path = clip_a(args[0], dur, chap, subs, i)
        elif kind == "clipB":
            path = clip_plain(B, args[0], dur, chap, subs, i)
        elif kind == "pip":
            path = pip(args[0], dur, chap, subs, i)
        else:
            path = donly(args[0], dur, chap, subs, i)
        add(path, dur, subs); i += 1
    for k, (n, dur, subs) in enumerate(SLIDES_END):
        add(slide(n, dur, subs, i), dur, subs, "Results, limits and next" if k == 0 else None); i += 1

    lst = work / "concat.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in segs))
    film = out / "Ve-AP-capstone-film.mp4"
    film.with_suffix(".key").unlink(missing_ok=True)  # always re-join: the segments are listed in a file
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy",
         "-map_metadata", "-1", "-movflags", "+faststart", str(film)])
    write_srt(REPO / "video/captions.srt", all_subs)
    print("film", film, f"{t0:.0f} s")
    for t, name in chapters:
        print(f"{int(t // 60)}:{int(t % 60):02d} {name}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, required=True)
    ap.add_argument("--work", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=REPO / "video/out")
    a = ap.parse_args()
    build(a.src, a.work, a.out)
