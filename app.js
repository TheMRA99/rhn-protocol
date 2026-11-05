// THE RED HOOD × NIGHTWING PROTOCOL — app logic

const STORAGE_KEY = 'rhn-protocol-v1';
const SHADOW_KEY = STORAGE_KEY + ':shadow';   // mirror of the last good save
const SNAP_PREFIX = STORAGE_KEY + ':snap:';   // dated point-in-time snapshots

const defaultState = {
  startDate: null,
  weights: [],
  waists: [],          // [{ date, cm }]
  sleep: {},           // { "2026-05-08": { bed: "22:30", fresh: 4 } }
  sessions: [],
  selectedWorkout: null,
  officeTrip: null,    // { date, idx, done } — covert office-day station rotator
  pausedAt: null,      // ISO date when Maintain/Travel mode was switched on (null = active block)
  onboarded: true,     // onboarding removed — baseline is hard-coded below
  baseline: { weight: 75, waist: 86, kneeL: 13, kneeR: 16, hipIR: 'normal' },
  mobility: [],        // [{ date, test, value }] — 4-weekly mobility milestones
  pain: {},            // { "date::workout::exKey": true } — pain flags for pattern-spotting
  swaps: {},           // { "date::workout::exKey": true } — exercise swapped to its sub (equipment taken)
  cableMachine: {},    // { "date::workout::exKey": "1"|"2" } — which cable stack (the two stacks number differently)
  exMachine: {},       // { "date::workout::exKey": "Stairmaster" } — which machine for multi-machine cardio
  workoutByDate: {},   // { "2026-04-29": "day3", ... }
  dayCursor: null,     // last numbered day you completed — drives the sequential default
  setLog: {},
  daily: {},
  ritual: {},
  stamina: {},
  ramadan: false,      // #4 fasting engine: post-iftar training, hold load, pause deficit
  program: 'rhn'       // 'rhn' or 'oman' — which block the user is training
};

// Program days run in numeric sequence. The app no longer maps a fixed weekday
// to each day — office days shift, so the default just advances Day 1 → 2 → 3
// → 4 → 5 as you complete them (the picker still lets you choose any day, and
// you slot rest / Home-core days in whenever you need one). Keep a rest or easy
// Home day between Day 2 and Day 4 — both are leg days.
const DAY_SEQUENCE = ['day1', 'day2', 'day3', 'day4', 'day5'];
const DAY_SEQUENCE_OMAN = ['oman1', 'oman2', 'oman3', 'oman4', 'oman5'];
// Reset block (Nov 2026 →): A/B/C in order + 'Move' sessions. Every Reset session counts toward the week.
const DAY_SEQUENCE_RESET = ['reset_a', 'reset_b', 'reset_c'];
const RESET_EXTRAS = ['reset_swim', 'reset_z2', 'reset_hill', 'reset_home'];
const RESET_START_KEY = '2026-11-reset-v2';
const RESET_START_DATE = '2026-11-07'; // Week 1 = Sat 7 Nov 2026

function isReset() { return state.program === 'reset'; }

function getActiveSequence() {
  if (isReset()) return DAY_SEQUENCE_RESET;
  return state.program === 'oman' ? DAY_SEQUENCE_OMAN : DAY_SEQUENCE;
}

let state = load();

function load() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // Primary key gone (browser cleared it / storage evicted) but a backup exists?
    // Recover from the shadow mirror instead of starting empty.
    if (!raw) {
      const shadow = localStorage.getItem(SHADOW_KEY);
      if (shadow) { safeSet(STORAGE_KEY, shadow); raw = shadow; }
      else return seed();
    }
    const parsed = JSON.parse(raw);
    const merged = { ...defaultState, ...parsed };
    // Onboarding is gone — everyone is onboarded with a hard-coded baseline.
    merged.onboarded = true;
    if (!merged.baseline) merged.baseline = { ...defaultState.baseline };
    // Never show "started —": if the clock was never set (older state / lapse),
    // anchor it to today so week + streak are real. Restart-block resets it later.
    if (!merged.startDate) {
      merged.startDate = today();
      safeSet(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch (e) {
    // Primary corrupt — try the shadow mirror before giving up, and write the
    // recovered copy back so the corrupt primary can't be read again next load.
    try {
      const shadow = localStorage.getItem(SHADOW_KEY);
      if (shadow) {
        const recovered = { ...defaultState, ...JSON.parse(shadow), onboarded: true };
        safeSet(STORAGE_KEY, JSON.stringify(recovered));
        return recovered;
      }
    } catch (_) { /* shadow also unreadable */ }
    return seed();
  }
}

// setItem that never throws — returns false on quota / blocked storage.
function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (_) { return false; }
}

function seed() {
  const s = { ...defaultState, startDate: today() };
  safeSet(STORAGE_KEY, JSON.stringify(s));
  return s;
}

const SNAPSHOT_KEEP = 3;

function save() {
  const json = JSON.stringify(state);
  // Primary write first. On quota errors, free the snapshot space (the least
  // valuable copies) and retry once before telling the user.
  if (!safeSet(STORAGE_KEY, json)) {
    pruneSnapshots(0);
    if (!safeSet(STORAGE_KEY, json)) {
      showToast('Save failed — storage full, export a backup');
      return false;
    }
  }
  // Auto-backup: a mirror + a per-day snapshot, so a cleared key or a bad edit
  // can't silently wipe the log. Only back up when there's real data — never let
  // an empty/reset state overwrite a good backup.
  const hasData = (state.setLog && Object.keys(state.setLog).length)
    || (state.weights && state.weights.length) || (state.sessions && state.sessions.length)
    || (state.waists && state.waists.length);
  if (hasData) {
    safeSet(SHADOW_KEY, json);
    safeSet(SNAP_PREFIX + today(), json);
    pruneSnapshots(SNAPSHOT_KEEP);
  }
  return true;
}

function snapshotKeys() {
  const snaps = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(SNAP_PREFIX)) snaps.push(k);
  }
  return snaps.sort(); // dated keys sort chronologically
}

// Keep only the most recent N dated snapshots.
function pruneSnapshots(keep) {
  try {
    const snaps = snapshotKeys();
    while (snaps.length > keep) localStorage.removeItem(snaps.shift());
  } catch (_) { /* storage blocked */ }
}

// HTML-escape any user- or storage-sourced string before it touches innerHTML.
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Parse a YYYY-MM-DD string as LOCAL midnight (bare ISO dates parse as UTC).
function parseIso(iso) {
  return new Date(iso + 'T00:00:00');
}

// Local-timezone date — toISOString() is UTC, which made "today" flip at 8am SGT
function localIso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ?today=YYYY-MM-DD pins "today" for testing week rollovers (e.g. the Saturday
// boundary). Only read from the URL; nothing in the UI ever sets it.
// (function-scoped so it works even when called during the initial load())
function todayOverride() {
  if (todayOverride.v === undefined) {
    try {
      const q = new URLSearchParams(location.search).get('today');
      todayOverride.v = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
    } catch (_) { todayOverride.v = null; }
  }
  return todayOverride.v;
}
function today() {
  return todayOverride() || localIso(new Date());
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function isPaused() { return !!state.pausedAt; }

// The program week runs Saturday → Friday (Day 1 has always been "the Saturday
// lift"). Week 1 starts on the Saturday on/before startDate, not on startDate
// itself — so if you start on a Tuesday, that week is a short partial week and
// the next Saturday cleanly opens Week 2. Every week boundary lands on Saturday.
function saturdayOnOrBefore(dateObj) {
  const dow = dateObj.getDay(); // 0=Sun .. 6=Sat
  const back = (dow - 6 + 7) % 7; // days since the most recent Saturday
  return new Date(dateObj.getTime() - back * 86400000);
}

function programWeekAnchor() {
  return saturdayOnOrBefore(new Date((state.startDate || today()) + 'T00:00:00'));
}

function weekNumber() {
  if (!state.startDate) return 1;
  const anchor = programWeekAnchor();
  // While paused, freeze the clock at the pause date so deloads don't drift.
  const ref = isPaused() ? new Date(state.pausedAt + 'T00:00:00') : new Date(today() + 'T00:00:00');
  const diffDays = Math.floor((ref - anchor) / (1000 * 60 * 60 * 24));
  return Math.min(DATA.totalWeeks || 16, Math.max(1, Math.floor(diffDays / 7) + 1));
}

// ===== Periodization: 16 weeks = four 4-week phases. Workouts evolve by phase. =====
function phaseNumber(week) {
  return Math.min(4, Math.ceil((week || weekNumber()) / 4));
}

// Reset: phase comes from DATA.phases ("1–4", "5–13", ...), not 4-week blocks.
function resetPhase(week) {
  const wk = week || weekNumber();
  for (const ph of (DATA.phases || [])) {
    const m = String(ph.weeks).match(/(\d+)\D+(\d+)/);
    if (m && wk >= +m[1] && wk <= +m[2]) return ph;
  }
  return null;
}

// Weights for the current block only (Reset ignores the old 75 kg-era logs).
function blockWeights() {
  const all = (state.weights || []).filter(d => d && d.date && Number.isFinite(+d.kg))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!isReset() || !state.startDate) return all;
  // Allow a week of pre-start weigh-ins as the baseline.
  const from = parseIso(state.startDate); from.setDate(from.getDate() - 7);
  const fromIso = localIso(from);
  return all.filter(d => d.date >= fromIso);
}

// Ramadan 1448 (Singapore, approx.) — Ramadan mode switches itself on/off by date.
const RAMADAN_2027 = { start: '2027-02-08', end: '2027-03-09' };
function autoRamadan() {
  const t = today();
  if (t >= RAMADAN_2027.start && t <= RAMADAN_2027.end && state.ramadanAuto !== '2027-on' && state.ramadanAuto !== '2027-off') {
    state.ramadan = true; state.ramadanAuto = '2027-on';
  } else if (t > RAMADAN_2027.end && state.ramadanAuto === '2027-on') {
    state.ramadan = false; state.ramadanAuto = '2027-off';
  }
}
function daysUntilRamadan() {
  return Math.round((parseIso(RAMADAN_2027.start) - parseIso(today())) / 86400000);
}

// Week index for an arbitrary log date — lets history render the phase that was
// actually active that day rather than today's phase.
function weekForDate(dateStr) {
  if (!state.startDate || !dateStr) return weekNumber();
  const anchor = programWeekAnchor();
  const ref = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.floor((ref - anchor) / 86400000);
  return Math.min(DATA.totalWeeks || 16, Math.max(1, Math.floor(diffDays / 7) + 1));
}

// The [start, end) Saturday-anchored date window of a program week.
function weekWindow(weekNum) {
  const anchor = programWeekAnchor();
  const ws = new Date(anchor.getTime() + (weekNum - 1) * 7 * 86400000);
  const we = new Date(ws.getTime() + 7 * 86400000);
  return { start: localIso(ws), end: localIso(we) };
}

// Which numbered days (day1..day5 or oman1..oman5) you actually completed in a given program week.
// Checks both explicit session marks AND set-log data — if you filled in sets but
// forgot to press "Mark session complete", the day still counts.
function daysDoneInWeek(weekNum) {
  const { start, end } = weekWindow(weekNum);
  const done = new Set();
  const seq = isReset() ? [...DAY_SEQUENCE_RESET, ...RESET_EXTRAS] : getActiveSequence();
  for (const s of (state.sessions || [])) {
    if (seq.includes(s.workoutId) && s.date >= start && s.date < end) done.add(s.workoutId);
  }
  for (const dateStr of Object.keys(state.setLog || {})) {
    if (dateStr < start || dateStr >= end) continue;
    for (const wId of seq) {
      if (done.has(wId)) continue;
      const wLog = state.setLog[dateStr]?.[wId];
      if (!wLog) continue;
      const hasDone = Object.values(wLog).some(sets =>
        Array.isArray(sets) && sets.some(s => s && s.done)
      );
      if (hasDone) done.add(wId);
    }
  }
  return done;
}

// Lowest-numbered day you haven't done yet THIS week (null once all five are in).
function nextDayThisWeek() {
  const done = daysDoneInWeek(weekNumber());
  return getActiveSequence().find(id => !done.has(id)) || null;
}

// Resolve a workout to a phase: keep every exercise that has no `phases` tag, or
// whose `phases` list includes the active phase; drop blocks left empty. NOTE:
// phase-specific exercises must always be APPENDED at the end of a block or live
// in their own block, so the index-based set-log keys of the base exercises never
// shift between phases (history, prev-best and suggestions stay aligned).
// `byPhase: { 3: { name, note, reps, sets } }` overrides an exercise in place for
// that phase — same slot, same key. Overrides may change name/note/reps/sets only,
// never inputMode/stages/order (those would corrupt how old logs are read).
function resolveWorkout(w, phase) {
  if (!w || !w.blocks) return w;
  const ph = phase || phaseNumber();
  const wk = weekNumber();
  const blocks = w.blocks
    .map(b => ({
      ...b,
      exercises: b.exercises
        .filter(ex => !ex.phases || ex.phases.includes(ph))
        .map((ex, i) => {
          let e = (ex.byPhase && ex.byPhase[ph]) ? { ...ex, ...ex.byPhase[ph] } : ex;
          // byWeek: { 5: { sets: 4 } } — set-count steps by program week (never keys/modes).
          if (e.byWeek) {
            Object.keys(e.byWeek).map(Number).sort((a, b) => a - b)
              .forEach(k => { if (wk >= k) e = { ...e, ...e.byWeek[k] }; });
          }
          // Chosen alternate (week-5 / week-10 picks). Logs under its own ~alt slot.
          if (e.alt && state.variants && state.variants[`${w.id}::${b.title}::${i}`]) {
            e = { ...e, ...e.alt, _alt: true, _orig: e };
          }
          return e;
        })
    }))
    .filter(b => b.exercises.length);
  return { ...w, blocks, _phase: ph };
}

function getWorkout(id, phase) {
  return resolveWorkout(DATA.workouts.find(x => x.id === id), phase);
}

function phaseWorkouts(phase) {
  return DATA.workouts.filter(w => !w.special).map(w => resolveWorkout(w, phase));
}

// Deloads land at weeks 8 and 14; week 8 also runs a diet break.
function isDeloadWeek(n) { return !isReset() && (n === 8 || n === 14); }
function isDietBreakWeek(n) { return !isReset() && (n === 8 || n === 12); }

// Self-test gating: ankle/glute-med block shows only if knee-to-wall flagged tight.
function gateActive(gate) {
  if (gate === 'ankle') {
    const b = state.baseline;
    if (!b) return false;
    const l = parseFloat(b.kneeL), rr = parseFloat(b.kneeR);
    return (!isNaN(l) && l < 10) || (!isNaN(rr) && rr < 10);
  }
  return false;
}

function enterPause() {
  state.pausedAt = today();
  save();
  renderAll();
  showToast('Block paused · streak frozen');
}

function exitPause() {
  if (state.pausedAt && state.startDate) {
    // Shift the whole block forward by the paused duration so deloads /
    // diet break keep their position relative to where you left off.
    const pausedMs = new Date(today() + 'T00:00:00') - new Date(state.pausedAt + 'T00:00:00');
    const pausedDays = Math.max(0, Math.round(pausedMs / 86400000));
    const ns = new Date(state.startDate + 'T00:00:00');
    ns.setDate(ns.getDate() + pausedDays);
    state.startDate = localIso(ns);
    // Remember the paused span so the streak skips it instead of breaking on it.
    state.pauseSpans = [...(state.pauseSpans || []), { from: state.pausedAt, to: today() }];
  }
  state.pausedAt = null;
  save();
  renderAll();
  showToast('Block resumed');
}

function dailyKey() {
  return today();
}

function getSelectedWorkoutForToday() {
  const dKey = today();
  if (state.workoutByDate && state.workoutByDate[dKey]) {
    return state.workoutByDate[dKey];
  }
  // Already logged something today? That's today's workout — never jump away
  // from a session in progress just because it now counts as done this week.
  const loggedToday = Object.keys(state.setLog?.[dKey] || {})
    .filter(wId => DATA.workouts.some(w => w.id === wId));
  const inProgram = loggedToday.find(wId => getActiveSequence().includes(wId));
  if (inProgram || loggedToday.length) return inProgram || loggedToday[0];
  // No pick yet today → suggest the next day you still owe THIS week. Each week
  // is a fresh Day 1→5 attempt, so missed days don't carry over — a new week
  // resets to Day 1. All five already done → suggest a Home / rest day.
  return nextDayThisWeek() || (isReset() ? 'reset_z2' : 'homecore');
}

function setSelectedWorkoutForToday(id) {
  state.workoutByDate = state.workoutByDate || {};
  state.workoutByDate[today()] = id;
  state.selectedWorkout = id;
}

// Cable-stack lifts: the gym's two stacks are numbered on different scales, so a
// bare "40" is ambiguous. These get an M1/M2 tag stamped onto each logged set.
function usesCableStack(ex) {
  if (ex.cable === true) return true;
  if (ex.cable === false) return false;
  return /\b(cable|pulldown|pushdown|face pull)/i.test(ex.name || '');
}

function findExerciseByKey(workout, exKey) {
  let clean = exKey.replace(/~sub$/, ''); // swapped-exercise logs live under a ~sub slot
  const isAlt = /~alt$/.test(clean);      // chosen-alternate logs live under ~alt
  clean = clean.replace(/~alt$/, '');
  const sep = clean.indexOf('::');
  if (sep < 0) return null;
  const blockTitle = clean.slice(0, sep);
  const idx = +clean.slice(sep + 2);
  const block = workout.blocks.find(b => b.title === blockTitle);
  let ex = block ? block.exercises[idx] : null;
  if (!ex) return null;
  if (isAlt && ex.alt && !ex._alt) ex = { ...ex, ...ex.alt, _alt: true, _orig: ex };
  if (!isAlt && ex._alt && ex._orig) ex = ex._orig;
  return ex;
}

/**
 * Suggested next-session weight, derived from your last logged session
 * for this exercise + the program's double-progression rule.
 * Returns null in the first 4 weeks (the adaptation phase) — the user
 * picks their own weights until then.
 */
function suggestedKgFor(workoutId, exKey, ex, stageIdx) {
  if (weekNumber() < 5) return null;
  const dKey = today();
  const dates = Object.keys(state.setLog || {})
    .filter(d => d !== dKey)
    .sort()
    .reverse();
  let lastSets = null;
  for (const d of dates) {
    const s = state.setLog[d]?.[workoutId]?.[exKey];
    if (s && s.length) { lastSets = s; break; }
  }
  if (!lastSets) return null;

  const isMS = ex.inputMode === 'multistage';
  const kgList = [], repsList = [];
  lastSets.forEach(set => {
    if (!set || !set.done) return;
    if (isMS && stageIdx != null) {
      const st = set[`stage${stageIdx}`];
      if (!st) return;
      const kg = parseFloat(st.kg);
      const reps = parseInt(st.reps);
      if (!isNaN(kg)) kgList.push(kg);
      if (!isNaN(reps)) repsList.push(reps);
    } else if (!isMS) {
      const kg = parseFloat(set.kg);
      const reps = parseInt(set.reps);
      if (!isNaN(kg)) kgList.push(kg);
      if (!isNaN(reps)) repsList.push(reps);
    }
  });
  if (!kgList.length) return null;
  const lastKg = Math.max(...kgList);

  // Deload weeks 8 & 14: ~60% of last, matching the progression card.
  if (isDeloadWeek(weekNumber())) {
    return Math.round(lastKg * 0.6 * 4) / 4;
  }

  const repMatch = (ex.reps || '').match(/(\d+)\s*[-–]\s*(\d+)/);
  let minRep = 0, maxRep = 0;
  if (repMatch) {
    minRep = +repMatch[1];
    maxRep = +repMatch[2];
  } else {
    const single = (ex.reps || '').match(/(\d+)/);
    if (single) maxRep = +single[1];
  }
  if (!maxRep) return lastKg;

  const allHitTop = repsList.length && repsList.every(r => r >= maxRep);
  const someBelowMin = minRep && repsList.some(r => r < minRep);
  const isVolume = maxRep >= 12;
  const inc = isVolume ? 1.25 : 2.5;

  let suggested = lastKg;
  if (allHitTop) suggested = lastKg + inc;
  else if (someBelowMin) suggested = lastKg - inc;
  return Math.round(suggested * 4) / 4;
}

function isMultiStageDone(setData, ex) {
  return ex.stages.every((_, si) => {
    const s = setData[`stage${si}`];
    return s && s.kg !== undefined && s.kg !== '' && s.reps !== undefined && s.reps !== '';
  });
}

function inputFieldsForMode(mode, ex) {
  switch (mode) {
    case 'bodyweight_reps':
      if (ex && ex.assist) return [
        { key: 'assist', label: 'assist', width: 60, inputmode: 'decimal' },
        { key: 'reps', label: 'reps', width: 52, inputmode: 'numeric' }
      ];
      return [{ key: 'reps', label: 'reps', width: 60, inputmode: 'numeric' }];
    case 'time':
      return [{ key: 'sec', label: 'sec', width: 60, inputmode: 'numeric' }];
    case 'time_speed':
      return [
        { key: 'min', label: 'min', width: 50, inputmode: 'decimal' },
        { key: 'spm', label: 'spm', width: 56, inputmode: 'numeric' }
      ];
    case 'treadmill':
      return [
        { key: 'min', label: 'min', width: 44, inputmode: 'decimal' },
        { key: 'kmh', label: 'km/h', width: 48, inputmode: 'decimal' },
        { key: 'incline', label: '%inc', width: 44, inputmode: 'decimal' }
      ];
    case 'interval':
      return [
        { key: 'level', label: 'level', width: 54, inputmode: 'numeric' },
        { key: 'rounds', label: 'rds', width: 48, inputmode: 'numeric' }
      ];
    case 'cardio':
      return [
        { key: 'min', label: 'min', width: 50, inputmode: 'decimal' },
        { key: 'level', label: 'level', width: 54, inputmode: 'numeric' }
      ];
    case 'amrap':
      return [{ key: 'rounds', label: 'rounds', width: 70, inputmode: 'numeric' }];
    case 'carry':
      return [
        { key: 'kg', label: 'kg/hand', width: 56, inputmode: 'decimal' },
        { key: 'm', label: 'm', width: 46, inputmode: 'numeric' }
      ];
    case 'weight_reps':
    default:
      return [
        { key: 'kg', label: 'kg', width: 48, inputmode: 'decimal' },
        { key: 'reps', label: 'rep', width: 48, inputmode: 'numeric' }
      ];
  }
}

function placeholderFor(field, ex, mode) {
  const repsSpec = (ex.reps || '').toLowerCase();
  const isPerSide = /\/side/.test(repsSpec);
  const isFailure = /failure/i.test(repsSpec);
  if (field.key === 'reps') {
    if (isFailure) return 'max';
    if (isPerSide) return 'r/side';
    return field.label;
  }
  if (field.key === 'sec' && isPerSide) return 's/side';
  return field.label;
}

/**
 * Find the most recent prior session's best set for an exercise.
 * Returns { kg, reps, sec, min, spm } from the heaviest/longest entry, or null.
 */
function findPreviousBest(workoutId, exKey) {
  const dKey = today();
  const dates = Object.keys(state.setLog || {})
    .filter(d => d !== dKey)
    .sort()
    .reverse();
  for (const d of dates) {
    const sets = state.setLog[d]?.[workoutId]?.[exKey];
    if (!sets || !sets.length) continue;
    const valid = sets.filter(s => s && s.done);
    if (!valid.length) continue;
    // Pick best by kg first, else reps, else sec, else min.
    // Multistage sets keep their numbers in stage0 — rank on the heavy stage.
    const rank = (s) => {
      const src = s.stage0 || s;
      return parseFloat(src.kg || src.sec || src.min || src.reps || src.rounds || 0) || 0;
    };
    const best = valid.reduce((a, b) => (rank(b) > rank(a) ? b : a));
    return { date: d, set: best };
  }
  return null;
}

// Escaped wrapper — set values come from storage / imported backups, so they are
// untrusted text by the time they reach innerHTML.
function formatPrev(set, mode, ex) { return esc(formatPrevRaw(set, mode, ex)); }

function formatPrevRaw(set, mode, ex) {
  if (!set) return '';
  const mTag = set.m ? ` · M${set.m}` : ''; // which cable stack, if tagged
  const macTag = set.mac ? ` · ${set.mac}` : ''; // which machine, if tagged
  switch (mode) {
    case 'bodyweight_reps':
      return set.assist != null && set.assist !== '' ? `${set.reps || '–'} reps · ${set.assist} kg assist` : `${set.reps || '–'} reps`;
    case 'amrap':
      return `${set.rounds || '–'} rounds`;
    case 'time':
      return `${set.sec || '–'} s`;
    case 'time_speed':
      return `${set.min || '–'} min · ${set.spm || '–'} spm${macTag}`;
    case 'treadmill':
      return `${set.min || '–'} min · ${set.kmh || '–'} km/h · ${set.incline || '–'}%${macTag}`;
    case 'interval':
      return `lvl ${set.level || '–'} · ${set.rounds || '–'} rds${macTag}`;
    case 'cardio':
      return `${set.min || '–'} min · lvl ${set.level || '–'}${macTag}`;
    case 'carry':
      return `${set.kg || '–'} kg/hand × ${set.m || '–'} m`;
    case 'multistage': {
      // pull stage0 as the headline
      const s0 = set.stage0;
      if (!s0) return 'logged';
      return `${s0.kg || '–'} kg × ${s0.reps || '–'}${mTag}`;
    }
    default:
      if (ex?.barbell) {
        const side = parseFloat(set.kg);
        const total = !isNaN(side) ? ((ex.bar ?? 20) + 2 * side) : null;
        return `${set.kg || '–'} /side × ${set.reps || '–'}${total != null ? ` (${total} total)` : ''}${mTag}`;
      }
      return `${set.kg || '–'} kg × ${set.reps || '–'}${mTag}`;
  }
}

function barTotalText(kgPerSide, barWeight) {
  const v = parseFloat(kgPerSide);
  if (isNaN(v)) return '';
  return '= ' + (barWeight + 2 * v) + ' kg';
}

function renderSessionProgress(done, total, floorDone, floorTotal) {
  const wrap = document.getElementById('sessionProgress');
  const fill = document.getElementById('sessionProgressFill');
  const stat = document.getElementById('sessionProgressStat');
  const label = document.getElementById('sessionProgressLabel');
  if (!wrap || !fill || !stat) return;
  if (!total) { wrap.hidden = true; return; }
  wrap.hidden = false;
  const pct = Math.round((done / total) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('complete', pct >= 100);
  stat.textContent = `${done} / ${total} sets · ${pct}%`;
  label.textContent = pct >= 100 ? 'Session complete' : (done === 0 ? 'Today' : 'In progress');
  wrap.classList.remove('pinned-done');
  if (floorTotal) {
    const floorPct = Math.round((floorDone / floorTotal) * 100);
    fill.style.width = Math.min(100, floorPct) + '%';
    fill.classList.toggle('complete', floorDone >= floorTotal);
    wrap.classList.toggle('pinned-done', floorDone >= floorTotal);
    if (floorDone >= floorTotal) {
      label.textContent = 'Minimum done ✓ — this counts as a full session';
      stat.textContent = done > floorDone ? `+${done - floorDone} bonus sets` : 'Rest is bonus';
    } else {
      label.textContent = done === 0 ? 'Minimum block first' : 'Minimum in progress';
      stat.textContent = `${floorDone} / ${floorTotal} sets to a full session`;
    }
  }
}

// Reset: the first visible block is the "floor" — finishing it is a full session.
function floorProgress(w, log, dKey, id) {
  if (!isReset()) return [0, 0];
  const block = w.blocks.find(b => !b.gated || gateActive(b.gated));
  if (!block || !/^Floor/.test(block.title)) return [0, 0];
  let total = 0, done = 0;
  block.exercises.forEach((ex, exIdx) => {
    const baseKey = `${block.title}::${exIdx}${ex._alt ? '~alt' : ''}`;
    const swapped = !!(ex.sub && state.swaps && state.swaps[`${dKey}::${id}::${baseKey}`]);
    const sets = log[baseKey + (swapped ? '~sub' : '')] || [];
    total += ex.sets;
    for (let s = 0; s < ex.sets; s++) if (sets[s] && sets[s].done) done += 1;
  });
  return [done, total];
}

function refreshSessionProgress() {
  const id = state.selectedWorkout;
  if (!id) return;
  const w = getWorkout(id);
  if (!w) return;
  const dKey = today();
  const log = state.setLog[dKey] && state.setLog[dKey][id] ? state.setLog[dKey][id] : {};
  let total = 0, done = 0;
  w.blocks.forEach(block => {
    if (block.gated && !gateActive(block.gated)) return; // hidden blocks don't count
    block.exercises.forEach((ex, exIdx) => {
      const baseKey = `${block.title}::${exIdx}${ex._alt ? '~alt' : ''}`;
      const swapped = !!(ex.sub && state.swaps && state.swaps[`${dKey}::${id}::${baseKey}`]);
      const exKey = baseKey + (swapped ? '~sub' : '');
      const sets = log[exKey] || [];
      total += ex.sets;
      for (let s = 0; s < ex.sets; s++) {
        if (sets[s] && sets[s].done) done += 1;
      }
    });
  });
  renderSessionProgress(done, total, ...floorProgress(w, log, dKey, id));
}

function isCurrentBeating(currentSets, prev, mode) {
  if (!prev || !currentSets || !currentSets.length) return false;
  const current = currentSets.filter(s => s && s.done);
  if (!current.length) return false;
  const score = (s) => {
    if (mode === 'bodyweight_reps') return parseFloat(s.reps || 0);
    if (mode === 'amrap') return parseFloat(s.rounds || 0);
    if (mode === 'time') return parseFloat(s.sec || 0);
    if (mode === 'time_speed') return parseFloat(s.min || 0) * (parseFloat(s.spm || 0) || 1);
    if (mode === 'carry') return parseFloat(s.kg || 0) * (parseFloat(s.m || 0) || 1);
    if (mode === 'multistage') {
      // drop supersets keep their numbers in stage0..N — headline on the heavy stage
      const s0 = s.stage0 || {};
      return parseFloat(s0.kg || 0) * (parseFloat(s0.reps || 0) || 1);
    }
    // weight_reps: tonnage proxy
    return parseFloat(s.kg || 0) * (parseFloat(s.reps || 0) || 1);
  };
  const bestNow = Math.max(...current.map(score));
  const bestPrev = score(prev.set);
  return bestNow > bestPrev;
}

// ========== REST TIMER ==========
let _restHandle = null;
let _restRemaining = 0;
let _restTotal = 0;

// Screen Wake Lock — keep the display on while a timer runs (HTTPS only)
let _wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) _wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* unsupported or denied — fail silently */ }
}
function releaseWakeLock() {
  try { _wakeLock?.release(); } catch (e) {}
  _wakeLock = null;
}
// Re-acquire if the user tabs away and back while a timer is still running
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _restHandle && !_wakeLock) requestWakeLock();
});

