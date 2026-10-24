// Builds presentation/Ve-AP-capstone.pptx from the repo's diagrams and stills.
// Usage (from the repo root): NODE_PATH=<dir with pptxgenjs, react-icons, react, react-dom, sharp>/node_modules \
//   PPTX_SKILL=<pptx skill dir> node presentation/build/deck.js
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");
const { applyTheme } = require(path.join(process.env.PPTX_SKILL, "scripts/apply_theme.js"));

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "presentation/Ve-AP-capstone.pptx");

const THEME = {
  name: "Ve-AP",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "1B2433", lt1: "FFFFFF", dk2: "0E1A2B", lt2: "EEF2F7",
    accent1: "F2A900", accent2: "12827A", accent3: "C0392B",
    accent4: "3B6EA5", accent5: "5B6B7F", accent6: "16263D",
    hlink: "3B6EA5", folHlink: "5B6B7F",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Yuvaraja";
pres.title = "Ve-AP: a governed AI agent in a real car";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
// accent6 is the raised navy used for cards on dark slides
const NAVY2 = C.accent6;

const W = 13.333, M = 0.6, CW = W - 2 * M;

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.0, w: 6.9, h: 1.9, fontSize: 40, bold: true, color: C.background1, valign: "bottom", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.05, w: 6.9, h: 1.6, fontSize: 18, color: C.background2, valign: "top", align: "left" }, text: "" } },
  ],
});
const footer = (color) => ({ text: { text: "Ve-AP · capstone 2026", options: { x: M, y: 7.02, w: 5, h: 0.3, fontSize: 10, color } } });
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.38, w: CW, h: 0.9, fontSize: 32, bold: true, color: C.text2, valign: "middle", align: "left" }, text: "" } },
    footer(C.accent5),
  ],
  slideNumber: { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
});
pres.defineSlideMaster({
  title: "CONTENT_DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.38, w: CW, h: 0.9, fontSize: 32, bold: true, color: C.background1, valign: "middle", align: "left" }, text: "" } },
    footer(C.background2),
  ],
  slideNumber: { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.3, fontSize: 10, color: C.background2, align: "right" },
});

// ---------- helpers ----------
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function jpgSize(file) {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1], len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  throw new Error("no SOF in " + file);
}
// Fit an image inside a box, keeping its aspect, centred.
function img(slide, rel, x, y, bw, bh, name) {
  const file = path.join(ROOT, rel);
  const s = rel.endsWith(".png") ? pngSize(file) : jpgSize(file);
  const r = s.w / s.h;
  let w = bw, h = bw / r;
  if (h > bh) { h = bh; w = bh * r; }
  slide.addImage({ path: file, x: x + (bw - w) / 2, y: y + (bh - h) / 2, w, h, objectName: name, altText: name });
  return { x: x + (bw - w) / 2, y: y + (bh - h) / 2, w, h };
}
const iconCache = {};
async function icon(name, color) {
  const key = name + color;
  if (!iconCache[key]) {
    const svg = RDS.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + color, size: 256 }));
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    iconCache[key] = "image/png;base64," + buf.toString("base64");
  }
  return iconCache[key];
}
async function iconDot(slide, name, x, y, d, dotColor, iconHex, objectName) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: dotColor }, line: { color: dotColor }, objectName: objectName + " dot" });
  const p = d * 0.25;
  slide.addImage({ data: await icon(name, iconHex), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: objectName + " icon" });
}
function text(slide, t, o) { slide.addText(t, Object.assign({ isTextBox: true, margin: 0 }, o)); }
function card(slide, x, y, w, h, fill, name, line) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line || fill }, objectName: name });
}
function chip(slide, t, x, y, w, fill, color, name, size) {
  slide.addText(t, { isTextBox: true, x, y, w, h: 0.32, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.16, fill: { color: fill }, line: { color: fill }, color, fontSize: size || 11, bold: true, align: "center", valign: "middle", margin: 0, objectName: name });
}
function stat(slide, big, label, x, y, w, bigColor, labelColor, name, size) {
  text(slide, big, { x, y, w, h: 0.95, fontSize: size || 48, bold: true, color: bigColor, objectName: name + " value" });
  text(slide, label, { x, y: y + 0.98, w, h: 0.7, fontSize: 14, color: labelColor, valign: "top", objectName: name + " label" });
}
function slideOf(master, section, title) {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
}

