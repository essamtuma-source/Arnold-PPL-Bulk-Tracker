import { useState, useMemo, useEffect } from "react";

/* ---------- DATA ---------- */

const E = (name, warm, sets, reps, rest, note) => ({ name, warm, sets, reps, rest, note });
const MAIN = "Stop 1-3 reps short of failure";
const ISO = "Stop 0-2 reps short of failure";
const DROP = "0-2 reps short; optional drop set (max 2 per session)";

const DAYS = [
  { key: "mon", short: "Day 1", title: "Chest + Back", kind: "Heavy · 6-10 reps", exercises: [
    E("Neutral-Grip Machine Press", "2", 3, "6-10", "2-3", MAIN),
    E("Neutral-Grip Pulldown", "2", 3, "6-10", "2-3", MAIN),
    E("Incline DB Press", "1-2", 2, "8-10", "2", "Comfortable shoulder range. " + MAIN),
    E("Chest-Supported Row", "1-2", 3, "6-10", "2-3", MAIN),
    E("Cable Fly", "1", 2, "10-12", "1-2", ISO),
    E("Face Pull", "1", 2, "12-15", "1-2", ISO),
  ] },
  { key: "tue", short: "Day 2", title: "Shoulders + Arms", kind: "Heavy · 6-10 reps", exercises: [
    E("Machine Lateral Raise", "1", 2, "10-15", "1-2", "Pain-free range only; keep neck relaxed. " + ISO),
    E("Cable Lateral Raise", "1", 3, "10-15", "1-2", ISO),
    E("Rear Delt Fly", "1", 2, "12-15", "1-2", ISO),
    E("EZ-Bar Curl", "1-2", 2, "6-10", "2", "Controlled, no swinging. " + ISO),
    E("Rope Pushdown", "1", 2, "8-12", "1-2", ISO),
    E("Incline DB Curl", "1", 2, "10-12", "1-2", ISO),
    E("Overhead Cable Extension", "1", 2, "10-12", "1-2", ISO),
  ] },
  { key: "wed", short: "Day 3", title: "Legs + Glutes", kind: "Heavy · 6-10 reps", exercises: [
    E("Leg Press (90° max)", "2-3", 3, "6-10", "2-3", "Knee angle no deeper than 90°. " + MAIN),
    E("Hip Thrust", "2", 3, "6-10", "2-3", MAIN),
    E("Lying Leg Curl", "1", 2, "8-12", "1-2", ISO),
    E("Glute Machine", "1", 2, "10-12", "1-2", ISO),
    E("Standing Calf Raise", "1", 2, "8-12", "1-2", "Full stretch, 2 s pause. " + ISO),
    E("Cable Crunch", "1", 2, "8-12", "1-2", ISO),
  ] },
  { key: "thu", short: "Day 4", title: "Push", kind: "PPL · 8-12 reps", exercises: [
    E("Neutral-Grip DB Press", "2", 3, "8-12", "2-3", MAIN),
    E("Cable Lateral Raise", "1", 2, "12-15", "1-2", "Pain-free range only; keep neck relaxed. " + ISO),
    E("Cable Fly", "1", 2, "10-15", "1-2", ISO),
    E("Cable Lateral Raise", "1", 3, "12-15", "1-2", DROP),
    E("Rope Pushdown", "1", 2, "10-12", "1-2", DROP),
    E("Overhead Cable Extension", "1", 2, "10-12", "1-2", ISO),
  ] },
  { key: "fri", short: "Day 5", title: "Pull", kind: "PPL · 8-12 reps", exercises: [
    E("Neutral-Grip Pulldown", "2", 3, "8-12", "2-3", MAIN),
    E("Chest-Supported Row", "1-2", 3, "8-12", "2-3", MAIN),
    E("One-Arm Cable Row", "1", 2, "10-12", "1-2", ISO),
    E("Face Pull", "1", 2, "12-15", "1-2", ISO),
    E("Rear Delt Fly", "1", 2, "12-15", "1-2", ISO),
    E("Preacher Curl", "1", 2, "8-12", "1-2", ISO),
    E("Hammer Curl", "1", 2, "10-12", "1-2", DROP),
  ] },
  { key: "sat", short: "Day 6", title: "Legs + Glutes", kind: "PPL · 8-12 reps", exercises: [
    E("Leg Press (90° max)", "2", 3, "8-12", "2-3", "Knee angle no deeper than 90°. " + MAIN),
    E("Hip Thrust", "1-2", 2, "8-12", "2-3", MAIN),
    E("Seated Leg Curl", "1", 3, "10-12", "1-2", ISO),
    E("Glute Machine", "1", 2, "10-15", "1-2", ISO),
    E("Cable Glute Kickback", "1", 2, "10-15", "1-2", "Stable pelvis; controlled, pain-free range. " + ISO),
    E("Leg Extension", "1", 2, "10-12", "1-2", DROP),
    E("Seated Calf Raise", "1", 3, "12-15", "1-2", ISO),
    E("Cable Crunch", "1", 2, "10-15", "1-2", ISO),
  ] },
  { key: "sun", short: "Day 7", title: "Off", kind: "Recovery", exercises: [] },
];

// Editable copy of the plan. Each exercise gets a stable id so logs survive edits and re-ordering.
const DEFAULT_PLAN = DAYS.map((d) => ({
  ...d,
  exercises: d.exercises.map((e, i) => ({ ...e, id: `${d.key}-${i}` })),
}));

const WEEKS = [
  ...[1, 2, 3].map((w) => ({ w, phase: "Establish", intensity: "Main lifts 2-3 reps short of failure", sets: "As planned", load: "Find repeatable loads, clean technique", deload: false })),
  ...[4, 5].map((w) => ({ w, phase: "Progress", intensity: "Main 1-3 reps short, isolation 0-2", sets: "As planned", load: "Double progression: reps first, then smallest load jump", deload: false })),
  { w: 6, phase: "Deload", intensity: "No failure, 3+ reps short", sets: "1 per exercise", load: "Same weights, fewer sets", deload: true },
  ...[7, 8, 9].map((w) => ({ w, phase: "Build", intensity: "Main 1-3 reps short, isolation 0-2", sets: "As planned", load: "Keep progressing; intensifiers selectively", deload: false })),
  ...[10, 11, 12].map((w) => ({ w, phase: "Consolidate", intensity: "Same effort, respond to fatigue", sets: "As planned (cut a set if run down)", load: "Progress where possible, no forced PRs", deload: false })),
  { w: 13, phase: "Review", intensity: "No failure, no max testing", sets: "1 per exercise", load: "Reduce fatigue, review logs, plan next block", deload: true },
];

const RULES = [
  ["Intensity", "Main lifts: stop with 1-3 good reps left. Isolation: 0-2 reps left."],
  ["Drop sets", "Optional, on 1-2 isolation exercises per session at most."],
  ["Rest-pause", "Optional. Never on demanding compound lifts."],
  ["Rest", "Compounds 2-3 min or longer when needed. Isolation 1-2 min."],
  ["Progression", "Double progression: build to the top of the rep range on every working set, then add the smallest practical load and repeat."],
  ["Joints", "Stay in pain-free ranges. Leg press no deeper than 90° at the knee. Skip anything that aggravates your neck or shoulders and follow your clinician's rehab guidance."],
  ["Warm-up", "Ramp-up sets on the first exercise per muscle, 1 light set on the rest."],
  ["Tracking", "Log every set, plus morning weight, sleep, soreness and fatigue on the Body tab."],
  ["Deload", "Cut sets and avoid failure. If performance drops 2 weeks in a row, deload early."],
];

/* ---------- HELPERS ---------- */