function restDurationFor(ex) {
  if (!ex) return 60;
  const mode = ex.inputMode;
  if (mode === 'time' || mode === 'time_speed' || mode === 'bodyweight_reps') return 60;
  const m = (ex.reps || '').match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) {
    const max = +m[2];
    if (max <= 8) return 120;
    if (max <= 12) return 90;
    return 60;
  }
  const single = (ex.reps || '').match(/(\d+)/);
  if (single) {
    const n = +single[1];
    if (n <= 5) return 120;
    if (n <= 8) return 90;
  }
  return 60;
}

function startRestTimer(seconds, label = 'Rest') {
  cancelRestTimer();
  _restTotal = seconds;
  _restRemaining = seconds;
  const bar = document.getElementById('restBar');
  if (!bar) return;
  bar.hidden = false;
  bar.classList.remove('done');
  document.body.classList.add('rest-active');
  requestWakeLock();
  const labelEl = document.querySelector('.rest-bar-label');
  if (labelEl) labelEl.textContent = label;
  updateRestBar();
  _restHandle = setInterval(() => {
    _restRemaining -= 1;
    updateRestBar();
    if (_restRemaining <= 0) finishRestTimer();
  }, 1000);
}

function cancelRestTimer() {
  if (_restHandle) clearInterval(_restHandle);
  _restHandle = null;
  releaseWakeLock();
  const bar = document.getElementById('restBar');
  if (bar) bar.hidden = true;
  document.body.classList.remove('rest-active');
}

function finishRestTimer() {
  if (_restHandle) clearInterval(_restHandle);
  _restHandle = null;
  releaseWakeLock();
  if (navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (e) {}
  const bar = document.getElementById('restBar');
  if (!bar) return;
  bar.classList.add('done');
  document.getElementById('restRemaining').textContent = 'Go';
  setTimeout(() => {
    if (bar) bar.hidden = true;
    document.body.classList.remove('rest-active');
  }, 2400);
}

function adjustRestTimer(delta) {
  if (!_restHandle) return;
  _restRemaining = Math.max(0, _restRemaining + delta);
  _restTotal = Math.max(_restTotal, _restRemaining);
  updateRestBar();
}

function updateRestBar() {
  const m = Math.floor(Math.max(0, _restRemaining) / 60);
  const s = (Math.max(0, _restRemaining) % 60).toString().padStart(2, '0');
  const el = document.getElementById('restRemaining');
  if (el) el.textContent = `${m}:${s}`;
  const fill = document.getElementById('restFill');
  if (fill) {
    const pct = _restTotal > 0 ? Math.max(0, Math.min(100, (_restRemaining / _restTotal) * 100)) : 0;
    fill.style.width = pct + '%';
  }
}

// ========== ACTIVE EXERCISE EMPHASIS ==========
function refreshActiveExercise() {
  const list = document.getElementById('exerciseList');
  if (!list) return;
  const exercises = list.querySelectorAll('.exercise');
  let activeFound = false;
  exercises.forEach(el => {
    el.classList.remove('active', 'completed');
    const setRows = el.querySelectorAll('.set-input, .ms-set');
    if (!setRows.length) return;
    const allDone = [...setRows].every(r => r.classList.contains('done'));
    if (allDone) {
      el.classList.add('completed');
    } else if (!activeFound) {
      el.classList.add('active');
      activeFound = true;
    }
  });
}

// ========== PR FLASH ==========
function maybeFlashPR(row, exKey, ex, mode) {
  const id = state.selectedWorkout;
  const dKey = today();
  const exLog = state.setLog[dKey]?.[id]?.[exKey] || [];
  const prev = findPreviousBest(id, exKey);
  if (!prev) return;
  if (!isCurrentBeating(exLog, prev, mode)) return;
  // Update prev-chip in the parent exercise card
  const exCard = row.closest('.exercise');
  const chip = exCard?.querySelector('.exercise-prev');
  if (chip && !chip.classList.contains('beaten')) {
    chip.classList.add('beaten');
    chip.innerHTML = chip.innerHTML.replace(/^[^l]*last/, '↑ last') + ' · beaten';
  }
  // Flash the row briefly
  row.classList.add('pr-flash');
  setTimeout(() => row.classList.remove('pr-flash'), 1400);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

// ========== TABS ==========
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'lifts') renderLifts(); // recompute from latest logs on open
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ========== PROGRAM SWITCHER ==========
document.querySelectorAll('.prog-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const prog = btn.dataset.program;
    if (state.program === prog) return;
    state.program = prog;
    document.querySelectorAll('.prog-btn').forEach(b => b.classList.toggle('active', b === btn));
    // Only today's pick resets to the new program's next day — past dates keep their history.
    if (state.workoutByDate) delete state.workoutByDate[today()];
    const pick = getSelectedWorkoutForToday();
    const fits = getActiveSequence().includes(pick) || pick === 'homecore';
    setSelectedWorkoutForToday(fits ? pick : (nextDayThisWeek() || getActiveSequence()[0]));
    save();
    renderToday();
    renderHeader();
    renderWeeklyLog();
  });
});

// ========== HEADER ==========
const RESET_BADGE = { reset_a: 'A', reset_b: 'B', reset_c: 'C', reset_swim: 'Swim', reset_z2: 'Z2', reset_hill: 'Hill', reset_home: 'Hm' };
function renderHeader() {
  document.getElementById('currentWeek').textContent = weekNumber();
  const streakLabel = document.getElementById('streakLabel');
  if (isReset()) {
    if (streakLabel) streakLabel.textContent = 'Sessions';
    document.getElementById('streakBadge').textContent = new Set(state.sessions.map(s => s.date + s.workoutId)).size;
  } else {
    if (streakLabel) streakLabel.textContent = 'Streak';
    document.getElementById('streakBadge').textContent = computeStreak();
  }
  // Header shows the 7-day rolling average — the real trend, not the daily ±1 kg.
  const avg = rollingAvgWeight();
  document.getElementById('weightBadge').textContent = avg != null ? avg.toFixed(1) : DATA.startKg.toFixed(1);
  const sel = state.selectedWorkout;
  const ws = DATA.workouts.find(w => w.id === sel);
  document.getElementById('dayBadge').textContent = ws ? (RESET_BADGE[ws.id] || ws.id.replace('homecore', 'Hc').replace('day', 'D').replace('oman', 'O')) : '—';
  const sd = state.startDate;
  document.getElementById('startDate').textContent = sd ? fmtDate(sd) : '--';
  document.getElementById('todayDate').textContent = fmtDate(today());
}

const STREAK_REST_ALLOWANCE = 2; // consecutive non-session days that don't break it

// Rest-day-aware streak: counts session days walking back from today (or from
// the pause date while paused). Up to 2 consecutive non-session days are rest,
// not a break, and any day inside a past pause span is skipped entirely.
function computeStreak() {
  if (!state.sessions?.length) return 0;
  const dates = new Set(state.sessions.map(s => s.date));
  const spans = state.pauseSpans || [];
  const inPause = iso => spans.some(p => iso >= p.from && iso < p.to);
  const d = isPaused() ? parseIso(state.pausedAt) : parseIso(today());
  let streak = 0, gap = 0;
  for (let i = 0; i < 730; i++, d.setDate(d.getDate() - 1)) {
    const iso = localIso(d);
    if (dates.has(iso)) { streak++; gap = 0; continue; }
    if (inPause(iso)) continue;
    if (++gap > STREAK_REST_ALLOWANCE) break;
  }
  return streak;
}

