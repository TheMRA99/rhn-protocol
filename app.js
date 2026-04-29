// THE RED HOOD × NIGHTWING PROTOCOL — app logic

const STORAGE_KEY = 'rhn-protocol-v1';

const defaultState = {
  startDate: null,
  weights: [],
  sessions: [],
  selectedWorkout: null,
  setLog: {},
  daily: {},
  ritual: {},
  stamina: {}
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

function today() {
  return new Date().toISOString().slice(0, 10);
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
    case 'weight_reps':
    default:
      return [
        { key: 'kg', label: 'kg', width: 48, inputmode: 'decimal' },
        { key: 'reps', label: 'rep', width: 48, inputmode: 'numeric' }
      ];
  }
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

function formatPrev(set, mode) {
  if (!set) return '';
  switch (mode) {
    case 'bodyweight_reps':
      return `${set.reps || '–'} reps`;
    case 'time':
      return `${set.sec || '–'} s`;
    case 'time_speed':
      return `${set.min || '–'} min · ${set.spm || '–'} spm`;
    default:
      return `${set.kg || '–'} kg × ${set.reps || '–'}`;
  }
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
    const iso = d.toISOString().slice(0, 10);
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
      state.selectedWorkout = b.dataset.id;
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

// ========== TODAY: CHECKLISTS ==========
function renderChecklist(elId, items, scope) {
  const dKey = dailyKey();
  const checked = state[scope][dKey] || {};
  const el = document.getElementById(elId);
  el.innerHTML = items.map((it, i) => `
    <div class="check-item ${checked[i] ? 'done' : ''}" data-i="${i}">
      <div class="check-box"></div>
      <div class="check-body">
        <div class="check-name">${it.name}</div>
        <div class="check-note">${it.note}</div>
      </div>
      <div class="check-spec">${it.spec}</div>
    </div>
  `).join('');
  el.querySelectorAll('.check-item').forEach(row => {
    row.addEventListener('click', () => {
      const i = +row.dataset.i;
      const dKey2 = dailyKey();
      if (!state[scope][dKey2]) state[scope][dKey2] = {};
      state[scope][dKey2][i] = !state[scope][dKey2][i];
      save();
      row.classList.toggle('done');
    });
  });
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

  const dKey = dailyKey();
  const log = state.setLog[dKey] && state.setLog[dKey][id] ? state.setLog[dKey][id] : {};

  const list = document.getElementById('exerciseList');
  let totalSets = 0, doneSets = 0;
  list.innerHTML = w.blocks.map(block => `
    <div class="block-title">${block.title}</div>
    ${block.exercises.map((ex, exIdx) => {
      const exKey = `${block.title}::${exIdx}`;
      const exLog = log[exKey] || [];
      const fields = inputFieldsForMode(ex.inputMode);
      const mode = ex.inputMode || 'weight_reps';
      const prev = findPreviousBest(id, exKey);
      const beating = isCurrentBeating(exLog, prev, mode);
      let setRows = '';
      for (let s = 0; s < ex.sets; s++) {
        totalSets += 1;
        const setData = exLog[s] || {};
        const isDone = setData.done;
        if (isDone) doneSets += 1;
        const innerHTML = fields.map((f, fi) => {
          const sep = fi > 0 ? '<span>×</span>' : '';
          return `${sep}<input type="number" placeholder="${f.label}" value="${setData[f.key] ?? ''}" data-field="${f.key}" inputmode="${f.inputmode}" style="width:${f.width}px" />`;
        }).join('');
        setRows += `
          <div class="set-input ${isDone ? 'done' : ''}" data-ex="${exKey}" data-set="${s}" data-mode="${mode}">
            <span>S${s + 1}</span>
            ${innerHTML}
          </div>
        `;
      }
      const prevHTML = prev
        ? `<div class="exercise-prev ${beating ? 'beaten' : ''}" title="From ${fmtDate(prev.date)}">last · ${formatPrev(prev.set, mode)}${beating ? ' · beaten' : ''}</div>`
        : '';
      return `
        <div class="exercise">
          <div class="exercise-head">
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-spec">${ex.sets} × ${ex.reps}</div>
          </div>
          ${ex.note ? `<div class="exercise-note">${ex.note}</div>` : ''}
          ${prevHTML}
          <div class="set-rows">${setRows}</div>
        </div>
      `;
    }).join('')}
  `).join('');

  renderSessionProgress(doneSets, totalSets);

  // Set input handlers
  list.querySelectorAll('.set-input').forEach(row => {
    const exKey = row.dataset.ex;
    const setIdx = +row.dataset.set;
    const mode = row.dataset.mode;
    const fields = inputFieldsForMode(mode);
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (!state.setLog[dKey]) state.setLog[dKey] = {};
        if (!state.setLog[dKey][id]) state.setLog[dKey][id] = {};
        if (!state.setLog[dKey][id][exKey]) state.setLog[dKey][id][exKey] = [];
        if (!state.setLog[dKey][id][exKey][setIdx]) state.setLog[dKey][id][exKey][setIdx] = {};
        state.setLog[dKey][id][exKey][setIdx][input.dataset.field] = input.value;
        const v = state.setLog[dKey][id][exKey][setIdx];
        state.setLog[dKey][id][exKey][setIdx].done = fields.every(f => v[f.key] !== undefined && v[f.key] !== '');
        if (state.setLog[dKey][id][exKey][setIdx].done) {
          row.classList.add('done');
        } else {
          row.classList.remove('done');
        }
        save();
        refreshSessionProgress();
      });
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
  renderChecklist('ritualList', DATA.morningRitual, 'ritual');
  renderChecklist('dailyList', DATA.daily, 'daily');
  renderChecklist('staminaList', DATA.stamina, 'stamina');
  renderWorkout();

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
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#E11D2C" stroke="#04050D" stroke-width="2"/>`).join('')}
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
}

function renderHistory() {
  const el = document.getElementById('sessionHistory');
  if (!state.sessions.length) {
    el.innerHTML = '<div class="history-empty">No sessions logged yet. Show up.</div>';
    return;
  }
  const recent = state.sessions.slice(-12).reverse();
  el.innerHTML = recent.map(s => `
    <div class="history-row">
      <span class="history-date">${fmtDate(s.date)}</span>
      <span class="history-name">${s.name}</span>
    </div>
  `).join('');
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

function renderProgress() {
  renderWeightChart();
  renderWeightStats();
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
  renderProgress();
  renderNutrition();
  renderProtocol();
}

renderAll();
