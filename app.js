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
    return { ...defaultState, ...parsed };
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

function weekNumber() {
  if (!state.startDate) return 1;
  const start = new Date(state.startDate + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(16, Math.floor(diffDays / 7) + 1);
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
        const total = !isNaN(side) ? (20 + 2 * side) : null;
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
  const w = DATA.workouts.find(x => x.id === id);
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
  wrap.innerHTML = DATA.workouts.map((w, i) => `
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
  const w = DATA.workouts.find(x => x.id === id);
  if (!w) { card.hidden = true; return; }
  card.hidden = false;
  document.getElementById('workoutTitle').textContent = w.name;
  document.getElementById('workoutSubtitle').textContent = w.tagline;

  const warmupEl = document.getElementById('workoutWarmup');
  if (warmupEl) {
    warmupEl.hidden = !w.warmup;
    warmupEl.textContent = w.warmup || '';
  }

  const dKey = dailyKey();
  const log = state.setLog[dKey] && state.setLog[dKey][id] ? state.setLog[dKey][id] : {};

  const list = document.getElementById('exerciseList');
  let totalSets = 0, doneSets = 0;
  list.innerHTML = w.blocks.map(block => `
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
        const barWeight = ex.bar || 20;
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
      return `
        <div class="exercise">
          <div class="exercise-head">
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-spec">${ex.sets} × ${ex.reps}</div>
          </div>
          ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
          ${prevHTML}
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
            if (tot) tot.textContent = barTotalText(input.value, ex.bar || 20);
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

      // On blur (change), auto-fill kg into related fields
      input.addEventListener('change', () => {
        const field = input.dataset.field;
        if (field !== 'kg' || !input.value) return;
        const exLog = state.setLog[dKey]?.[id]?.[exKey];
        if (!exLog) return;
        if (mode === 'multistage') {
          const stageEl = input.closest('.ms-stage');
          if (!stageEl) return;
          const stageIdx = +stageEl.dataset.stage;
          const stageKey = `stage${stageIdx}`;

          // Within-set R→L autofill: even stage → next (odd) stage in same set
          if (stageIdx % 2 === 0 && ex.stages && ex.stages[stageIdx + 1]) {
            const nextKey = `stage${stageIdx + 1}`;
            if (!exLog[setIdx]) exLog[setIdx] = {};
            if (!exLog[setIdx][nextKey]) exLog[setIdx][nextKey] = {};
            if (!exLog[setIdx][nextKey].kg) {
              exLog[setIdx][nextKey].kg = input.value;
              const nextEl = row.querySelector(`.ms-stage[data-stage="${stageIdx + 1}"]`);
              const nextIn = nextEl?.querySelector('input[data-field="kg"]');
              if (nextIn && !nextIn.value) nextIn.value = input.value;
            }
          }

          // Cross-set autofill: only triggered from S0
          if (setIdx === 0) {
            for (let s = 1; s < ex.sets; s++) {
              if (!exLog[s]) exLog[s] = {};
              if (!exLog[s][stageKey]) exLog[s][stageKey] = {};
              if (!exLog[s][stageKey].kg) {
                exLog[s][stageKey].kg = input.value;
                const tRow = list.querySelector(`.ms-set[data-ex="${CSS.escape(exKey)}"][data-set="${s}"]`);
                const tIn = tRow?.querySelector(`.ms-stage[data-stage="${stageIdx}"] input[data-field="kg"]`);
                if (tIn && !tIn.value) tIn.value = input.value;
              }
            }
          }
        } else {
          if (setIdx !== 0) return;
          for (let s = 1; s < ex.sets; s++) {
            if (!exLog[s]) exLog[s] = {};
            if (!exLog[s].kg) {
              exLog[s].kg = input.value;
              const tRow = list.querySelector(`.set-input[data-ex="${CSS.escape(exKey)}"][data-set="${s}"]`);
              const tIn = tRow?.querySelector('input[data-field="kg"]');
              if (tIn && !tIn.value) tIn.value = input.value;
              if (ex.barbell) {
                const tot = tRow?.querySelector('[data-bar-total]');
                if (tot) tot.textContent = barTotalText(input.value, ex.bar || 20);
              }
            }
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

  const w = DATA.workouts.find(x => x.id === state.selectedWorkout);
  document.getElementById('todayTitle').textContent = w ? w.name : "Today's session";
  document.getElementById('todaySub').textContent = w ? w.blurb : "Pick what fits your week. Don't stack delts back-to-back.";
  document.getElementById('todayTag').textContent = w ? w.tagline : 'Show up';
}

// ========== WORKOUTS VIEW ==========
function renderAllWorkouts() {
  const wrap = document.getElementById('workoutsAll');
  wrap.innerHTML = DATA.workouts.map((w, i) => `
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

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E03A60" stop-opacity="0.40"/>
          <stop offset="100%" stop-color="#E03A60" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line x1="${P}" y1="${targetY}" x2="${W - P}" y2="${targetY}" stroke="#3D4258" stroke-dasharray="4 6" />
      <text x="${W - P - 4}" y="${targetY - 6}" text-anchor="end" fill="#E11D2C" font-family="JetBrains Mono" font-size="11">target ${target}</text>
      <path d="${area}" fill="url(#grad)" />
      <path d="${path}" stroke="#E03A60" stroke-width="2.2" fill="none" filter="drop-shadow(0 0 7px rgba(225,29,44,0.6))" />
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#E11D2C" stroke="#18181F" stroke-width="2"/>`).join('')}
    </svg>
  `;
}

function renderWeightStats() {
  const el = document.getElementById('weightStats');
  const data = state.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const latest = data.at(-1)?.kg ?? DATA.startKg;
  const start = data.length > 1 ? data[0].kg : DATA.startKg;
  const lost = start - latest;
  const target = DATA.targetKg;
  const toGo = latest - target;

  el.innerHTML = `
    <div class="progress-stat">
      <div class="progress-stat-label">Current</div>
      <div class="progress-stat-value">${latest.toFixed(1)}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">Lost</div>
      <div class="progress-stat-value ${lost > 0 ? 'green' : ''}">${lost > 0 ? '−' : ''}${Math.abs(lost).toFixed(1)}</div>
    </div>
    <div class="progress-stat">
      <div class="progress-stat-label">To target</div>
      <div class="progress-stat-value">${toGo > 0 ? toGo.toFixed(1) : '✓'}</div>
    </div>
  `;
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
    const isCurrent = i === cw;
    const isPast = i < cw;
    const isDeload = i % 5 === 0;
    let cls = 'week-cell';
    if (isPast) cls += ' done';
    if (isDeload) cls += ' deload';
    if (isCurrent) cls += ' current';
    el.innerHTML += `<div class="${cls}">${i}</div>`;
  }
  const meta = document.getElementById('weekMapMeta');
  if (meta) meta.textContent = `16 weeks · ${sessionsThisTrainingWeek()}/5 this wk`;
}

function buildHistoryDetail(session) {
  const w = DATA.workouts.find(x => x.id === session.workoutId);
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
      if (ex?.barbell && !isNaN(kg)) kg = (ex.bar || 20) + 2 * kg; // compare true bar totals
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
            if (ex.barbell && !isNaN(kg)) kg = (ex.bar || 20) + 2 * kg;
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

function renderProgress() {
  renderWeightChart();
  renderWeightStats();
  renderWaist();
  renderSleepAnalysis();
  renderWeekGrid();
  renderHistory();
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
}

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