// ========== TODAY: DAY PICKER ==========
function renderDayPicker() {
  const wrap = document.getElementById('dayPicker');
  const done = daysDoneInWeek(weekNumber());
  const next = nextDayThisWeek();
  const seq = getActiveSequence();
  // For RHN, include homecore as a rest day option. For Oman, show only the 5-day cycle.
  const showHomecore = state.program === 'rhn';
  wrap.innerHTML = DATA.workouts.filter(w => {
    if (isReset()) return seq.includes(w.id) || RESET_EXTRAS.includes(w.id);
    if (w.special && w.id !== 'homecore') return false;
    if (w.id === 'homecore') return showHomecore;
    return seq.includes(w.id);
  }).map((w, i) => {
    const isDone = done.has(w.id);
    const cls = ['day-pill'];
    if (state.selectedWorkout === w.id) cls.push('active');
    if (isDone) cls.push('done');
    if (w.id === next) cls.push('next');
    return `
    <button class="${cls.join(' ')}" data-id="${w.id}">
      <div class="day-pill-num">${isReset() ? (RESET_EXTRAS.includes(w.id) ? 'Move' : 'Session ' + RESET_BADGE[w.id]) : w.id === 'homecore' ? 'Home · core' : 'Day 0' + (i + 1)}${isDone ? '<span class="day-pill-check">✓</span>' : ''}</div>
      <div class="day-pill-name">${w.name.split('+')[0].replace(/^[ABC] · /, '').trim()}</div>
    </button>`;
  }).join('');

  // "This week" status line under the picker: how many of Day 1–5 are in, next up.
  const statusEl = document.getElementById('weekStatus');
  if (statusEl) {
    const wk = weekNumber();
    const n = done.size;
    const activeSeq = getActiveSequence();
    if (isReset()) {
      const nextTxt = next ? ` · next up <strong>Session ${RESET_BADGE[next]}</strong>` : ' · any Move session from here';
      statusEl.innerHTML = `This week <strong>${n} ✓</strong> · target ${weekTarget(wk)}${n >= fullWeekAt(wk) ? ' · full week ✓' : ''}${nextTxt}`;
    } else {
    const nextLabel = next ? (state.program === 'oman' ? 'Oman ' : 'Day ') + (activeSeq.indexOf(next) + 1) : null;
    let html = `Week ${wk} · <strong>${n}/5</strong> done`
      + (n >= 5 ? ' · week complete 🔥' : (nextLabel ? ` · next up <strong>${nextLabel}</strong>` : ''));
    if (n === 0 && wk > 1) {
      const prevDone = daysDoneInWeek(wk - 1).size;
      if (prevDone > 0) html += ` · last week <strong>${prevDone}/5</strong>`;
    }
    statusEl.innerHTML = html;
    }
  }

  wrap.querySelectorAll('.day-pill').forEach(b => {
    b.addEventListener('click', () => {
      setSelectedWorkoutForToday(b.dataset.id);
      save();
      renderToday();
      renderHeader();
      requestAnimationFrame(() => {
        const card = document.getElementById('workoutCard');
        if (card && !card.hidden) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
}

// ========== TODAY: INFO LISTS (no checkboxes) ==========
function renderInfoList(elId, items) {
  const el = document.getElementById(elId);
  el.innerHTML = items.map(it => `
    <div class="info-row">
      <div class="info-body">
        <div class="info-name">${it.name}</div>
        <div class="info-note">${it.note}</div>
      </div>
      <div class="info-spec">${it.spec}</div>
    </div>
  `).join('');
}

// ========== TODAY: WORKOUT ==========
function renderWorkout() {
  const card = document.getElementById('workoutCard');
  const id = state.selectedWorkout;
  if (!id) { card.hidden = true; return; }
  const w = getWorkout(id);
  if (!w) { card.hidden = true; return; }
  card.hidden = false;
  document.getElementById('workoutTitle').textContent = w.name;
  const lastDone = [...(state.sessions || [])].reverse().find(s => s.workoutId === id && s.date !== today());
  const lastDoneTag = lastDone ? ' · Last done ' + fmtDate(lastDone.date) : '';
  document.getElementById('workoutSubtitle').textContent = w.tagline + (isReset() ? '' : ' · Phase ' + (w._phase || phaseNumber())) + lastDoneTag;

  const warmupEl = document.getElementById('workoutWarmup');
  if (warmupEl) {
    warmupEl.hidden = !w.warmup;
    warmupEl.textContent = w.warmup || '';
  }

  // Hip-IR self-test gating: on lower day, if internal rotation came back
  // limited (and symmetric, which a single value implies), don't fight the
  // stance in lifts — manage the toe-out in gait instead.
  const gatedNote = document.getElementById('workoutGatedNote');
  if (gatedNote) {
    if (id === 'day2' && state.baseline && state.baseline.hipIR === 'limited') {
      gatedNote.hidden = false;
      gatedNote.textContent = 'Your hip internal-rotation test came back limited — likely anatomical (femoral retroversion). Don\'t force a narrow/toes-forward squat stance. Let the feet turn out, keep knees over toes, and manage the toe-out in walking, not under the bar.';
    } else {
      gatedNote.hidden = true;
      gatedNote.textContent = '';
    }
  }

  // Always log to today. Past sessions are never shown as filled-in fields —
  // their numbers appear as faint placeholders + the "last ·" chip instead.
  const dKey = today();
  const log = state.setLog[dKey] && state.setLog[dKey][id] ? state.setLog[dKey][id] : {};

  const list = document.getElementById('exerciseList');
  let totalSets = 0, doneSets = 0;
  list.innerHTML = w.blocks.filter(block => !block.gated || gateActive(block.gated)).map((block, bIdx) => `
    <section class="exercise-block${isReset() && bIdx === 0 && /^Floor/.test(block.title) ? ' floor-block' : ''}${isReset() && bIdx > 0 && !(log && Object.keys(log).some(k => k.startsWith(block.title + '::'))) ? ' collapsed' : ''}">
      <button type="button" class="block-title">
        <span class="block-title-text">${esc(blockLabel(block.title))}</span>
        <span class="block-toggle" aria-hidden="true"></span>
      </button>
      <div class="exercise-block-body">
    ${block.exercises.map((ex, exIdx) => {
      const baseExKey = `${block.title}::${exIdx}${ex._alt ? '~alt' : ''}`;
      const swapKey = `${dKey}::${id}::${baseExKey}`;
      const swapped = !!(ex.sub && state.swaps && state.swaps[swapKey]);
      // Swapped work logs under its own ~sub slot and drops barbell math (the sub is a DB/band/bodyweight move).
      const exKey = baseExKey + (swapped ? '~sub' : '');
      const exForLog = swapped ? { ...ex, barbell: false } : ex;
      const exLog = log[exKey] || [];
      const mode = ex.inputMode || 'weight_reps';
      const prev = findPreviousBest(id, exKey);
      const beating = isCurrentBeating(exLog, prev, mode);
      const lastSets = findLastSessionSets(id, exKey);
      const lastVal = (s, field, stageIdx) => {
        const src = stageIdx != null ? lastSets[s]?.[`stage${stageIdx}`] : lastSets[s];
        const v = src?.[field];
        return v !== undefined && v !== '' ? String(v) : null;
      };

      let bodyHTML = '';
      if (mode === 'multistage') {
        let setsHTML = '';
        for (let s = 0; s < ex.sets; s++) {
          totalSets += 1;
          const setData = exLog[s] || {};
          if (setData.done) doneSets += 1;
          const stagesHTML = ex.stages.map((stage, si) => {
            const sd = setData[`stage${si}`] || {};
            const suggKg = suggestedKgFor(id, exKey, exForLog, si);
            const kgPh = suggKg != null ? String(suggKg) : (lastVal(s, 'kg', si) ?? 'kg');
            const repPh = lastVal(s, 'reps', si) ?? 'rep';
            return `
              <div class="ms-stage" data-stage="${si}">
                <span class="ms-label">${stage.label}</span>
                <div class="ms-inputs">
                  <input type="number" placeholder="${esc(kgPh)}" value="${esc(sd.kg ?? '')}" data-field="kg" inputmode="decimal" />
                  <span>×</span>
                  <input type="number" placeholder="${esc(repPh)}" value="${esc(sd.reps ?? '')}" data-field="reps" inputmode="numeric" />
                </div>
              </div>
            `;
          }).join('');
          setsHTML += `
            <div class="ms-set ${setData.done ? 'done' : ''}" data-ex="${exKey}" data-set="${s}" data-mode="multistage">
              <div class="ms-set-label">Set ${s + 1}</div>
              ${stagesHTML}
            </div>
          `;
        }
        bodyHTML = `<div class="ms-sets">${setsHTML}</div>`;
      } else {
        const fields = inputFieldsForMode(mode, swapped ? null : ex);
        const suggKg = (mode === 'weight_reps') ? suggestedKgFor(id, exKey, exForLog) : null;
        const isBarbell = exForLog.barbell === true;
        const barWeight = ex.bar ?? 20;
        let setRows = '';
        for (let s = 0; s < ex.sets; s++) {
          totalSets += 1;
          const setData = exLog[s] || {};
          if (setData.done) doneSets += 1;
          const innerHTML = fields.map((f, fi) => {
            const sep = fi > 0 ? (f.key === 'reps' && fields[0].key === 'assist' ? '<span>kg ·</span>' : '<span>×</span>') : '';
            let ph;
            if (f.key === 'kg') {
              if (suggKg != null) ph = String(suggKg);
              else ph = lastVal(s, 'kg') ?? (isBarbell ? 'side' : f.label);
            } else {
              ph = lastVal(s, f.key) ?? placeholderFor(f, ex, mode);
            }
            const valStr = setData[f.key] ?? '';
            let extra = '';
            if (isBarbell && f.key === 'kg') {
              extra = `<span class="set-bar-total" data-bar-total>${barTotalText(valStr, barWeight)}</span>`;
            }
            return `${sep}<input type="number" placeholder="${esc(ph)}" value="${esc(valStr)}" data-field="${f.key}" inputmode="${f.inputmode}" style="width:${f.width}px" />${extra}`;
          }).join('');
          // One-tap repeat: only offered when every empty field has a numeric
          // placeholder (last session's number / suggestion) to copy.
          const hasPrev = fields.some(f => lastVal(s, f.key) != null) || (suggKg != null);
          const repeatable = hasPrev && fields.some(f => setData[f.key] === undefined || setData[f.key] === '');
          const repeatBtn = repeatable ? `<button type="button" class="repeat-btn" aria-label="Repeat last session's numbers for set ${s + 1}" title="Repeat last time">✓</button>` : '';
          const timedBtn = ex.timed ? `<button class="timed-go" type="button" data-secs="${ex.timed}">▶ ${ex.timed >= 60 ? Math.floor(ex.timed / 60) + ':' + String(ex.timed % 60).padStart(2, '0') : ex.timed + 's'}</button>` : '';
          setRows += `
            <div class="set-input ${setData.done ? 'done' : ''}" data-ex="${exKey}" data-set="${s}" data-mode="${mode}"${isBarbell ? ` data-barbell="1" data-bar="${barWeight}"` : ''}>
              <span>S${s + 1}</span>
              ${innerHTML}
              ${timedBtn}
              ${repeatBtn}
            </div>
          `;
        }
        bodyHTML = `<div class="set-rows">${setRows}</div>`;
      }

      const prevHTML = prev
        ? `<div class="exercise-prev ${beating ? 'beaten' : ''}" title="From ${fmtDate(prev.date)}">last · ${formatPrev(prev.set, mode, exForLog)}${beating ? ' · beaten' : ''}</div>`
        : '';
      const stallHTML = isStalled(id, exKey, exForLog)
        ? `<div class="exercise-stall">Stalled 3 sessions. Pick one: drop load 10% &amp; rebuild · swap a variation · or fix sleep + food first.</div>`
        : '';
      const painOn = !!(state.pain && state.pain[`${dKey}::${id}::${exKey}`]);
      const cable = usesCableStack(ex) && !swapped;
      const mKey = `${dKey}::${id}::${exKey}`;
      const mSel = cable ? (state.cableMachine?.[mKey] || '') : '';
      const machineHTML = cable ? `
          <div class="cable-machine" data-mkey="${mKey}">
            <span class="cable-machine-label">STACK</span>
            <button type="button" class="cm-chip ${mSel === '1' ? 'on' : ''}" data-m="1">M1</button>
            <button type="button" class="cm-chip ${mSel === '2' ? 'on' : ''}" data-m="2">M2</button>
            <span class="cable-machine-hint">which stack? the two number differently</span>
          </div>` : '';
      const macSel = (ex.machines && !swapped) ? (state.exMachine?.[mKey] || '') : '';
      const machineSelHTML = (ex.machines && !swapped) ? `
          <div class="machine-select" data-mackey="${mKey}">
            <span class="cable-machine-label">MACHINE</span>
            ${ex.machines.map(m => `<button type="button" class="mac-chip ${macSel === m ? 'on' : ''}" data-mac="${esc(m)}">${esc(m)}</button>`).join('')}
            <span class="cable-machine-hint">tag which one — the numbers differ per machine</span>
          </div>` : '';
      const swapBtn = ex.sub
        ? `<button type="button" class="swap-btn ${swapped ? 'on' : ''}" data-swapkey="${swapKey}" title="${swapped ? 'Swap back to the prescribed lift' : 'Taken? Swap to the alternative'}">⇄</button>`
        : '';
      const subHTML = ex.sub
        ? (swapped
            ? `<div class="exercise-sub active"><span class="exercise-sub-tag">DOING INSTEAD</span>${ex.sub}</div>`
            : `<div class="exercise-sub"><span class="exercise-sub-tag">TAKEN?</span>${ex.sub}<span class="exercise-sub-cta"> · tap ⇄ to swap</span></div>`)
        : '';
      return `
        <div class="exercise ${swapped ? 'is-swapped' : ''}">
          <div class="exercise-head">
            <div class="exercise-name">${ex.name}${swapped ? ' <span class="swapped-tag">SWAPPED</span>' : ''}</div>
            <div class="exercise-spec">${ex.sets} × ${ex.reps}</div>
            ${swapBtn}
            <button type="button" class="pain-flag ${painOn ? 'on' : ''}" data-painkey="${dKey}::${id}::${exKey}" title="Flag pain on this exercise">⚑</button>
          </div>
          ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
          ${subHTML}
          ${prevHTML}
          ${stallHTML}
          ${machineHTML}
          ${machineSelHTML}
          ${bodyHTML}
        </div>
      `;
    }).join('')}
      </div>
    </section>
  `).join('');

  // Block collapse/expand toggle
  list.querySelectorAll('.exercise-block .block-title').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.exercise-block').classList.toggle('collapsed');
    });
  });

  renderSessionProgress(doneSets, totalSets, ...floorProgress(w, log, dKey, id));

  // Set input handlers — input event saves state, change event auto-fills
  list.querySelectorAll('.set-input, .ms-set').forEach(row => {
    const exKey = row.dataset.ex;
    const setIdx = +row.dataset.set;
    const mode = row.dataset.mode;
    const ex = findExerciseByKey(w, exKey);
    // ✓ repeat: copy numeric placeholders into empty fields, then fire the same
    // 'input' handler a keystroke would — one save path, one done/PR/rest flow.
    row.querySelector('.repeat-btn')?.addEventListener('click', () => {
      const empties = [...row.querySelectorAll('input[data-field]')].filter(i => i.value === '');
      const fillable = empties.filter(i => i.placeholder !== '' && Number.isFinite(Number(i.placeholder)));
      if (!fillable.length || fillable.length !== empties.length) {
        showToast('No last-session numbers to repeat — enter them once');
        return;
      }
      fillable.forEach(i => { i.value = i.placeholder; });
      fillable.forEach(i => i.dispatchEvent(new Event('input', { bubbles: true })));
    });
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (!state.setLog[dKey]) state.setLog[dKey] = {};
        if (!state.setLog[dKey][id]) state.setLog[dKey][id] = {};
        if (!state.setLog[dKey][id][exKey]) state.setLog[dKey][id][exKey] = [];
        if (!state.setLog[dKey][id][exKey][setIdx]) state.setLog[dKey][id][exKey][setIdx] = {};
        const setData = state.setLog[dKey][id][exKey][setIdx];
        const wasDone = !!setData.done;
        const field = input.dataset.field;
        if (mode === 'multistage') {
          const stageEl = input.closest('.ms-stage');
          const stageIdx = stageEl ? stageEl.dataset.stage : '0';
          const stageKey = `stage${stageIdx}`;
          if (!setData[stageKey]) setData[stageKey] = {};
          setData[stageKey][field] = input.value;
          setData.done = isMultiStageDone(setData, ex);
        } else {
          const fields = inputFieldsForMode(mode, exKey.endsWith('~sub') ? null : ex);
          setData[field] = input.value;
          setData.done = fields.every(f => setData[f.key] !== undefined && setData[f.key] !== '');
          // Live update of the bar total next to this kg input
          if (ex.barbell && field === 'kg') {
            const tot = row.querySelector('[data-bar-total]');
            if (tot) tot.textContent = barTotalText(input.value, ex.bar ?? 20);
          }
        }
        // Stamp the chosen cable stack onto this set so the number stays interpretable.
        const mSel = state.cableMachine?.[`${dKey}::${id}::${exKey}`];
        if (mSel) setData.m = mSel;
        const macSel = state.exMachine?.[`${dKey}::${id}::${exKey}`];
        if (macSel) setData.mac = macSel;
        if (setData.done) row.classList.add('done');
        else row.classList.remove('done');
        save();
        refreshSessionProgress();
        refreshActiveExercise();

        // Set transitioned to done — start rest timer + check for PR
        if (!wasDone && setData.done) {
          startRestTimer(restDurationFor(ex));
          maybeFlashPR(row, exKey, ex, mode);
          // Auto-record the session so the day-pill shows ✓ even if you
          // never scroll down to press "Mark session complete".
          if (!state.sessions.some(s => s.date === dKey && s.workoutId === id)) {
            state.sessions.push({ date: dKey, workoutId: id, name: w.name });
            save();
            renderDayPicker();
            renderHeader();
          }
        }
        refreshFinishButtons();
      });

      // On blur (change), auto-fill this weight into every matching empty field.
      // Enter a weight once → it propagates everywhere it logically repeats.
      input.addEventListener('change', () => {
        if (input.dataset.field !== 'kg' || !input.value) return;
        const val = input.value;
        const exLog = state.setLog[dKey]?.[id]?.[exKey];
        if (!exLog) return;

        const fillKg = (s, stageIdx) => {
          let tRow, tIn, tot;
          if (mode === 'multistage') {
            tRow = list.querySelector(`.ms-set[data-ex="${CSS.escape(exKey)}"][data-set="${s}"]`);
            tIn = tRow?.querySelector(`.ms-stage[data-stage="${stageIdx}"] input[data-field="kg"]`);
          } else {
            tRow = list.querySelector(`.set-input[data-ex="${CSS.escape(exKey)}"][data-set="${s}"]`);
            tIn = tRow?.querySelector('input[data-field="kg"]');
            tot = tRow?.querySelector('[data-bar-total]');
          }
          if (tIn && !tIn.value) tIn.value = val;
          if (tot && ex.barbell) tot.textContent = barTotalText(val, ex.bar ?? 20);
        };

        if (mode === 'multistage') {
          // R and L of a stage-pair share one weight; every set repeats it.
          const stageEl = input.closest('.ms-stage');
          if (!stageEl) return;
          const stageIdx = +stageEl.dataset.stage;
          const pairBase = stageIdx - (stageIdx % 2);          // 0,1 → 0 · 2,3 → 2
          const pairStages = [pairBase, pairBase + 1].filter(i => ex.stages[i]);
          for (let s = 0; s < ex.sets; s++) {
            if (!exLog[s]) exLog[s] = {};
            for (const st of pairStages) {
              const k = `stage${st}`;
              if (!exLog[s][k]) exLog[s][k] = {};
              if (s === setIdx && st === stageIdx) continue;    // skip the one just typed
              if (!exLog[s][k].kg) { exLog[s][k].kg = val; fillKg(s, st); }
            }
          }
        } else {
          // Plain / barbell: same weight across every empty set
          for (let s = 0; s < ex.sets; s++) {
            if (s === setIdx) continue;
            if (!exLog[s]) exLog[s] = {};
            if (!exLog[s].kg) { exLog[s].kg = val; fillKg(s); }
          }
        }
        save();
      });
    });
  });

  refreshActiveExercise();

  // Per-set notes — long-press (mobile) or right-click (desktop), zero clutter
  list.querySelectorAll('.set-input, .ms-set').forEach(row => {
    const exKey = row.dataset.ex;
    const setIdx = +row.dataset.set;
    const openNote = (e) => {
      e.preventDefault();
      const sd = state.setLog[dKey]?.[id]?.[exKey]?.[setIdx];
      const current = sd?.note || '';
      const note = window.prompt('Note for this set (e.g. felt strong, form broke):', current);
      if (note === null) return;
      if (!state.setLog[dKey]) state.setLog[dKey] = {};
      if (!state.setLog[dKey][id]) state.setLog[dKey][id] = {};
      if (!state.setLog[dKey][id][exKey]) state.setLog[dKey][id][exKey] = [];
      if (!state.setLog[dKey][id][exKey][setIdx]) state.setLog[dKey][id][exKey][setIdx] = {};
      const trimmed = note.trim();
      state.setLog[dKey][id][exKey][setIdx].note = trimmed;
      row.classList.toggle('has-note', !!trimmed);
      row.title = trimmed || '';
      save();
    };
    // right-click (desktop)
    row.addEventListener('contextmenu', openNote);
    // long-press (mobile)
    let pressTimer = null;
    row.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'INPUT') return; // don't hijack typing
      pressTimer = setTimeout(() => openNote(e), 550);
    }, { passive: true });
    ['touchend', 'touchmove', 'touchcancel'].forEach(evt =>
      row.addEventListener(evt, () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }, { passive: true })
    );
    // initial dot state
    const sd = state.setLog[dKey]?.[id]?.[exKey]?.[setIdx];
    if (sd?.note) { row.classList.add('has-note'); row.title = sd.note; }
  });

  // Timed-set buttons (1-min arm finisher, etc.)
  list.querySelectorAll('.timed-go').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const secs = +btn.dataset.secs;
      startRestTimer(secs, 'Go');
    });
  });

  // Pain flags — toggle, store for pattern-spotting
  list.querySelectorAll('.pain-flag').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.painkey;
      state.pain = state.pain || {};
      if (state.pain[key]) { delete state.pain[key]; btn.classList.remove('on'); }
      else { state.pain[key] = true; btn.classList.add('on'); showToast('Pain flagged — ease off, no hero sets'); }
      save();
    });
  });

  // Exercise swap — equipment taken → do the alternative, logged to its own slot
  list.querySelectorAll('.swap-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.swapkey;
      state.swaps = state.swaps || {};
      if (state.swaps[key]) { delete state.swaps[key]; showToast('Back to the prescribed lift'); }
      else { state.swaps[key] = true; showToast('Swapped — your numbers log separately'); }
      save();
      renderWorkout();
    });
  });

  // Cable-stack tag — remember which machine, stamp it onto this session's sets
  list.querySelectorAll('.cable-machine').forEach(row => {
    const mKey = row.dataset.mkey;
    const exKey = mKey.split('::').slice(2).join('::');
    row.querySelectorAll('.cm-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.cableMachine = state.cableMachine || {};
        const m = chip.dataset.m;
        if (state.cableMachine[mKey] === m) delete state.cableMachine[mKey];
        else state.cableMachine[mKey] = m;
        const sets = state.setLog[dKey]?.[id]?.[exKey];
        if (Array.isArray(sets)) sets.forEach(s => { if (s) s.m = state.cableMachine[mKey]; });
        save();
        renderWorkout();
      });
    });
  });

  // Machine tag — remember which machine (treadmill / stairmaster / bike …) so a
  // multi-machine cardio log stays accurate; stamp it onto this session's sets.
  list.querySelectorAll('.machine-select').forEach(row => {
    const macKey = row.dataset.mackey;
    const exKey = macKey.split('::').slice(2).join('::');
    row.querySelectorAll('.mac-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.exMachine = state.exMachine || {};
        const m = chip.dataset.mac;
        if (state.exMachine[macKey] === m) delete state.exMachine[macKey];
        else state.exMachine[macKey] = m;
        const sets = state.setLog[dKey]?.[id]?.[exKey];
        if (Array.isArray(sets)) sets.forEach(s => { if (s) s.mac = state.exMachine[macKey]; });
        save();
        renderWorkout();
      });
    });
  });

  const btn = document.getElementById('finishWorkoutBtn');
  btn.onclick = () => {
    if (!isSessionLogged()) {
      state.sessions.push({ date: dKey, workoutId: id, name: w.name });
      save();
    }
    showToast('Session logged');
    renderWorkout();
    renderHeader();
    renderProgress();
  };

  // Escape hatch: wipe today's entries for this workout and start it clean.
  const clearBtn = document.getElementById('clearTodayBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (!confirm(`Clear everything logged today for ${w.name}? Past sessions are not touched.`)) return;
      if (state.setLog[dKey]) {
        delete state.setLog[dKey][id];
        if (!Object.keys(state.setLog[dKey]).length) delete state.setLog[dKey];
      }
      state.sessions = state.sessions.filter(s => !(s.date === dKey && s.workoutId === id));
      const prefix = `${dKey}::${id}::`;
      for (const map of [state.swaps, state.cableMachine, state.exMachine, state.pain]) {
        if (!map) continue;
        for (const k of Object.keys(map)) if (k.startsWith(prefix)) delete map[k];
      }
      save();
      showToast("Today's log cleared");
      renderToday();
      renderHeader();
      renderProgress();
    };
  }
  refreshFinishButtons();
}

function isSessionLogged() {
  const id = state.selectedWorkout, t = today();
  return state.sessions.some(s => s.date === t && s.workoutId === id);
}

function refreshFinishButtons() {
  const id = state.selectedWorkout;
  const logged = isSessionLogged();
  const btn = document.getElementById('finishWorkoutBtn');
  if (btn) {
    btn.textContent = logged ? 'Session logged' : 'Mark session complete';
    btn.classList.toggle('done', logged);
  }
  const clearBtn = document.getElementById('clearTodayBtn');
  if (clearBtn) clearBtn.hidden = !(logged || state.setLog[today()]?.[id]);
}

// The most recent PAST session's sets for an exercise (today excluded) — used
// to show last time's numbers as placeholders in today's empty fields.
function findLastSessionSets(workoutId, exKey) {
  const t = today();
  const dates = Object.keys(state.setLog || {}).filter(d => d < t).sort().reverse();
  for (const d of dates) {
    const sets = state.setLog[d]?.[workoutId]?.[exKey];
    if (Array.isArray(sets) && sets.some(s => s && s.done)) return sets;
  }
  return [];
}

function renderToday() {
  renderDayPicker();
  renderInfoList('ritualList', DATA.morningRitual);
  renderInfoList('resetList', DATA.mobilityReset);
  renderInfoList('dailyList', DATA.daily);
  renderInfoList('staminaList', DATA.stamina);
  renderReadiness();
  renderWorkout();
  renderPrayer();
  renderOffice();
  renderModeBanner();

  applyResetLayout();

  const w = getWorkout(state.selectedWorkout);
  document.getElementById('todayTitle').textContent = w ? w.name : "Today's session";
  document.getElementById('todaySub').textContent = w ? w.blurb : "Pick what fits your week. Don't stack delts back-to-back.";
  document.getElementById('todayTag').textContent = w ? w.tagline : 'Show up';
}

// Reset: workout first, everything else out of the way. RHN keeps its full layout.
function applyResetLayout() {
  const r = isReset();
  const cardOf = id => document.getElementById(id)?.closest('.card');
  document.querySelector('.escape-links')?.toggleAttribute('hidden', r);
  [cardOf('resetList'), cardOf('staminaList'), cardOf('officeRotator')].forEach(c => c && (c.hidden = r));
  if (r) [cardOf('ritualList'), cardOf('dailyList')].forEach(c => c?.classList.add('collapsed'));
  const cue = document.querySelector('.workout-cue');
  if (cue) cue.innerHTML = r ? effortCue()
    : 'Working sets · stop <strong>1–2 reps shy of failure</strong> · slow 3-sec lower on isolation';
  // Workouts tab + Protocol copy that was written for the old 16-week RHN block
  const wHero = document.querySelector('#view-workouts .hero');
  if (wHero && r) {
    wHero.querySelector('.hero-eyebrow').textContent = 'Reset · 3 sessions + Move';
    wHero.querySelector('.hero-title').textContent = 'The sessions';
    wHero.querySelector('.hero-sub').textContent = 'Go A → B → C in order, any weekday. Missed one? Just do the next. The first block of each is a full session.';
  }
  document.getElementById('plateTarget')?.closest('.card')?.toggleAttribute('hidden', r);
  renderTodayNudge();
  renderVariantCard();
  renderCheckinPrompt('today');
  // Prayer card after the workout; program switcher lives on the Protocol tab.
  const prayer = document.getElementById('prayerCard');
  const workout = document.getElementById('workoutCard');
  if (r && prayer && workout && workout.nextElementSibling !== prayer) workout.after(prayer);
  const sw = document.querySelector('.program-switcher');
  const proto = document.getElementById('view-protocol');
  if (sw && proto && sw.parentElement !== proto) proto.prepend(sw);
  document.querySelector('.logo-mark').textContent = r ? 'Reset' : 'RHN Protocol';
  document.querySelector('.logo-sub').innerHTML = `Wk <span id="currentWeek">${weekNumber()}</span>/${r ? DATA.totalWeeks : 16}`;
}