// Saves state to localStorage (works in your own project; silently falls back to memory where blocked).
function usePersist(key, init) {
  const make = () => (typeof init === "function" ? init() : init);
  const [v, setV] = useState(() => {
    const fallback = make();
    try {
      const raw = window.localStorage.getItem("hit:" + key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const compatible = Array.isArray(fallback)
        ? Array.isArray(parsed)
        : fallback !== null && typeof fallback === "object"
          ? parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
          : typeof parsed === typeof fallback;
      return compatible ? parsed : fallback;
    } catch { return fallback; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("hit:" + key, JSON.stringify(v)); } catch { /* browser storage may be blocked or full */ }
  }, [key, v]);
  return [v, setV];
}
const clean = (v) => (/^\d{0,3}([.,]\d{0,2})?$/.test(v) ? v : null); // numeric input only
const dateHasLogs = (log, di) => Object.keys(log).some((k) => k.startsWith(di + "-"));
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------- DATES ---------- */

// Day 1 of week 1 is Sat 10 Oct 2026. Each 7-day week runs Day 1 to Day 7 (off).
// 13 weeks = 3 months: week 13 ends Fri 8 Jan 2027.
const DEFAULT_PROGRAM_START = new Date(2026, 9, 10);
const DEFAULT_PROGRAM_START_ISO = "2026-10-10";
const DAY_MS = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / DAY_MS);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const wd = (d) => d.toLocaleDateString("en-GB", { weekday: "short" });
const dateFromISO = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(DEFAULT_PROGRAM_START);
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : new Date(DEFAULT_PROGRAM_START);
};
const weekFor = (d, start = DEFAULT_PROGRAM_START) => Math.min(WEEKS.length, Math.max(1, Math.floor(dayDiff(d, start) / 7) + 1));
const dayIdxFor = (d, start = DEFAULT_PROGRAM_START) => Math.min(6, Math.max(0, ((dayDiff(d, start) % 7) + 7) % 7));
const weekStart = (w, start = DEFAULT_PROGRAM_START) => addDays(start, (w - 1) * 7);
const TOTAL_DAYS = WEEKS.length * 7;
const DEFAULT_ASSIGN = Array.from({ length: TOTAL_DAYS }, (_, i) => i % 7); // date index -> workout index

/* ---------- STYLES ---------- */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
.hit { --bg:#E9ECEF; --panel:#F8F9FA; --ink:#16202C; --mute:#5B6673; --line:#C9CFD6; --accent:#2848E0; --accent-soft:#DDE3FB; --ok:#1F7A4D; --ok-soft:#D7EEDF;
  font-family:'IBM Plex Sans',system-ui,sans-serif; background:var(--bg); color:var(--ink); min-height:100vh; padding:16px; box-sizing:border-box; }
