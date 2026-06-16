// THE RED HOOD × NIGHTWING PROTOCOL — app logic

const STORAGE_KEY = 'rhn-protocol-v1';

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
  workoutByDate: {},   // { "2026-04-29": "day3", ... }
  setLog: {},
  daily: {},
  ritual: {},
  stamina: {}
};

// Default workout per weekday — Sat is Day 1, then forward through the week
const DEFAULT_WEEKDAY_WORKOUT = {
  6: 'day1',     // Sat — back width + side delts
  0: 'day2',     // Sun — lower posterior + core
  1: 'day3',     // Mon — chest + shoulders + arms
  2: 'day4',     // Tue — power + conditioning
  3: 'day5',     // Wed — pump upper volume
  4: 'homecore', // Thu — rest / home core
  5: 'homecore'  // Fri — rest / home core
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    const merged = { ...defaultState, ...parsed };
    // Onboarding is gone — everyone is onboarded with a hard-coded baseline.
    merged.onboarded = true;
    if (!merged.baseline) merged.baseline = { ...defaultState.baseline };
    return merged;
  } catch (e) {
    return seed();
  }
}

function seed() {
  const s = { ...defaultState, startDate: today() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Local-timezone date — toISOString() is UTC, which made "today" flip at 8am SGT
function localIso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function today() {
  return localIso(new Date());
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function isPaused() { return !!state.pausedAt; }

function weekNumber() {
  if (!state.startDate) return 1;
  const start = new Date(state.startDate + 'T00:00:00');
  // While paused, freeze the clock at the pause date so deloads don't drift.
  const ref = isPaused() ? new Date(state.pausedAt + 'T00:00:00') : new Date();
  const diffDays = Math.floor((ref - start) / (1000 * 60 * 60 * 24));
  return Math.min(16, Math.max(1, Math.floor(diffDays / 7) + 1));
}

// ===== Periodization: 16 weeks = four 4-week phases. Workouts evolve by phase. =====
function phaseNumber(week) {
  return Math.min(4, Math.ceil((week || weekNumber()) / 4));
}

// Week index for an arbitrary log date — lets history render the phase that was
// actually active that day rather than today's phase.
function weekForDate(dateStr) {
  if (!state.startDate || !dateStr) return weekNumber();
  const start = new Date(state.startDate + 'T00:00:00');
  const ref = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.floor((ref - start) / 86400000);
  return Math.min(16, Math.max(1, Math.floor(diffDays / 7) + 1));
}

// Resolve a workout to a phase: keep every exercise that has no `phases` tag, or
// whose `phases` list includes the active phase; drop blocks left empty. NOTE:
// phase-specific exercises must always be APPENDED at the end of a block or live
// in their own block, so the index-based set-log keys of the base exercises never
// shift between phases (history, prev-best and suggestions stay aligned).
function resolveWorkout(w, phase) {
  if (!w || !w.blocks) return w;
  const ph = phase || phaseNumber();
  const blocks = w.blocks
    .map(b => ({ ...b, exercises: b.exercises.filter(ex => !ex.phases || ex.phases.includes(ph)) }))
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
function isDeloadWeek(n) { return n === 8 || n === 14; }
function isDietBreakWeek(n) { return n === 8; }

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
  const dow = new Date().getDay();
  return DEFAULT_WEEKDAY_WORKOUT[dow] || 'homecore';
}

function setSelectedWorkoutForToday(id) {
  state.workoutByDate = state.workoutByDate || {};
  state.workoutByDate[today()] = id;
  state.selectedWorkout = id;
}

function findExerciseByKey(workout, exKey) {
  const sep = exKey.indexOf('::');
  if (sep < 0) return null;
  const blockTitle = exKey.slice(0, sep);
  const idx = +exKey.slice(sep + 2);
  const block = workout.blocks.find(b => b.title === blockTitle);
  return block ? block.exercises[idx] : null;
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

  // Deload week (multiples of 5): 80% of last
  if (weekNumber() % 5 === 0) {
    return Math.round(lastKg * 0.8 * 4) / 4;
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

function inputFieldsForMode(mode) {
  switch (mode) {
    case 'bodyweight_reps':
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
    // Pick best by kg first, else reps, else sec, else min
    const best = valid.reduce((a, b) => {
      const aw = parseFloat(a.kg || a.sec || a.min || a.reps || 0);
      const bw = parseFloat(b.kg || b.sec || b.min || b.reps || 0);
      return bw > aw ? b : a;
    });
    return { date: d, set: best };
  }
  return null;
}

function formatPrev(set, mode, ex) {
  if (!set) return '';
  switch (mode) {
    case 'bodyweight_reps':
      return `${set.reps || '–'} reps`;
    case 'time':
      return `${set.sec || '–'} s`;
    case 'time_speed':
      return `${set.min || '–'} min · ${set.spm || '–'} spm`;
    case 'treadmill':
      return `${set.min || '–'} min · ${set.kmh || '–'} km/h · ${set.incline || '–'}%`;
    case 'interval':
      return `lvl ${set.level || '–'} · ${set.rounds || '–'} rds`;
    case 'cardio':
      return `${set.min || '–'} min · lvl ${set.level || '–'}`;
    case 'multistage': {
      // pull stage0 as the headline
      const s0 = set.stage0;
      if (!s0) return 'logged';
      return `${s0.kg || '–'} kg × ${s0.reps || '–'}`;
    }
    default:
      if (ex?.barbell) {
        const side = parseFloat(set.kg);
        const total = !isNaN(side) ? ((ex.bar ?? 20) + 2 * side) : null;
        return `${set.kg || '–'} /side × ${set.reps || '–'}${total != null ? ` (${total} total)` : ''}`;
      }
      return `${set.kg || '–'} kg × ${set.reps || '–'}`;
  }
}

function barTotalText(kgPerSide, barWeight) {
  const v = parseFloat(kgPerSide);
  if (isNaN(v)) return '';
  return '= ' + (barWeight + 2 * v) + ' kg';
}

function renderSessionProgress(done, total) {
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
}

function refreshSessionProgress() {
  const id = state.selectedWorkout;
  if (!id) return;
  const w = getWorkout(id);
  if (!w) return;
  const dKey = dailyKey();
  const log = state.setLog[dKey] && state.setLog[dKey][id] ? state.setLog[dKey][id] : {};
  let total = 0, done = 0;
  w.blocks.forEach(block => {
    block.exercises.forEach((ex, exIdx) => {
      const exKey = `${block.title}::${exIdx}`;
      const sets = log[exKey] || [];
      total += ex.sets;
      for (let s = 0; s < ex.sets; s++) {
        if (sets[s] && sets[s].done) done += 1;
      }
    });
  });
  renderSessionProgress(done, total);
}

function isCurrentBeating(currentSets, prev, mode) {
  if (!prev || !currentSets || !currentSets.length) return false;
  const current = currentSets.filter(s => s && s.done);
  if (!current.length) return false;
  const score = (s) => {
    if (mode === 'bodyweight_reps') return parseFloat(s.reps || 0);
    if (mode === 'time') return parseFloat(s.sec || 0);
    if (mode === 'time_speed') return parseFloat(s.min || 0) * (parseFloat(s.spm || 0) || 1);
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

// ========== HEADER ==========
function renderHeader() {
  document.getElementById('currentWeek').textContent = weekNumber();
  document.getElementById('streakBadge').textContent = computeStreak();
  const latest = state.weights.at(-1);
  document.getElementById('weightBadge').textContent = latest ? latest.kg.toFixed(1) : DATA.startKg.toFixed(1);
  const sel = state.selectedWorkout;
  const ws = DATA.workouts.find(w => w.id === sel);
  document.getElementById('dayBadge').textContent = ws ? ws.id.replace('day', 'D').replace('homecore', 'Hc') : '—';
  const sd = state.startDate;
  document.getElementById('startDate').textContent = sd ? fmtDate(sd) : '--';
  document.getElementById('todayDate').textContent = fmtDate(today());
}

function computeStreak() {
  if (!state.sessions.length) return 0;
  const dates = new Set(state.sessions.map(s => s.date));
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = localIso(d);
    if (dates.has(iso)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today to not be done yet — start counting from yesterday
      if (i === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

// ========== TODAY: DAY PICKER ==========
function renderDayPicker() {
  const wrap = document.getElementById('dayPicker');
  wrap.innerHTML = DATA.workouts.filter(w => !w.special).map((w, i) => `
    <button class="day-pill ${state.selectedWorkout === w.id ? 'active' : ''}" data-id="${w.id}">
      <div class="day-pill-num">${w.id === 'homecore' ? 'Home · core' : 'Day 0' + (i + 1)}</div>
      <div class="day-pill-name">${w.name.split('+')[0].trim()}</div>
    </button>
  `).join('');
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
  document.getElementById('workoutSubtitle').textContent = w.tagline + ' · Phase ' + (w._phase || phaseNumber());

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

  const dKey = dailyKey();
  const log = state.setLog[dKey] && state.setLog[dKey][id] ? state.setLog[dKey][id] : {};

  const list = document.getElementById('exerciseList');
  let totalSets = 0, doneSets = 0;
  list.innerHTML = w.blocks.filter(block => !block.gated || gateActive(block.gated)).map(block => `
    <section class="exercise-block">
      <button type="button" class="block-title">
        <span class="block-title-text">${block.title}</span>
        <span class="block-toggle" aria-hidden="true"></span>
      </button>
      <div class="exercise-block-body">
    ${block.exercises.map((ex, exIdx) => {
      const exKey = `${block.title}::${exIdx}`;
      const exLog = log[exKey] || [];
      const mode = ex.inputMode || 'weight_reps';
      const prev = findPreviousBest(id, exKey);
      const beating = isCurrentBeating(exLog, prev, mode);

      let bodyHTML = '';
      if (mode === 'multistage') {
        let setsHTML = '';
        for (let s = 0; s < ex.sets; s++) {
          totalSets += 1;
          const setData = exLog[s] || {};
          if (setData.done) doneSets += 1;
          const stagesHTML = ex.stages.map((stage, si) => {
            const sd = setData[`stage${si}`] || {};
            const suggKg = suggestedKgFor(id, exKey, ex, si);
            const kgPh = suggKg != null ? String(suggKg) : 'kg';
            return `
              <div class="ms-stage" data-stage="${si}">
                <span class="ms-label">${stage.label}</span>
                <div class="ms-inputs">
                  <input type="number" placeholder="${kgPh}" value="${sd.kg ?? ''}" data-field="kg" inputmode="decimal" />
                  <span>×</span>
                  <input type="number" placeholder="rep" value="${sd.reps ?? ''}" data-field="reps" inputmode="numeric" />
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
        const fields = inputFieldsForMode(mode);
        const suggKg = (mode === 'weight_reps') ? suggestedKgFor(id, exKey, ex) : null;
        const isBarbell = ex.barbell === true;
        const barWeight = ex.bar ?? 20;
        let setRows = '';
        for (let s = 0; s < ex.sets; s++) {
          totalSets += 1;
          const setData = exLog[s] || {};
          if (setData.done) doneSets += 1;
          const innerHTML = fields.map((f, fi) => {
            const sep = fi > 0 ? '<span>×</span>' : '';
            let ph;
            if (f.key === 'kg') {
              if (suggKg != null) ph = String(suggKg);
              else if (isBarbell) ph = 'side';
              else ph = f.label;
            } else {
              ph = placeholderFor(f, ex, mode);
            }
            const valStr = setData[f.key] ?? '';
            let extra = '';
            if (isBarbell && f.key === 'kg') {
              extra = `<span class="set-bar-total" data-bar-total>${barTotalText(valStr, barWeight)}</span>`;
            }
            return `${sep}<input type="number" placeholder="${ph}" value="${valStr}" data-field="${f.key}" inputmode="${f.inputmode}" style="width:${f.width}px" />${extra}`;
          }).join('');
          const timedBtn = ex.timed ? `<button class="timed-go" type="button" data-secs="${ex.timed}">▶ ${ex.timed}s</button>` : '';
          setRows += `
            <div class="set-input ${setData.done ? 'done' : ''}" data-ex="${exKey}" data-set="${s}" data-mode="${mode}"${isBarbell ? ` data-barbell="1" data-bar="${barWeight}"` : ''}>
              <span>S${s + 1}</span>
              ${innerHTML}
              ${timedBtn}
            </div>
          `;
        }
        bodyHTML = `<div class="set-rows">${setRows}</div>`;
      }

      const prevHTML = prev
        ? `<div class="exercise-prev ${beating ? 'beaten' : ''}" title="From ${fmtDate(prev.date)}">last · ${formatPrev(prev.set, mode, ex)}${beating ? ' · beaten' : ''}</div>`
        : '';
      const stallHTML = isStalled(id, exKey, ex)
        ? `<div class="exercise-stall">Stalled 3 sessions. Pick one: drop load 10% &amp; rebuild · swap a variation · or fix sleep + food first.</div>`
        : '';
      const painOn = !!(state.pain && state.pain[`${dKey}::${id}::${exKey}`]);
      return `
        <div class="exercise">
          <div class="exercise-head">
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-spec">${ex.sets} × ${ex.reps}</div>
            <button type="button" class="pain-flag ${painOn ? 'on' : ''}" data-painkey="${dKey}::${id}::${exKey}" title="Flag pain on this exercise">⚑</button>
          </div>
          ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
          ${prevHTML}
          ${stallHTML}
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

  renderSessionProgress(doneSets, totalSets);

  // Set input handlers — input event saves state, change event auto-fills
  list.querySelectorAll('.set-input, .ms-set').forEach(row => {
    const exKey = row.dataset.ex;
    const setIdx = +row.dataset.set;
    const mode = row.dataset.mode;
    const ex = findExerciseByKey(w, exKey);
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
          const fields = inputFieldsForMode(mode);
          setData[field] = input.value;
          setData.done = fields.every(f => setData[f.key] !== undefined && setData[f.key] !== '');
          // Live update of the bar total next to this kg input
          if (ex.barbell && field === 'kg') {
            const tot = row.querySelector('[data-bar-total]');
            if (tot) tot.textContent = barTotalText(input.value, ex.bar ?? 20);
          }
        }
        if (setData.done) row.classList.add('done');
        else row.classList.remove('done');
        save();
        refreshSessionProgress();
        refreshActiveExercise();

        // Set transitioned to done — start rest timer + check for PR
        if (!wasDone && setData.done) {
          startRestTimer(restDurationFor(ex));
          maybeFlashPR(row, exKey, ex, mode);
        }
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

  const btn = document.getElementById('finishWorkoutBtn');
  const isLogged = state.sessions.some(s => s.date === dKey && s.workoutId === id);
  btn.textContent = isLogged ? 'Session logged' : 'Mark session complete';
  btn.classList.toggle('done', isLogged);
  btn.onclick = () => {
    if (isLogged) return;
    state.sessions.push({ date: dKey, workoutId: id, name: w.name });
    save();
    showToast('Session logged');
    renderWorkout();
    renderHeader();
    renderProgress();
  };
}

function renderToday() {
  renderDayPicker();
  renderInfoList('ritualList', DATA.morningRitual);
  renderInfoList('dailyList', DATA.daily);
  renderInfoList('staminaList', DATA.stamina);
  renderWorkout();
  renderSleep();
  renderOffice();
  renderModeBanner();

  const w = getWorkout(state.selectedWorkout);
  document.getElementById('todayTitle').textContent = w ? w.name : "Today's session";
  document.getElementById('todaySub').textContent = w ? w.blurb : "Pick what fits your week. Don't stack delts back-to-back.";
  document.getElementById('todayTag').textContent = w ? w.tagline : 'Show up';
}

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
  wrap.innerHTML = phaseTag + phaseWorkouts().map((w, i) => `
    <section class="workout-block">
      <div class="workout-block-head">
        <div class="workout-block-tag">${w.id === 'homecore' ? 'Home · core' : 'Day 0' + (i + 1)}</div>
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
          </div>
        `).join('')}
      `).join('')}
    </section>
  `).join('');
}

// ========== PROGRESS ==========
function renderWeightChart() {
  const el = document.getElementById('weightChart');
  if (!state.weights.length) {
    el.innerHTML = '<div class="chart-empty">Log your first weight to see the curve</div>';
    return;
  }

  const data = state.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
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

// Rolling 7-day average ending at the latest entry — the honest cut number.
function rollingAvgWeight() {
  const data = state.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!data.length) return null;
  const last7 = data.slice(-7).map(d => d.kg);
  return last7.reduce((a, b) => a + b, 0) / last7.length;
}

function renderWeightStats() {
  const el = document.getElementById('weightStats');
  const data = state.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const today = data.at(-1)?.kg ?? DATA.startKg;
  const avg = rollingAvgWeight() ?? DATA.startKg;
  const start = data.length > 1 ? data[0].kg : DATA.startKg;
  const lost = start - avg;
  const target = DATA.targetKg;
  const toGo = avg - target;
  const atFloor = avg <= 68;

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
      <div class="progress-stat-label">${atFloor ? 'At floor' : 'To target'}</div>
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
    return '<strong>68 kg — the floor.</strong> Hold maintenance and keep progressing the lifts. No deeper deficit; below 12% body fat tanks recovery and hormones.';
  }
  // Find a data point ~14 days before the latest to measure the slope.
  const latest = data.at(-1);
  const latestT = new Date(latest.date).getTime();
  let past = null;
  for (const d of data) {
    const days = (latestT - new Date(d.date).getTime()) / 86400000;
    if (days >= 12) past = d; else break;
  }
  if (!past) {
    return 'Track the average line, not the daily dot. Target rate is 0.3–0.45 kg/week — the 2-week check kicks in once you have ~14 days logged.';
  }
  const weeks = ((latestT - new Date(past.date).getTime()) / 86400000) / 7;
  // rolling avg at the past point
  const idx = data.indexOf(past);
  const pastWin = data.slice(Math.max(0, idx - 6), idx + 1).map(x => x.kg);
  const pastAvg = pastWin.reduce((a, b) => a + b, 0) / pastWin.length;
  const rate = (pastAvg - avg) / weeks; // +ve = losing
  const r = rate.toFixed(2);

  if (rate >= 0.3 && rate <= 0.45) {
    return `<strong>On track.</strong> Losing ${r} kg/week — right in the 0.3–0.45 window. Hold everything steady; you're keeping muscle while the fat comes off.`;
  }
  if (rate > 0.45) {
    return `<strong>Ahead — and a touch fast.</strong> Losing ${r} kg/week (target 0.3–0.45). Add ~100–150 kcal/day (a fist of rice or an extra fruit). Too fast burns muscle and tanks gym performance.`;
  }
  if (rate < 0.3 && rate >= 0) {
    return `<strong>Behind.</strong> Losing ${r} kg/week (target 0.3–0.45). Trim ~150 kcal/day — cut one starch portion or the chai sugar — or add 1,500 steps. Re-check in a week.`;
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

function renderWeekGrid() {
  const el = document.getElementById('weekGrid');
  const cw = weekNumber();
  el.innerHTML = '';
  for (let i = 1; i <= 16; i++) {
    let cls = 'week-cell';
    if (i < cw) cls += ' done';
    if (isDeloadWeek(i)) cls += ' deload';
    if (isDietBreakWeek(i)) cls += ' dietbreak';
    if (i === cw) cls += ' current';
    const title = isDietBreakWeek(i) ? 'Deload + diet break' : (isDeloadWeek(i) ? 'Deload' : '');
    el.innerHTML += `<div class="${cls}"${title ? ` title="${title}"` : ''}>${i}</div>`;
  }
  const meta = document.getElementById('weekMapMeta');
  if (meta) meta.textContent = `16 weeks · ${sessionsThisTrainingWeek()}/5 this wk`;
  // Legend
  const legend = document.getElementById('weekMapLegend');
  if (legend) legend.innerHTML = `
    <span class="wk-leg"><i class="wk-sw done"></i>done</span>
    <span class="wk-leg"><i class="wk-sw current"></i>now</span>
    <span class="wk-leg"><i class="wk-sw deload"></i>deload (8·14)</span>
    <span class="wk-leg"><i class="wk-sw dietbreak"></i>diet break (8)</span>`;
}

function buildHistoryDetail(session) {
  const w = getWorkout(session.workoutId, phaseNumber(weekForDate(session.date)));
  if (!w) return '';
  const dayLog = state.setLog?.[session.date]?.[session.workoutId] || {};
  const blocks = w.blocks.map(block => {
    const exHTML = block.exercises.map((ex, exIdx) => {
      const exKey = `${block.title}::${exIdx}`;
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
      }).join('  ·  ');
      const notes = done.filter(s => s.note).map(s => s.note);
      const noteHTML = notes.length ? `<div class="det-note">✎ ${notes.join(' · ')}</div>` : '';
      return `<div class="det-ex">
        <div class="det-ex-name">${ex.name}</div>
        <div class="det-sets">${summary}</div>
        ${noteHTML}
      </div>`;
    }).filter(Boolean).join('');
    if (!exHTML) return '';
    return `<div class="det-block">
      <div class="det-block-title">${block.title}</div>
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
      <span class="history-name">${s.name}</span>
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
    case 'time': return parseFloat(s.sec || 0);
    case 'time_speed': return parseFloat(s.min || 0) * (parseFloat(s.spm || 0) || 1);
    case 'treadmill': return parseFloat(s.min || 0) * (parseFloat(s.kmh || 0) || 1) * (1 + (parseFloat(s.incline || 0) || 0) / 100);
    case 'interval': return (parseFloat(s.level || 0) || 0) * 100 + (parseFloat(s.rounds || 0) || 0);
    case 'cardio': return (parseFloat(s.level || 0) || 0) * 100 + (parseFloat(s.min || 0) || 0);
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
            <div class="lift-name">${h.ex.name}</div>
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

// ========== SLEEP LOG · bed time + freshness ==========
function renderSleep() {
  const summary = document.getElementById('sleepSummary');
  if (!summary) return;
  const sleep = state.sleep || {};
  const dKey = today();
  const todayEntry = sleep[dKey];
  if (todayEntry) {
    const bedIn = document.getElementById('sleepBedInput');
    const freshIn = document.getElementById('sleepFreshInput');
    if (bedIn && !bedIn.value) bedIn.value = todayEntry.bed || '';
    if (freshIn && !freshIn.value) freshIn.value = todayEntry.fresh || '';
  }
  // Last-7-entries freshness average
  const recent = Object.keys(sleep).sort().slice(-7).map(k => sleep[k].fresh).filter(Boolean);
  if (!recent.length) {
    summary.innerHTML = '<span class="sleep-note">Log tonight\'s bed time tomorrow morning, with how fresh you woke (1–5).</span>';
    return;
  }
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg <= 2.5 && recent.length >= 4) {
    summary.innerHTML = `<span class="sleep-note warn-note">⚠ Freshness avg ${avg.toFixed(1)} over ${recent.length} days — sleep is the limiter right now, not the program. Lights out 10:15.</span>`;
  } else {
    summary.innerHTML = `<span class="sleep-note">${recent.length}-day freshness avg · <strong>${avg.toFixed(1)} / 5</strong></span>`;
  }
}

document.getElementById('logSleepBtn')?.addEventListener('click', () => {
  const bed = document.getElementById('sleepBedInput').value;
  const fresh = parseInt(document.getElementById('sleepFreshInput').value);
  if (!bed && !fresh) { showToast('Enter bed time or freshness'); return; }
  if (fresh && (fresh < 1 || fresh > 5)) { showToast('Freshness is 1–5'); return; }
  state.sleep = state.sleep || {};
  const dKey = today();
  state.sleep[dKey] = { ...(state.sleep[dKey] || {}), bed: bed || undefined, fresh: fresh || undefined };
  save();
  showToast('Sleep logged');
  renderSleep();
});

// ========== SLEEP ANALYSIS · Progress tab ==========
// Bed times cross midnight, so average them relative to noon.
function bedToNoonMinutes(bed) {
  if (!bed || !/^\d{2}:\d{2}$/.test(bed)) return null;
  const [h, m] = bed.split(':').map(Number);
  return ((h + 12) % 24) * 60 + m;
}
function noonMinutesToStr(mins) {
  const h = (Math.floor(mins / 60) + 12) % 24;
  const m = Math.round(mins % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function renderSleepAnalysis() {
  const chartEl = document.getElementById('sleepChart');
  const statsEl = document.getElementById('sleepStats');
  const corrEl = document.getElementById('sleepCorrelation');
  if (!chartEl || !statsEl || !corrEl) return;

  const entries = Object.keys(state.sleep || {}).sort().map(d => ({ date: d, ...state.sleep[d] }));
  if (!entries.length) {
    chartEl.innerHTML = '<div class="chart-empty">Log bed time + freshness on the Today tab — analysis appears here</div>';
    statsEl.innerHTML = '';
    corrEl.innerHTML = '';
    return;
  }

  // Freshness bars · last 14 logged mornings, 2.5 limiter line dashed
  const recent = entries.filter(e => e.fresh).slice(-14);
  const W = 1000, H = 150, P = 16;
  const slotW = (W - 2 * P) / 14;
  const bars = recent.map((e, i) => {
    const h = (e.fresh / 5) * (H - 2 * P);
    const color = e.fresh >= 4 ? '#E84966' : (e.fresh === 3 ? '#828699' : '#5A5E72');
    return `<rect x="${P + i * slotW + 3}" y="${H - P - h}" width="${Math.max(slotW - 6, 6)}" height="${h}" rx="3" fill="${color}"/>`;
  }).join('');
  const refY = H - P - (2.5 / 5) * (H - 2 * P);
  chartEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="${P}" y1="${refY}" x2="${W - P}" y2="${refY}" stroke="#3C4156" stroke-dasharray="4 6"/>
    ${bars}
  </svg>`;

  // Stats: 7-day freshness + trend vs prior 7 · avg lights-out · % in bed by 22:30
  const freshEntries = entries.filter(e => e.fresh);
  const last7 = freshEntries.slice(-7).map(e => e.fresh);
  const prev7 = freshEntries.slice(-14, -7).map(e => e.fresh);
  const avg7 = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : null;
  const avgPrev = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : null;
  const trend = (avg7 != null && avgPrev != null) ? avg7 - avgPrev : null;
  const beds = entries.map(e => bedToNoonMinutes(e.bed)).filter(v => v != null);
  const avgBed = beds.length ? beds.reduce((a, b) => a + b, 0) / beds.length : null;
  const onTime = beds.length ? Math.round((beds.filter(v => v <= 630).length / beds.length) * 100) : null; // 630 = 22:30

  statsEl.innerHTML = `
    <div class="progress-stat">
      <div class="progress-stat-label">7-day freshness</div>
      <div class="progress-stat-value">${avg7 != null ? avg7.toFixed(1) : '—'}${trend != null ? `<span class="stat-trend">${trend > 0.05 ? '↑' : trend < -0.05 ? '↓' : '→'}</span>` : ''}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">Avg lights-out</div>
      <div class="progress-stat-value">${avgBed != null ? noonMinutesToStr(avgBed) : '—'}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">In bed by 22:30</div>
      <div class="progress-stat-value ${onTime != null && onTime >= 70 ? 'green' : ''}">${onTime != null ? onTime + '%' : '—'}</div>
    </div>
  `;

  // Sleep × lifts payoff: of every lift-vs-last-session comparison, how often
  // did you improve after a fresh morning (4–5) vs a tired one (1–3)?
  const hist = collectExerciseHistory();
  let freshImp = 0, freshTot = 0, tiredImp = 0, tiredTot = 0;
  for (const h of hist) {
    for (let i = 1; i < h.entries.length; i++) {
      const f = state.sleep?.[h.entries[i].date]?.fresh;
      if (!f) continue;
      const improved = h.entries[i].score > h.entries[i - 1].score;
      if (f >= 4) { freshTot++; if (improved) freshImp++; }
      else { tiredTot++; if (improved) tiredImp++; }
    }
  }
  if (freshTot >= 5 && tiredTot >= 5) {
    const fr = Math.round((freshImp / freshTot) * 100);
    const tr = Math.round((tiredImp / tiredTot) * 100);
    corrEl.innerHTML = `
      <div class="rule"><div class="rule-num">A</div><div class="rule-body">After <strong>fresh mornings (4–5)</strong> you improved on <strong>${fr}%</strong> of lifts (${freshImp} of ${freshTot}).</div></div>
      <div class="rule"><div class="rule-num">B</div><div class="rule-body">After <strong>tired mornings (1–3)</strong>: <strong>${tr}%</strong> (${tiredImp} of ${tiredTot}).${fr > tr ? ' Sleep is paying you in kilograms — protect the 10:15 lights-out.' : ''}</div></div>
    `;
  } else {
    corrEl.innerHTML = `<div class="rule"><div class="rule-num">··</div><div class="rule-body">Sleep × lifts payoff unlocks after ~2 weeks of logging both sleep and sessions (needs 5+ lift comparisons in each bucket · currently ${freshTot} fresh / ${tiredTot} tired).</div></div>`;
  }
}

// ========== DATA BACKUP · export / import ==========
document.getElementById('exportBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rhn-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Backup downloaded');
});

document.getElementById('importBtn')?.addEventListener('click', () => {
  document.getElementById('importFile')?.click();
});

document.getElementById('importFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !data.setLog) throw new Error('not a backup');
      if (!confirm('Replace current data with this backup?')) return;
      state = { ...defaultState, ...data };
      save();
      renderAll();
      showToast('Backup restored');
    } catch (err) {
      showToast('Invalid backup file');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ===== MOBILITY MILESTONES =====
function renderMobility() {
  const el = document.getElementById('mobilityList');
  if (!el) return;
  el.innerHTML = DATA.mobilityTests.map((t, i) => {
    const hits = (state.mobility || []).filter(m => m.test === t.name).sort((a, b) => a.date.localeCompare(b.date));
    const last = hits.at(-1);
    const daysAgo = last ? Math.round((new Date(today()) - new Date(last.date)) / 86400000) : null;
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
  renderWeightChart();
  renderWeightStats();
  renderWaist();
  renderSleepAnalysis();
  renderWeekGrid();
  renderHistory();
  renderMobility();
  renderPhases();
}

// ========== NUTRITION ==========
function renderNutrition() {
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
function renderProtocol() {
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

// Maintain / travel / illness mode toggle
document.getElementById('maintainToggleBtn')?.addEventListener('click', () => {
  if (isPaused()) {
    exitPause();
  } else {
    if (!confirm('Pause the block? Streak freezes, deficit nagging stops, and a bodyweight circuit takes over until you resume.')) return;
    enterPause();
  }
});

// Lapse-friendly restart: Week 1 clock, every log kept
document.getElementById('restartBlockBtn')?.addEventListener('click', () => {
  if (!confirm('Restart the 16-week block from today? All history stays.')) return;
  state.startDate = today();
  save();
  showToast('Week 1 · history kept');
  renderAll();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Wipe everything and restart Week 1?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = seed();
  showToast('Reset · week 1');
  renderAll();
});

// ========== INIT ==========
function renderAll() {
  renderHeader();
  renderToday();
  renderAllWorkouts();
  renderLifts();
  renderProgress();
  renderNutrition();
  renderProtocol();
}

// Sync today's workout pick from per-date map (auto-default if first visit today)
state.selectedWorkout = getSelectedWorkoutForToday();
save();

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

renderAll();