// ===== Reset helpers: labels, effort, holidays, comebacks =====
function blockLabel(title) {
  if (!isReset()) return title;
  if (/^Floor · superset/.test(title)) return 'Minimum · ~15 min — this alone = full session';
  if (/^Floor · /.test(title)) return title.replace(/^Floor · /, 'Minimum · ') + ' — this alone counts';
  return title;
}
function isHolidayWeek(wk) { return isReset() && wk >= 7 && wk <= 9; }
function isRamadanHold(wk) { return isReset() && (state.ramadan || (wk >= 14 && wk <= 19)); }
function weekTarget(wk) { return isHolidayWeek(wk) ? '1–2 (holidays: 1 = full week)' : isRamadanHold(wk) ? '2 (Ramadan)' : '2–3'; }
function fullWeekAt(wk) { return isHolidayWeek(wk) ? 1 : 2; }
function hasLoggedToday() {
  const day = state.setLog?.[today()];
  return !!day && Object.values(day).some(wl => Object.values(wl || {}).some(sets => Array.isArray(sets) && sets.some(x => x && x.done)));
}
function lastTrainingDate() {
  const t = today();
  let last = null;
  for (const s of (state.sessions || [])) if (s.date < t && (!last || s.date > last)) last = s.date;
  for (const d of Object.keys(state.setLog || {})) {
    if (d >= t || (last && d <= last)) continue;
    const has = Object.values(state.setLog[d] || {}).some(wl => Object.values(wl || {}).some(sets => Array.isArray(sets) && sets.some(x => x && x.done)));
    if (has) last = d;
  }
  return last;
}
function effortCue() {
  const wk = weekNumber();
  const last = lastTrainingDate();
  const gap = last ? Math.round((parseIso(today()) - parseIso(last)) / 86400000) : null;
  if (gap != null && gap >= 10 && !hasLoggedToday()) {
    return `<strong>Welcome back — ${gap} days off.</strong> Today: just the first block, lighter than last time. No catching up.`;
  }
  if (isRamadanHold(wk)) return '<strong>Ramadan:</strong> first block only, 60–90 min after iftar · hold your weights · 2 fewer reps is fine';
  if (wk <= 1) return '<strong>Week 1:</strong> only the first block · stop when <strong>3–4 more reps</strong> were possible';
  if (wk <= 3) return `<strong>Week ${wk}:</strong> first block + one more · stop when <strong>2–3 more reps</strong> were possible`;
  return 'All blocks if you have time · stop when <strong>2 more reps</strong> were possible · first block alone still counts';
}

// One small, dated line on Today: Day 0, waist Saturdays, monthly shoulders + photos.
function renderTodayNudge() {
  let el = document.getElementById('todayNudge');
  if (!el) {
    el = document.createElement('div');
    el.id = 'todayNudge';
    el.className = 'today-nudge';
    document.getElementById('weekStatus')?.after(el);
  }
  const t = today();
  const d = parseIso(t);
  const msgs = [];
  if (isReset() && state.startDate) {
    const daysIn = Math.round((d - parseIso(state.startDate)) / 86400000);
    const hasWaistSince = since => (state.waists || []).some(x => x.date >= since);
    if (daysIn >= 0 && daysIn <= 6 && !(state.baselineDay0 && state.baselineDay0.date)) {
      msgs.push('<strong>Day 0 · 5 min:</strong> weigh in, waist at the navel, knee-to-wall L/R, and 3 photos (front, side, back) to your camera roll. <button type="button" class="nudge-btn" id="day0Btn">Log Day 0</button>');
    } else if (d.getDay() === 6 && daysIn > 0) {
      const wk = weekNumber();
      if (d.getDate() <= 7) msgs.push('<strong>First Saturday:</strong> shoulders + waist (Progress) and 3 photos to the camera roll.');
      else if (wk % 2 === 1 && !hasWaistSince(t)) msgs.push('<strong>Waist day:</strong> tape at the navel, relaxed — Progress tab.');
    }
  }
  el.innerHTML = msgs.join('');
  el.hidden = !msgs.length;
  document.getElementById('day0Btn')?.addEventListener('click', openDay0);
}

function openDay0() {
  const sheet = openSheet();
  const b = state.baseline || {};
  const lastW = (state.waists || []).slice().sort((a, c) => a.date.localeCompare(c.date)).at(-1);
  sheet.innerHTML = `
    <div class="ci-head"><span class="ci-step">Day 0</span><button type="button" class="ci-x" data-close>✕</button></div>
    <h2 class="ci-title">Your starting point</h2>
    <p class="ci-sub">Two minutes. This is what week 10 compares against. Photos stay in your camera roll — the app never stores them.</p>
    <label class="ci-field"><span>Waist at the navel (cm)</span><input type="number" step="0.1" inputmode="decimal" id="d0Waist" value="${lastW && lastW.date >= weekWindow(0).start ? lastW.cm : ''}" placeholder="e.g. 94.0"></label>
    <label class="ci-field"><span>Hips at the widest point (cm) · optional</span><input type="number" step="0.1" inputmode="decimal" id="d0Hip" value="${b.hip ?? ''}" placeholder="e.g. 105"></label>
    <label class="ci-field"><span>Knee-to-wall LEFT (cm)</span><input type="number" step="0.5" inputmode="decimal" id="d0KneeL" value="${b.kneeL ?? ''}" placeholder="toe-to-wall distance"></label>
    <label class="ci-field"><span>Knee-to-wall RIGHT (cm)</span><input type="number" step="0.5" inputmode="decimal" id="d0KneeR" value="${b.kneeR ?? ''}" placeholder="toe-to-wall distance"></label>
    <div class="ci-q">Photos (front · side · back) in the camera roll?</div>
    <div class="ci-chips" data-k="photos">${chipsHTML(['Done', 'Later'], state.baselineDay0?.photos)}</div>
    <button type="button" class="btn-primary" id="d0Save">Save Day 0</button>`;
  wireChips(sheet, (k, v) => { sheet.dataset[k] = v; });
  sheet.querySelector('#d0Save').addEventListener('click', () => {
    const num = id => { const v = parseFloat(sheet.querySelector(id).value); return Number.isFinite(v) ? v : null; };
    const waist = num('#d0Waist'), kL = num('#d0KneeL'), kR = num('#d0KneeR'), hip = num('#d0Hip');
    if (waist != null) {
      state.waists = (state.waists || []).filter(x => x.date !== today());
      state.waists.push({ date: today(), cm: waist });
    }
    state.baseline = { ...(state.baseline || {}), waist: waist ?? state.baseline?.waist ?? null, hip: hip ?? state.baseline?.hip ?? null, kneeL: kL, kneeR: kR };
    state.baselineDay0 = { date: today(), waist, hip, kneeL: kL, kneeR: kR, photos: sheet.dataset.photos || null };
    save();
    closeSheet();
    renderToday();
    showToast('Day 0 saved');
  });
}

// ===== Bottom-sheet + chip helpers (check-in, Day 0, lift picks) =====
function openSheet() {
  let wrap = document.getElementById('ciWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'ciWrap';
    wrap.className = 'ci-wrap';
    wrap.innerHTML = '<div class="ci-sheet" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) closeSheet(); });
  }
  wrap.hidden = false;
  document.body.classList.add('sheet-open');
  const sheet = wrap.querySelector('.ci-sheet');
  sheet.scrollTop = 0;
  sheet.removeAttribute('data-photos');
  return sheet;
}
function closeSheet() {
  const wrap = document.getElementById('ciWrap');
  if (wrap) wrap.hidden = true;
  document.body.classList.remove('sheet-open');
}
function chipsHTML(opts, selected, multi) {
  const sel = multi ? (selected || []) : [selected];
  return opts.map(o => `<button type="button" class="ci-chip${sel.includes(o) ? ' on' : ''}" data-v="${esc(o)}">${esc(o)}</button>`).join('');
}
function wireChips(root, onPick) {
  root.querySelectorAll('.ci-chips').forEach(group => {
    const multi = group.dataset.multi ? +group.dataset.multi : 0;
    group.querySelectorAll('.ci-chip').forEach(chip => chip.addEventListener('click', () => {
      if (multi) {
        const on = [...group.querySelectorAll('.ci-chip.on')];
        if (chip.classList.contains('on')) chip.classList.remove('on');
        else if (on.length < multi) chip.classList.add('on');
        else { on[0].classList.remove('on'); chip.classList.add('on'); }
        onPick(group.dataset.k, [...group.querySelectorAll('.ci-chip.on')].map(c => c.dataset.v));
      } else {
        group.querySelectorAll('.ci-chip').forEach(c => c.classList.toggle('on', c === chip));
        onPick(group.dataset.k, chip.dataset.v);
      }
    }));
  });
}

// ===== Lift picks: one alternate per main lift, offered in week 5 and week 10 =====
function mainLifts() {
  const out = [];
  DAY_SEQUENCE_RESET.forEach(id => {
    const w = DATA.workouts.find(x => x.id === id);
    w.blocks.forEach(b => b.exercises.forEach((ex, i) => {
      if (ex.alt) out.push({ key: `${id}::${b.title}::${i}`, wid: id, ex });
    }));
  });
  return out;
}
function variantWindow() {
  if (!isReset()) return null;
  const wk = weekNumber();
  if (wk >= 5 && wk <= 6) return 'w5';
  if (wk >= 10 && wk <= 11) return 'w10';
  return null;
}
function renderVariantCard() {
  let card = document.getElementById('variantCard');
  if (!card) {
    card = document.createElement('section');
    card.id = 'variantCard';
    card.className = 'card variant-card';
    document.getElementById('workoutCard')?.before(card);
  }
  const win = variantWindow();
  // Week 10: the check-in comes first; lift picks show once it's done.
  const show = win && !(state.variantWindows && state.variantWindows[win]) && !hasLoggedToday() && !(win === 'w10' && dueCheckin() === 'w10');
  card.hidden = !show;
  if (!show) { card.innerHTML = ''; return; }
  card.innerHTML = `
    <header class="card-header"><h2>Want a change?</h2><span class="card-meta">${win === 'w5' ? 'Week 5' : 'Week 10'} · 30 sec · optional</span></header>
    <p class="coach-note">One alternate per main lift — same muscles, new feel. Keep is the default. Your pick is locked until ${win === 'w5' ? 'week 10' : 'RHN 2.0'}.</p>
    <button type="button" class="btn-primary" id="variantOpenBtn">Pick lifts</button>
    <button type="button" class="btn-ghost" id="variantKeepBtn">Keep everything as is</button>`;
  card.querySelector('#variantOpenBtn').addEventListener('click', openVariantSheet);
  card.querySelector('#variantKeepBtn').addEventListener('click', () => lockVariants(win, null));
}
function lockVariants(win, picks) {
  state.variantWindows = { ...(state.variantWindows || {}), [win]: today() };
  if (picks) state.variants = picks;
  save();
  closeSheet();
  renderToday();
  showToast(picks && Object.keys(picks).length ? 'Locked in — new lifts start today' : 'Keeping everything — locked in');
}
function openVariantSheet() {
  const win = variantWindow() || 'w5';
  const picks = { ...(state.variants || {}) };
  const sheet = openSheet();
  const rows = mainLifts().map(({ key, wid, ex }) => `
    <div class="ci-lift">
      <div class="ci-lift-name"><span class="ci-badge">${RESET_BADGE[wid]}</span>${esc(ex.name)} <span class="ci-arrow">→</span> ${esc(ex.alt.name)}</div>
      <div class="ci-chips" data-k="${esc(key)}">${chipsHTML(['Keep', 'Try alternate'], picks[key] ? 'Try alternate' : 'Keep')}</div>
    </div>`).join('');
  sheet.innerHTML = `
    <div class="ci-head"><span class="ci-step">Lift picks</span><button type="button" class="ci-x" data-close>✕</button></div>
    <h2 class="ci-title">Keep or try?</h2>
    <p class="ci-sub">Alternates keep their own history, so nothing you've logged is lost. You can flip back at the next pick window.</p>
    ${rows}
    <button type="button" class="btn-primary" id="variantSave">Lock it in</button>`;
  wireChips(sheet, (k, v) => { if (v === 'Try alternate') picks[k] = true; else delete picks[k]; });
  sheet.querySelector('#variantSave').addEventListener('click', () => lockVariants(win, picks));
}

// ===== Week-10 check-in ("prompt me later") → RHN 2.0 brief =====
// Reads logs only; answers live in state.checkins (never in setLog).
const CHECKINS = {
  w10: { fromWeek: 10, toWeek: 19, title: 'Week-10 check-in', blurb: "10 weeks in. 3 minutes of taps so RHN 2.0 (from 20 Mar) is built around the real you. Nothing changes until you say so." },
  w18: { fromWeek: 18, toWeek: 19, title: 'Before RHN 2.0', blurb: 'RHN 2.0 starts Sat 20 Mar. 30 seconds: has anything changed?' }
};
function checkinState(id) {
  state.checkins = state.checkins || {};
  return state.checkins[id] || (state.checkins[id] = { answers: {}, step: 0, snoozes: 0, snoozeUntil: null, doneAt: null });
}
function dueCheckin() {
  if (!isReset()) return null;
  const wk = weekNumber();
  for (const id of ['w18', 'w10']) {
    const c = CHECKINS[id];
    const st = state.checkins?.[id];
    if (wk >= c.fromWeek && wk <= c.toWeek && !(st && st.doneAt)) return id;
  }
  return null;
}
function renderCheckinPrompt(where) {
  const hostId = where === 'today' ? 'checkinCardToday' : 'checkinCardProgress';
  let card = document.getElementById(hostId);
  if (!card) {
    card = document.createElement('section');
    card.id = hostId;
    card.className = 'card checkin-card';
    if (where === 'today') document.getElementById('workoutCard')?.before(card);
    else document.querySelector('#view-progress .coach-card')?.after(card);
  }
  const id = dueCheckin();
  const st = id ? checkinState(id) : null;
  let show = !!id;
  if (show && where === 'today') {
    show = !hasLoggedToday() && st.snoozes < 3 && !(st.snoozeUntil && today() < st.snoozeUntil);
  }
  // Progress keeps a done card too, so the brief can be re-copied.
  const doneId = !id && state.checkins && ['w18', 'w10'].find(k => state.checkins[k]?.doneAt);
  if (where === 'progress' && !show && doneId && isReset()) {
    card.hidden = false;
    card.innerHTML = `
      <header class="card-header"><h2>RHN 2.0 brief</h2><span class="card-meta">check-in done ${fmtDate(state.checkins[doneId].doneAt)}</span></header>
      <p class="coach-note">Copy it and paste it into the chat — RHN 2.0 gets built from this.</p>
      <button type="button" class="btn-primary" id="briefCopyBtn2">Copy RHN 2.0 brief</button>`;
    card.querySelector('#briefCopyBtn2').addEventListener('click', copyBrief);
    return;
  }
  card.hidden = !show;
  if (!show) { card.innerHTML = ''; return; }
  const c = CHECKINS[id];
  const resumed = st.step > 0 ? ` · resume at ${st.step + 1}` : '';
  card.innerHTML = `
    <header class="card-header"><h2>${c.title}</h2><span class="card-meta">${id === 'w10' ? '~3 min' : '30 sec'}${resumed}</span></header>
    <p class="coach-note">${c.blurb}</p>
    <button type="button" class="btn-primary" data-ci-open>Start</button>
    ${where === 'today' ? '<button type="button" class="btn-ghost" data-ci-snooze>Not now — ask in 3 days</button>' : ''}`;
  card.querySelector('[data-ci-open]').addEventListener('click', () => openCheckin(id));
  card.querySelector('[data-ci-snooze]')?.addEventListener('click', () => {
    st.snoozes += 1;
    const d = parseIso(today()); d.setDate(d.getDate() + 3);
    st.snoozeUntil = localIso(d);
    save();
    renderCheckinPrompt('today');
    renderCheckinPrompt('progress');
    showToast(st.snoozes >= 3 ? "Okay — it'll wait on the Progress tab" : 'Asking again in 3 days');
  });
}

// --- auto stats (read-only over the logs) ---
function resetWindowSessions(fromWk, toWk) {
  const a = weekWindow(fromWk).start, b = weekWindow(toWk).end;
  const ids = [...DAY_SEQUENCE_RESET, ...RESET_EXTRAS];
  const seen = new Set();
  for (const s of (state.sessions || [])) if (ids.includes(s.workoutId) && s.date >= a && s.date < b) seen.add(s.date + '|' + s.workoutId);
  for (const d of Object.keys(state.setLog || {})) {
    if (d < a || d >= b) continue;
    for (const wid of ids) {
      const wl = state.setLog[d]?.[wid];
      if (wl && Object.values(wl).some(sets => Array.isArray(sets) && sets.some(x => x && x.done))) seen.add(d + '|' + wid);
    }
  }
  return [...seen].map(x => { const [date, workoutId] = x.split('|'); return { date, workoutId }; });
}
function liftHistory(wid, keyBase, ex, alt) {
  const rows = [];
  for (const d of Object.keys(state.setLog || {}).sort()) {
    if (state.startDate && d < state.startDate) continue;
    for (const k of [alt ? keyBase + '~alt' : keyBase]) {
      const sets = (state.setLog[d]?.[wid]?.[k] || []).filter(x => x && x.done);
      if (!sets.length) continue;
      const mode = ex.inputMode || 'weight_reps';
      const best = sets.reduce((m, x) => setScore(x, mode, ex) > setScore(m, mode, ex) ? x : m, sets[0]);
      rows.push({ date: d, alt: k.endsWith('~alt'), best, mode, sets });
    }
  }
  return rows;
}
function computeCheckinAuto() {
  const wk = weekNumber();
  const lastWk = Math.max(1, wk - 1);
  const per = (a, b) => { const n = resetWindowSessions(a, b).length; return b >= a ? +(n / (b - a + 1)).toFixed(1) : 0; };
  const all = resetWindowSessions(1, lastWk);
  const counts = {};
  all.forEach(s => { const k = RESET_BADGE[s.workoutId] || s.workoutId; counts[k] = (counts[k] || 0) + 1; });
  // minimum-only vs fuller sessions for A/B/C
  let minOnly = 0, fuller = 0;
  all.filter(s => DAY_SEQUENCE_RESET.includes(s.workoutId)).forEach(s => {
    const w = DATA.workouts.find(x => x.id === s.workoutId);
    const wl = state.setLog?.[s.date]?.[s.workoutId] || {};
    const beyond = w.blocks.slice(1).some(b => Object.keys(wl).some(k => k.startsWith(b.title + '::') && (wl[k] || []).some(x => x && x.done)));
    if (beyond) fuller += 1; else minOnly += 1;
  });
  const lifts = [];
  DAY_SEQUENCE_RESET.forEach(wid => {
    const w = DATA.workouts.find(x => x.id === wid);
    w.blocks.forEach(b => b.exercises.forEach((ex, i) => {
      if (!(ex.alt || ex.assist || /Dead Hang/.test(ex.name))) return;
      [false, true].forEach(alt => {
        if (alt && !ex.alt) return;
        const exV = alt ? { ...ex, ...ex.alt } : ex;
        const h = liftHistory(wid, `${b.title}::${i}`, exV, alt);
        if (!h.length) return;
        const f = h[0], l = h.at(-1);
        lifts.push({ session: RESET_BADGE[wid], name: exV.name, first: formatPrevRaw(f.best, f.mode, exV), last: formatPrevRaw(l.best, l.mode, exV), firstDate: f.date, lastDate: l.date, sessions: h.length, usedAlt: alt });
      });
    }));
  });
  const swim = (() => {
    let best = null;
    for (const d of Object.keys(state.setLog || {})) {
      const wl = state.setLog[d]?.reset_swim || {};
      Object.entries(wl).forEach(([k, sets]) => { if (k.startsWith('Main')) (sets || []).forEach(x => { const m = parseFloat(x?.min); if (x?.done && Number.isFinite(m) && (best == null || m > best)) best = m; }); });
    }
    return best;
  })();
  const swaps = {};
  Object.keys(state.swaps || {}).forEach(k => {
    if (!state.swaps[k]) return;
    const [d, wid, title, idx] = k.split('::');
    if (state.startDate && d < state.startDate) return;
    const w = DATA.workouts.find(x => x.id === wid);
    const ex = w?.blocks.find(b => b.title === title)?.exercises[+String(idx).replace(/~alt$/, '')];
    if (ex) swaps[ex.name] = (swaps[ex.name] || 0) + 1;
  });
  const pain = {};
  Object.keys(state.pain || {}).forEach(k => {
    if (!state.pain[k]) return;
    const [d, wid, title, idx] = k.split('::');
    if (state.startDate && d < state.startDate) return;
    const w = DATA.workouts.find(x => x.id === wid);
    const ex = w?.blocks.find(b => b.title === title)?.exercises[+String(idx).replace(/~(alt|sub)/g, '')];
    if (ex) pain[ex.name] = (pain[ex.name] || 0) + 1;
  });
  const wts = blockWeights();
  const avg = rollingAvgWeight();
  const startKg = wts.length ? wts[0].kg : DATA.startKg;
  const daysSpan = wts.length > 1 ? (parseIso(wts.at(-1).date) - parseIso(wts[0].date)) / 86400000 : 0;
  const waists = (state.waists || []).filter(x => !state.startDate || x.date >= weekWindow(1).start).sort((a, b) => a.date.localeCompare(b.date));
  return {
    week: wk,
    sessionsPerWeek: { 'weeks 1–6': per(1, Math.min(6, lastWk)), 'weeks 7–9 (holidays)': lastWk >= 7 ? per(7, Math.min(9, lastWk)) : null, [`weeks 1–${lastWk}`]: per(1, lastWk) },
    totals: counts,
    minimumOnly: minOnly, fullerSessions: fuller,
    lifts,
    longestSwimMin: swim,
    swaps, painFlags: pain,
    weight: { startKg: +(+startKg).toFixed(1), avgNow: avg != null ? +avg.toFixed(1) : null, kgPerWeek: avg != null && daysSpan > 13 ? +((startKg - avg) / (daysSpan / 7)).toFixed(2) : null },
    waist: waists.length ? { first: waists[0].cm, latest: waists.at(-1).cm } : null,
    variants: Object.keys(state.variants || {}),
    day0: state.baselineDay0 || null
  };
}