.hit *, .hit *::before, .hit *::after { box-sizing:border-box; }
.hit .wrap { max-width:760px; margin:0 auto; }
.hit h1 { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:34px; line-height:1.05; margin:0 0 4px; letter-spacing:.2px; }
.hit .sub { color:var(--mute); font-size:14px; margin:0 0 16px; }
.hit .nav { overflow-x:auto; white-space:nowrap; display:flex; gap:4px; border-bottom:2px solid var(--line); margin-bottom:16px; }
.hit .nav button { background:none; border:0; min-height:44px; padding:10px 14px; font:600 15px 'IBM Plex Sans',sans-serif; color:var(--mute); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; }
.hit .nav button[aria-selected="true"] { color:var(--ink); border-bottom-color:var(--accent); }
.hit button:focus-visible, .hit input:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
.hit .strip { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-bottom:14px; }
.hit .strip button { min-height:58px; border:1px solid var(--line); background:var(--panel); border-radius:6px; padding:8px 2px 7px; cursor:pointer; font:500 13px 'IBM Plex Sans',sans-serif; color:var(--ink); }
.hit .strip button b { display:block; font:700 17px 'Barlow Condensed',sans-serif; }
.hit .strip button[aria-pressed="true"] { background:var(--ink); color:#fff; border-color:var(--ink); }
.hit .strip button small { display:block; font-size:11px; opacity:.75; }
.hit .strip button[data-today="true"] { border-color:var(--accent); box-shadow:inset 0 0 0 1px var(--accent); }
.hit .strip button .bar { display:block; height:3px; margin:5px 8px 0; background:var(--line); border-radius:2px; overflow:hidden; }
.hit .strip button .bar i { display:block; height:100%; background:var(--ok); }
.hit .head { display:flex; justify-content:space-between; align-items:baseline; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
.hit .head h2 { font:700 26px 'Barlow Condensed',sans-serif; margin:0; }
.hit .head span { color:var(--mute); font-size:14px; }
.hit .banner { background:var(--accent-soft); border-left:4px solid var(--accent); padding:10px 12px; font-size:14px; margin-bottom:12px; border-radius:0 6px 6px 0; }
.hit .ex { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:12px; margin-bottom:10px; }
.hit .ex.complete { border-color:var(--ok); background:#F3FAF6; }
.hit .ex h3 { font:600 17px 'IBM Plex Sans',sans-serif; margin:0 0 2px; }
.hit .meta { font-size:13px; color:var(--mute); margin-bottom:8px; }
.hit .meta strong { color:var(--ink); font-weight:600; }
.hit .setrow { display:grid; grid-template-columns:54px 1fr 1fr 44px; gap:8px; align-items:center; margin-top:6px; }
.hit .setrow label { font-size:13px; color:var(--mute); }
.hit .setrow input { width:100%; min-width:0; padding:8px; font:500 16px 'IBM Plex Sans',sans-serif; border:1px solid var(--line); border-radius:6px; background:#fff; color:var(--ink); }
.hit .setrow button { height:38px; border:1px solid var(--line); background:#fff; border-radius:6px; cursor:pointer; font:600 16px sans-serif; color:var(--mute); }
.hit .setrow button[aria-pressed="true"] { background:var(--ok); border-color:var(--ok); color:#fff; }
.hit .colhint { display:grid; grid-template-columns:54px 1fr 1fr 44px; gap:8px; font-size:12px; color:var(--mute); }
.hit .rest { text-align:center; padding:36px 12px; color:var(--mute); }
.hit table { width:100%; border-collapse:collapse; background:var(--panel); border:1px solid var(--line); border-radius:8px; overflow:hidden; font-size:14px; }
.hit th, .hit td { text-align:left; padding:9px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
.hit th { background:var(--ink); color:#fff; font-weight:600; font-size:13px; }
.hit tr.deload td { background:var(--accent-soft); }
.hit tr.cur td { box-shadow:inset 0 2px 0 var(--accent), inset 0 -2px 0 var(--accent); font-weight:600; }
.hit .scroll { overflow-x:auto; }
.hit .weekpick { display:flex; align-items:center; gap:10px; margin-bottom:12px; font-size:14px; }
.hit .weekpick input[type=range] { flex:1; accent-color:var(--accent); }
.hit dl { margin:0; }
.hit dt { font-weight:600; margin-top:12px; }
.hit dd { margin:2px 0 0; color:var(--mute); font-size:14px; }
.hit .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
.hit .field label { display:block; font-size:13px; color:var(--mute); margin-bottom:4px; }
.hit .field input { width:100%; padding:10px; font:500 16px 'IBM Plex Sans',sans-serif; border:1px solid var(--line); border-radius:6px; background:#fff; }
.hit .tot { font-weight:700; }
.hit .note { font-size:13px; color:var(--mute); margin-top:10px; }
.hit .stat { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:12px; margin-bottom:10px; font-size:14px; }
.hit .seg { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:10px; }
.hit .seg button { border:1px solid var(--line); background:var(--panel); border-radius:999px; padding:6px 12px; font:500 13px 'IBM Plex Sans',sans-serif; cursor:pointer; color:var(--ink); }
.hit .seg button[aria-pressed="true"] { background:var(--ink); color:#fff; border-color:var(--ink); }
.hit .ctl { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
.hit .ctl .field { flex:1; min-width:130px; }
.hit .ctl select { width:100%; padding:9px; font:500 14px 'IBM Plex Sans',sans-serif; border:1px solid var(--line); border-radius:6px; background:#fff; color:var(--ink); }
.hit .chips { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
.hit .chip { display:inline-flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); border-radius:999px; padding:4px 6px 4px 10px; font-size:13px; }
.hit .chip i { width:10px; height:10px; border-radius:50%; display:inline-block; }
.hit .chip button { border:0; background:none; cursor:pointer; font-size:15px; line-height:1; color:var(--mute); padding:0 4px; }
.hit .chart { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:8px; margin-bottom:12px; }
.hit .chart svg { width:100%; height:auto; display:block; }
.hit .chart text { font-family:'IBM Plex Sans',sans-serif; fill:var(--mute); font-size:11px; }
.hit .cmp { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:12px; }
.hit .cmp .row { margin-bottom:12px; }
.hit .cmp .row:last-child { margin-bottom:0; }
.hit .cmp .nm { display:flex; justify-content:space-between; font-size:14px; font-weight:600; margin-bottom:4px; gap:8px; }
.hit .cmp .nm span { font-weight:600; font-size:13px; }
.hit .cmp .up { color:var(--ok); } .hit .cmp .down { color:#B3261E; } .hit .cmp .flat { color:var(--mute); }
.hit .bar2 { display:flex; align-items:center; gap:8px; margin-bottom:3px; font-size:12px; color:var(--mute); }
.hit .bar2 .lab { width:42px; flex:none; }
.hit .bar2 .track { flex:1; background:#E3E7EB; border-radius:3px; height:16px; overflow:hidden; }
.hit .bar2 .fill { height:100%; border-radius:3px; }
.hit .bar2 .val { width:56px; flex:none; text-align:right; color:var(--ink); font-weight:600; }
.hit .empty { background:var(--panel); border:1px dashed var(--line); border-radius:8px; padding:20px 14px; text-align:center; color:var(--mute); margin-bottom:12px; font-size:14px; }
.hit .btnrow { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
.hit .btn { border:1px solid var(--ink); background:var(--ink); color:#fff; border-radius:6px; padding:8px 12px; font:600 13px 'IBM Plex Sans',sans-serif; cursor:pointer; }
.hit .btn.ghost { background:transparent; color:var(--ink); }
.hit .month { margin-bottom:18px; }
.hit .month h3 { font:700 22px 'Barlow Condensed',sans-serif; margin:0 0 6px; }
.hit .cal { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
.hit .cal .dow { font-size:11px; color:var(--mute); text-align:center; padding-bottom:2px; }
.hit .cell { position:relative; min-height:54px; border:1px solid transparent; border-radius:5px; padding:3px 2px; font:500 10px 'IBM Plex Sans',sans-serif; text-align:center; background:transparent; color:var(--ink); }
.hit button.cell { cursor:pointer; }
.hit .cell .n { display:block; font-size:12px; font-weight:600; line-height:1.1; }
.hit .cell .lb { display:block; margin-top:3px; line-height:1.15; }
.hit .cell .wk { position:absolute; top:1px; left:3px; font-size:9px; color:var(--mute); font-weight:600; }
.hit .cell.arn { background:var(--accent-soft); }
.hit .cell.ppl { background:var(--ok-soft); }
.hit .cell.off { background:#DDE0E4; color:var(--mute); }
.hit .cell.out { color:#AEB5BD; }
.hit .cell.dl { border:1.5px dashed var(--accent); }
.hit .cell.today { border:2px solid var(--ink); }
.hit .cell.sel { box-shadow:0 0 0 2px var(--accent); }
.hit .legend { display:flex; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--mute); margin-bottom:12px; }
.hit .legend i { display:inline-block; width:12px; height:12px; border-radius:3px; margin-right:5px; vertical-align:-2px; }
.hit .fgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:8px; }
.hit .fgrid .wide { grid-column:span 4; }
.hit .tools { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
.hit .lock { background:#FFF4D6; border-left:4px solid #B08900; padding:10px 12px; font-size:14px; margin-bottom:12px; border-radius:0 6px 6px 0; }
.hit .cell.mv { box-shadow:0 0 0 3px #D9480F; }
.hit .jump { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
.hit .move { display:flex; gap:10px; align-items:center; flex-wrap:wrap; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:8px 10px; margin-bottom:12px; font-size:13px; }
.hit .move select { padding:7px; font:500 13px 'IBM Plex Sans',sans-serif; border:1px solid var(--line); border-radius:6px; background:#fff; }
.hit .sample { background:#FFE8D6; border-left:4px solid #D9480F; padding:10px 12px; font-size:14px; margin-bottom:12px; border-radius:0 6px 6px 0; }
.hit .bodyform { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px; }
.hit .bodyform select, .hit .bodyform input { width:100%; padding:9px; font:500 14px 'IBM Plex Sans',sans-serif; border:1px solid var(--line); border-radius:6px; background:#fff; }
@media (max-width:480px) { .hit .fgrid { grid-template-columns:repeat(2,1fr); } .hit .fgrid .wide { grid-column:span 2; } }
@media (max-width:480px) { .hit { padding: max(12px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom)); } .hit h1 { font-size:28px; } .hit .setrow { grid-template-columns:44px minmax(0,1fr) minmax(0,1fr) 42px; gap:6px; } .hit .nav button { padding:10px 11px; } .hit .bodyform { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (prefers-reduced-motion: reduce) { .hit * { transition:none !important; animation:none !important; } }
`;

/* ---------- COMPONENTS ---------- */

function Workout({ week, log, setLog, pos, setPos, assign, setAssign, plan, setPlan, canEdit, skipped, setSkipped, programStart }) {
  const [applyAll, setApplyAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const today = useMemo(() => new Date(), []);
  const wkStart = weekStart(week, programStart);
  const base = (week - 1) * 7;
  const dayIdx = assign[base + pos]; // which workout is scheduled on the selected date
  const day = plan[dayIdx];

  // Swap the workout on the selected date with another date of the same week (optionally every later week too).
  // Put any workout (or rest = 6) on the selected date, optionally on the same weekday of every later week.
  const setWorkout = (wi) => {
    if (dateHasLogs(log, base + pos)) { window.alert("This day already has logged sets, so its workout can't be changed."); return; }
    setAssign((a) => {
      const n = [...a];
      const lastWeek = applyAll ? WEEKS.length : week;
      for (let w = week; w <= lastWeek; w++) { const idx = (w - 1) * 7 + pos; if (!dateHasLogs(log, idx)) n[idx] = wi; }
      return n;
    });
    setEditing(false);
  };

  const moveTo = (target) => {
    if (target === pos) return;
    if (dateHasLogs(log, base + pos) || dateHasLogs(log, base + target)) { window.alert("One of these days has logged sets, so it can't be moved."); return; }
    setAssign((a) => {
      const n = [...a];
      const lastWeek = applyAll ? WEEKS.length : week;
      for (let w = week; w <= lastWeek; w++) {
        const b = (w - 1) * 7;
        if (dateHasLogs(log, b + pos) || dateHasLogs(log, b + target)) continue;
        [n[b + pos], n[b + target]] = [n[b + target], n[b + pos]];
      }
      return n;
    });
    setPos(target);
  };
  const wk = WEEKS[week - 1];

  const keyOf = (d, e, s) => `${base + pos}-${plan[d].exercises[e]?.id}-${s}`; // keyed by calendar date, so reschedules never mix logs
  const get = (d, e, s) => log[keyOf(d, e, s)] || { kg: "", reps: "", done: false };
  const set = (d, e, s, patch) =>
    setLog((p) => ({ ...p, [keyOf(d, e, s)]: { ...get(d, e, s), ...patch, ...(patch.done ? { at: new Date().toISOString() } : {}) } }));

  const setsFor = (ex) => (wk.deload ? 1 : ex.sets);

  const progress = (p) => {
    const wi = assign[base + p];
    let total = 0, done = 0;
    plan[wi].exercises.forEach((ex) => {
      for (let q = 0; q < setsFor(ex); q++) { total++; if (log[`${base + p}-${ex.id}-${q}`]?.done) done++; }
    });
    return total ? done / total : 0;
  };

  return (
    <div>
      <div className="strip" role="group" aria-label="Training day">
        {[0, 1, 2, 3, 4, 5, 6].map((p) => {
          const wi = assign[base + p];
          return (
            <button
              key={p} aria-pressed={p === pos} data-today={dayDiff(today, addDays(wkStart, p)) === 0}
              onClick={() => setPos(p)}
            >
              <b>{wd(addDays(wkStart, p))}</b>
              <small>{fmt(addDays(wkStart, p))}</small>
              <small>{skipped[base + p] ? "Skipped" : wi === 6 ? "Off" : plan[wi].title}</small>
              <span className="bar"><i style={{ width: `${progress(p) * 100}%` }} /></span>
            </button>
          );
        })}
      </div>

      <div className="head">
        <h2>{day.title}</h2>
        <span>{day.kind}</span>
      </div>

      <div className="move">
        <label htmlFor="wf">Workout for this day</label>
        <select id="wf" value={dayIdx} onChange={(e) => setWorkout(+e.target.value)}>
          {plan.slice(0, 6).map((d, i) => (
            <option key={d.key} value={i}>{d.short}: {d.title}</option>
          ))}
          <option value={6}>Rest day</option>
        </select>
        <button className="btn ghost" onClick={() => setWorkout(6)} disabled={dayIdx === 6}>Make rest day</button>
      </div>
      <div className="move">
        <label htmlFor="mv">Swap with</label>
        <select id="mv" value={pos} onChange={(e) => moveTo(+e.target.value)}>
          {[0, 1, 2, 3, 4, 5, 6].map((p) => (
            <option key={p} value={p}>{wd(addDays(wkStart, p))} {fmt(addDays(wkStart, p))}</option>
          ))}
        </select>
        <label><input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} /> apply to this weekday in every later week too</label>
      </div>
      {dayIdx !== 6 && (
        <div className="btnrow">
          <button className="btn ghost" onClick={() => setSkipped((k) => ({ ...k, [base + pos]: !k[base + pos] }))}>
            {skipped[base + pos] ? "Undo skipped" : "Mark session skipped"}
          </button>
        </div>
      )}
      {canEdit ? (
        <div className="btnrow">
          <button className="btn ghost" onClick={() => setEditing(!editing)}>
            {editing ? "Done editing" : "Edit plan"}
          </button>
        </div>
      ) : (
        <div className="lock">
          Plan is locked while week 1 runs. Editing unlocks after the first 7 days finish
          ({fmt(addDays(programStart, 6))}) or once every week-1 set is marked done.
        </div>
      )}
      {editing && <EditPanel dayIdx={dayIdx} plan={plan} setPlan={setPlan} />}
      <div className="banner">
        Week {week}, {wk.phase}: {wk.intensity}. Sets: {wk.sets}. Load: {wk.load}.
      </div>
      <div className="stat"><b>Glute priority:</b> 11 direct working sets per normal week (Hip Thrust, Glute Machine and Cable Glute Kickback). Deload weeks reduce this volume to 1 set per exercise.</div>

      {!editing && day.exercises.length === 0 && (
        <div className="rest">Rest day. Walk, stretch, sleep 7-9 hours.</div>
      )}

      {!editing && day.exercises.map((ex, ei) => {
        const n = setsFor(ex);
        let doneCount = 0;
        for (let s = 0; s < n; s++) if (get(dayIdx, ei, s).done) doneCount++;
        return (
          <section key={ex.name + ei} className={"ex" + (doneCount === n ? " complete" : "")}>
            <h3>{ex.name}</h3>
            <div className="meta">
              <strong>{n} × {ex.reps}</strong> · warm-up {ex.warm} · rest {ex.rest} min · {ex.note}
            </div>
            <div className="colhint"><span /><span>kg</span><span>reps</span><span /></div>
            {Array.from({ length: n }).map((_, s) => {
              const v = get(dayIdx, ei, s);
              return (
                <div className="setrow" key={s}>
                  <label>Set {s + 1}</label>
                  <input
                    inputMode="decimal" aria-label={`${ex.name} set ${s + 1} weight in kilograms`}
                    value={v.kg} onChange={(e) => { const c = clean(e.target.value); if (c !== null) set(dayIdx, ei, s, { kg: c }); }}
                  />
                  <input
                    inputMode="numeric" aria-label={`${ex.name} set ${s + 1} reps`}
                    value={v.reps} onChange={(e) => { const c = clean(e.target.value); if (c !== null) set(dayIdx, ei, s, { reps: c }); }}
                  />
                  <button
                    aria-pressed={v.done} aria-label={`Mark ${ex.name} set ${s + 1} done`}
                    onClick={() => set(dayIdx, ei, s, { done: !v.done })}
                  >
                    {v.done ? "✓" : ""}
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}
      <p className="note">Entries are saved in this browser when local storage is available. They do not sync across devices or browsers. Use History → Export data for a backup, and export regularly.</p>
    </div>
  );
}

function Progression({ week, setWeek, programStart }) {
  return (
    <div>
      <div className="weekpick">
        <label htmlFor="wk">Current week: <b>{week}</b></label>
        <input id="wk" type="range" min="1" max={WEEKS.length} value={week} onChange={(e) => setWeek(+e.target.value)} />
      </div>
      <div className="scroll">
        <table>
          <thead>
            <tr><th>Wk</th><th>Dates</th><th>Phase</th><th>Intensity</th><th>Sets</th><th>Load</th></tr>
          </thead>
          <tbody>
            {WEEKS.map((r) => (
              <tr key={r.w} className={(r.deload ? "deload " : "") + (r.w === week ? "cur" : "")}>
                <td>{r.w}</td><td>{fmt(weekStart(r.w, programStart))}-{fmt(addDays(weekStart(r.w, programStart), 6))}</td><td>{r.phase}</td><td>{r.intensity}</td><td>{r.sets}</td><td>{r.load}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl>
        {RULES.map(([t, d]) => (
          <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
        ))}
      </dl>
    </div>
  );
}

function Nutrition() {
  const [bw, setBw] = usePersist("bw", 82.9);
  const [kcal, setKcal] = usePersist("kcal", 3500);
  const p = [Math.round(bw * 1.8), Math.round(bw * 2.2)];
  const f = [Math.round(bw * 0.8), Math.round(bw * 1.0)];
  const carbs = Math.max(0, Math.round((kcal - ((p[0] + p[1]) / 2) * 4 - ((f[0] + f[1]) / 2) * 9) / 4));
  return (
    <div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="bw">Body weight (kg)</label>
          <input id="bw" type="number" min="30" max="250" step="0.1" value={bw} onChange={(e) => setBw(Math.min(250, Math.max(30, +e.target.value || 30)))} />
        </div>
        <div className="field">
          <label htmlFor="kc">Daily calorie target</label>
          <input id="kc" type="number" min="1200" max="6000" step="50" value={kcal} onChange={(e) => setKcal(Math.min(6000, Math.max(1200, +e.target.value || 1200)))} />
        </div>
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th>Macro</th><th>Target</th></tr></thead>
          <tbody>
            <tr><td>Protein</td><td>{p[0]}-{p[1]} g (1.8-2.2 g/kg)</td></tr>
            <tr><td>Fat</td><td>{f[0]}-{f[1]} g (0.8-1.0 g/kg)</td></tr>
            <tr><td>Carbohydrate</td><td>About {carbs} g: fills the remaining calories</td></tr>
          </tbody>
        </table>
      </div>
      <div className="stat">Starting weight-gain target: <b>0.08-0.21 kg/week</b>.</div>
      <div className="stat">The calorie figure is a starting estimate, not a validated maintenance or surplus target. Adjust it from your 7-day average weight trend on the Body tab.</div>
      <div className="stat">Also track morning weight, sleep, appetite, training performance and waist. Fast weight gain without better performance isn't necessarily helping.</div>
    </div>
  );
}

/* ---------- EDIT PANEL ---------- */

function EditPanel({ dayIdx, plan, setPlan }) {
  const day = plan[dayIdx];
  if (dayIdx === 6) return <div className="empty">Day 7 is the off day. Edit Days 1-6.</div>;

  const patchDay = (fn) => setPlan(plan.map((d, i) => (i === dayIdx ? fn(d) : d)));
  const patchEx = (id, patch) =>
    patchDay((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const move = (i, dir) =>
    patchDay((d) => {
      const a = [...d.exercises], j = i + dir;
      if (j < 0 || j >= a.length) return d;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...d, exercises: a };
    });
  const remove = (id) => patchDay((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) }));
  const add = () =>
    patchDay((d) => ({
      ...d,
      exercises: [...d.exercises, { id: `x${Date.now()}`, name: "New exercise", warm: "1", sets: 2, reps: "8-12", rest: "2", note: "Failure" }],
    }));

  return (
    <div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label htmlFor="dt">Workout name (Day {dayIdx + 1})</label>
        <input id="dt" value={day.title} onChange={(e) => patchDay((d) => ({ ...d, title: e.target.value }))} />
      </div>
      {day.exercises.map((ex, i) => (
        <section className="ex" key={ex.id}>
          <div className="fgrid">
            <div className="field wide">
              <label>Exercise</label>
              <input value={ex.name} onChange={(e) => patchEx(ex.id, { name: e.target.value })} aria-label="Exercise name" />
            </div>
            <div className="field">
              <label>Sets</label>
              <input type="number" min="1" max="5" value={ex.sets}
                onChange={(e) => patchEx(ex.id, { sets: Math.min(5, Math.max(1, +e.target.value || 1)) })} />
            </div>
            <div className="field">
              <label>Reps</label>
              <input value={ex.reps} onChange={(e) => patchEx(ex.id, { reps: e.target.value })} />
            </div>
            <div className="field">
              <label>Rest (min)</label>
              <input value={ex.rest} onChange={(e) => patchEx(ex.id, { rest: e.target.value })} />
            </div>
            <div className="field">
              <label>Warm-up sets</label>
              <input value={ex.warm} onChange={(e) => patchEx(ex.id, { warm: e.target.value })} />
            </div>
            <div className="field wide">
              <label>Note / intensifier</label>
              <input value={ex.note} onChange={(e) => patchEx(ex.id, { note: e.target.value })} />
            </div>
          </div>
          <div className="tools">
            <button className="btn ghost" onClick={() => move(i, -1)} disabled={i === 0}>Move up</button>
            <button className="btn ghost" onClick={() => move(i, 1)} disabled={i === day.exercises.length - 1}>Move down</button>
            <button className="btn ghost" onClick={() => window.confirm(`Delete ${ex.name}?`) && remove(ex.id)}>Delete</button>
          </div>
        </section>
      ))}
      <div className="btnrow">
        <button className="btn" onClick={add}>Add exercise</button>
        <button className="btn ghost" onClick={() => window.confirm("Reset the whole plan to the original?") && setPlan(DEFAULT_PLAN)}>Reset plan to original</button>
      </div>
      <p className="note">Edits apply to every week. Logged sets stay attached to their exercise. Keep exercises pain-free and consistent with your clinician’s restrictions.</p>
    </div>
  );
}

/* ---------- PROGRESS (charts) ---------- */

const PALETTE = ["#2848E0", "#D9480F", "#1F7A4D", "#AE3EC9", "#0B7285", "#B08900"];
const METRICS = {
  kg: { label: "Weight (kg)", unit: "kg" },
  reps: { label: "Reps", unit: "reps" },
  vol: { label: "Volume (kg × reps)", unit: "kg" },
};
const MAX_SETS = 5;
const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Value for one exercise in one week. kg = heaviest set, reps = most reps in a set, vol = total kg × reps.
function statFor(log, plan, assign, name, week, metric, dayFilter) {
  let best = null, vol = 0, any = false;
  for (let p = 0; p < 7; p++) {
    const di = (week - 1) * 7 + p, wi = assign[di];
    if (dayFilter !== "all" && wi !== dayFilter) continue;
    plan[wi].exercises.forEach((ex) => {
      if (ex.name !== name) return;
      for (let s = 0; s < MAX_SETS; s++) {
        const v = log[`${di}-${ex.id}-${s}`];
        if (!v) continue;
        const kg = num(v.kg), reps = num(v.reps);
        if (metric === "kg" && kg) { best = Math.max(best ?? 0, kg); any = true; }
        if (metric === "reps" && reps) { best = Math.max(best ?? 0, reps); any = true; }
        if (metric === "vol" && kg && reps) { vol += kg * reps; any = true; }
      }
    });
  }
  if (!any) return null;
  return metric === "vol" ? Math.round(vol) : best;
}

// Illustrative data for previewing charts only. It is never merged into your real logs.
function sampleLog(plan, assign) {
  const out = {};
  for (let w = 1; w <= 8; w++) {
    for (let p = 0; p < 7; p++) {
      const di = (w - 1) * 7 + p;
      plan[assign[di]].exercises.forEach((ex) => {
        const h = [...ex.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 10;
        const base = 20 + h * 6;
        const [lo0, hi0] = ex.reps.split("-").map(Number);
        const lo = lo0 || 8, top = hi0 || lo;
        const deload = WEEKS[w - 1].deload;
        for (let s = 0; s < ex.sets; s++) {
          const kg = Math.round((base * (1 + 0.02 * (w - 1)) * (deload ? 0.9 : 1)) / 2.5) * 2.5;
          const reps = Math.max(lo, Math.min(top, lo + ((w + h + s) % (top - lo + 1))));
          out[`${di}-${ex.id}-${s}`] = { kg: String(kg), reps: String(reps), done: true };
        }
      });
    }
  }
  return out;
}

function LineChart({ series, metric }) {
  const W = 640, H = 280, L = 44, R = 12, T = 12, B = 30;
  const vals = series.flatMap((s) => s.points.filter((p) => p.v != null).map((p) => p.v));
  const max = Math.max(1, ...vals) * 1.1;
  const x = (w) => L + ((w - 1) / (WEEKS.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${METRICS[metric].label} by week`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#D5DAE0" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {WEEKS.map((wk) => (
        <g key={wk.w}>
          {wk.deload && <rect x={x(wk.w) - 10} y={T} width="20" height={H - T - B} fill="#DDE3FB" opacity=".6" />}
          <text x={x(wk.w)} y={H - 10} textAnchor="middle">{wk.w}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 0} textAnchor="middle">Week (shaded = deload)</text>
      {series.map((s, i) => {
        const pts = s.points.filter((p) => p.v != null);
        return (
          <g key={s.name}>
            <polyline fill="none" stroke={PALETTE[i % 6]} strokeWidth="2.5" strokeLinejoin="round"
              points={pts.map((p) => `${x(p.w)},${y(p.v)}`).join(" ")} />
            {pts.map((p) => (
              <circle key={p.w} cx={x(p.w)} cy={y(p.v)} r="4" fill="#fff" stroke={PALETTE[i % 6]} strokeWidth="2.5">
                <title>{`${s.name}, week ${p.w}: ${p.v} ${METRICS[metric].unit}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function Progress({ log, setLog, week, plan, assign }) {
  const [useSample, setUseSample] = useState(false);
  const data = useSample ? sampleLog(plan, assign) : log;
  const ALL_NAMES = useMemo(() => [...new Set(plan.flatMap((d) => d.exercises.map((e) => e.name)))], [plan]);
  const [metric, setMetric] = useState("kg");
  const [mode, setMode] = useState("trend");
  const [dayFilter, setDayFilter] = useState("all");
  const [picked, setPicked] = useState(["Neutral-Grip Machine Press", "Chest-Supported Row", "Hip Thrust"]);
  const [wa, setWa] = useState(1);
  const [wb, setWb] = useState(Math.max(2, week));

  const hasData = Object.keys(data).length > 0;
  const names = dayFilter === "all"
    ? ALL_NAMES
    : plan[dayFilter].exercises.map((e) => e.name);
  useEffect(() => {
    setPicked((prev) => {
      const valid = prev.filter((n) => names.includes(n));
      return valid.length ? valid : names.slice(0, Math.min(3, names.length));
    });
  }, [names.join("|")]);
  const shown = mode === "trend" ? picked.filter((n) => names.includes(n)) : names;

  const series = shown.map((n) => ({
    name: n,
    points: WEEKS.map((wk) => ({ w: wk.w, v: statFor(data, plan, assign, n, wk.w, metric, dayFilter) })),
  }));

  const rows = names
    .map((n) => ({ n, a: statFor(data, plan, assign, n, wa, metric, dayFilter), b: statFor(data, plan, assign, n, wb, metric, dayFilter) }))
    .filter((r) => r.a != null || r.b != null);
  const cmpMax = Math.max(1, ...rows.flatMap((r) => [r.a ?? 0, r.b ?? 0]));
  const unit = METRICS[metric].unit;

  return (
    <div>
      <div className="seg" role="group" aria-label="Metric">
        {Object.entries(METRICS).map(([k, m]) => (
          <button key={k} aria-pressed={metric === k} onClick={() => setMetric(k)}>{m.label}</button>
        ))}
      </div>
      <div className="seg" role="group" aria-label="View">
        <button aria-pressed={mode === "trend"} onClick={() => setMode("trend")}>Trend by week</button>
        <button aria-pressed={mode === "compare"} onClick={() => setMode("compare")}>Compare two weeks</button>
      </div>

      <div className="ctl">
        <div className="field">
          <label htmlFor="pf">Workout</label>
          <select id="pf" value={dayFilter} onChange={(e) => setDayFilter(e.target.value === "all" ? "all" : +e.target.value)}>
            <option value="all">All workouts</option>
            {plan.slice(0, 6).map((d, i) => (
              <option key={d.key} value={i}>{d.short}: {d.title}</option>
            ))}
          </select>
        </div>
        {mode === "trend" ? (
          <div className="field">
            <label htmlFor="pe">Add exercise</label>
            <select id="pe" value="" onChange={(e) => e.target.value && picked.length < 6 && !picked.includes(e.target.value) && setPicked([...picked, e.target.value])}>
              <option value="">Choose…</option>
              {names.filter((n) => !picked.includes(n)).map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="wa">Week A</label>
              <select id="wa" value={wa} onChange={(e) => setWa(+e.target.value)}>
                {WEEKS.map((k) => <option key={k.w} value={k.w}>Week {k.w}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="wb">Week B</label>
              <select id="wb" value={wb} onChange={(e) => setWb(+e.target.value)}>
                {WEEKS.map((k) => <option key={k.w} value={k.w}>Week {k.w}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="btnrow">
        <button className="btn" onClick={() => setUseSample(!useSample)}>{useSample ? "Back to my data" : "Preview sample data"}</button>
        {!useSample && Object.keys(log).length > 0 && (
          <button className="btn ghost" onClick={() => window.confirm("Delete ALL logged sets? This can't be undone.") && setLog({})}>Clear all logs</button>
        )}
      </div>
      {useSample && <div className="sample">SAMPLE DATA: illustrative numbers, not your logs. Your real logs are untouched.</div>}

      {!hasData && (
        <div className="empty">
          No sets logged yet. Enter kg and reps on the Workout tab, or preview sample data.
        </div>
      )}

      {hasData && mode === "trend" && (
        <>
          <div className="chips">
            {series.map((s, i) => (
              <span className="chip" key={s.name}>
                <i style={{ background: PALETTE[i % 6] }} />{s.name}
                <button aria-label={`Remove ${s.name}`} onClick={() => setPicked(picked.filter((n) => n !== s.name))}>×</button>
              </span>
            ))}
          </div>
          {series.length === 0 ? (
            <div className="empty">Add an exercise to see its trend.</div>
          ) : (
            <div className="chart"><LineChart series={series} metric={metric} /></div>
          )}
          <p className="note">
            Weight = heaviest set, reps = most reps in one set, volume = total kg × reps across the week.
            Same-name exercises on different days are combined unless you filter by workout.
          </p>
        </>
      )}

      {hasData && mode === "compare" && (
        <>
          <div className="cmp">
            {rows.length === 0 && <div className="empty">No data for these weeks.</div>}
            {rows.map((r) => {
              const d = r.a != null && r.b != null ? r.b - r.a : null;
              return (
                <div className="row" key={r.n}>
                  <div className="nm">
                    {r.n}
                    {d != null && (
                      <span className={d > 0 ? "up" : d < 0 ? "down" : "flat"}>
                        {d > 0 ? "+" : ""}{Math.round(d * 10) / 10} {unit}
                      </span>
                    )}
                  </div>
                  {[["Wk " + wa, r.a, PALETTE[0]], ["Wk " + wb, r.b, PALETTE[1]]].map(([lab, v, c]) => (
                    <div className="bar2" key={lab + c}>
                      <span className="lab">{lab}</span>
                      <span className="track"><span className="fill" style={{ display: "block", width: `${((v ?? 0) / cmpMax) * 100}%`, background: c }} /></span>
                      <span className="val">{v == null ? "-" : `${v} ${unit}`}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="note">Green = Week B is higher than Week A. Red = lower (expected in deload weeks).</p>
        </>
      )}
    </div>
  );
}

/* ---------- CALENDAR ---------- */

const CAL_CLASS = ["arn", "arn", "arn", "ppl", "ppl", "ppl", "off"];

function CalendarView({ week, onPick, plan, assign, setAssign, log, programStart }) {
  const label = (di) => (di === 6 ? "Off" : plan[di].title);
  const [moveMode, setMoveMode] = useState(false);
  const [sel, setSel] = useState(null);
  const today = useMemo(() => new Date(), []);
  const programEnd = addDays(programStart, TOTAL_DAYS - 1);
  const months = [];
  for (let m = new Date(programStart.getFullYear(), programStart.getMonth(), 1); m <= programEnd; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push(m);

  const tap = (diff, w, pos) => {
    if (!moveMode) return onPick(w, pos);
    if (sel === null) return setSel(diff);
    if (sel !== diff) {
      if (dateHasLogs(log, sel) || dateHasLogs(log, diff)) window.alert("A day with logged sets can't be moved.");
      else setAssign((a) => { const n = [...a]; [n[sel], n[diff]] = [n[diff], n[sel]]; return n; });
    }
    setSel(null);
  };
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="btnrow">
        <button className={moveMode ? "btn" : "btn ghost"} onClick={() => { setMoveMode(!moveMode); setSel(null); }}>
          {moveMode ? "Done moving days" : "Move days"}
        </button>
        <button className="btn ghost" onClick={() => { if (Object.keys(log).length && !window.confirm("Reset the schedule? Logged days keep their logs.")) return; setAssign((a) => a.map((v, i) => (dateHasLogs(log, i) ? v : DEFAULT_ASSIGN[i]))); setSel(null); }}>Reset schedule</button>
      </div>
      {moveMode && (
        <div className="banner">
          {sel === null ? "Tap the day you want to move." : "Now tap the day to swap it with."}
        </div>
      )}
      <div className="jump">
        {months.map((m, i) => (
          <button key={i} className="btn ghost" onClick={() => document.getElementById(`mon-${i}`)?.scrollIntoView({ behavior: "smooth" })}>
            {m.toLocaleDateString("en-GB", { month: "short" })}
          </button>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--accent-soft)" }} />Arnold (Days 1-3)</span>
        <span><i style={{ background: "var(--ok-soft)" }} />PPL (Days 4-6)</span>
        <span><i style={{ background: "#DDE0E4" }} />Off</span>
        <span><i style={{ border: "1.5px dashed var(--accent)" }} />Deload week</span>
      </div>
      {months.map((m) => {
        const first = (m.getDay() + 6) % 7;
        const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < first; i++) cells.push(<div key={"b" + i} />);
        for (let day = 1; day <= count; day++) {
          const date = new Date(m.getFullYear(), m.getMonth(), day);
          const diff = dayDiff(date, programStart);
          const inside = diff >= 0 && diff < TOTAL_DAYS;
          const isToday = dayDiff(date, today) === 0;
          if (!inside) {
            cells.push(
              <div key={day} className={"cell out" + (isToday ? " today" : "")}><span className="n">{day}</span></div>
            );
            continue;
          }
          const w = Math.floor(diff / 7) + 1, pos = diff % 7, di = assign[diff];
          const dl = WEEKS[w - 1].deload;
          cells.push(
            <button
              key={day}
              className={`cell ${CAL_CLASS[di]}${dl ? " dl" : ""}${isToday ? " today" : ""}${w === week ? " sel" : ""}${sel === diff ? " mv" : ""}`}
              onClick={() => tap(diff, w, pos)}
              aria-label={`${wd(date)} ${fmt(date)}, week ${w}: ${label(di)}${dl ? ", deload week" : ""}`}
            >
              {pos === 0 && <span className="wk">W{w}</span>}
              <span className="n">{day}</span>
              <span className="lb">{label(di)}</span>
            </button>
          );
        }
        return (
          <section className="month" key={m.getMonth()} id={`mon-${months.indexOf(m)}`}>
            <h3>{m.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h3>
            <div className="cal">
              {dow.map((x) => <div className="dow" key={x}>{x}</div>)}
              {cells}
            </div>
          </section>
        );
      })}
      <p className="note">
        Weeks run 7 days from the selected start date. Week 1 starts {fmt(programStart)}; week {WEEKS.length} ends {fmt(programEnd)} {programEnd.getFullYear()}.
        Tap a day to open that workout, or use Move days to swap two days.
      </p>
    </div>
  );
}

/* ---------- BODY / RECOVERY ---------- */

function Spark({ series, height = 150 }) {
  const W = 640, H = height, L = 40, R = 10, T = 10, B = 14;
  const all = series.flatMap((s) => s.vals.filter((v) => v != null));
  if (!all.length) return <div className="empty">No data yet.</div>;
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const n = Math.max(...series.map((s) => s.vals.length));
  const x = (i) => L + (n < 2 ? 0 : i / (n - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img">
        {[lo, (lo + hi) / 2, hi].map((t) => (
          <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#D5DAE0" /><text x={L - 5} y={y(t) + 4} textAnchor="end">{t.toFixed(1)}</text></g>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round"
              points={s.vals.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ")} />
            {s.dots && s.vals.map((v, i) => v != null && <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div className="legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>
    </div>
  );
}

function Body({ body, setBody }) {
  const [f, setF] = useState({ date: isoOf(new Date()), weight: "", sleep: "", soreness: "", fatigue: "", kcal: "", waist: "" });
  const rows = [...body].sort((a, b) => a.date.localeCompare(b.date));
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = () => {
    const w = num(f.weight), sl = num(f.sleep), kc = num(f.kcal), wa = num(f.waist);
    if (w && (w < 30 || w > 250)) return window.alert("Weight must be between 30 and 250 kg.");
    if (sl && sl > 16) return window.alert("Sleep must be 16 hours or less.");
    if (kc && (kc < 500 || kc > 8000)) return window.alert("Calories must be between 500 and 8000.");
    if (!f.date || !(w || sl || num(f.soreness) || num(f.fatigue) || kc || wa)) return window.alert("Enter at least one value.");
    const entry = { date: f.date, weight: w, sleep: sl, soreness: num(f.soreness), fatigue: num(f.fatigue), kcal: kc, waist: wa };
    setBody((prev) => [...prev.filter((r) => r.date !== f.date), entry]);
    setF({ ...f, weight: "", sleep: "", soreness: "", fatigue: "", kcal: "", waist: "" });
  };

  const ws = rows.filter((r) => r.weight);
  const last7 = avg(ws.slice(-7).map((r) => r.weight)), prev7 = avg(ws.slice(-14, -7).map((r) => r.weight));
  const gain = ws.length >= 14 ? last7 - prev7 : null;
  const advice = gain == null
    ? "Log at least 14 morning weights to get a calorie recommendation."
    : gain < 0.08 ? `Trend ${gain.toFixed(2)} kg/week is below the 0.08-0.21 target. If performance is flat too, add about 100-150 kcal/day.`
    : gain > 0.21 ? `Trend ${gain.toFixed(2)} kg/week is above target. If waist is rising or lifts aren't improving, cut about 100-150 kcal/day.`
    : `Trend ${gain.toFixed(2)} kg/week is on target. Hold calories.`;

  const recent = rows.slice(-60);
  const wAvg = recent.map((_, i) => {
    const w = recent.slice(Math.max(0, i - 6), i + 1).filter((r) => r.weight).map((r) => r.weight);
    return w.length ? avg(w) : null;
  });
  const last7r = rows.slice(-7);
  const a7 = (k) => { const v = avg(last7r.filter((r) => r[k]).map((r) => r[k])); return v == null ? "-" : v.toFixed(1); };
  const sel = (k, label, max) => (
    <div className="field"><label>{label}</label>
      <select value={f[k]} onChange={upd(k)}><option value="">-</option>{Array.from({ length: max }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></div>
  );

  return (
    <div>
      <div className="bodyform">
        <div className="field"><label>Date</label><input type="date" value={f.date} onChange={upd("date")} /></div>
        <div className="field"><label>Morning weight (kg)</label><input type="number" step="0.1" min="30" max="250" value={f.weight} onChange={upd("weight")} /></div>
        <div className="field"><label>Sleep (h)</label><input type="number" step="0.25" min="0" max="16" value={f.sleep} onChange={upd("sleep")} /></div>
        {sel("soreness", "Soreness 1-5", 5)}
        {sel("fatigue", "Fatigue 1-5", 5)}
        <div className="field"><label>Calories eaten</label><input type="number" step="50" min="500" max="8000" value={f.kcal} onChange={upd("kcal")} /></div>
        <div className="field"><label>Waist (cm)</label><input type="number" step="0.5" min="40" max="200" value={f.waist} onChange={upd("waist")} /></div>
      </div>
      <div className="btnrow"><button className="btn" onClick={save}>Save entry</button></div>

      <div className="stat">{advice}</div>
      <div className="stat">
        7-day averages: weight {a7("weight")} kg · sleep {a7("sleep")} h · soreness {a7("soreness")}/5 · fatigue {a7("fatigue")}/5
      </div>

      <Spark series={[{ name: "Weight (kg)", color: PALETTE[0], vals: recent.map((r) => r.weight ?? null), dots: true }, { name: "7-day average", color: PALETTE[1], vals: wAvg }]} />
      <Spark series={[
        { name: "Sleep (h)", color: PALETTE[4], vals: recent.map((r) => r.sleep ?? null), dots: true },
        { name: "Soreness", color: PALETTE[3], vals: recent.map((r) => r.soreness ?? null), dots: true },
        { name: "Fatigue", color: PALETTE[5], vals: recent.map((r) => r.fatigue ?? null), dots: true },
      ]} />

      {rows.length > 0 && (
        <div className="scroll">
          <table>
            <thead><tr><th>Date</th><th>kg</th><th>Sleep</th><th>Sore</th><th>Fatig</th><th>kcal</th><th>Waist</th><th /></tr></thead>
            <tbody>
              {rows.slice(-10).reverse().map((r) => (
                <tr key={r.date}>
                  <td>{r.date}</td><td>{r.weight ?? "-"}</td><td>{r.sleep ?? "-"}</td><td>{r.soreness ?? "-"}</td>
                  <td>{r.fatigue ?? "-"}</td><td>{r.kcal ?? "-"}</td><td>{r.waist ?? "-"}</td>
                  <td><button className="btn ghost" onClick={() => window.confirm(`Delete entry ${r.date}?`) && setBody((b) => b.filter((x) => x.date !== r.date))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- CERVICAL REHAB CHECKLIST ---------- */
function Rehab() {
  const [items, setItems] = usePersist("rehabExercises", []);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const todayKey = isoOf(new Date());
  const [completed, setCompleted] = usePersist("rehabCompleted", {});
  const add = () => {
    const cleanName = name.trim();
    if (!cleanName) return window.alert("Enter the exact exercise prescribed by your clinician.");
    setItems((prev) => [...prev, { id: `rehab-${Date.now()}`, name: cleanName, details: details.trim() }]);
    setName(""); setDetails("");
  };
  return (
    <div>
      <div className="lock">Cervical rehab is individual. Add only movements and dosage already approved by your physiotherapist or clinician. This app does not prescribe neck exercises.</div>
      {items.length === 0 ? <div className="empty">No clinician-approved rehab exercises added yet. Use the form below to enter your prescribed routine.</div> : items.map((item) => {
        const done = !!completed[`${todayKey}-${item.id}`];
        return <section className={"ex" + (done ? " complete" : "")} key={item.id}>
          <div className="head"><h2>{item.name}</h2><button className="btn ghost" onClick={() => window.confirm(`Remove ${item.name}?`) && setItems((prev) => prev.filter((x) => x.id !== item.id))}>Remove</button></div>
          {item.details && <p className="meta">{item.details}</p>}
          <button className={done ? "btn" : "btn ghost"} aria-pressed={done} onClick={() => setCompleted((prev) => ({ ...prev, [`${todayKey}-${item.id}`]: !done }))}>{done ? "Completed today ✓" : "Mark completed today"}</button>
        </section>;
      })}
      <div className="stat">
        <div className="field"><label htmlFor="rehab-name">Prescribed exercise name</label><input id="rehab-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter clinician-approved exercise" /></div>
        <div className="field" style={{ marginTop: 8 }}><label htmlFor="rehab-details">Prescribed sets, reps, hold time or notes</label><input id="rehab-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Enter only your prescribed dosage" /></div>
        <div className="btnrow" style={{ marginTop: 10 }}><button className="btn" onClick={add}>Add prescribed exercise</button></div>
      </div>
      <p className="note">The checklist is saved in this browser when local storage is available. Stop and seek professional advice if symptoms worsen or a movement causes concerning symptoms.</p>
    </div>
  );
}

/* ---------- HISTORY, PERSONAL RECORDS, BACKUP ---------- */

function History({ log, plan, assign, skipped, exportData, importData, programStart }) {
  const nameById = {};
  plan.forEach((d) => d.exercises.forEach((e) => { nameById[e.id] = e.name; }));

  const sessions = [];
  for (let di = 0; di < TOTAL_DAYS; di++) {
    const wi = assign[di];
    if (wi === 6) continue;
    const w = Math.floor(di / 7);
    let planned = 0, done = 0, at = null;
    plan[wi].exercises.forEach((ex) => {
      const n = WEEKS[w].deload ? 1 : ex.sets;
      for (let s = 0; s < n; s++) {
        planned++;
        const v = log[`${di}-${ex.id}-${s}`];
        if (v?.done) { done++; if (v.at && (!at || v.at > at)) at = v.at; }
      }
    });
    if (done > 0 || skipped[di]) sessions.push({ di, title: plan[wi].title, planned, done, at, skip: !!skipped[di] && done === 0 });
  }

  const prs = {};
  Object.entries(log).forEach(([k, v]) => {
    const m = k.match(/^(\d+)-(.+)-(\d+)$/);
    if (!m) return;
    const di = m[1], id = m[2];
    const name = nameById[id], kg = num(v.kg), reps = num(v.reps);
    if (!name || !kg) return;
    const cur = prs[name];
    if (!cur || kg > cur.kg || (kg === cur.kg && (reps || 0) > cur.reps)) prs[name] = { kg, reps: reps || 0, di: +di };
  });
  const prRows = Object.entries(prs).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <div className="head"><h2>Sessions</h2><span>{sessions.length} logged or skipped</span></div>
      {sessions.length === 0 ? <div className="empty">No sessions yet.</div> : (
        <div className="scroll"><table>
          <thead><tr><th>Scheduled</th><th>Workout</th><th>Sets</th><th>Status</th><th>Logged on</th></tr></thead>
          <tbody>
            {sessions.slice().reverse().map((x) => (
              <tr key={x.di}>
                <td>{wd(addDays(programStart, x.di))} {fmt(addDays(programStart, x.di))}</td>
                <td>{x.title}</td><td>{x.done}/{x.planned}</td>
                <td>{x.skip ? "Skipped" : x.done === x.planned ? "Complete" : "Partial"}</td>
                <td>{x.at ? fmt(new Date(x.at)) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <div className="head" style={{ marginTop: 16 }}><h2>Personal records</h2><span>heaviest set</span></div>
      {prRows.length === 0 ? <div className="empty">Records appear as you log weights.</div> : (
        <div className="scroll"><table>
          <thead><tr><th>Exercise</th><th>Best set</th><th>Date</th></tr></thead>
          <tbody>{prRows.map(([n, r]) => (
            <tr key={n}><td>{n}</td><td>{r.kg} kg × {r.reps || "-"}</td><td>{fmt(addDays(programStart, r.di))}</td></tr>
          ))}</tbody>
        </table></div>
      )}

      <div className="head" style={{ marginTop: 16 }}><h2>Backup</h2></div>
      <div className="btnrow">
        <button className="btn" onClick={exportData}>Export data</button>
        <label className="btn ghost" style={{ display: "inline-block" }}>
          Import backup
          <input type="file" accept="application/json" style={{ display: "none" }}
            onChange={(e) => { const file = e.target.files[0]; if (file) file.text().then(importData); e.target.value = ""; }} />
        </label>
      </div>
      <p className="note">Export includes your plan, schedule, logs, skipped sessions and body entries. Importing replaces current data after you confirm.</p>
    </div>
  );
}

/* ---------- SETTINGS ---------- */
function Settings({ startDate, onChangeStartDate, hasLogs }) {
  const [draft, setDraft] = useState(startDate);
  useEffect(() => setDraft(startDate), [startDate]);
  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft) || isoOf(dateFromISO(draft)) !== draft) {
      return window.alert("Choose a valid start date.");
    }
    if (draft === startDate) return;
    if (hasLogs && !window.confirm("Changing the start date shifts the calendar dates assigned to existing program-day logs. Your logs will not be deleted. Continue?")) return;
    onChangeStartDate(draft);
    window.alert("Program start date updated. The calendar and week mapping now use the new date.");
  };
  return <div>
    <div className="head"><h2>Program settings</h2></div>
    <div className="stat">Choose the date that Day 1 / Week 1 begins. All calendar dates, week labels, progress charts and history dates will be recalculated from this date. Existing logs remain attached to their program day, so their displayed calendar dates may shift.</div>
    <div className="field"><label htmlFor="program-start">Program start date</label><input id="program-start" type="date" value={draft} onChange={(e) => setDraft(e.target.value)} /></div>
    <div className="btnrow" style={{ marginTop: 10 }}><button className="btn" onClick={save}>Save start date</button><button className="btn ghost" onClick={() => setDraft(DEFAULT_PROGRAM_START_ISO)}>Reset to default</button></div>
    <p className="note">Default start date: 10 October 2026. This setting is saved in this browser only.</p>
  </div>;
}

/* ---------- APP ---------- */

export default function ArnoldSplitHIT() {
  const [tab, setTab] = useState("workout");
  const [programStartISO, setProgramStartISO] = usePersist("programStart", DEFAULT_PROGRAM_START_ISO);
  const programStart = useMemo(() => dateFromISO(programStartISO), [programStartISO]);
  const programEnd = useMemo(() => addDays(programStart, TOTAL_DAYS - 1), [programStartISO]);
  const [week, setWeek] = useState(() => weekFor(new Date(), programStart));
  const [pos, setPos] = useState(() => dayIdxFor(new Date(), programStart));
  const [assign, setAssign] = usePersist("assign", DEFAULT_ASSIGN);
  const [plan, setPlan] = usePersist("plan", DEFAULT_PLAN);
  const [log, setLog] = usePersist("log", {}); // key "dateIndex-exerciseId-set" -> { kg, reps, done, at }
  const [skipped, setSkipped] = usePersist("skipped", {});
  const [body, setBody] = usePersist("body", []);

  // Editing unlocks once the first 7 days are over, or earlier if every week-1 set is marked done.
  const week1Done = useMemo(() => {
    let total = 0, done = 0;
    for (let p = 0; p < 7; p++) {
      plan[assign[p]].exercises.forEach((ex) => {
        for (let q = 0; q < ex.sets; q++) { total++; if (log[`${p}-${ex.id}-${q}`]?.done) done++; }
      });
    }
    return total > 0 && total === done;
  }, [plan, assign, log]);
  const unlockedNow = dayDiff(new Date(), programStart) >= 7 || week1Done;
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => { if (unlockedNow) setCanEdit(true); }, [unlockedNow]);
  useEffect(() => {
    setWeek(weekFor(new Date(), programStart));
    setPos(dayIdxFor(new Date(), programStart));
  }, [programStartISO]);

  const readStored = (key, fallback) => {
    try {
      const raw = window.localStorage.getItem("hit:" + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  };
  const exportData = () => {
    const backup = {
      version: 3, plan, assign, log, skipped, body,
      nutrition: { bw: readStored("bw", 82.9), kcal: readStored("kcal", 3500) },
      rehabExercises: readStored("rehabExercises", []),
      rehabCompleted: readStored("rehabCompleted", {}),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "arnold-ppl-backup.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importData = (text) => {
    try {
      const d = JSON.parse(text);
      const validPlan = Array.isArray(d.plan) && d.plan.length === 7 && d.plan.every((day) => day && typeof day.title === "string" && Array.isArray(day.exercises) && day.exercises.every((ex) => ex && typeof ex.id === "string" && typeof ex.name === "string" && Number.isFinite(Number(ex.sets))));
      const validAssign = Array.isArray(d.assign) && d.assign.length === TOTAL_DAYS && d.assign.every((x) => Number.isInteger(x) && x >= 0 && x <= 6);
      const validLog = d.log && typeof d.log === "object" && !Array.isArray(d.log);
      const validRehab = (d.rehabExercises == null || Array.isArray(d.rehabExercises)) && (d.rehabCompleted == null || (typeof d.rehabCompleted === "object" && !Array.isArray(d.rehabCompleted)));
      if (!validPlan || !validAssign || !validLog || !validRehab || (d.body != null && !Array.isArray(d.body)) || (d.skipped != null && (typeof d.skipped !== "object" || Array.isArray(d.skipped)))) throw new Error("bad");
      if (!window.confirm("Replace ALL current data with this backup? Export your current data first if you want a restore point.")) return;
      setPlan(d.plan); setAssign(d.assign); setLog(d.log); setSkipped(d.skipped || {}); setBody(d.body || []);
      try {
        if (d.nutrition && typeof d.nutrition === "object") {
          if (Number.isFinite(Number(d.nutrition.bw))) window.localStorage.setItem("hit:bw", JSON.stringify(Math.min(250, Math.max(30, Number(d.nutrition.bw)))));
          if (Number.isFinite(Number(d.nutrition.kcal))) window.localStorage.setItem("hit:kcal", JSON.stringify(Math.min(6000, Math.max(1200, Number(d.nutrition.kcal)))));
        }
        if (Array.isArray(d.rehabExercises)) window.localStorage.setItem("hit:rehabExercises", JSON.stringify(d.rehabExercises));
        if (d.rehabCompleted && typeof d.rehabCompleted === "object") window.localStorage.setItem("hit:rehabCompleted", JSON.stringify(d.rehabCompleted));
      } catch { window.alert("Main backup data was imported, but some nutrition or rehab settings could not be restored because browser storage is unavailable."); }
    } catch { window.alert("That file is not a valid backup."); }
  };

  const tabs = [
    ["workout", "Workout"],
    ["calendar", "Calendar"],
    ["progress", "Charts"],
    ["history", "History"],
    ["body", "Body"],
    ["rehab", "Rehab"],
    ["settings", "Settings"],
    ["progression", `${WEEKS.length} weeks`],
    ["nutrition", "Nutrition"],
  ];

  return (
    <div className="hit">
      <style>{css}</style>
      <div className="wrap">
        <h1>Arnold + PPL: High Intensity Bulk</h1>
        <p className="sub">Days 1-3 Arnold split, Days 4-6 Push/Pull/Legs, stop 0-3 reps short of failure. {fmt(programStart)} to {fmt(programEnd)} {programEnd.getFullYear()} (13 weeks).</p>

        <div className="nav" role="tablist">
          {tabs.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        {tab === "workout" && (
          <Workout
            week={week} log={log} setLog={setLog} pos={pos} setPos={setPos} assign={assign} setAssign={setAssign}
            plan={plan} setPlan={setPlan} canEdit={canEdit || unlockedNow}
            skipped={skipped} setSkipped={setSkipped} programStart={programStart}
          />
        )}
        {tab === "calendar" && (
          <CalendarView
            week={week} plan={plan} assign={assign} setAssign={setAssign} log={log}
            onPick={(w, p) => { setWeek(w); setPos(p); setTab("workout"); }} programStart={programStart}
          />
        )}
        {tab === "progress" && <Progress log={log} setLog={setLog} week={week} plan={plan} assign={assign} />}
        {tab === "history" && (
          <History log={log} plan={plan} assign={assign} skipped={skipped} exportData={exportData} importData={importData} programStart={programStart} />
        )}
        {tab === "body" && <Body body={body} setBody={setBody} />}
        {tab === "rehab" && <Rehab />}
        {tab === "progression" && <Progression week={week} setWeek={setWeek} programStart={programStart} />}
        {tab === "settings" && <Settings startDate={programStartISO} onChangeStartDate={setProgramStartISO} hasLogs={Object.keys(log).length > 0} />}
        {tab === "nutrition" && <Nutrition />}
      </div>
    </div>
  );
}