async function build() {
  // ---------------- 1. Title ----------------
  pres.addSection({ title: "Opening" });
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Opening" });
    s.addText("Ve-AP: a governed AI agent in a real car", { placeholder: "title" });
    s.addText([
      { text: "Bounded authority and measured refusal for in-vehicle agents", options: { breakLine: true } },
      { text: " ", options: { breakLine: true, fontSize: 10 } },
      { text: "Capstone project 2026 · Yuvaraja", options: { fontSize: 14 } },
    ], { placeholder: "body" });
    img(s, "media/in-car-display.jpg", 7.9, 1.6, 4.85, 3.6, "photo of the cabin display in the car");
    chip(s, "No cloud · Jetson + Raspberry Pi 5 · tested in a car, 19 Oct 2026", 7.9, 5.45, 4.85, C.accent1, C.text2, "context chip", 11);
    s.addNotes("Ve-AP is an AI agent that answers questions about a car while it is driven. It runs on two small boards in the car, with no cloud. Its point is not the answers: it is that every call to the vehicle passes a gate that can refuse, and every refusal is recorded.");
  }

  // ---------------- 2. Problem ----------------
  pres.addSection({ title: "Problem and idea" });
  {
    const s = slideOf("CONTENT", "Problem and idea", "Agents are arriving in cars. Three questions stay open");
    const rows = [
      ["FaUserShield", "What may it do, and who decides?", "A tool list says what an agent can call, not what it is allowed to call here, now, with this evidence."],
      ["FaBan", "How do we know a refusal works?", "A safety rule that has never refused anything has never been shown to work."],
      ["FaMicrochip", "How does it reach hardware without protocols?", "If a model can emit a CAN ID, every guard above it can be bypassed by one string."],
    ];
    for (let i = 0; i < rows.length; i++) {
      const y = 1.65 + i * 1.62;
      await iconDot(s, rows[i][0], M, y, 0.72, C.text2, HEX.accent1, "problem " + (i + 1));
      text(s, rows[i][1], { x: M + 0.95, y: y - 0.02, w: 6.4, h: 0.45, fontSize: 19, bold: true, color: C.text2, objectName: "problem title " + (i + 1) });
      text(s, rows[i][2], { x: M + 0.95, y: y + 0.45, w: 6.4, h: 0.85, fontSize: 15, color: C.text1, valign: "top", objectName: "problem body " + (i + 1) });
    }
    card(s, 8.4, 1.65, 4.33, 4.95, C.text2, "ceiling card");
    text(s, "0", { x: 8.75, y: 1.85, w: 3.6, h: 1.5, fontSize: 96, bold: true, color: C.accent1, objectName: "zero" });
    text(s, "times a failure ceiling fired in 19 runs of an earlier evaluation", { x: 8.75, y: 3.45, w: 3.7, h: 1.0, fontSize: 17, bold: true, color: C.background1, valign: "top", objectName: "zero label" });
    text(s, "Not because it was rarely needed: the tests never created the event. A predicate with eight conditions has eight ways to repeat that mistake.", { x: 8.75, y: 4.55, w: 3.7, h: 1.8, fontSize: 14, color: C.background2, valign: "top", objectName: "zero body" });
    s.addNotes("Vendor architectures show where an agent sits. They do not say what it may do, how we know its refusals work, or how it reaches hardware without speaking protocols. The author's earlier evaluation had a failure ceiling that fired zero times in nineteen runs: the zero meant 'never tested', not 'never needed'.");
  }

  // ---------------- 3. Thesis ----------------
  {
    const s = slideOf("CONTENT_DARK", "Problem and idea", "One predicate guards every vehicle call");
    s.addText([{ text: "Allow(q) = Auth ∧ Schema ∧ Fresh ∧ Pre", options: { breakLine: true } }, { text: "         ∧ Risk ≤ Permit ∧ Consent ∧ Budget ∧ Before" }], { isTextBox: true, margin: 0, x: M, y: 1.45, w: CW, h: 0.95, fontSize: 22, bold: true, fontFace: "Courier New", color: C.accent1, objectName: "formula" });
    const cj = [
      ["Auth", "in this agent's manifest?", "NOT_IN_MANIFEST"],
      ["Schema", "arguments well formed?", "SCHEMA_INVALID"],
      ["Fresh", "evidence young enough?", "STALE_EVIDENCE"],
      ["Pre", "preconditions hold now?", "PRECONDITION_UNMET"],
      ["Risk ≤ Permit", "class within the permit?", "RISK_EXCEEDS_PERMIT"],
      ["Consent", "data use consented?", "REDACTION_UNAVAILABLE"],
      ["Budget", "calls and cost left?", "BUDGET_EXHAUSTED"],
      ["Before", "inside the deadline?", "DEADLINE_EXCEEDED"],
    ];
    const cw = 2.85, gap = 0.233;
    cj.forEach((c, i) => {
      const x = M + (i % 4) * (cw + gap), y = 2.6 + Math.floor(i / 4) * 1.72;
      card(s, x, y, cw, 1.5, NAVY2, "conjunct " + c[0]);
      text(s, c[0], { x: x + 0.2, y: y + 0.15, w: cw - 0.4, h: 0.45, fontSize: 19, bold: true, color: C.background1, objectName: "conjunct name " + c[0] });
      text(s, c[1], { x: x + 0.2, y: y + 0.6, w: cw - 0.4, h: 0.35, fontSize: 14, color: C.background2, objectName: "conjunct q " + c[0] });
      text(s, c[2], { x: x + 0.2, y: y + 1.0, w: cw - 0.4, h: 0.32, fontSize: 12, bold: true, fontFace: "Courier New", color: C.accent1, objectName: "conjunct code " + c[0] });
    });
    text(s, "Each conjunct must deny on its own, name itself, and leave evidence. All 8 are made to deny, with their own code, on every run.", { x: M, y: 6.15, w: CW, h: 0.6, fontSize: 16, color: C.background1, objectName: "thesis line" });
    s.addNotes("The thesis: every action passes one predicate of eight conditions. Each can refuse on its own and names itself. The first one to refuse names the decision, and the decision is journalled before anything reaches a device.");
  }

  // ---------------- 4. Layers ----------------
  pres.addSection({ title: "Architecture" });
  {
    const s = slideOf("CONTENT", "Architecture", "L4 is the only way down");
    const L = [
      ["L9", "Cloud / depot — optional, off", "off"],
      ["L8", "Experience — cabin display, voice, console"],
      ["L7", "Orchestration — fast route, planner, budgets"],
      ["L6", "Specialised agent — read-only vehicle agent"],
      ["L5", "Shared intelligence — knowledge, driver state"],
      ["L4", "Capability gateway — Allow(q) · MCP · journal", "gate"],
      ["L3", "Vehicle services — SOVD north face over MHS"],
      ["L2", "Signals and transport — KUKSA · CAN"],
      ["L1", "Runtime — Jetson + Pi, containers, models"],
      ["L0", "Physical — ECUs, sensors, deterministic controllers"],
    ];
    L.forEach((l, i) => {
      const y = 1.55 + i * 0.52, gate = l[2] === "gate", off = l[2] === "off";
      s.addText([
        { text: l[0] + "   ", options: { bold: true } },
        { text: l[1] },
      ], { isTextBox: true, x: M, y, w: 6.9, h: 0.45, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06,
        fill: { color: gate ? C.accent1 : off ? C.background1 : C.background2 }, line: { color: gate ? C.accent1 : off ? C.accent5 : C.background2, dashType: off ? "dash" : "solid" },
        fontSize: 14, color: off ? C.accent5 : C.text2, bold: gate, margin: [0, 10, 0, 10], valign: "middle", objectName: "layer " + l[0] });
    });
    text(s, "Invariants — each has a test that runs every time", { x: 8.0, y: 1.55, w: 4.73, h: 0.45, fontSize: 18, bold: true, color: C.text2, objectName: "invariants head" });
    const inv = [
      ["I1", "No model or agent touches a vehicle interface"],
      ["I2", "Only L3 adapters speak a protocol"],
      ["I3", "No CAN, service or UDS IDs in any capability"],
      ["I4", "High-rate data never crosses L4"],
      ["I5", "Deterministic controllers stay authoritative"],
      ["I6", "Only admitted paths actuate; only providers publish"],
      ["I7", "Isolation is a missing import, not a filter"],
    ];
    inv.forEach((v, i) => {
      const y = 2.15 + i * 0.64;
      chip(s, v[0], 8.0, y + 0.04, 0.55, C.text2, C.accent1, "inv chip " + v[0], 12);
      text(s, v[1], { x: 8.7, y, w: 4.03, h: 0.42, fontSize: 14, color: C.text1, valign: "middle", objectName: "inv text " + v[0] });
    });
    s.addNotes("Ten layers. Models and agents live above L4, protocols below it. Nothing crosses except bounded semantic operations: never a CAN ID or a diagnostic service number. These are invariants with tests, and a hook stops the coding agent from breaking them.");
  }

  // ---------------- 5. System context ----------------
  {
    const s = slideOf("CONTENT", "Architecture", "The system on one page");
    img(s, "diagrams/png/D01-system-context.png", M, 1.5, CW, 3.6, "system context diagram");
    const pts = [["FaShieldHalved", "Every vehicle call goes through Allow(q)"], ["FaLink", "Every decision, refusals included, is journalled"], ["FaCloud", "No cloud: two boards in the car"]];
    for (let i = 0; i < 3; i++) {
      const x = M + i * 4.1;
      await iconDot(s, pts[i][0], x, 5.55, 0.6, C.text2, HEX.accent1, "context point " + (i + 1));
      text(s, pts[i][1], { x: x + 0.75, y: 5.55, w: 3.2, h: 0.6, fontSize: 15, bold: true, color: C.text2, valign: "middle", objectName: "context text " + (i + 1) });
    }
    s.addNotes("The agent has no route to the vehicle except through the gate. Below the gate is MHS, the hardware layer. Driver monitoring and the road view feed the cabin display with derived data only.");
  }

  // ---------------- 6. Deployment ----------------
  {
    const s = slideOf("CONTENT", "Architecture", "Two boards in the car, no cloud");
    img(s, "diagrams/png/D03-deployment.png", M, 1.45, CW, 3.0, "deployment diagram");
    const cols = [
      ["Jetson Orin Nano Super", "Vehicle agent, Allow(q) and journal · fast-route classifier · voice · driver monitoring · road view"],
      ["Raspberry Pi 5", "MHS · SOVD + MCP server · KUKSA · CAN · cabin display · car audio · dash cam gateway"],
      ["In the car", "Dash cam · driver webcam + mic · GNSS · bench panel · the car's own speakers over Bluetooth"],
    ];
    cols.forEach((c, i) => {
      const x = M + i * 4.1;
      card(s, x, 4.75, 3.9, 1.95, C.background2, "node card " + (i + 1));
      text(s, c[0], { x: x + 0.25, y: 4.9, w: 3.4, h: 0.4, fontSize: 17, bold: true, color: C.text2, objectName: "node title " + (i + 1) });
      text(s, c[1], { x: x + 0.25, y: 5.35, w: 3.4, h: 1.25, fontSize: 14, color: C.text1, valign: "top", objectName: "node body " + (i + 1) });
    });
    s.addNotes("The Jetson runs the agent and perception; the Pi runs the hardware layer, the diagnostic server and the cabin display. They talk over a direct Ethernet cable. The workstation model is optional, and it was not in the car.");
  }

  // ---------------- 7. MHS what/how/where/whether ----------------
  pres.addSection({ title: "MHS" });
  {
    const s = slideOf("CONTENT", "MHS", "MHS: every hardware fact is checked data");
    img(s, "diagrams/png/D10-mhs-four-questions.png", M, 1.45, CW, 2.15, "MHS four questions diagram");
    const cards = [
      ["FaDatabase", "Registry as data", "Interfaces, capabilities, bindings, interlocks, lenses, controllers. Generated, checked, never hand-edited."],
      ["FaFingerprint", "Pinned by digest", "Nodes import each other pinned by digest. A mismatch answers REGISTRY_CHANGED, not a guess."],
      ["FaArrowsRotate", "Honest fallback", "A read falls back only to the same quantity, as fresh or fresher. Writes never fall back."],
      ["FaCubes", "Generic core", "The core knows no vehicle, board or pin. A test fails if one appears in its logic."],
    ];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.083;
      card(s, x, 3.9, 2.88, 2.85, C.background2, "mhs card " + (i + 1));
      await iconDot(s, cards[i][0], x + 0.22, 4.08, 0.55, C.text2, HEX.accent1, "mhs card " + (i + 1));
      text(s, cards[i][1], { x: x + 0.22, y: 4.75, w: 2.45, h: 0.4, fontSize: 16, bold: true, color: C.text2, objectName: "mhs card title " + (i + 1) });
      text(s, cards[i][2], { x: x + 0.22, y: 5.2, w: 2.45, h: 1.45, fontSize: 13, color: C.text1, valign: "top", objectName: "mhs card body " + (i + 1) });
    }
    s.addNotes("MHS is the hardware layer. Every hardware fact is data in a registry that is checked when it compiles. MHS separates what, how, where and whether, so the agent never names a pin, a CAN ID or a diagnostic service. A new sensor is a registry entry, not new agent code.");
  }

  // ---------------- 8. MHS two locks + one core ----------------
  {
    const s = slideOf("CONTENT", "MHS", "MHS decides no authority: two locks, one core");
    const steps = [
      ["Gate", "mints an admission for this exact request", C.accent2],
      ["MHS", "verifies it, and cannot mint one", C.text2],
      ["Interlock", "the device policy may still refuse", C.accent3],
      ["Adapter", "the only code that speaks the protocol", C.accent5],
      ["Read-back", "the write is verified, then journalled", C.accent2],
    ];
    const bw = 2.2, g = (CW - 5 * bw) / 4;
    steps.forEach((st, i) => {
      const x = M + i * (bw + g);
      card(s, x, 1.5, bw, 1.45, st[2], "lock step " + st[0]);
      text(s, st[0], { x: x + 0.15, y: 1.6, w: bw - 0.3, h: 0.4, fontSize: 17, bold: true, color: C.background1, objectName: "lock step title " + st[0] });
      text(s, st[1], { x: x + 0.15, y: 2.0, w: bw - 0.3, h: 0.85, fontSize: 13, color: C.background1, valign: "top", objectName: "lock step body " + st[0] });
      if (i < 4) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + bw + 0.02, y: 2.07, w: g - 0.04, h: 0.3, fill: { color: C.accent5 }, line: { color: C.accent5 }, objectName: "lock arrow " + i });
    });
    img(s, "diagrams/png/D11-mhs-one-core.png", M, 3.2, 6.3, 3.55, "MHS one core many faces diagram");
    s.addText([
      { text: "Agent harness, MCP, cabin display and the SOVD diagnostic API are faces of one core. None speaks a protocol.", options: { bullet: true, breakLine: true } },
      { text: "Live data leaves only through budgeted lenses. Anything held is a lease that expires to a safe state.", options: { bullet: true, breakLine: true } },
      { text: "Faults are named: REGISTRY_CHANGED, INTERLOCK_REJECTED, LEASE_EXPIRED, CONTROLLER_HALTED.", options: { bullet: true, breakLine: true } },
      { text: "481 MHS tests passed (19 Oct 2026).", options: { bullet: true, bold: true } },
    ], { isTextBox: true, x: 7.2, y: 3.35, w: 5.53, h: 3.3, fontSize: 15, color: C.text1, paraSpaceAfter: 8, valign: "top", objectName: "mhs bullets" });
    s.addNotes("Two locks. The gate mints an admission for one exact request; MHS verifies it and cannot mint one. The device interlock can still refuse an admitted write. And every face, from MCP to the cabin display, is a consumer of one core.");
  }

  // ---------------- 9. Two paths + refused by name ----------------
  pres.addSection({ title: "Innovations" });
  {
    const s = slideOf("CONTENT", "Innovations", "Alerts never wait for a model");
    const lanes = [
      ["Path A · deterministic, no model", "Declared rules: coolant hot, door open while moving, belt unfastened", "Alert on screen and sound", C.accent2],
      ["Path B · the governed agent", "Through Allow(q), like every other call", "May explain an alert. Never clear or suppress one", C.text2],
    ];
    lanes.forEach((l, i) => {
      const y = 1.6 + i * 2.35;
      text(s, l[0], { x: M, y, w: 6.3, h: 0.4, fontSize: 17, bold: true, color: l[3], objectName: "lane title " + i });
      card(s, M, y + 0.5, 2.9, 1.5, C.background2, "lane box a " + i);
      text(s, l[1], { x: M + 0.18, y: y + 0.6, w: 2.55, h: 1.3, fontSize: 14, color: C.text1, valign: "middle", objectName: "lane text a " + i });
      s.addShape(pres.shapes.RIGHT_ARROW, { x: M + 2.98, y: y + 1.1, w: 0.42, h: 0.3, fill: { color: l[3] }, line: { color: l[3] }, objectName: "lane arrow " + i });
      card(s, M + 3.48, y + 0.5, 2.85, 1.5, l[3], "lane box b " + i);
      text(s, l[2], { x: M + 3.66, y: y + 0.6, w: 2.5, h: 1.3, fontSize: 14, bold: true, color: C.background1, valign: "middle", objectName: "lane text b " + i });
    });
    text(s, "Refused by name (C3)", { x: 7.5, y: 1.6, w: 5.2, h: 0.4, fontSize: 17, bold: true, color: C.accent3, objectName: "c3 head" });
    const c3 = ["send_can_frame", "write_ecu_memory", "install_ota_bundle", "stream_forward_camera_raw", "get_cabin_frame", "identify_driver", "identify_speaker", "read_emotion", "detect_stress", "detect_smoking", "store_audio"];
    c3.forEach((n, i) => {
      const x = 7.5 + (i % 2) * 2.65, y = 2.15 + Math.floor(i / 2) * 0.5;
      s.addText(n, { isTextBox: true, x, y, w: 2.5, h: 0.38, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, fill: { color: C.background1 }, line: { color: C.accent3 }, color: C.accent3, fontFace: "Courier New", fontSize: 11, bold: true, align: "center", valign: "middle", margin: 0, objectName: "c3 " + n });
    });
    text(s, "In no manifest, ever. The names exist only so a request for them is refused with NOT_IN_MANIFEST, before any model runs.", { x: 7.5, y: 5.2, w: 5.2, h: 0.95, fontSize: 14, color: C.text1, valign: "top", objectName: "c3 note" });
    s.addNotes("Two paths: safety alerts are rules with no model, so a model failure can never silence a warning. And the dangerous capabilities are not missing features: they are named, and refused by name, which makes the refusal testable.");
  }

  // ---------------- 10. Privacy ----------------
  {
    const s = slideOf("CONTENT", "Innovations", "Privacy by construction, not by redaction");
    const a = img(s, "media/cabin-attention-lines.jpg", M, 1.45, 5.95, 3.45, "driver attention screen drawn as lines");
    const b = img(s, "media/cabin-road-view-in-path.jpg", M + 6.15, 1.45, 5.95, 3.45, "road view with blurred picture");
    text(s, "The driver's face, drawn from numbers", { x: a.x, y: a.y + a.h + 0.08, w: a.w, h: 0.3, fontSize: 12, color: C.accent5, objectName: "caption a" });
    text(s, "The dash cam, blurred before it leaves the computer", { x: b.x, y: b.y + b.h + 0.08, w: b.w, h: 0.3, fontSize: 12, color: C.accent5, objectName: "caption b" });
    const rules = [["FaEye", "Driver camera", "numbers out, never a frame"], ["FaCarSide", "Dash cam", "blurred, or no picture at all"], ["FaMicrophone", "Microphone", "only while Talk is held"], ["FaLocationDot", "Location", "only with consent"]];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.083;
      await iconDot(s, rules[i][0], x, 5.5, 0.6, C.text2, HEX.accent1, "privacy rule " + (i + 1));
      text(s, rules[i][1], { x: x + 0.75, y: 5.45, w: 2.2, h: 0.35, fontSize: 15, bold: true, color: C.text2, objectName: "privacy title " + (i + 1) });
      text(s, rules[i][2], { x: x + 0.75, y: 5.8, w: 2.2, h: 0.55, fontSize: 13, color: C.text1, valign: "top", objectName: "privacy body " + (i + 1) });
    }
    s.addNotes("Nothing is redacted afterwards because the sensitive data never leaves its box. The driver monitor emits numbers, and the screen draws the face as lines. The road picture is blurred on the Jetson, and if blurring is unavailable no picture is sent at all.");
  }

  // ---------------- 11. What is new ----------------
  {
    const s = slideOf("CONTENT", "Innovations", "What is new");
    const items = [
      ["FaShieldHalved", "Allow(q), executed", "8 conjuncts, each made to deny on every run", "8/8"],
      ["FaMicrochip", "MHS hardware layer", "hardware as checked data; cannot mint authority", "481 tests"],
      ["FaBan", "Refusal by name", "safety-critical names exist only to be refused", "built"],
      ["FaEye", "Derived-state sensing", "the driver camera emits numbers, never frames", "in the car"],
      ["FaRoad", "Privacy-first road view", "no blur means no picture", "in the car"],
      ["FaCodeFork", "Two paths", "alerts need no model; the agent never clears one", "built"],
      ["FaBolt", "Model as last resort", "~130 ms classifier (warm); 19.7 s → 0.86 s", "12/12"],
      ["FaVolumeHigh", "Car audio arbiter", "a critical alert pre-empts an answer; repeats are rate-limited", "shown in car"],
      ["FaListCheck", "Gated AI-SDLC", "hooks stop the coding agent breaking an invariant", "212 commits"],
    ];
    const cw = 3.85, gx = (CW - 3 * cw) / 2;
    for (let i = 0; i < 9; i++) {
      const x = M + (i % 3) * (cw + gx), y = 1.5 + Math.floor(i / 3) * 1.8;
      card(s, x, y, cw, 1.6, C.background2, "new card " + (i + 1));
      await iconDot(s, items[i][0], x + 0.2, y + 0.22, 0.55, C.text2, HEX.accent1, "new card " + (i + 1));
      text(s, items[i][1], { x: x + 0.9, y: y + 0.2, w: 2.75, h: 0.4, fontSize: 15, bold: true, color: C.text2, objectName: "new title " + (i + 1) });
      text(s, items[i][2], { x: x + 0.9, y: y + 0.62, w: 2.75, h: 0.55, fontSize: 12, color: C.text1, valign: "top", objectName: "new body " + (i + 1) });
      chip(s, items[i][3], x + 0.9, y + 1.18, 1.35, C.accent1, C.text2, "new chip " + (i + 1), 10);
    }
    s.addNotes("Nine ideas a reviewer can check. Each card carries its evidence: a test count, an eval, or the fact that it was shown in the car.");
  }

  // ---------------- 12. Seventeen inventions ----------------
  {
    const s = slideOf("CONTENT", "Innovations", "Seventeen inventions, each with its real status");
    s.addChart(pres.charts.BAR, [{ name: "Inventions", labels: ["Built", "Partial", "Proof of concept", "Design only"], values: [1, 9, 1, 6] }], {
      x: M, y: 1.5, w: 5.6, h: 4.9, barDir: "bar", chartColors: [HEX.accent2],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 14, dataLabelColor: HEX.dk1, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 14, catAxisLabelFontFace: "+mn-lt", catAxisOrientation: "maxMin",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
      showTitle: true, title: "How far each of the 17 is built", titleFontSize: 14, titleColor: HEX.dk2, titleFontFace: "+mn-lt", objectName: "inventions chart",
    });
    const groups = [
      ["Built", "14 derived-state-only sensing", C.accent2],
      ["Partial", "1 authority-routed inference · 4 offline manifest · 6 evidence receipt · 8 A2UI in the car · 11 motion-state legality · 12 a generated tool is a proposal · 13 the plan is not the authority · 15 grammar-bounded calls · 17 presence = push-to-talk", C.accent4],
      ["Proof of concept", "2 the Speak predicate", C.accent5],
      ["Design only", "3 refusal counterfactual · 5 joules per answer · 7 negative-answer accountability · 9 shadow verdict gate · 10 conflict arbitration · 16 signed model slots", C.accent3],
    ];
    let y = 1.55;
    const hs = [0.75, 1.9, 0.75, 1.5];
    groups.forEach((gp, i) => {
      chip(s, gp[0], 6.6, y, 1.75, gp[2], C.background1, "status chip " + gp[0], 11);
      text(s, gp[1], { x: 8.5, y: y - 0.02, w: 4.23, h: hs[i], fontSize: 13, color: C.text1, valign: "top", objectName: "status list " + gp[0] });
      y += hs[i] + 0.15;
    });
    s.addNotes("The architecture argues for seventeen inventions. This build proves one fully, nine partly, one in a proof of concept, and six remain design. Saying so is part of the method.");
  }

  // ---------------- 13. Ask the car ----------------
  pres.addSection({ title: "Flows" });
  {
    const s = slideOf("CONTENT", "Flows", "Ask the car: every reading passes the gate");
    img(s, "diagrams/png/S01-ask-the-car.png", M, 1.4, CW, 4.85, "ask the car sequence diagram");
    text(s, "The fast route picks the readings. Each passes Allow(q) and is journalled. The answer shows its evidence and is spoken through the car's speakers.", { x: M, y: 6.35, w: CW, h: 0.5, fontSize: 14, color: C.text1, objectName: "ask caption" });
    s.addNotes("A push-to-talk question. Audio is captured only while Talk is held. The fast route picks the readings, every reading passes the gate, and the answer comes back with its evidence, spoken through the car's own audio.");
  }

  // ---------------- 14. Refusals ----------------
  {
    const s = slideOf("CONTENT", "Flows", "Refusals are fast, named and journalled");
    img(s, "diagrams/png/S02-refused-by-name.png", M, 1.45, 7.6, 4.6, "refused by name sequence diagram");
    card(s, 8.55, 1.5, 4.18, 4.9, C.background2, "stale card");
    text(s, "Stale data is refused too", { x: 8.8, y: 1.7, w: 3.7, h: 0.4, fontSize: 17, bold: true, color: C.text2, objectName: "stale head" });
    s.addText([
      { text: "A reading older than its bound is refused STALE_EVIDENCE.", options: { bullet: true, breakLine: true } },
      { text: "The agent says: \"I could not read the coolant temperature — the reading is too old.\"", options: { bullet: true, breakLine: true } },
      { text: "Commands are refused before any model runs: milliseconds, not seconds.", options: { bullet: true, breakLine: true } },
      { text: "An old number is never shown as current.", options: { bullet: true } },
    ], { isTextBox: true, x: 8.8, y: 2.2, w: 3.75, h: 4.0, fontSize: 14, color: C.text1, paraSpaceAfter: 8, valign: "top", objectName: "stale bullets" });
    s.addNotes("Refusals are first-class. A C3 request is refused by name, before any model runs. A stale reading is refused rather than shown as current. Both are journal lines.");
  }

  // ---------------- 15. Fast route ----------------
  {
    const s = slideOf("CONTENT", "Flows", "The model is the last resort");
    const rungs = [
      ["1", "No model", "commands and C3 refused; template answers", C.accent2],
      ["2", "Small classifier, ~130 ms warm", "picks the one reading a question needs", C.accent4],
      ["3", "Larger model", "plans in a strict schema; every step re-enters the gate", C.text2],
    ];
    rungs.forEach((r, i) => {
      const y = 1.55 + i * 1.35;
      card(s, M, y, 6.9, 1.15, C.background2, "rung " + r[0]);
      chip(s, r[0], M + 0.25, y + 0.38, 0.5, r[3], C.background1, "rung num " + r[0], 13);
      text(s, r[1], { x: M + 1.0, y: y + 0.13, w: 5.7, h: 0.4, fontSize: 17, bold: true, color: C.text2, objectName: "rung title " + r[0] });
      text(s, r[2], { x: M + 1.0, y: y + 0.55, w: 5.7, h: 0.45, fontSize: 14, color: C.text1, objectName: "rung body " + r[0] });
    });
    text(s, "If the larger model is unreachable: a model-free answer, or an honest \"I can't answer that now\".", { x: M, y: 5.65, w: 6.9, h: 0.7, fontSize: 14, italic: true, color: C.accent5, valign: "top", objectName: "ladder note" });
    stat(s, "19.7 → 0.86 s", "median answer time, before and after the fast route", 8.0, 1.6, 4.73, C.accent1, C.text1, "latency", 44);
    stat(s, "12 / 12", "eval questions answered with the workstation model off (19 Oct)", 8.0, 3.5, 4.73, C.accent2, C.text1, "box down");
    stat(s, "0.4 s", "median live answer, the same day", 8.0, 5.25, 4.73, C.text2, C.text1, "median");
    s.addNotes("The model is the last resort. Most questions need one reading, which a small classifier picks in about 130 milliseconds and a template answers. That took the median answer from almost twenty seconds to under one, and every answer still works when the big model is unreachable.");
  }

  // ---------------- 16. Testing strategy ----------------
  pres.addSection({ title: "Evidence" });
  {
    const s = slideOf("CONTENT", "Evidence", "A test that has never failed proves nothing");
    const st = ["Requirement", "Test names its reason code", "Must fail for the stated reason", "Minimal code", "Pass", "Reachability", "Mutation gate", "Commit"];
    const bw = 1.4, g = (CW - 8 * bw) / 7;
    st.forEach((t, i) => {
      const x = M + i * (bw + g), hot = i === 2;
      s.addText(t, { isTextBox: true, x, y: 1.55, w: bw, h: 1.0, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, fill: { color: hot ? C.accent1 : C.background2 }, line: { color: hot ? C.accent1 : C.background2 }, fontSize: 12, bold: true, color: C.text2, align: "center", valign: "middle", margin: 4, objectName: "tdd step " + (i + 1) });
    });
    const tiers = [["T1", "pure logic, any machine"], ["T2", "compute host"], ["T3", "CAN + ECU simulator"], ["T4", "governed: guard + journal"], ["T5", "two or more nodes"], ["T6", "shadow, recorded corpus"]];
    text(s, "Tiers — a tier that cannot run skips with its reason", { x: M, y: 2.9, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.text2, objectName: "tiers head" });
    tiers.forEach((t, i) => {
      const y = 3.4 + i * 0.55;
      chip(s, t[0], M, y + 0.05, 0.6, C.text2, C.accent1, "tier " + t[0], 12);
      text(s, t[1], { x: M + 0.8, y, w: 5, h: 0.42, fontSize: 14, color: C.text1, valign: "middle", objectName: "tier text " + t[0] });
    });
    const proofs = [
      ["Reachability", "Each conjunct is made to deny alone, with its own code and no other. 8/8."],
      ["Mutation gates", "Break a rule on purpose: cabin, registry, audio, dev gates. A test must go red."],
      ["Traceability", "Intent → requirement → plan → test → reason code. A gap breaks the build."],
    ];
    proofs.forEach((p, i) => {
      const y = 2.9 + i * 1.3;
      card(s, 7.0, y, 5.73, 1.15, C.background2, "proof card " + (i + 1));
      text(s, p[0], { x: 7.25, y: y + 0.1, w: 5.3, h: 0.4, fontSize: 16, bold: true, color: C.text2, objectName: "proof title " + (i + 1) });
      text(s, p[1], { x: 7.25, y: y + 0.5, w: 5.3, h: 0.6, fontSize: 13, color: C.text1, valign: "top", objectName: "proof body " + (i + 1) });
    });
    s.addNotes("Every behaviour starts as a test that fails for the stated reason. Then reachability proves each conjunct can deny, mutation gates prove each rule is really tested, and traceability links every requirement to its test.");
  }

  // ---------------- 17. Results ----------------
  {
    const s = slideOf("CONTENT", "Evidence", "Results: 19 October 2026");
    const stats = [["18 / 18", "check-all sections pass, 0 fail"], ["8 / 8", "conjuncts deny with their own code"], ["1,950", "journal decisions, chain intact"], ["I1–I7", "every invariant held"]];
    stats.forEach((st2, i) => stat(s, st2[0], st2[1], M + i * 3.083, 1.45, 2.9, i === 1 ? C.accent1 : C.text2, C.text1, "result " + (i + 1)));
    s.addChart(pres.charts.BAR, [{ name: "Tests passed", labels: ["T1 pure logic", "MHS", "Voice", "Cabin display", "T4 agent", "Vision", "SOVD server", "Console"], values: [983, 481, 335, 278, 146, 121, 104, 42] }], {
      x: M, y: 3.35, w: CW, h: 3.4, barDir: "col", chartColors: [HEX.accent2],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
      showTitle: true, title: "Tests passed per suite (suites overlap, so they are not summed)", titleFontSize: 13, titleColor: HEX.dk2, titleFontFace: "+mn-lt", objectName: "tests chart",
    });
    s.addNotes("The offline check-all passed every one of its eighteen sections on the nineteenth of October. Every conjunct denied, the journal chain was intact over 1,950 decisions, and the invariants held.");
  }

  // ---------------- 18. In the car ----------------
  pres.addSection({ title: "In the car" });
  {
    const s = slideOf("CONTENT", "In the car", "In the car: what was real, what was simulated");
    const shots = [["media/cabin-ask-the-car.jpg", "Spoken question, answer with its evidence"], ["media/cabin-drowsiness-alert.jpg", "\"Signs of drowsiness. Take a break soon.\""], ["media/cabin-road-view-in-path.jpg", "Blurred dash cam, detections, in path"]];
    shots.forEach((sh, i) => {
      const r = img(s, sh[0], M + i * 4.1, 1.45, 3.9, 2.35, "still " + (i + 1));
      text(s, sh[1], { x: r.x, y: r.y + r.h + 0.06, w: r.w, h: 0.3, fontSize: 12, color: C.accent5, objectName: "still caption " + (i + 1) });
    });
    card(s, M, 4.45, 5.95, 2.3, C.accent2, "real card");
    text(s, "Real", { x: M + 0.25, y: 4.55, w: 5.4, h: 0.4, fontSize: 17, bold: true, color: C.background1, objectName: "real head" });
    text(s, "Dash cam and road view · driver webcam and monitoring · microphone, speech, spoken answers · Bluetooth to the car's speakers · both boards on their own battery", { x: M + 0.25, y: 5.0, w: 5.45, h: 1.6, fontSize: 14, color: C.background1, valign: "top", objectName: "real body" });
    card(s, M + 6.15, 4.45, 5.95, 2.3, C.background1, "sim card", C.accent1);
    text(s, "Simulated", { x: M + 6.4, y: 4.55, w: 5.4, h: 0.4, fontSize: 17, bold: true, color: C.text2, objectName: "sim head" });
    text(s, "The vehicle signals the agent read: speed, battery %, coolant, fault codes, from a CAN simulator. The screen marks them estimate / replayed. The car's OBD-II port is the next stage.", { x: M + 6.4, y: 5.0, w: 5.45, h: 1.6, fontSize: 14, color: C.text1, valign: "top", objectName: "sim body" });
    s.addNotes("On the nineteenth of October the rig went into a car. Cameras, microphone, speech and the car's own speakers were real. The vehicle signals came from a simulator, and the screen says so. Reading the car's own bus is the next stage.");
  }

  // ---------------- 19. Drive measured ----------------
  {
    const s = slideOf("CONTENT", "In the car", "What the drive measured");
    const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.dk2 } } });
    const rows = [
      [hdr(""), hdr("Drive 1"), hdr("Drive 2"), hdr("Drive 3 · camera straightened")],
      ["Duration", "5 min 41 s", "29 min 5 s", "6 min 53 s"],
      ["Pictures processed", "3,253", "17,386", "4,116"],
      ["Rate (blur on)", "9.8 fps", "9.98 fps", "9.97 fps"],
      ["Camera mount", "found at 42 s, lost at 64 s", "out of range: \"straighten the camera\"", "found after 74 s"],
      ["Lane probability, left near", "0.01", "0.14", "0.35"],
      ["Lead car seen", "0 %", "1 %", "13 %"],
      ["Boxes flagged in path", "0", "601", "149"],
    ];
    s.addTable(rows, { x: M, y: 1.45, w: CW, colW: [3.2, 2.6, 3.3, 3.03], fontSize: 14, color: HEX.dk1, border: { type: "solid", pt: 0.75, color: "D5DCE6" }, rowH: 0.48, valign: "middle", margin: [0, 0.12, 0, 0.12], objectName: "drive table" });
    card(s, M, 5.55, 5.95, 1.2, C.background2, "drive note good");
    text(s, "It refused to calibrate a crooked camera and said why. Once the camera was straightened, the mount was found in 74 s.", { x: M + 0.25, y: 5.62, w: 5.5, h: 1.05, fontSize: 14, color: C.text1, valign: "middle", objectName: "drive good" });
    card(s, M + 6.15, 5.55, 5.95, 1.2, C.background2, "drive note open");
    text(s, "Not done on the day: OBD-II in the car, lens calibration, a GNSS fix. Each is said, not hidden.", { x: M + 6.4, y: 5.62, w: 5.5, h: 1.05, fontSize: 14, color: C.text1, valign: "middle", objectName: "drive open" });
    s.addNotes("The road view held about ten frames a second for forty-two minutes with blurring on. On the long drive it refused to calibrate a crooked camera and told us to straighten it; once straightened, it found the mount in seventy-four seconds. The lens was never calibrated, and the roads had no lane markings, so lane confidence stayed low.");
  }

  // ---------------- 20. AI-SDLC ----------------
  pres.addSection({ title: "How it was built" });
  {
    const s = slideOf("CONTENT", "How it was built", "Built with an AI coding agent, inside gates");
    img(s, "diagrams/png/D07-ai-sdlc-loop.png", M, 1.4, CW, 1.6, "AI-SDLC loop diagram");
    const st3 = [["212", "commits, 204 co-authored with the AI agent"], ["54", "intents · 47 specs · 10 plans"], ["424", "requirements traced to a test and a code (19 Oct)"], ["7 weeks", "3 Sep → 19 Oct 2026"]];
    st3.forEach((x, i) => stat(s, x[0], x[1], M + i * 3.083, 3.2, 2.9, C.text2, C.text1, "sdlc stat " + (i + 1)));
    card(s, M, 5.25, CW, 1.5, C.text2, "gates card");
    text(s, "Pre-edit hooks stop the coding agent before it writes:", { x: M + 0.3, y: 5.35, w: CW - 0.6, h: 0.4, fontSize: 15, bold: true, color: C.accent1, objectName: "gates head" });
    text(s, "a gate importing CAN or MCP · a camera frame escaping · a C3 capability · a flash path · an unsigned model slot · a push to main · a cloud SDK, or actuation outside an admitted path · protocol IDs in a capability. Each gate is probed both ways in CI.", { x: M + 0.3, y: 5.75, w: CW - 0.6, h: 0.95, fontSize: 14, color: C.background1, valign: "top", objectName: "gates body" });
    s.addNotes("The coding agent worked inside gates it could not edit around. Memory lived in files: status, plan, learnings. Every incident opened an intent. The human chose, approved, wired, drove and pushed; the agent wrote tests first and reported failures with their output.");
  }

  // ---------------- 21. Limits and next ----------------
  pres.addSection({ title: "Close" });
  {
    const s = slideOf("CONTENT", "Close", "Honest limits, and what comes next");
    text(s, "Limits", { x: M, y: 1.45, w: 5.9, h: 0.4, fontSize: 18, bold: true, color: C.accent3, objectName: "limits head" });
    s.addText([
      "A simulated vehicle bus; OBD-II not yet in a car",
      "Live permit is C0 (read-only); C2 proven in a proof of concept",
      "Journal tamper-evident, not anchored or signed",
      "Driver monitoring not validated on drowsy drivers",
      "One car, one session, one operator",
      "No ISO 26262 or ISO/SAE 21434 claim",
    ].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { isTextBox: true, x: M, y: 1.95, w: 5.9, h: 3.5, fontSize: 15, color: C.text1, paraSpaceAfter: 10, valign: "top", objectName: "limits list" });
    text(s, "Next", { x: 6.95, y: 1.45, w: 5.78, h: 0.4, fontSize: 18, bold: true, color: C.accent2, objectName: "next head" });
    s.addText([
      "OBD-II in the car: listen-only, then reads",
      "Calibrate the lens; drive a marked road",
      "C2 on the live path with a real writ issuer",
      "Anchor the journal; sign the receipts",
      "Wire the verdict-sequence shadow gate",
      "Release MHS on its own, with its paper",
    ].map((t, i, a) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < a.length - 1 } })), { isTextBox: true, x: 6.95, y: 1.95, w: 5.78, h: 3.5, fontSize: 15, color: C.text1, paraSpaceAfter: 10, valign: "top", objectName: "next list" });
    card(s, M, 5.6, CW, 1.15, C.text2, "maxim card");
    text(s, "Overclaiming is worth less than not claiming. Every limit above is also written in the documents.", { x: M + 0.3, y: 5.6, w: CW - 0.6, h: 1.15, fontSize: 17, bold: true, color: C.background1, valign: "middle", objectName: "maxim" });
    s.addNotes("Overclaiming is worth less than not claiming. These are the limits, and the next steps that close them, starting with connecting to the car's own bus.");
  }

  // ---------------- 22. Thanks ----------------
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Close" });
    s.addText("Thank you", { placeholder: "title" });
    s.addText([
      { text: "Documents, diagrams, slides and film: the ve-ap-capstone repository on GitHub", options: { breakLine: true } },
      { text: " ", options: { breakLine: true, fontSize: 10 } },
      { text: "CC BY-NC-ND 4.0 · source code private", options: { fontSize: 14 } },
    ], { placeholder: "body" });
    img(s, "media/cabin-attention-lines.jpg", 7.9, 1.9, 4.85, 3.0, "attention screen");
    s.addNotes("Thank you. Everything in this talk, including the film and every diagram, is in the public repository.");
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
}

build().catch((e) => { console.error(e); process.exit(1); });