const CI_SCREENS = {
  w10: [
    { t: 'Your weeks so far', auto: true, qs: [{ k: 'prefill', opts: ['Looks right', 'Fix a number'] }], text: { k: 'fixes', show: 'prefill=Fix a number', ph: 'e.g. chin assist started at 40, not 35' } },
    { t: 'Body', waist: true, qs: [
      { k: 'belly', q: 'Belly vs Day 0', opts: ['Flatter', 'Same', 'Bigger'] },
      { k: 'photos', q: 'Photos taken today (camera roll)?', opts: ['Yes', 'Not yet'] }] },
    { t: 'The exercises', lifts: true },
    { t: 'Joints', qs: [
      { k: 'ankle', q: 'Left ankle', opts: ['Better', 'Same', 'Worse'] },
      { k: 'shoulders', q: 'Shoulders', opts: ['Fine', 'Niggly', 'Painful'] },
      { k: 'other', q: 'Anything else?', opts: ['Knees', 'Low back', 'Elbows', 'None'], multi: 3 }] },
    { t: 'Real life', qs: [
      { k: 'perWeek', q: 'Sessions a week you can REALLY do', opts: ['2', '3', '4'] },
      { k: 'minutes', q: 'Minutes per session', opts: ['25', '35', '45'] },
      { k: 'slot', q: 'Best time', opts: ['Early', 'Lunch', 'Evening', 'Weekend'], multi: 2 },
      { k: 'work', q: 'Work lately', opts: ['Light', 'Normal', 'Crushing'] },
      { k: 'dread', q: 'Gym dread (1 = keen, 5 = dread)', opts: ['1', '2', '3', '4', '5'] }] },
    { t: 'Next adventure', qs: [
      { k: 'adventure', q: 'What is it?', opts: ['Via ferrata / climb', 'Swim', 'Hike / trek', 'Run', 'Sport', 'None yet'], multi: 2 },
      { k: 'when', q: 'When?', opts: ['< 3 months', '3–6 months', '6+ months', 'Not set'] }], text: { k: 'where', ph: 'Where / what, if you know (optional)' } },
    { t: 'Look + fuel', qs: [
      { k: 'priority', q: 'Physique priority', opts: ['Shoulders / V-taper', 'Arms', 'Chest', 'Waist', 'Legs'], multi: 2 },
      { k: 'protein', q: 'Protein hits on most days', opts: ['2', '3', '4'] },
      { k: 'hunger', q: 'Hunger', opts: ['Fine', 'Hungry', 'Starving'] },
      { k: 'energy', q: 'Energy', opts: ['Good', 'Flat', 'Wrecked'] },
      { k: 'hardMeal', q: 'Hardest meal to get right', opts: ['Breakfast', 'Lunch', 'Late dinner', 'Weekends'] }] },
    { t: 'Quick re-tests · optional', retest: true }
  ],
  w18: [
    { t: 'Anything changed?', qs: [
      { k: 'schedule', q: 'Work schedule since week 10', opts: ['Same', 'Lighter', 'Heavier'] },
      { k: 'niggle', q: 'New niggle?', opts: ['None', 'Ankle', 'Shoulder', 'Knee', 'Low back'], multi: 2 },
      { k: 'perWeek', q: 'Sessions a week from 20 Mar', opts: ['2', '3', '4'] },
      { k: 'excited', q: 'Ready for something new?', opts: ['Bring it', 'Ease me in', 'Keep it like Reset'] }], text: { k: 'notes', ph: 'Anything else (optional)' } }
  ]
};
const CI_RETESTS = [
  { k: 'hip', label: 'Hips, widest point (cm)' },
  { k: 'kneeL', label: 'Knee-to-wall LEFT (cm)' }, { k: 'kneeR', label: 'Knee-to-wall RIGHT (cm)' },
  { k: 'hang', label: 'Dead hang (s)' }, { k: 'pushups', label: 'Max push-ups (one set)' }, { k: 'swimMin', label: 'Longest no-touch swim (min)' }
];

function openCheckin(id) {
  const st = checkinState(id);
  const screens = CI_SCREENS[id];
  if (st.step >= screens.length) st.step = 0;
  if (id === 'w10' && !st.auto) st.auto = computeCheckinAuto();
  renderCheckinStep(id);
}
function renderCheckinStep(id) {
  const st = checkinState(id);
  const screens = CI_SCREENS[id];
  const sc = screens[st.step];
  const a = st.answers;
  const sheet = openSheet();
  let body = '';
  if (sc.auto) {
    const au = st.auto || computeCheckinAuto();
    const spw = Object.entries(au.sessionsPerWeek).filter(([, v]) => v != null).map(([k, v]) => `${k}: <strong>${v}</strong>/wk`).join(' · ');
    const liftRows = au.lifts.length ? au.lifts.map(l => `<li>${esc(l.name)}: <strong>${esc(l.first)}</strong> → <strong>${esc(l.last)}</strong></li>`).join('') : '<li>No lift logs yet.</li>';
    body += `<ul class="ci-auto">
      <li>${au.weight.avgNow != null ? `Weight (7-day avg): <strong>${au.weight.startKg}</strong> → <strong>${au.weight.avgNow}</strong> kg${au.weight.kgPerWeek != null ? ` · ${au.weight.kgPerWeek} kg/wk` : ''}` : 'Weight: no weigh-ins logged yet'}</li>
      <li>Sessions: ${spw || '—'}</li>
      <li>First block only: ${au.minimumOnly} · fuller: ${au.fullerSessions}</li>
      ${au.waist ? `<li>Waist: <strong>${au.waist.first}</strong> → <strong>${au.waist.latest}</strong> cm</li>` : ''}
      ${au.longestSwimMin != null ? `<li>Longest no-touch swim: <strong>${au.longestSwimMin} min</strong></li>` : ''}
      ${liftRows}
    </ul>`;
  }
  if (sc.waist) {
    const lastW = (state.waists || []).slice().sort((x, y) => x.date.localeCompare(y.date)).at(-1);
    body += `<label class="ci-field"><span>Waist today (cm, navel)</span><input type="number" step="0.1" inputmode="decimal" data-num="waist" value="${a.waist ?? ''}" placeholder="${lastW ? lastW.cm : 'cm'}"></label>`;
  }
  if (sc.lifts) {
    body += '<p class="ci-sub">Default is Keep. Hurts = it hurts a joint, not just hard.</p>';
    a.lifts = a.lifts || {};
    DAY_SEQUENCE_RESET.forEach(wid => {
      const w = getWorkout(wid);
      w.blocks.forEach(b => b.exercises.forEach(ex => {
        if (!(ex.alt || ex._alt || ex.assist || b === w.blocks[0])) return;
        body += `<div class="ci-lift"><div class="ci-lift-name"><span class="ci-badge">${RESET_BADGE[wid]}</span>${esc(ex.name)}</div>
          <div class="ci-chips" data-k="lift:${esc(ex.name)}">${chipsHTML(['Keep', 'Bored', 'Hate', 'Hurts'], a.lifts[ex.name] || 'Keep')}</div></div>`;
      }));
    });
  }
  (sc.qs || []).forEach(q => {
    body += `${q.q ? `<div class="ci-q">${esc(q.q)}${q.multi ? ` <span class="ci-hint">pick up to ${q.multi}</span>` : ''}</div>` : ''}
      <div class="ci-chips" data-k="${q.k}"${q.multi ? ` data-multi="${q.multi}"` : ''}>${chipsHTML(q.opts, a[q.k], !!q.multi)}</div>`;
  });
  if (sc.text) {
    const [sk, sv] = (sc.text.show || '').split('=');
    const visible = !sc.text.show || a[sk] === sv;
    body += `<textarea class="ci-text" data-txt="${sc.text.k}" rows="2" placeholder="${esc(sc.text.ph)}"${visible ? '' : ' hidden'}>${esc(a[sc.text.k] || '')}</textarea>`;
  }
  if (sc.retest) {
    const au = st.auto || {};
    body += '<p class="ci-sub">Skip any you can\'t do right now.</p>' + CI_RETESTS.map(r => {
      const ph = r.k === 'swimMin' && au.longestSwimMin != null ? au.longestSwimMin : '';
      return `<label class="ci-field"><span>${r.label}</span><input type="number" step="0.5" inputmode="decimal" data-num="${r.k}" value="${a[r.k] ?? ''}" placeholder="${ph}"></label>`;
    }).join('');
  }
  const last = st.step === screens.length - 1;
  sheet.innerHTML = `
    <div class="ci-head"><span class="ci-step">${st.step + 1} / ${screens.length}</span><button type="button" class="ci-x" data-close aria-label="Close — progress is saved">✕</button></div>
    <div class="ci-progress"><i style="width:${Math.round(((st.step + 1) / screens.length) * 100)}%"></i></div>
    <h2 class="ci-title">${esc(sc.t)}</h2>
    ${body}
    <div class="ci-nav">
      ${st.step > 0 ? '<button type="button" class="btn-secondary" data-ci-back>Back</button>' : ''}
      <button type="button" class="btn-primary" data-ci-next>${last ? 'Finish' : 'Next'}</button>
    </div>`;
  wireChips(sheet, (k, v) => {
    if (k.startsWith('lift:')) a.lifts[k.slice(5)] = v;
    else a[k] = v;
    if (sc.text && sc.text.show) {
      const [sk, sv] = sc.text.show.split('=');
      const ta = sheet.querySelector('[data-txt]');
      if (ta) ta.hidden = a[sk] !== sv;
    }
    save();
  });
  const collect = () => {
    sheet.querySelectorAll('[data-num]').forEach(inp => {
      const v = parseFloat(inp.value);
      if (Number.isFinite(v)) a[inp.dataset.num] = v; else delete a[inp.dataset.num];
    });
    sheet.querySelectorAll('[data-txt]').forEach(ta => { if (ta.value.trim()) a[ta.dataset.txt] = ta.value.trim().slice(0, 500); else delete a[ta.dataset.txt]; });
  };
  sheet.querySelector('[data-ci-back]')?.addEventListener('click', () => { collect(); st.step -= 1; save(); renderCheckinStep(id); });
  sheet.querySelector('[data-ci-next]').addEventListener('click', () => {
    collect();
    if (!last) { st.step += 1; save(); renderCheckinStep(id); return; }
    finishCheckin(id);
  });
  sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { collect(); save(); renderCheckinPrompt('today'); renderCheckinPrompt('progress'); }));
}
function finishCheckin(id) {
  const st = checkinState(id);
  const a = st.answers;
  if (id === 'w10') {
    if (Number.isFinite(a.waist)) {
      state.waists = (state.waists || []).filter(x => x.date !== today());
      state.waists.push({ date: today(), cm: a.waist });
    }
    st.auto = computeCheckinAuto();
    if (Number.isFinite(a.kneeL) || Number.isFinite(a.kneeR)) {
      state.baseline = { ...(state.baseline || {}), kneeL: a.kneeL ?? state.baseline?.kneeL ?? null, kneeR: a.kneeR ?? state.baseline?.kneeR ?? null };
    }
  }
  st.doneAt = today();
  st.step = 0;
  save();
  const sheet = openSheet();
  sheet.innerHTML = `
    <div class="ci-head"><span class="ci-step">Done</span><button type="button" class="ci-x" data-close>✕</button></div>
    <h2 class="ci-title">That's everything</h2>
    <p class="ci-sub">Nothing in your plan has changed. Copy the brief and paste it into the chat — RHN 2.0 gets built from it and starts Sat 20 Mar.</p>
    <button type="button" class="btn-primary" id="briefCopyBtn">Copy RHN 2.0 brief</button>
    <button type="button" class="btn-secondary" id="ciBackupBtn">Export a backup too</button>`;
  sheet.querySelector('#briefCopyBtn').addEventListener('click', copyBrief);
  sheet.querySelector('#ciBackupBtn').addEventListener('click', exportBackup);
  renderCheckinPrompt('today');
  renderCheckinPrompt('progress');
  renderVariantCard();
}
function buildCheckinBrief() {
  const L = [];
  const ci = state.checkins || {};
  if (!ci.w10?.doneAt && !ci.w18?.doneAt) return '';
  L.push('RHN 2.0 BRIEF — from the Reset check-ins');
  L.push(`generated ${today()} · week ${weekNumber()}/${DATA.totalWeeks} · RHN 2.0 starts Sat 20 Mar 2027 (week 20)`);
  L.push('Constraints: no sled / trap bar / leg curl / leg press / calf machine · DBs over Smith for chest · protect shoulders (no overhead pressing, no dips) · stiff LEFT ankle · offline app · no doctor push · physique (V-taper) + functional (via ferrata, swims, hikes).');
  const w10 = ci.w10;
  if (w10?.doneAt) {
    const a = w10.answers || {}, au = w10.auto || {};
    L.push('', `WEEK-10 CHECK-IN (${w10.doneAt})`);
    if (au.weight) L.push(`  Weight 7-day avg: ${au.weight.startKg} → ${au.weight.avgNow ?? '—'} kg${au.weight.kgPerWeek != null ? ` (${au.weight.kgPerWeek} kg/wk)` : ''}`);
    if (au.waist) L.push(`  Waist: ${au.waist.first} → ${au.waist.latest} cm${Number.isFinite(a.waist) ? ` · today ${a.waist}` : ''} (target ≤ 83.5)`);
    if (au.sessionsPerWeek) L.push('  Sessions/wk: ' + Object.entries(au.sessionsPerWeek).filter(([, v]) => v != null).map(([k, v]) => `${k} ${v}`).join(' · '));
    if (au.totals) L.push('  Totals: ' + Object.entries(au.totals).map(([k, v]) => `${k} ${v}`).join(' · ') + ` · first-block-only ${au.minimumOnly} · fuller ${au.fullerSessions}`);
    (au.lifts || []).forEach(l => L.push(`  ${l.session} ${l.name}: ${l.first} → ${l.last} (${l.sessions} sessions${l.usedAlt ? ', alt used' : ''})`));
    if (au.longestSwimMin != null) L.push(`  Longest no-touch swim: ${au.longestSwimMin} min`);
    if (au.swaps && Object.keys(au.swaps).length) L.push('  Swaps: ' + Object.entries(au.swaps).map(([k, v]) => `${k} ×${v}`).join(' · '));
    if (au.painFlags && Object.keys(au.painFlags).length) L.push('  Pain flags: ' + Object.entries(au.painFlags).map(([k, v]) => `${k} ×${v}`).join(' · '));
    if (au.variants?.length) L.push(`  Alternates chosen: ${au.variants.length}`);
    if (au.day0) L.push(`  Day 0: waist ${au.day0.waist ?? '—'} · hips ${au.day0.hip ?? '—'} · knee-to-wall L ${au.day0.kneeL ?? '—'} R ${au.day0.kneeR ?? '—'} · height ${DATA.heightCm} cm`);
    L.push(`  Prefill: ${a.prefill || '—'}${a.fixes ? ' · fixes: ' + a.fixes : ''}`);
    L.push(`  Body: belly ${a.belly || '—'} · photos ${a.photos || '—'}`);
    if (a.lifts) L.push('  Exercise verdicts: ' + Object.entries(a.lifts).filter(([, v]) => v !== 'Keep').map(([k, v]) => `${k} = ${v}`).join(' · ') || '  Exercise verdicts: all Keep');
    L.push(`  Joints: L ankle ${a.ankle || '—'} · shoulders ${a.shoulders || '—'} · other ${(a.other || []).join(', ') || '—'}`);
    L.push(`  Real life: ${a.perWeek || '—'}×/wk · ${a.minutes || '—'} min · best ${(a.slot || []).join('/') || '—'} · work ${a.work || '—'} · dread ${a.dread || '—'}/5`);
    L.push(`  Adventure: ${(a.adventure || []).join(' + ') || '—'} · ${a.when || '—'}${a.where ? ' · ' + a.where : ''}`);
    L.push(`  Look/fuel: priority ${(a.priority || []).join(' + ') || '—'} · protein hits ${a.protein || '—'} · hunger ${a.hunger || '—'} · energy ${a.energy || '—'} · hardest meal ${a.hardMeal || '—'}`);
    const rt = CI_RETESTS.filter(r => Number.isFinite(a[r.k])).map(r => `${r.label.replace(/ \(.*\)/, '')} ${a[r.k]}`);
    if (rt.length) L.push('  Re-tests: ' + rt.join(' · '));
    const guard = (+a.dread >= 4) || a.work === 'Crushing';
    L.push('', 'RULES FOR BUILDING 2.0');
    L.push(guard ? '  ⚠ Dread ≥ 4 or work = crushing → 2.0 adds NO volume over Reset.' : '  Volume may rise modestly over Reset.');
    L.push('  Recalculate calories from the current 7-day average. Keep the first-block-counts rule. Opens easy like Reset week 1.');
  }
  const w18 = ci.w18;
  if (w18?.doneAt) {
    const a = w18.answers || {};
    L.push('', `PRE-LAUNCH RE-CHECK (${w18.doneAt})`);
    L.push(`  Schedule ${a.schedule || '—'} · niggle ${(a.niggle || []).join(', ') || '—'} · ${a.perWeek || '—'}×/wk · ${a.excited || '—'}${a.notes ? ' · ' + a.notes : ''}`);
  }
  L.push('', '```json', JSON.stringify(ci), '```');
  return L.join('\n');
}
async function copyBrief() {
  const text = buildCheckinBrief() || buildCoachReport();
  let ok = false;
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch (_) { ok = false; }
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(ta);
  }
  showToast(ok ? 'Brief copied — paste it into the chat' : 'Copy blocked — use Copy my training data instead');
}

// ===== Intelligence-layer renderers =====
function renderReadiness() {
  const el = document.getElementById('readinessCard');
  if (!el) return;
  if (isReset()) { el.hidden = true; return; }
  const { readiness: r, adjustments } = adaptivePlan();
  const vClass = r.verdict === 'push' ? 'rd-push' : r.verdict === 'hold' ? 'rd-hold' : 'rd-backoff';
  const header = `<header class="card-header"><h2>Readiness</h2><span class="card-meta">adaptive engine</span></header>`;

  // One-tap recovery check — feeds the engine without a full sleep logger.
  const todayFresh = +(state.sleep?.[today()]?.fresh) || 0;
  const feelStrip = `
    <div class="rd-feel">
      <span class="rd-feel-label">Feel today</span>
      <div class="rd-feel-dots" role="group" aria-label="How recovered do you feel, 1 to 5">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="rd-feel-dot${todayFresh >= n ? ' on' : ''}" data-feel="${n}" aria-label="${n} of 5">${n}</button>`).join('')}
      </div>
    </div>`;

  el.hidden = false;
  if (!r.hasData) {
    el.innerHTML = header + feelStrip +
      `<div class="rd-empty">Tap how recovered you feel and weigh in daily — the engine reads those, plus your pain flags and lift trend, to call <em>push · hold · back off</em> and adjust today automatically.</div>`;
  } else {
    const factorsHTML = r.factors.map(f =>
      `<span class="rd-chip ${f.delta >= 0 ? 'pos' : 'neg'}">${f.label} <b>${f.delta > 0 ? '+' : ''}${f.delta}</b></span>`
    ).join('');
    const adjHTML = adjustments.map(a => `<li class="rd-adj rd-adj-${a.kind}">${a.text}</li>`).join('');
    el.innerHTML = header + `
      <div class="rd-top">
        <div class="rd-score"><span class="rd-num">${r.score}</span><span class="rd-denom">/100</span></div>
        <div class="rd-verdict ${vClass}">${r.verdict.toUpperCase()}</div>
      </div>
      <div class="rd-bar"><div class="rd-bar-fill ${vClass}" style="width:${r.score}%"></div></div>
      ${feelStrip}
      ${factorsHTML ? `<div class="rd-factors">${factorsHTML}</div>` : ''}
      <ul class="rd-adjs">${adjHTML}</ul>`;
  }

  el.querySelectorAll('.rd-feel-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = +btn.dataset.feel;
      state.sleep = state.sleep || {};
      const k = today();
      const cur = +(state.sleep[k]?.fresh) || 0;
      state.sleep[k] = { ...(state.sleep[k] || {}), fresh: cur === n ? undefined : n }; // re-tap to clear
      save();
      renderReadiness();
    });
  });
}

function renderForecast() {
  const el = document.getElementById('forecastCard');
  if (!el) return;
  const f = forecastTrajectory(DATA.targetKg);
  const head = `<header class="card-header"><h2>Trajectory</h2><span class="card-meta">forecast · ${DATA.targetKg} kg</span></header>`;

  if (f.status === 'thin') {
    el.hidden = false;
    el.innerHTML = head + `<div class="fc-empty">Need ~2 weeks of daily weigh-ins to project a date. Keep logging — the forecast unlocks once the trend is real, not daily water noise.</div>`;
    return;
  }
  if (f.status === 'reached') {
    el.hidden = false;
    el.innerHTML = head + `<div class="fc-empty"><strong>At target.</strong> The trend line sits at or below ${DATA.targetKg} kg — shift to holding the line and pushing the lifts. No deeper deficit.</div>`;
    return;
  }
  if (f.status === 'flat') {
    el.hidden = false;
    el.innerHTML = head + `<div class="fc-empty"><strong>No date yet — the 4-week average is flat.</strong> Nothing to project until it's dropping. Tighten the deficit ~150 kcal/day or add steps, then recheck.</div>`;
    return;
  }
  const rate = Math.abs(f.slopePerWeek).toFixed(2);
  el.hidden = false;
  el.innerHTML = head + `
    <div class="fc-main">
      <div class="fc-date">${fmtForecastDate(f.projDate)}</div>
      <div class="fc-sub">projected ${DATA.targetKg} kg · ± ${f.bandDays} days</div>
    </div>
    <div class="fc-rate">Losing <strong>${rate} kg/week</strong> on the ${f.n}-point trend · ≈${f.curKg.toFixed(1)} kg now.</div>
    <div class="fc-whatif">Slip to the slow edge — missed sessions, a looser week — and it drifts to <strong>${fmtForecastDate(f.slowDate)}</strong>. Seeing the date is the lever; protect the pace.</div>`;
}

function renderPrayer() {
  const el = document.getElementById('prayerCard');
  if (!el) return;
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const t = prayerTimes(now);
  const np = nextPrayer(t, nowH);
  const ramadan = !!state.ramadan;
  const dUntil = daysUntilRamadan();
  const ramadanSoon = !ramadan && dUntil >= 1 && dUntil <= 3
    ? `<div class="pr-ramadan"><strong>Ramadan starts in ~${dUntil} day${dUntil > 1 ? 's' : ''}.</strong> Hold phase: eat at maintenance, first block only after iftar, keep protein high. Ramadan mode switches on by itself.</div>` : '';

  const cells = PRAYER_ORDER.map(([k, label]) => {
    const isNext = !np.tomorrow && k === np.key;
    return `<div class="pr-cell ${isNext ? 'pr-next' : ''} ${k === 'sunrise' ? 'pr-muted' : ''}">
      <span class="pr-name">${label}</span><span class="pr-time">${fmtClock(t[k])}</span>
    </div>`;
  }).join('');

  let delta = np.tomorrow ? (24 - nowH) + t.fajr : np.at - nowH;
  const hrs = Math.floor(delta), mins = Math.round((delta - hrs) * 60);
  const cd = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const wd = windDownClock(t);

  let ramadanHTML = '';
  if (ramadan) {
    ramadanHTML = `
      <div class="pr-ramadan">
        <div class="pr-ram-row"><span>Suhoor ends · Fajr</span><strong>${fmtClock(t.fajr)}</strong></div>
        <div class="pr-ram-row"><span>Iftar · Maghrib</span><strong>${fmtClock(t.maghrib)}</strong></div>
        <div class="pr-ram-note">Train <strong>60–90 min after iftar</strong> (never in a prayer slot) — first block only, 2× a week. Hold your loads, no PRs while fasting. <strong>Deficit paused:</strong> eat at maintenance. Protein in 2–3 hits of ~45 g (suhoor, iftar, before bed). Water spread from iftar to suhoor, ~2.5 L.</div>
      </div>`;
  }

  el.innerHTML = `
    <header class="card-header"><h2>Prayer &amp; fasting</h2><span class="card-meta">${PRAYER_CONFIG.place} · calculated</span></header>
    <div class="pr-next-line">Next · <strong>${np.label}</strong> ${np.tomorrow ? 'tomorrow' : `in ${cd}`}</div>
    <div class="pr-grid">${cells}</div>
    <button class="pr-toggle ${ramadan ? 'on' : ''}" id="ramadanToggle">${ramadan ? '✓ Ramadan mode on' : 'Ramadan mode'}</button>
    ${ramadanHTML}${ramadanSoon}
    <div class="pr-windown">Wind-down for Fajr ${fmtClock(t.fajr)} — lights out by <strong>${fmtClock(wd)}</strong> to bank 7 hours.</div>
    <div class="pr-caveat">Calculated from MUIS angles (Fajr 20° · Isha 18° · Shafi'i Asr). For fasting, confirm suhoor &amp; iftar against the official MUIS table.</div>`;

  const tg = document.getElementById('ramadanToggle');
  if (tg) tg.addEventListener('click', () => { state.ramadan = !state.ramadan; save(); renderPrayer(); });
}

// Keep the prayer countdown honest while the Today tab sits open — the times
// themselves are recomputed from the current date on every render.
setInterval(() => {
  const v = document.getElementById('view-today');
  if (v && v.classList.contains('active') && document.visibilityState === 'visible') renderPrayer();
}, 60000);

// ========== WORKOUTS VIEW ==========
// ===== PLATE CALCULATOR =====
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
function computePlates(total, bar) {
  let perSide = (total - bar) / 2;
  if (isNaN(perSide) || perSide < 0) return null;
  const out = [];
  for (const p of PLATES) {
    let n = 0;
    while (perSide >= p - 0.001) { perSide -= p; n++; }
    if (n) out.push({ p, n });
  }
  const leftover = Math.round(perSide * 100) / 100;
  return { out, leftover, perSide: (total - bar) / 2 };
}
function renderPlateResult() {
  const el = document.getElementById('plateResult');
  if (!el) return;
  const total = parseFloat(document.getElementById('plateTarget').value);
  const bar = parseFloat(document.getElementById('plateBar').value);
  if (isNaN(total)) { el.innerHTML = '<span class="plate-hint">Enter a target weight</span>'; return; }
  const r = computePlates(total, bar);
  if (!r || r.perSide < 0) { el.innerHTML = '<span class="plate-hint">Target is below the bar weight</span>'; return; }
  const chips = r.out.map(x => `<span class="plate-chip">${x.n}×${x.p}</span>`).join('') || '<span class="plate-hint">just the bar</span>';
  const warn = r.leftover > 0 ? `<span class="plate-hint"> · ${r.leftover}kg short (no plate fits)</span>` : '';
  el.innerHTML = `<div class="plate-perside">${r.perSide}kg / side</div><div class="plate-chips">${chips}${warn}</div>`;
}
document.getElementById('plateTarget')?.addEventListener('input', renderPlateResult);
document.getElementById('plateBar')?.addEventListener('change', renderPlateResult);

function renderAllWorkouts() {
  const wrap = document.getElementById('workoutsAll');
  const phaseTag = `<div style="font:700 11px/1 var(--font-mono,ui-monospace,monospace);letter-spacing:.12em;text-transform:uppercase;opacity:.55;margin-bottom:16px">Showing Phase ${phaseNumber()} · Week ${weekNumber()}</div>`;
  const list = isReset() ? DATA.workouts.filter(w => DAY_SEQUENCE_RESET.includes(w.id) || RESET_EXTRAS.includes(w.id)) : phaseWorkouts();
  wrap.innerHTML = (isReset() ? '' : phaseTag) + list.map((w, i) => `
    <section class="workout-block">
      <div class="workout-block-head">
        <div class="workout-block-tag">${isReset() ? (RESET_EXTRAS.includes(w.id) ? 'Move' : 'Session ' + RESET_BADGE[w.id]) : w.id === 'homecore' ? 'Home · core' : 'Day 0' + (i + 1)}</div>
        <div class="workout-block-name">${w.name}</div>
        <div class="workout-block-blurb">${w.blurb}</div>
      </div>
      ${w.blocks.map(block => `
        <div class="block-title">${block.title}</div>
        ${block.exercises.map(ex => `
          <div class="exercise">
            <div class="exercise-head">
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-spec">${ex.sets} × ${ex.reps}</div>
            </div>
            ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
            ${ex.sub ? `<div class="exercise-sub"><span class="exercise-sub-tag">TAKEN?</span>${ex.sub}</div>` : ''}
          </div>
        `).join('')}
      `).join('')}
    </section>
  `).join('');
}

// ========== PROGRESS ==========
function renderWeightChart() {
  const el = document.getElementById('weightChart');
  if (!blockWeights().length) {
    el.innerHTML = '<div class="chart-empty">Log your first weight to see the curve</div>';
    return;
  }

  const data = blockWeights();
  const target = DATA.targetKg;
  const allKg = data.map(d => d.kg).concat([target, DATA.startKg]);
  const min = Math.floor(Math.min(...allKg) - 1);
  const max = Math.ceil(Math.max(...allKg) + 1);
  const range = max - min || 1;

  const W = 1000, H = 200, P = 24;
  const xStep = data.length > 1 ? (W - 2 * P) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = P + i * xStep;
    const y = H - P - ((d.kg - min) / range) * (H - 2 * P);
    return { x, y, kg: d.kg, date: d.date };
  });

  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const area = path + ` L${points.at(-1).x},${H - P} L${points[0].x},${H - P} Z`;

  const targetY = H - P - ((target - min) / range) * (H - 2 * P);

  // 7-day trailing average line — the signal under the daily noise
  const avgPts = data.map((d, i) => {
    const win = data.slice(Math.max(0, i - 6), i + 1).map(x => x.kg);
    const a = win.reduce((s, v) => s + v, 0) / win.length;
    const x = P + i * xStep;
    const y = H - P - ((a - min) / range) * (H - 2 * P);
    return x + ',' + y;
  }).join(' ');

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E03A60" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#E03A60" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line x1="${P}" y1="${targetY}" x2="${W - P}" y2="${targetY}" stroke="#3D4258" stroke-dasharray="4 6" />
      <text x="${W - P - 4}" y="${targetY - 6}" text-anchor="end" fill="#E11D2C" font-family="JetBrains Mono" font-size="11">target ${target}</text>
      <path d="${area}" fill="url(#grad)" />
      <polyline points="${avgPts}" fill="none" stroke="#E03A60" stroke-width="3" stroke-linejoin="round" filter="drop-shadow(0 0 7px rgba(225,29,44,0.55))" />
      <path d="${path}" stroke="#6E747A" stroke-width="1.2" fill="none" opacity="0.55" />
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#6E747A"/>`).join('')}
    </svg>
  `;
}

// Entries from the last 7 calendar days (not the last 7 entries, which could
// span a month of sporadic weigh-ins). Falls back to the latest entry.
function rollingAvgWeight() {
  const data = (state.weights || []).filter(d => d && d.date && Number.isFinite(+d.kg))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!data.length) return null;
  const cutoff = parseIso(today());
  cutoff.setDate(cutoff.getDate() - 6);
  const cutIso = localIso(cutoff);
  const recent = data.filter(d => d.date >= cutIso).map(d => +d.kg);
  if (!recent.length) return +data.at(-1).kg;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function renderWeightStats() {
  const el = document.getElementById('weightStats');
  const data = blockWeights();
  const today = data.at(-1)?.kg ?? DATA.startKg;
  const avg = rollingAvgWeight() ?? DATA.startKg;
  const start = data.length > 1 ? data[0].kg : DATA.startKg;
  const lost = start - avg;
  const target = DATA.targetKg;
  const toGo = avg - target;
  const waistTarget = 83.5;
  const lastWaist = (state.waists || []).slice().sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const waistHit = isReset() && lastWaist && lastWaist.cm <= waistTarget;
  const atFloor = isReset() ? (avg <= target || waistHit) : avg <= 68;
  const hero = document.querySelector('#view-progress .hero-sub');
  if (hero && isReset()) {
    const goalKg = DATA.startKg - target;
    hero.innerHTML = `<strong>−${Math.max(0, DATA.startKg - avg).toFixed(1)} of ${goalKg} kg</strong> · waist ${lastWaist ? lastWaist.cm.toFixed(1) : '—'} → ${waistTarget} cm · hit either = health goal done`;
  }

  el.innerHTML = `
    <div class="progress-stat">
      <div class="progress-stat-label">7-day avg</div>
      <div class="progress-stat-value">${avg.toFixed(1)}</div>
      <div class="progress-stat-sub">today ${today.toFixed(1)}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">Lost</div>
      <div class="progress-stat-value ${lost > 0 ? 'green' : ''}">${lost > 0 ? '−' : ''}${Math.abs(lost).toFixed(1)}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">${atFloor ? (isReset() ? 'Goal' : 'At floor') : 'To target'}</div>
      <div class="progress-stat-value">${atFloor ? '✓' : (toGo > 0 ? toGo.toFixed(1) : '✓')}</div>
    </div>
  `;

  const note = document.getElementById('weightNote');
  if (note) {
    note.innerHTML = weightTrendNote(data, avg, atFloor);
  }
}

// 14-day slope check: compare the rolling avg now vs ~2 weeks ago, against
// the 0.3–0.45 kg/wk target. Returns an on-track / ahead / behind note + nudge.
function weightTrendNote(data, avg, atFloor) {
  if (data.length < 7) {
    return 'Weigh in daily. The 7-day average is the real trend — ignore the daily ±1 kg of water and food.';
  }
  if (atFloor) {
    return '<strong>Health target hit.</strong> Hold here or keep going — either is a win. Holding = add back a fist of rice at lunch and keep lifting.';
  }
  // Find a data point ~14 days before the latest to measure the slope.
  const latest = data.at(-1);
  const latestT = parseIso(latest.date).getTime();
  let past = null;
  for (const d of data) {
    const days = (latestT - parseIso(d.date).getTime()) / 86400000;
    if (days >= 12) past = d; else break;
  }
  if (state.ramadan) {
    return '<strong>Ramadan: maintenance on purpose.</strong> Aim to finish at the same weight. A post-Raya bump of 1–2 kg is water and food in the gut, not fat.';
  }
  if (!past) {
    return 'Track the average line, not the daily dot. Target rate is 0.4–0.5 kg/week — the 2-week check kicks in once you have ~14 days logged.';
  }
  const weeks = ((latestT - parseIso(past.date).getTime()) / 86400000) / 7;
  // rolling avg at the past point
  const idx = data.indexOf(past);
  const pastWin = data.slice(Math.max(0, idx - 6), idx + 1).map(x => x.kg);
  const pastAvg = pastWin.reduce((a, b) => a + b, 0) / pastWin.length;
  const rate = (pastAvg - avg) / weeks; // +ve = losing
  const r = rate.toFixed(2);

  const earlyDays = state.startDate ? (Date.now() - parseIso(state.startDate).getTime()) / 86400000 : 99;
  if (rate > 0.75 && earlyDays < 28) {
    return `<strong>Early drop — mostly water.</strong> Losing ${r} kg/week in the first month is expected. Change nothing yet.`;
  }
  if (rate >= 0.35 && rate <= 0.75) {
    return `<strong>On track.</strong> Losing ${r} kg/week — aim is 0.4–0.5. Hold everything steady; you're keeping muscle while the fat comes off.`;
  }
  if (rate > 0.75) {
    return `<strong>A touch fast.</strong> Losing ${r} kg/week (aim 0.4–0.5). Add a fist of rice on training days — too fast costs muscle and energy.`;
  }
  if (rate >= 0) {
    return `<strong>Slower than plan</strong> (${r} kg/week, aim 0.4–0.5). Change nothing unless the average has been flat 14 days — then half a fist less rice at dinner, or +2K steps.`;
  }
  return `<strong>Trending up.</strong> The 2-week average rose ${Math.abs(r)} kg/week. If you're not in a planned diet break, the deficit has slipped — tighten portions and recheck the weekly average, not the daily.`;
}

/** Gym sessions completed in the current training week (Sat-start, matching the split). */
function sessionsThisTrainingWeek() {
  const now = new Date();
  const sinceSat = (now.getDay() + 1) % 7; // days since last Saturday
  const start = new Date(now);
  start.setDate(now.getDate() - sinceSat);
  const startIso = localIso(start);
  return state.sessions.filter(s => s.date >= startIso && s.workoutId !== 'homecore').length;
}

// ============================================================================
// INTELLIGENCE LAYER · on-device reasoning + prediction over logged data only.
// No sensors, no network. Every function degrades gracefully on missing logs.
// ============================================================================

const DAY_MS = 86400000;
function daysAgo(iso) { return (Date.now() - new Date(iso + 'T00:00:00').getTime()) / DAY_MS; }
function fmtForecastDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ----- #6 TRAJECTORY FORECASTING -------------------------------------------
// Least-squares fit of weight vs day over the last 28 days of entries, projected
// to the target. Confidence band scales with the slope's standard error so the
// estimate is honest about noise. Returns a status object the card can render.
function forecastTrajectory(targetKg) {
  const data = blockWeights();
  if (data.length < 6) return { status: 'thin', n: data.length };
  const t0 = new Date(data[0].date + 'T00:00:00').getTime();
  const latestT = new Date(data.at(-1).date + 'T00:00:00').getTime();
  const win = data.filter(d => (latestT - new Date(d.date + 'T00:00:00').getTime()) / DAY_MS <= 28);
  if (win.length < 6) return { status: 'thin', n: win.length };
  const xs = win.map(d => (new Date(d.date + 'T00:00:00').getTime() - t0) / DAY_MS);
  const ys = win.map(d => d.kg);
  const spanDays = xs.at(-1) - xs[0];
  if (spanDays < 10) return { status: 'thin', n: win.length };
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
  if (sxx === 0) return { status: 'thin', n };
  const slope = sxy / sxx;                 // kg/day, negative = losing
  const intercept = my - slope * mx;
  let ss = 0;
  for (let i = 0; i < n; i++) { const pred = intercept + slope * xs[i]; ss += (ys[i] - pred) ** 2; }
  const resStd = Math.sqrt(ss / Math.max(1, n - 2));
  const seSlope = resStd / Math.sqrt(sxx);
  const slopePerWeek = slope * 7;
  const curKg = intercept + slope * xs.at(-1); // fitted (smoothed) current weight
  if (curKg <= targetKg) return { status: 'reached', slopePerWeek, curKg, n };
  if (slope >= -0.001) return { status: 'flat', slopePerWeek, curKg, n }; // not losing
  const daysToTarget = (targetKg - curKg) / slope;     // both negative → positive
  const projDate = new Date(latestT + daysToTarget * DAY_MS);
  const relSE = Math.min(0.6, seSlope / Math.abs(slope));
  const bandDays = Math.max(2, Math.round(daysToTarget * relSE));
  const slowDate = new Date(latestT + daysToTarget * (1 + relSE) * DAY_MS); // slip scenario
  return { status: 'ok', slopePerWeek, curKg, n, daysToTarget, projDate, bandDays, slowDate, targetKg };
}

// ----- #1 ADAPTIVE PERIODIZATION ENGINE ------------------------------------
// Readiness = a composite of what you actually log: today's recovery tap,
// its 7-day trend, recent pain flags, and lift-performance trend.
// One number → push / hold / back off.
function readinessScore() {
  const factors = [];
  let score = 70; // neutral = hold
  const sleepDates = Object.keys(state.sleep || {}).sort();

  let lastFresh = null;
  for (let i = sleepDates.length - 1; i >= 0; i--) {
    const f = state.sleep[sleepDates[i]]?.fresh;
    if (f && daysAgo(sleepDates[i]) <= 2) { lastFresh = +f; break; }
  }
  if (lastFresh != null) {
    const d = Math.round((lastFresh - 3) * 12); // 1→−24 … 5→+24
    score += d;
    factors.push({ label: `Feel ${lastFresh}/5`, delta: d });
  }

  const recentFresh = sleepDates.slice(-7).map(d => +state.sleep[d]?.fresh).filter(Boolean);
  if (recentFresh.length >= 3) {
    const avg = recentFresh.reduce((a, b) => a + b, 0) / recentFresh.length;
    const d = Math.round((avg - 3) * 6);
    score += d;
    factors.push({ label: `7-day recovery ${avg.toFixed(1)}/5`, delta: d });
  }

  const painNames = recentPainExercises();
  if (painNames.length) {
    const d = -Math.min(20, painNames.length * 10);
    score += d;
    factors.push({ label: `${painNames.length} pain flag${painNames.length > 1 ? 's' : ''}`, delta: d });
  }

  const stalls = stalledLiftNames();
  if (stalls.length) {
    const d = -Math.min(15, stalls.length * 8);
    score += d;
    factors.push({ label: `${stalls.length} lift${stalls.length > 1 ? 's' : ''} stalling`, delta: d });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = score >= 78 ? 'push' : score >= 55 ? 'hold' : 'back off';
  return { score, verdict, factors, lastFresh, hasData: factors.length > 0 };
}

// Exercises flagged for pain in the last 5 days, resolved to readable names.
function recentPainExercises() {
  const names = new Set();
  for (const k of Object.keys(state.pain || {})) {
    if (!state.pain[k]) continue;
    const parts = k.split('::');
    const date = parts[0], wid = parts[1], exKey = parts.slice(2).join('::');
    if (daysAgo(date) > 5) continue;
    const w = DATA.workouts.find(x => x.id === wid);
    const ex = w ? findExerciseByKey(w, exKey) : null;
    if (ex) names.add(ex.name);
  }
  return [...names];
}

// Strength lifts whose last 3 sessions beat no prior peak, last trained ≤16 days.
function stalledLiftNames() {
  const out = [];
  for (const h of collectExerciseHistory()) {
    if (h.mode !== 'weight_reps' && h.mode !== 'multistage') continue;
    const scores = h.entries.map(e => e.score);
    if (scores.length < 4) continue;
    if (daysAgo(h.entries.at(-1).date) > 16) continue;
    const recent = scores.slice(-3);
    const prior = Math.max(...scores.slice(0, -3));
    if (Math.max(...recent) <= prior + 0.001) out.push(h.ex.name);
  }
  return out;
}

// Waist flat over ~2 weeks → calorie/step nudge (only if there's a 2-week pair).
function waistFlatNudge() {
  const data = (state.waists || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (data.length < 2) return null;
  const latest = data.at(-1);
  const latestT = new Date(latest.date + 'T00:00:00').getTime();
  let past = null;
  for (const d of data) {
    const days = (latestT - new Date(d.date + 'T00:00:00').getTime()) / DAY_MS;
    if (days >= 12) past = d; else break;
  }
  if (!past) return null;
  if (past.cm - latest.cm < 0.5) {
    return `Waist flat for 2 weeks (${latest.cm} cm). If the scale's also stuck, trim ~150 kcal/day or add 1,500 steps and recheck next week. If the scale's still dropping, it's just measurement noise — hold course.`;
  }
  return null;
}

// The engine's output: readiness + the concrete adjustments it recommends today.
function adaptivePlan() {
  const r = readinessScore();
  const adj = [];
  if (r.verdict === 'back off') {
    adj.push({ kind: 'session', text: 'Low readiness — make today the 20-min minimum session or an easy Zone-2 walk. Hold the load, skip the hero sets. Showing up still counts.' });
  } else if (r.verdict === 'push') {
    adj.push({ kind: 'push', text: 'Green light. On any double-progression lift where you hit the top of the rep range last time, add 2.5 kg today.' });
  } else {
    adj.push({ kind: 'session', text: 'Train as planned — leave 1–2 reps in reserve on the heavy compounds.' });
  }
  for (const name of recentPainExercises()) {
    adj.push({ kind: 'pain', text: `${name} was flagged for pain — swap to a pain-free variation today and add the matching prehab. Don't train through it.` });
  }
  for (const name of stalledLiftNames().slice(0, 3)) {
    adj.push({ kind: 'stall', text: `${name} hasn't moved in 3 sessions — drop the load ~10% and rebuild, or swap the variation. A stall is information, not failure.` });
  }
  const waist = waistFlatNudge();
  if (waist) adj.push({ kind: 'waist', text: waist });
  return { readiness: r, adjustments: adj };
}

// ----- #4 PRAYER-TIME + FASTING ENGINE -------------------------------------
// On-device solar calculation (no API). Singapore / MUIS convention:
// Fajr 20°, Isha 18°, Shafi'i Asr (factor 1). Sun-position math per PrayTimes.
const PRAYER_CONFIG = { lat: 1.3521, lng: 103.8198, tz: 8, fajrAngle: 20, ishaAngle: 18, asrFactor: 1, place: 'Singapore' };

const dtr = d => d * Math.PI / 180, rtd = r => r * 180 / Math.PI;
const sinD = d => Math.sin(dtr(d)), cosD = d => Math.cos(dtr(d)), tanD = d => Math.tan(dtr(d));
const arcsinD = x => rtd(Math.asin(x)), arccosD = x => rtd(Math.acos(x));
const arccotD = x => rtd(Math.atan(1 / x)), arctan2D = (y, x) => rtd(Math.atan2(y, x));
const fixAngle = a => { a = a % 360; return a < 0 ? a + 360 : a; };
const fixhour = h => { h = h % 24; return h < 0 ? h + 24 : h; };

function julianDate(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

// Sun declination + equation of time (hours) for a Julian date.
function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = arctan2D(cosD(e) * sinD(L), cosD(L)) / 15;
  return { decl: arcsinD(sinD(e) * sinD(L)), eqt: q / 15 - fixhour(RA) };
}

// Local clock times (decimal hours) for the six daily markers.
function prayerTimes(dateObj) {
  const c = PRAYER_CONFIG;
  const jDate = julianDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()) - c.lng / (15 * 24);
  const { decl, eqt } = sunPosition(jDate + 0.5);   // equatorial: decl/eqt ~constant across the day
  const noon = 12 - eqt;
  const adj = h => fixhour(h + c.tz - c.lng / 15);
  // Hour-offset from noon for a sun altitude `angle` (T uses −sin(angle), matching PrayTimes).
  const T = angle => (1 / 15) * arccosD((-sinD(angle) - sinD(decl) * sinD(c.lat)) / (cosD(decl) * cosD(c.lat)));
  const asrAlt = arccotD(c.asrFactor + tanD(Math.abs(c.lat - decl)));
  return {
    fajr: adj(noon - T(c.fajrAngle)),
    sunrise: adj(noon - T(0.833)),
    dhuhr: adj(noon),
    asr: adj(noon + T(-asrAlt)),
    maghrib: adj(noon + T(0.833)),
    isha: adj(noon + T(c.ishaAngle))
  };
}

const PRAYER_ORDER = [
  ['fajr', 'Fajr'], ['sunrise', 'Syuruk'], ['dhuhr', 'Zuhr'],
  ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']
];

function fmtClock(h) {
  let hh = Math.floor(fixhour(h));
  let mm = Math.round((h - Math.floor(h)) * 60);
  if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

// Next upcoming prayer (skips Syuruk — sunrise isn't a prayer) given current time.
function nextPrayer(times, nowH) {
  const seq = PRAYER_ORDER.filter(([k]) => k !== 'sunrise');
  for (const [k, label] of seq) if (times[k] > nowH) return { key: k, label, at: times[k] };
  return { key: 'fajr', label: 'Fajr', at: times.fajr, tomorrow: true };
}

// Fajr-anchored wind-down: to wake ~20 min before Fajr with 7h sleep, lights out by…
function windDownClock(times) { return fixhour(times.fajr - 0.33 - 7); }

// ----- #3 PATTERN DETECTION -------------------------------------------------
// On-device correlation across the logs. Each pattern returns only when there's
// enough data to be real — nothing inferred from a handful of points.
function detectPatterns() {
  const out = [];
  const sleep = state.sleep || {};

  // (1) Freshness ↔ PRs: was the morning fresher on days a lift hit a new best?
  const prFresh = [], flatFresh = [];
  for (const h of collectExerciseHistory()) {
    if (h.mode !== 'weight_reps' && h.mode !== 'multistage') continue;
    let priorMax = null;
    for (const e of h.entries) {
      if (priorMax !== null) {
        const f = +(sleep[e.date]?.fresh);
        if (f) (e.score > priorMax + 0.001 ? prFresh : flatFresh).push(f);
      }
      priorMax = priorMax === null ? e.score : Math.max(priorMax, e.score);
    }
  }
  if (prFresh.length >= 4 && flatFresh.length >= 4) {
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    const ap = avg(prFresh), af = avg(flatFresh);
    if (ap - af >= 0.4) {
      out.push({ icon: 'sleep', text: `Your PRs land on days you rated <strong>${ap.toFixed(1)}/5</strong> recovered — versus ${af.toFixed(1)}/5 on days nothing moved. Recovery is upstream of strength; the days you show up fresh are the days you grow.` });
    }
  }

  // (2) Pain clustering: is one movement taking most of the flags?
  const painCount = {};
  for (const k of Object.keys(state.pain || {})) {
    if (!state.pain[k]) continue;
    const parts = k.split('::'), wid = parts[1], exKey = parts.slice(2).join('::');
    const w = DATA.workouts.find(x => x.id === wid);
    const ex = w ? findExerciseByKey(w, exKey) : null;
    if (ex) painCount[ex.name] = (painCount[ex.name] || 0) + 1;
  }
  const painSorted = Object.entries(painCount).sort((a, b) => b[1] - a[1]);
  const totalPain = painSorted.reduce((s, [, n]) => s + n, 0);
  if (painSorted.length && painSorted[0][1] >= 2) {
    const [name, n] = painSorted[0];
    out.push({ icon: 'pain', text: `<strong>${n} of your ${totalPain} pain flags</strong> are on ${name}. That's a recurring pattern, not bad luck — swap the variation, drop the load, and if it keeps flagging, get it looked at.` });
  }

  // (3) Strongest training day: where do you actually show up?
  const trained = (state.sessions || []).filter(s => s.workoutId !== 'homecore');
  if (trained.length >= 6) {
    const byDay = [0, 0, 0, 0, 0, 0, 0];
    for (const s of trained) byDay[new Date(s.date + 'T00:00:00').getDay()]++;
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const max = Math.max(...byDay);
    if (max >= 2 && max > Math.min(...byDay)) {
      out.push({ icon: 'cal', text: `You show up most on <strong>${names[byDay.indexOf(max)]}s</strong> (${max} sessions). That's your anchor — protect the slot and build the week around it.` });
    }
  }

  return out;
}

function renderPatterns() {
  const el = document.getElementById('patternsCard');
  if (!el) return;
  const pats = detectPatterns();
  const head = `<header class="card-header"><h2>Patterns</h2><span class="card-meta">your data, correlated</span></header>`;
  el.hidden = false;
  if (!pats.length) {
    el.innerHTML = head + `<div class="pt-empty">Watching for links across your logs — recovery ↔ strength, recurring pain, your strongest training days. Real patterns surface here after a few weeks of logging; nothing gets inferred from too little data.</div>`;
    return;
  }
  el.innerHTML = head + `<ul class="pt-list">${pats.map(p => `<li class="pt-item pt-${p.icon}">${p.text}</li>`).join('')}</ul>`;
}

function renderWeekGrid() {
  const el = document.getElementById('weekGrid');
  const cw = weekNumber();
  el.innerHTML = '';
  for (let i = 1; i <= (DATA.totalWeeks || 16); i++) {
    let cls = 'week-cell';
    if (i < cw) cls += ' done';
    if (isDeloadWeek(i)) cls += ' deload';
    if (isDietBreakWeek(i)) cls += ' dietbreak';
    if (i === cw) cls += ' current';
    const title = isDietBreakWeek(i) ? 'Deload + diet break' : (isDeloadWeek(i) ? 'Deload' : '');
    el.innerHTML += `<div class="${cls}"${title ? ` title="${title}"` : ''}>${i}</div>`;
  }
  const meta = document.getElementById('weekMapMeta');
  if (meta) meta.textContent = isReset() ? `Week ${cw} of ${DATA.totalWeeks} · ${resetPhase(cw)?.title || ''}` : `16 weeks · ${sessionsThisTrainingWeek()}/5 this wk`;
  // Legend
  const legend = document.getElementById('weekMapLegend');
  if (legend) legend.innerHTML = `
    <span class="wk-leg"><i class="wk-sw done"></i>done</span>
    <span class="wk-leg"><i class="wk-sw current"></i>now</span>
    ${isReset() ? '' : `<span class="wk-leg"><i class="wk-sw deload"></i>deload (8·14)</span>
    <span class="wk-leg"><i class="wk-sw dietbreak"></i>diet break (8)</span>`}`;
}

function buildHistoryDetail(session) {
  const w = getWorkout(session.workoutId, phaseNumber(weekForDate(session.date)));
  if (!w) return '';
  const dayLog = state.setLog?.[session.date]?.[session.workoutId] || {};
  const blocks = w.blocks.map(block => {
    const exHTML = block.exercises.map((ex, exIdx) => {
      const base = `${block.title}::${exIdx}`;
      const exKey = [base, base + '~sub', base + '~alt', base + '~alt~sub']
        .find(k => (dayLog[k] || []).some(s => s && s.done)) || base;
      const sets = dayLog[exKey] || [];
      const done = sets.filter(s => s && s.done);
      if (!done.length) return '';
      const summary = done.map(s => {
        const mode = ex.inputMode || 'weight_reps';
        if (mode === 'multistage') {
          const stages = ex.stages.map((_, si) => {
            const st = s[`stage${si}`] || {};
            return `${st.kg || '–'}×${st.reps || '–'}`;
          }).join(' › ');
          return stages;
        }
        if (mode === 'bodyweight_reps') return `${s.reps || '–'} reps`;
        if (mode === 'time') return `${s.sec || '–'}s`;
        if (mode === 'time_speed') return `${s.min || '–'}min·${s.spm || '–'}spm`;
        if (mode === 'treadmill') return `${s.min || '–'}min·${s.kmh || '–'}km/h·${s.incline || '–'}%`;
        if (mode === 'interval') return `lvl ${s.level || '–'} · ${s.rounds || '–'} rds`;
        if (mode === 'cardio') return `${s.min || '–'}min · lvl ${s.level || '–'}`;
        return `${s.kg || '–'}kg × ${s.reps || '–'}`;
      }).map(esc).join('  ·  ');
      const notes = done.filter(s => s.note).map(s => esc(s.note));
      const noteHTML = notes.length ? `<div class="det-note">✎ ${notes.join(' · ')}</div>` : '';
      return `<div class="det-ex">
        <div class="det-ex-name">${ex.name}</div>
        <div class="det-sets">${summary}</div>
        ${noteHTML}
      </div>`;
    }).filter(Boolean).join('');
    if (!exHTML) return '';
    return `<div class="det-block">
      <div class="det-block-title">${esc(blockLabel(block.title))}</div>
      ${exHTML}
    </div>`;
  }).filter(Boolean).join('');
  return blocks || '<div class="det-ex"><div class="det-sets">No sets logged.</div></div>';
}

function renderHistory() {
  const el = document.getElementById('sessionHistory');
  if (!state.sessions.length) {
    el.innerHTML = '<div class="history-empty">No sessions logged yet. Show up.</div>';
    return;
  }
  const recent = state.sessions.slice(-12).reverse();
  el.innerHTML = recent.map((s, i) => `
    <div class="history-row" data-i="${i}">
      <span class="history-date">${fmtDate(s.date)}</span>
      <span class="history-name">${esc(s.name)}</span>
      <span class="history-toggle">›</span>
      <div class="history-detail">${buildHistoryDetail(s)}</div>
    </div>
  `).join('');
  el.querySelectorAll('.history-row').forEach(row => {
    row.addEventListener('click', () => row.classList.toggle('open'));
  });
}

function renderPhases() {
  const el = document.getElementById('phases');
  el.innerHTML = DATA.phases.map(p => `
    <div class="phase">
      <div class="phase-weeks">Wk ${p.weeks}</div>
      <div class="phase-body">
        <div class="phase-title">${p.title}</div>
        <div class="phase-text">${p.body}</div>
      </div>
    </div>
  `).join('');
}

// ========== LIFTS · PROGRESSION ANALYSIS ==========

/** Numeric score for a single set, used to find the best set + compare sessions. */
function setScore(s, mode, ex) {
  if (!s) return 0;
  switch (mode) {
    case 'bodyweight_reps': return parseFloat(s.reps || 0);
    case 'amrap': return parseFloat(s.rounds || 0);
    case 'time': return parseFloat(s.sec || 0);
    case 'time_speed': return parseFloat(s.min || 0) * (parseFloat(s.spm || 0) || 1);
    case 'treadmill': return parseFloat(s.min || 0) * (parseFloat(s.kmh || 0) || 1) * (1 + (parseFloat(s.incline || 0) || 0) / 100);
    case 'interval': return (parseFloat(s.level || 0) || 0) * 100 + (parseFloat(s.rounds || 0) || 0);
    case 'cardio': return (parseFloat(s.level || 0) || 0) * 100 + (parseFloat(s.min || 0) || 0);
    case 'carry': return (parseFloat(s.kg || 0) || 0) * (parseFloat(s.m || 0) || 1);
    case 'multistage': {
      const s0 = s.stage0 || {};
      return parseFloat(s0.kg || 0) * (parseFloat(s0.reps || 0) || 1);
    }
    default: {
      let kg = parseFloat(s.kg || 0);
      if (ex?.barbell && !isNaN(kg)) kg = (ex.bar ?? 20) + 2 * kg; // compare true bar totals
      return kg * (parseFloat(s.reps || 0) || 1);
    }
  }
}

/** Best (highest-scoring) done set of a session. */
function bestSetOf(sets, mode, ex) {
  const done = (sets || []).filter(s => s && s.done);
  if (!done.length) return null;
  return done.reduce((a, b) => (setScore(b, mode, ex) > setScore(a, mode, ex) ? b : a));
}

// Stall: last 3 logged sessions produced no new best over the prior peak.
function isStalled(workoutId, exKey, ex) {
  const mode = ex.inputMode || 'weight_reps';
  if (mode !== 'weight_reps' && mode !== 'multistage') return false;  // strength lifts only
  const dates = Object.keys(state.setLog || {}).filter(d => d !== today()).sort();
  const scores = [];
  for (const d of dates) {
    const best = bestSetOf(state.setLog[d]?.[workoutId]?.[exKey], mode, ex);
    if (best) scores.push(setScore(best, mode, ex));
  }
  if (scores.length < 3) return false;
  const recent = scores.slice(-3);
  const priorMax = scores.length > 3 ? Math.max(...scores.slice(0, -3)) : recent[0];
  return Math.max(...recent) <= priorMax + 0.001;
}

/** Walk the whole set log → per-exercise session history, newest activity first. */
function collectExerciseHistory() {
  const map = new Map();
  const dates = Object.keys(state.setLog || {}).sort();
  for (const d of dates) {
    const byWorkout = state.setLog[d] || {};
    for (const wid of Object.keys(byWorkout)) {
      const w = DATA.workouts.find(x => x.id === wid);
      if (!w) continue;
      for (const exKey of Object.keys(byWorkout[wid])) {
        const ex = findExerciseByKey(w, exKey);
        if (!ex) continue;
        const best = bestSetOf(byWorkout[wid][exKey], ex.inputMode || 'weight_reps', ex);
        if (!best) continue;
        const id = wid + '::' + exKey;
        if (!map.has(id)) map.set(id, { ex, workoutName: w.name, mode: ex.inputMode || 'weight_reps', entries: [] });
        map.get(id).entries.push({ date: d, best, score: setScore(best, ex.inputMode || 'weight_reps', ex) });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.entries.at(-1).date.localeCompare(a.entries.at(-1).date));
}

function sparklineSVG(scores) {
  if (scores.length < 2) return '';
  const W = 110, H = 30, P = 3;
  const min = Math.min(...scores), max = Math.max(...scores);
  const range = max - min || 1;
  const step = (W - 2 * P) / (scores.length - 1);
  const pts = scores.map((v, i) => `${(P + i * step).toFixed(1)},${(H - P - ((v - min) / range) * (H - 2 * P)).toFixed(1)}`).join(' ');
  const last = pts.split(' ').at(-1);
  return `<svg viewBox="0 0 ${W} ${H}" class="spark" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="var(--wine-bright)" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${last.split(',')[0]}" cy="${last.split(',')[1]}" r="2.5" fill="var(--crimson-bright)"/>
  </svg>`;
}

function renderLifts() {
  const history = collectExerciseHistory();

  // ----- Overview stats -----
  const overview = document.getElementById('liftsOverview');
  let totalSets = 0, tonnage = 0, improving = 0, tracked = 0;
  for (const h of history) {
    for (const e of h.entries) totalSets += 1;
    if (h.entries.length >= 2) {
      tracked += 1;
      if (h.entries.at(-1).score > h.entries[0].score) improving += 1;
    }
  }
  // True tonnage: every done weight-mode set across the log
  for (const d of Object.keys(state.setLog || {})) {
    for (const wid of Object.keys(state.setLog[d] || {})) {
      const w = DATA.workouts.find(x => x.id === wid);
      if (!w) continue;
      for (const exKey of Object.keys(state.setLog[d][wid])) {
        const ex = findExerciseByKey(w, exKey);
        if (!ex) continue;
        const mode = ex.inputMode || 'weight_reps';
        for (const s of state.setLog[d][wid][exKey] || []) {
          if (!s || !s.done) continue;
          if (mode === 'weight_reps') {
            let kg = parseFloat(s.kg || 0);
            if (ex.barbell && !isNaN(kg)) kg = (ex.bar ?? 20) + 2 * kg;
            tonnage += (kg || 0) * (parseFloat(s.reps || 0) || 0);
          } else if (mode === 'multistage') {
            (ex.stages || []).forEach((_, si) => {
              const st = s[`stage${si}`] || {};
              tonnage += (parseFloat(st.kg || 0) || 0) * (parseFloat(st.reps || 0) || 0);
            });
          }
        }
      }
    }
  }
  overview.innerHTML = `
    <div class="target-cell"><div class="target-label">Sessions</div><div class="target-value">${state.sessions.length}</div><div class="target-note">logged complete</div></div>
    <div class="target-cell"><div class="target-label">Exercises tracked</div><div class="target-value">${history.length}</div><div class="target-note">${tracked} with 2+ sessions</div></div>
    <div class="target-cell"><div class="target-label">Improving</div><div class="target-value">${tracked ? Math.round((improving / tracked) * 100) + '%' : '—'}</div><div class="target-note">${improving} of ${tracked} trending up</div></div>
    <div class="target-cell"><div class="target-label">Total lifted</div><div class="target-value">${tonnage >= 1000 ? (tonnage / 1000).toFixed(1) + 't' : Math.round(tonnage) + 'kg'}</div><div class="target-note">all-time tonnage</div></div>
  `;

  // ----- Per-exercise rows -----
  const list = document.getElementById('liftsList');
  if (!history.length) {
    list.innerHTML = '<div class="history-empty">Log a few sessions and your progression appears here.</div>';
    return;
  }
  list.innerHTML = history.map((h, i) => {
    const first = h.entries[0];
    const last = h.entries.at(-1);
    const scores = h.entries.map(e => e.score);
    const bestEver = h.entries.reduce((a, b) => (b.score > a.score ? b : a));
    const deltaPct = h.entries.length >= 2 && first.score > 0
      ? Math.round(((last.score - first.score) / first.score) * 100)
      : null;
    const deltaHTML = deltaPct === null
      ? `<span class="lift-delta flat">${h.entries.length} session${h.entries.length > 1 ? 's' : ''}</span>`
      : `<span class="lift-delta ${deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat'}">${deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '→'} ${Math.abs(deltaPct)}%</span>`;
    const detail = h.entries.slice().reverse().map(e => `
      <div class="lift-session${e === bestEver ? ' pr' : ''}">
        <span class="lift-session-date">${fmtDate(e.date)}</span>
        <span class="lift-session-val">${formatPrev(e.best, h.mode, h.ex)}${e === bestEver ? ' · PR' : ''}</span>
      </div>
    `).join('');
    return `
      <div class="lift-row" data-i="${i}">
        <div class="lift-row-head">
          <div class="lift-info">
            <div class="lift-name">${esc(h.ex.name)}</div>
            <div class="lift-sub">${h.workoutName} · last ${fmtDate(last.date)} · ${formatPrev(last.best, h.mode, h.ex)}</div>
          </div>
          ${sparklineSVG(scores)}
          ${deltaHTML}
        </div>
        <div class="lift-detail">
          <div class="lift-session header-row">
            <span class="lift-session-date">Best ever</span>
            <span class="lift-session-val">${formatPrev(bestEver.best, h.mode, h.ex)} · ${fmtDate(bestEver.date)}</span>
          </div>
          ${detail}
        </div>
      </div>
    `;
  }).join('');
  list.querySelectorAll('.lift-row').forEach(row => {
    row.addEventListener('click', () => row.classList.toggle('open'));
  });
}

document.getElementById('logWeightBtn').addEventListener('click', () => {
  const input = document.getElementById('weightInput');
  const kg = parseFloat(input.value);
  if (!kg || kg < 30 || kg > 200) { showToast('Enter a valid weight'); return; }
  const dKey = today();
  state.weights = state.weights.filter(w => w.date !== dKey);
  state.weights.push({ date: dKey, kg });
  save();
  input.value = '';
  showToast('Logged ' + kg.toFixed(1) + ' kg');
  renderProgress();
  renderHeader();
});

// ========== WAIST LOG · the V-cut + metabolic metric ==========
function renderWaist() {
  const chartEl = document.getElementById('waistChart');
  const statsEl = document.getElementById('waistStats');
  if (!chartEl || !statsEl) return;
  const data = (state.waists || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  if (!data.length) {
    chartEl.innerHTML = '<div class="chart-empty">Tape at the navel, relaxed — same morning each week</div>';
    statsEl.innerHTML = '';
    return;
  }

  const allCm = data.map(d => d.cm);
  const min = Math.floor(Math.min(...allCm) - 1);
  const max = Math.ceil(Math.max(...allCm) + 1);
  const range = max - min || 1;
  const W = 1000, H = 150, P = 20;
  const xStep = data.length > 1 ? (W - 2 * P) / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: P + i * xStep,
    y: H - P - ((d.cm - min) / range) * (H - 2 * P)
  }));
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');

  chartEl.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <path d="${path}" stroke="#828699" stroke-width="2.2" fill="none" />
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#828699" stroke="#18181F" stroke-width="2"/>`).join('')}
    </svg>
  `;

  const first = data[0].cm;
  const latest = data.at(-1).cm;
  const change = latest - first;
  statsEl.innerHTML = `
    <div class="progress-stat">
      <div class="progress-stat-label">Current</div>
      <div class="progress-stat-value">${latest.toFixed(1)}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">Change</div>
      <div class="progress-stat-value ${change < 0 ? 'green' : ''}">${change > 0 ? '+' : ''}${change.toFixed(1)}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">Long-term target</div>
      <div class="progress-stat-value">&lt; 85</div>
    </div>
  `;
}

document.getElementById('logWaistBtn')?.addEventListener('click', () => {
  const input = document.getElementById('waistInput');
  const cm = parseFloat(input.value);
  if (!cm || cm < 50 || cm > 150) { showToast('Enter a valid waist in cm'); return; }
  const dKey = today();
  state.waists = (state.waists || []).filter(w => w.date !== dKey);
  state.waists.push({ date: dKey, cm });
  save();
  input.value = '';
  showToast('Logged ' + cm.toFixed(1) + ' cm');
  renderWaist();
});

// ========== OFFICE DAY · covert station rotator ==========
function renderOffice() {
  const rot = document.getElementById('officeRotator');
  if (!rot) return;
  renderInfoList('officeTripList', DATA.officeStations);
  renderInfoList('officeDeskList', DATA.officeDesk);
  const dKey = today();
  if (!state.officeTrip || state.officeTrip.date !== dKey) {
    state.officeTrip = { date: dKey, idx: 0, done: 0 };
  }
  const station = DATA.officeStations[state.officeTrip.idx % DATA.officeStations.length];
  const doneTxt = state.officeTrip.done ? ` · ${state.officeTrip.done} trip${state.officeTrip.done > 1 ? 's' : ''} today` : '';
  rot.innerHTML = `
    <div class="office-next">
      <span class="office-next-label">Next toilet trip${doneTxt}</span>
      <span class="office-next-name">${station.name} · ${station.spec}</span>
    </div>
    <button class="office-done-btn" id="officeDoneBtn" type="button">Did it</button>
  `;
  document.getElementById('officeDoneBtn').addEventListener('click', () => {
    state.officeTrip.idx = (state.officeTrip.idx + 1) % DATA.officeStations.length;
    state.officeTrip.done = (state.officeTrip.done || 0) + 1;
    save();
    renderOffice();
  });
}

// ========== COACH REVIEW · copy a readable digest + raw data ==========
// Builds a plain-text training summary the user can paste into chat for
// analysis, with the raw slice appended in a fenced JSON block.
function buildCoachReport() {
  const L = [];
  const wk = weekNumber();
  const ph = phaseNumber(wk);
  const start = state.startDate || '—';
  const daysIn = state.startDate
    ? Math.round((parseIso(today()) - parseIso(state.startDate)) / DAY_MS)
    : 0;

  L.push('RHN PROTOCOL — COACH REVIEW');
  const brief = buildCheckinBrief();
  if (brief) { L.push(brief.split('\n```json')[0]); L.push(''); }
  const phLabel = isReset() ? (resetPhase(wk)?.title || '—') : 'phase ' + ph;
  L.push(`generated ${today()} · ${isReset() ? 'RESET' : 'RHN'} · week ${wk}/${isReset() ? DATA.totalWeeks : 16} · ${phLabel} · started ${start} (${daysIn}d in)`);
  L.push('');

  // ----- BODY -----
  const weights = blockWeights();
  const waists = (state.waists || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  L.push('BODY');
  if (weights.length) {
    const latest = weights.at(-1);
    const avg = rollingAvgWeight();
    const startKg = weights.length > 1 ? weights[0].kg : (DATA.startKg ?? latest.kg);
    const f = forecastTrajectory(DATA.targetKg);
    const rate = (f && f.slopePerWeek != null) ? `${f.slopePerWeek > 0 ? '+' : ''}${f.slopePerWeek.toFixed(2)} kg/wk` : 'n/a';
    const net = avg != null ? avg - startKg : 0;
    L.push(`  Weight: ${latest.kg.toFixed(1)} kg today · 7-day avg ${avg != null ? avg.toFixed(1) : '—'} · trend ${rate} · start ${startKg.toFixed(1)} → net ${net >= 0 ? '+' : ''}${net.toFixed(1)} (${weights.length} logs)`);
    if (f && f.status === 'ok' && f.projDate) L.push(`  Forecast: ${DATA.targetKg} kg ~${f.projDate} (±${f.bandDays}d) at current rate`);
    else if (f && f.status === 'reached') L.push('  Forecast: at/under target on the 7-day line');
  } else {
    L.push('  Weight: no logs yet');
  }
  if (waists.length) {
    const lw = waists.at(-1), sw = waists.length > 1 ? waists[0] : lw;
    const d = lw.cm - sw.cm;
    L.push(`  Waist: ${lw.cm.toFixed(1)} cm · start ${sw.cm.toFixed(1)} → ${d >= 0 ? '+' : ''}${d.toFixed(1)} (${waists.length} logs)`);
  } else {
    L.push('  Waist: no logs yet');
  }
  L.push(`  Target: ${DATA.targetKg} kg`);
  L.push('');

  // ----- ADHERENCE -----
  const wname = id => (DATA.workouts.find(w => w.id === id)?.name) || id;
  const win = 28;
  const recentSess = (state.sessions || []).filter(s => daysAgo(s.date) <= win);
  const byW = {};
  for (const s of recentSess) byW[s.workoutId] = (byW[s.workoutId] || 0) + 1;
  L.push(`ADHERENCE (last ${win} days)`);
  L.push(`  Sessions logged: ${recentSess.length}`);
  const parts = Object.entries(byW).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${wname(id)} ×${n}`);
  if (parts.length) L.push(`  By session: ${parts.join(' · ')}`);
  const allSess = (state.sessions || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (allSess.length) {
    const last = allSess.at(-1);
    L.push(`  Last session: ${last.date} (${wname(last.workoutId)}) · ${daysAgo(last.date)}d ago · ${allSess.length} all-time`);
  }
  L.push('');

  // ----- STRENGTH PROGRESSION -----
  const all = collectExerciseHistory();
  const strength = all.filter(h => h.mode === 'weight_reps' || h.mode === 'multistage')
    .sort((a, b) => (a.workoutName + a.ex.name).localeCompare(b.workoutName + b.ex.name));
  L.push('STRENGTH — best set: first → latest (sessions · trend)');
  if (!strength.length) L.push('  No strength sets logged yet.');
  for (const h of strength) {
    const first = h.entries[0], last = h.entries.at(-1);
    const arrow = last.score > first.score + 0.001 ? '↑' : last.score < first.score - 0.001 ? '↓' : '→';
    const stalled = h.entries.length >= 4 &&
      Math.max(...h.entries.slice(-3).map(e => e.score)) <= Math.max(...h.entries.slice(0, -3).map(e => e.score)) + 0.001;
    L.push(`  ${h.ex.name} [${h.workoutName}]: ${formatPrev(first.best, h.mode, h.ex)} → ${formatPrev(last.best, h.mode, h.ex)} ${arrow} (${h.entries.length}${stalled ? ' · STALLING' : ''})`);
  }
  L.push('');

  // ----- OTHER LOGGED (conditioning / timed / cardio) -----
  const other = all.filter(h => h.mode !== 'weight_reps' && h.mode !== 'multistage')
    .sort((a, b) => (a.workoutName + a.ex.name).localeCompare(b.workoutName + b.ex.name));
  if (other.length) {
    L.push('OTHER LOGGED (latest)');
    for (const h of other) {
      const last = h.entries.at(-1);
      L.push(`  ${h.ex.name} [${h.workoutName}]: ${formatPrev(last.best, h.mode, h.ex)} (${h.entries.length})`);
    }
    L.push('');
  }

  // ----- PAIN + SWAPS -----
  const painNames = new Set();
  for (const k of Object.keys(state.pain || {})) {
    if (!state.pain[k]) continue;
    const p = k.split('::'), date = p[0], wid = p[1], exKey = p.slice(2).join('::');
    if (daysAgo(date) > 30) continue;
    const w = DATA.workouts.find(x => x.id === wid);
    const ex = w ? findExerciseByKey(w, exKey) : null;
    painNames.add(`${ex ? ex.name : exKey} (${date})`);
  }
  L.push(`PAIN FLAGS (30d): ${painNames.size ? [...painNames].join(' · ') : 'none'}`);
  const swapCount = {};
  for (const k of Object.keys(state.swaps || {})) {
    if (!state.swaps[k]) continue;
    const exKey = k.split('::').slice(2).join('::');
    swapCount[exKey] = (swapCount[exKey] || 0) + 1;
  }
  const swaps = Object.entries(swapCount).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`);
  L.push(`EQUIPMENT SWAPS: ${swaps.length ? swaps.join(' · ') : 'none'}`);
  L.push('');

  // ----- RAW slice for parsing -----
  const raw = {
    generated: today(), weekNumber: wk, phase: ph, startDate: state.startDate,
    baseline: state.baseline, targetKg: DATA.targetKg, startKg: DATA.startKg,
    weights: state.weights, waists: state.waists, sessions: state.sessions,
    pain: state.pain, swaps: state.swaps, recovery: state.sleep, setLog: state.setLog
  };
  L.push('--- RAW DATA (for Claude to parse) ---');
  L.push('```json');
  L.push(JSON.stringify(raw));
  L.push('```');

  return L.join('\n');
}

document.getElementById('coachCopyBtn')?.addEventListener('click', async () => {
  const text = buildCoachReport();
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (_) { ok = false; }
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(ta);
  }
  showToast(ok ? 'Copied — paste it into the chat' : 'Copy blocked — long-press Export instead');
});

// ========== DATA BACKUP · export / import ==========
const PREIMPORT_KEY = STORAGE_KEY + ':preimport';
const EXPORT_NAG_DAYS = 7;

// Newest logged date + number of logged days in a state's setLog.
function setLogSummary(st) {
  const days = Object.keys((st && st.setLog) || {}).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  return { newest: days.at(-1) || null, count: days.length };
}

// Share the backup as a file where supported (iOS share sheet → Files/Drive),
// else download it. Only stamps lastExport once the file actually left the app.
async function exportBackup() {
  const name = `rhn-backup-${today()}.json`;
  const json = JSON.stringify(state, null, 2);
  let delivered = false;
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], title: 'RHN backup' });
      delivered = true;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') { showToast('Export cancelled'); return; }
    // Share unsupported/failed — fall through to download.
  }
  if (!delivered) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  state.lastExport = new Date().toISOString();
  save();
  renderBackupBanner();
  showToast('Backup exported');
}

function renderBackupBanner() {
  const el = document.getElementById('backupBanner');
  if (!el) return;
  const hasLogs = setLogSummary(state).count > 0;
  const last = state.lastExport ? new Date(state.lastExport).getTime() : NaN;
  const stale = !Number.isFinite(last) || (Date.now() - last) / 86400000 > EXPORT_NAG_DAYS;
  el.hidden = !(hasLogs && stale);
  const txt = document.getElementById('backupBannerText');
  if (txt) txt.textContent = Number.isFinite(last)
    ? `Last backup ${Math.floor((Date.now() - last) / 86400000)} days ago — export a fresh one.`
    : 'No backup yet — your logs live only on this phone.';
}

document.getElementById('exportBtn')?.addEventListener('click', exportBackup);
document.getElementById('backupBannerBtn')?.addEventListener('click', exportBackup);

document.getElementById('importBtn')?.addEventListener('click', () => {
  document.getElementById('importFile')?.click();
});

document.getElementById('importFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || Array.isArray(data) || !data.setLog || typeof data.setLog !== 'object') throw new Error('not a backup');
    } catch (err) {
      showToast('Invalid backup file');
      return;
    }
    const inc = setLogSummary(data), cur = setLogSummary(state);
    let msg = `Replace current data with this backup?\n\nBackup: newest log ${inc.newest || 'none'} · ${inc.count} day(s)\nCurrent: newest log ${cur.newest || 'none'} · ${cur.count} day(s)`;
    if (inc.count < cur.count) msg += `\n\n⚠ The backup has FEWER logged days (${inc.count} vs ${cur.count}). You will lose ${cur.count - inc.count} day(s) of logs.`;
    if (cur.newest && inc.newest && inc.newest < cur.newest) msg += '\n⚠ The backup is OLDER than what is on this phone.';
    msg += '\n\nYour current data is kept as a pre-import copy.';
    if (!confirm(msg)) return;
    // Stash the current state first; refuse to overwrite if we can't.
    if (!safeSet(PREIMPORT_KEY, JSON.stringify(state))) {
      showToast('Import aborted — could not stash current data');
      return;
    }
    state = { ...defaultState, ...data, onboarded: true };
    if (!save()) return;
    renderAll();
    showToast('Backup restored');
  };
  reader.onerror = () => showToast('Could not read file');
  reader.readAsText(file);
});

// ===== MOBILITY MILESTONES =====
function renderMobility() {
  const el = document.getElementById('mobilityList');
  if (!el) return;
  el.innerHTML = DATA.mobilityTests.map((t, i) => {
    const hits = (state.mobility || []).filter(m => m.test === t.name).sort((a, b) => a.date.localeCompare(b.date));
    const last = hits.at(-1);
    const daysAgo = last ? Math.round((parseIso(today()) - parseIso(last.date)) / 86400000) : null;
    const stale = daysAgo == null || daysAgo >= 28;
    const status = last
      ? `<span class="mob-last ${stale ? 'stale' : 'fresh'}">last hit ${fmtDate(last.date)}${stale ? ' · re-test due' : ''}</span>`
      : `<span class="mob-last stale">not tested yet</span>`;
    return `
      <div class="mob-row">
        <div class="mob-info">
          <div class="mob-name">${t.name} <span class="mob-spec">${t.spec}</span></div>
          <div class="mob-note">${t.note}</div>
          ${status}
        </div>
        <button class="mob-btn" data-test="${i}">Hit ✓</button>
      </div>`;
  }).join('');
  el.querySelectorAll('.mob-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = DATA.mobilityTests[+btn.dataset.test];
      state.mobility = state.mobility || [];
      state.mobility = state.mobility.filter(m => !(m.test === t.name && m.date === today()));
      state.mobility.push({ test: t.name, date: today() });
      save();
      renderMobility();
      showToast(t.name + ' logged');
    });
  });
}

function renderProgress() {
  renderCheckinPrompt('progress');
  renderWeightChart();
  renderWeightStats();
  renderForecast();
  renderPatterns();
  renderWaist();
  renderWeekGrid();
  renderHistory();
  renderWeeklyLog();
  renderMobility();
  renderPhases();
}

// Per-week completion record — which of Day 1–5 you hit vs missed each week.
function renderWeeklyLog() {
  const el = document.getElementById('weeklyLog');
  if (!el) return;
  const card = el.closest('.card');
  if (card) card.hidden = isReset();
  if (isReset()) return;
  const cur = weekNumber();
  const rows = [];
  for (let wk = cur; wk >= 1; wk--) {
    const done = daysDoneInWeek(wk);
    const dots = getActiveSequence().map((id, i) =>
      `<span class="wl-day ${done.has(id) ? 'hit' : 'miss'}" title="Day ${i + 1} ${done.has(id) ? 'done' : 'missed'}">${i + 1}</span>`
    ).join('');
    const n = done.size;
    const label = wk === cur ? `Week ${wk} · now` : `Week ${wk}`;
    rows.push(`<div class="wl-row">
      <div class="wl-wk">${label}</div>
      <div class="wl-days">${dots}</div>
      <div class="wl-count ${n >= 5 ? 'full' : n === 0 ? 'zero' : ''}">${n}/5</div>
    </div>`);
  }
  el.innerHTML = rows.join('');
}

// ========== NUTRITION ==========
function renderNutrition() {
  const trailCard = document.getElementById('trailCard');
  if (trailCard) {
    trailCard.hidden = today() > OMAN_END_DATE;
    renderInfoList('trailList', DATA.trailFuel);
  }
  document.getElementById('targetsGrid').innerHTML = DATA.targets.map(t => `
    <div class="target-cell">
      <div class="target-label">${t.label}</div>
      <div class="target-value">${t.value}</div>
      <div class="target-note">${t.note}</div>
    </div>
  `).join('');
  document.getElementById('proteinList').innerHTML = DATA.proteinSources.map(s => `
    <div class="row">
      <div>
        <div class="row-name">${s.name}</div>
        <div class="row-meta">${s.when}</div>
      </div>
      <div class="row-meta protein">~${s.grams}g</div>
    </div>
  `).join('');
  document.getElementById('goToList').innerHTML = DATA.goTos.map(s => `
    <div class="row">
      <div class="row-name">${s.name}</div>
      <div class="row-meta">${s.how}</div>
    </div>
  `).join('');
  document.getElementById('limitList').innerHTML = DATA.limits.map(s => `
    <div class="row">
      <div class="row-name">${s.name}</div>
      <div class="row-meta">${s.how}</div>
    </div>
  `).join('');
}

// ========== PROTOCOL ==========
function renderLookThePart() {
  let card = document.getElementById('lookCard');
  const anchor = document.getElementById('maintainToggleBtn')?.closest('.card');
  if (!card && anchor) {
    card = document.createElement('section');
    card.id = 'lookCard';
    card.className = 'card card-collapsible collapsed';
    anchor.before(card);
  }
  if (!card) return;
  card.innerHTML = `
    <header class="card-header"><h2>Look the part</h2><span class="card-meta">optional · untracked</span><span class="card-toggle" aria-hidden="true"></span></header>
    <div class="rules">${(DATA.lookThePart || []).map((r, i) => `<div class="rule"><div class="rule-num">${String(i + 1).padStart(2, '0')}</div><div class="rule-body">${r}</div></div>`).join('')}
    ${isReset() ? '<div class="rule"><div class="rule-num">→</div><div class="rule-body">Planning RHN 2.0 early? <button type="button" class="nudge-btn" id="ciEarlyBtn">Open the check-in now</button></div></div>' : ''}</div>`;
  card.querySelector('.card-header').addEventListener('click', () => card.classList.toggle('collapsed'));
  card.querySelector('#ciEarlyBtn')?.addEventListener('click', e => { e.stopPropagation(); openCheckin('w10'); });
}

function renderProtocol() {
  renderLookThePart();
  document.getElementById('executionRules').innerHTML = DATA.executionRules.map((r, i) => `
    <div class="rule">
      <div class="rule-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="rule-body">${r}</div>
    </div>
  `).join('');
  document.getElementById('geneticsList').innerHTML = DATA.genetics.map((r, i) => `
    <div class="rule">
      <div class="rule-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="rule-body">
        <div class="rule-title">${r.title}</div>
        <div class="rule-sub">${r.body}</div>
      </div>
    </div>
  `).join('');
  document.getElementById('virilityList').innerHTML = DATA.virility.map((r, i) => `
    <div class="rule">
      <div class="rule-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="rule-body">${r}</div>
    </div>
  `).join('');
  document.getElementById('progressionList').innerHTML = DATA.progression.map((r, i) => `
    <div class="rule">
      <div class="rule-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="rule-body">
        <div class="rule-title">${r.title}</div>
        <div class="rule-sub">${r.body}</div>
      </div>
    </div>
  `).join('');
  renderMaintain();
  const disc = document.getElementById('disclaimerLine');
  if (disc) disc.textContent = DATA.disclaimer || '';
}

// ===== MAINTAIN / TRAVEL MODE =====
function renderMaintain() {
  const btn = document.getElementById('maintainToggleBtn');
  const status = document.getElementById('maintainStatus');
  if (!btn || !status) return;
  if (isPaused()) {
    btn.textContent = 'Resume block';
    btn.classList.add('done');
    status.innerHTML = `<div class="info-row"><div class="info-body"><div class="info-name">Paused since ${fmtDate(state.pausedAt)}</div><div class="info-note">Week frozen at ${weekNumber()}. Streak held. On resume, the block shifts forward so nothing drifts.</div></div></div>`;
  } else {
    btn.textContent = 'Pause block';
    btn.classList.remove('done');
    status.innerHTML = '';
  }
}

// Banner at the top of Today — pause state or a deload/diet-break week
function renderModeBanner() {
  const el = document.getElementById('modeBanner');
  if (!el) return;
  const wk = weekNumber();
  if (isPaused()) {
    el.hidden = false;
    el.className = 'mode-banner paused';
    el.innerHTML = `<div class="mode-banner-title">Maintain mode · block paused</div>
      <div class="mode-banner-body">Hold the line, don't chase. Bodyweight circuit below; eat at maintenance; protect sleep. Resume on the Protocol tab when you're back.</div>
      <div class="maintain-circuit">${DATA.maintainCircuit.map(m => `<div class="mc-row"><span class="mc-name">${m.name}</span><span class="mc-spec">${m.spec}</span></div>`).join('')}</div>`;
  } else if (isDeloadWeek(wk)) {
    el.hidden = false;
    el.className = 'mode-banner deload';
    const diet = isDietBreakWeek(wk) ? ' This week also runs a <strong>diet break</strong> — eat at maintenance for 5–7 days. Hormonal and mental reset.' : '';
    el.innerHTML = `<div class="mode-banner-title">Week ${wk} · Deload</div>
      <div class="mode-banner-body">Same lifts, ~60% load, half the sets. Leave the gym feeling you could've done more — that's the point. Form and mobility focus.${diet}</div>`;
  } else {
    el.hidden = true;
    el.innerHTML = '';
  }
}

// Minimum viable session — bad-day workout
document.getElementById('mvsLink')?.addEventListener('click', () => {
  setSelectedWorkoutForToday('mvs');
  save();
  renderToday();
  renderHeader();
  requestAnimationFrame(() => {
    const card = document.getElementById('workoutCard');
    if (card && !card.hidden) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Spidey session — no-gym / exhausted-day bodyweight AMRAP + easy run
document.getElementById('spideyLink')?.addEventListener('click', () => {
  setSelectedWorkoutForToday('spidey');
  save();
  renderToday();
  renderHeader();
  requestAnimationFrame(() => {
    const card = document.getElementById('workoutCard');
    if (card && !card.hidden) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Maintain / travel / illness mode toggle
document.getElementById('maintainToggleBtn')?.addEventListener('click', () => {
  if (isPaused()) {
    exitPause();
  } else {
    if (!confirm('Pause the block? Streak freezes, deficit nagging stops, and a bodyweight circuit takes over until you resume.')) return;
    enterPause();
  }
});

// Lapse-friendly restart: Day 1 / Week 1 clock + sequence, every log kept
document.getElementById('restartBlockBtn')?.addEventListener('click', () => {
  if (!confirm('Restart from Day 1, Week 1? The timeline and the day sequence reset to the start — all your logged history (sets, weight, waist) stays.')) return;
  state.startDate = today();
  state.dayCursor = null;        // sequence back to Day 1
  state.workoutByDate = {};      // clear the per-date schedule map
  state.selectedWorkout = 'day1';
  state.pausedAt = null;
  save();
  showToast('Day 1 · Week 1 · history kept');
  renderAll();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Wipe everything and restart Week 1?')) return;
  // Wipe the primary AND every backup copy — otherwise load() would happily
  // resurrect the "reset" data from the shadow mirror on next launch.
  try {
    [STORAGE_KEY, SHADOW_KEY, ...snapshotKeys()].forEach(k => localStorage.removeItem(k));
  } catch (_) { /* storage blocked */ }
  state = seed();
  showToast('Reset · week 1');
  renderAll();
});

// ========== INIT ==========
function renderAll() {
  renderHeader();
  renderBackupBanner();
  renderToday();
  renderAllWorkouts();
  renderLifts();
  renderProgress();
  renderNutrition();
  renderProtocol();
}

// Hide the Oman program after the trip date; fall back to RHN if it was active.
const OMAN_END_DATE = '2026-10-28';
const isOmanPastTrip = today() > OMAN_END_DATE;
if (isOmanPastTrip && state.program === 'oman') state.program = 'rhn';
document.querySelectorAll('.prog-btn').forEach(btn => {
  if (btn.dataset.program === 'oman') btn.hidden = isOmanPastTrip;
  btn.classList.toggle('active', btn.dataset.program === state.program);
});

if (state.resetBlock !== RESET_START_KEY) {
  state.resetBlock = RESET_START_KEY;
  state.program = 'reset';
  state.startDate = RESET_START_DATE;
  state.pausedAt = null;
  state.workoutByDate = {};
  state.dayCursor = null;
  document.querySelectorAll('.prog-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.program === 'reset'));
}

// Baseline was hard-coded at the 75 kg recomp — reset it for the 82 kg Reset start.
if (!state.baselineV2) {
  state.baselineV2 = true;
  state.baseline = { ...(state.baseline || {}), weight: DATA.startKg, waist: null, kneeL: null, kneeR: null };
}
if (state.baseline && state.baseline.weight === 82) state.baseline.weight = DATA.startKg; // real start: 83 kg
autoRamadan();

// Lock in today's pick so it can't shift mid-day (e.g. Day 1 → Day 2 the moment
// Day 1 counts as done this week).
setSelectedWorkoutForToday(getSelectedWorkoutForToday());
save();

// A home-screen app can sit suspended in memory for days and resume without
// reloading — so it would still be showing the day it was opened. When it
// comes back on a different date, reload so everything renders for today.
const LOADED_ON = today();
function reloadIfNewDay() {
  if (today() !== LOADED_ON) location.reload();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reloadIfNewDay();
});
window.addEventListener('pageshow', reloadIfNewDay);
window.addEventListener('focus', reloadIfNewDay);

// Onboarding removed — baseline is hard-coded. Keep the overlay hidden if any
// stale markup is still cached on a device.
(function () { const o = document.getElementById('onboard'); if (o) o.hidden = true; })();

// ===== THEME (light default) =====
const THEME_KEY = 'rhn-theme';
function applyTheme(theme) {
  const isLight = theme !== 'dark';
  document.documentElement.classList.toggle('light', isLight);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isLight ? '☾' : '☀';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isLight ? '#ECEAE3' : '#18181F');
}
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// Rest-timer button wiring
document.getElementById('restSkip')?.addEventListener('click', cancelRestTimer);
document.getElementById('restPlus')?.addEventListener('click', () => adjustRestTimer(15));
document.getElementById('restMinus')?.addEventListener('click', () => adjustRestTimer(-15));

// Collapsible info cards (Morning ritual, Stamina, Daily)
document.querySelectorAll('.card-collapsible .card-header').forEach(header => {
  header.addEventListener('click', () => {
    header.closest('.card-collapsible').classList.toggle('collapsed');
  });
});

// Ask the browser not to evict our storage under pressure (no-op where unsupported).
try { navigator.storage?.persist?.()?.catch?.(() => {}); } catch (_) { /* unsupported */ }
// Offline: network-first service worker — always fresh when online, cached copy when the gym has no signal.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

renderAll();
