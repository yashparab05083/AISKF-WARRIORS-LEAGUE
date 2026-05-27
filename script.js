/* ============================================================
   TEAM KUMITE — script.js
   ============================================================ */

/* ============================================================
   1. TEAM & PLAYER DATA  ← Edit here to change names
   ============================================================ */
const TEAMS = [
  {
    id: 0,
    name: "DEADLY DRAGONS",
    color: "#b71c1c",
    boys: ["Aakash Suthar", "Shreyas Marathe", "Patham Shah", "Karan Gupta"],
    girls: ["Riya Rane"]
  },
  {
    id: 1,
    name: "LEGENDARY LIONS",
    color: "#ff8f00",
    boys: ["Vinay Shah", "Deepesh Rajput", "Prathamesh Suthar", "Vedang Rajadhyaksha"],
    girls: ["Manaswi Patil", "Ishika Rajpurohit"]
  },
  {
    id: 2,
    name: "CHATUR CHEETAHS",
    color: "#1b5e20",
    boys: ["Ajay Yadav", "Shubham Panchal", "Vedant Shukla", "Arnav"],
    girls: ["Prajakta Chinkate"]
  },
  {
    id: 3,
    name: "SUPER SHARKS",
    color: "#0d47a1",
    boys: ["Karan Patil", "Pratham Chakradhari", "Arjun Gupta", "Harsh Mishra", "Tristan Koli"],
    girls: ["Shravani Shirodkar", "Prachi Kahar"]
  }
];

/* ============================================================
   2. TOURNAMENT STATE
   ============================================================ */
// Generate all league fixtures (every team plays every other once)
function generateFixtures() {
  const f = [];
  for (let i = 0; i < TEAMS.length; i++) {
    for (let j = i + 1; j < TEAMS.length; j++) {
      f.push({ teamA: i, teamB: j, played: false, scoreA: 0, scoreB: 0, winner: null });
    }
  }
  return f;
}

// Standings per team
function initStandings() {
  return TEAMS.map(t => ({ id: t.id, name: t.name, played: 0, wins: 0, losses: 0, points: 0, scoreDiff: 0, pointsScored: 0 }));
}

// small helper: convert hex to rgba string
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#','');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem("kumite_state");
    if (saved) return { fixtures: generateFixtures(), standings: initStandings(), history: [], ...JSON.parse(saved) };
  } catch(e) {}
  return { fixtures: generateFixtures(), standings: initStandings(), history: [] };
}

function saveState() {
  localStorage.setItem("kumite_state", JSON.stringify(state));
}

/* ============================================================
   3. CURRENT MATCH STATE
   ============================================================ */
let match = null;   // set when a match begins

/* ============================================================
   4. SCREEN ROUTING
   ============================================================ */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  const navMap = { home: 'navHome', table: 'navTable', history: 'navHistory' };
  if (navMap[name]) document.getElementById(navMap[name]).classList.add('active');

  if (name === 'home')    renderHome();
  if (name === 'table')   renderStandings();
  if (name === 'history') renderHistory();
  if (name === 'setup')   initSetup();
}

/* ============================================================
   5. HOME SCREEN
   ============================================================ */
function renderHome() {
  const grid = document.getElementById('fixtureGrid');
  grid.innerHTML = '';
  state.fixtures.forEach((f, idx) => {
    const tA = TEAMS[f.teamA], tB = TEAMS[f.teamB];
    const card = document.createElement('div');
    card.className = 'fixture-card' + (f.played ? ' played' : '');
    card.innerHTML = `
      <div class="fc-matchno">MATCH ${idx + 1}</div>
      <div class="fc-teams">${tA.name} <span>VS</span> ${tB.name}</div>
      <div class="fc-status">${f.played ? `✔ ${tA.name} ${f.scoreA} — ${f.scoreB} ${tB.name}` : 'UPCOMING'}</div>`;
    grid.appendChild(card);
  });
}

/* ============================================================
   6. SETUP SCREEN
   ============================================================ */
let setupData = {};

function initSetup() {
  // Reset cards
  document.getElementById('setupStep1').classList.remove('hidden');
  document.getElementById('setupStep2').classList.add('hidden');
  document.getElementById('setupStep3').classList.add('hidden');
  setupData = {};

  // Populate team selects
  ['teamA','teamB'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">— Select Team —</option>';
    TEAMS.forEach(t => {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.name;
      sel.appendChild(o);
    });
  });
}

function setupStep2() {
  const aId = parseInt(document.getElementById('teamA').value);
  const bId = parseInt(document.getElementById('teamB').value);
  if (isNaN(aId) || isNaN(bId) || aId === bId) {
    alert('Please select two different teams.'); return;
  }
  setupData.teamA = TEAMS[aId];
  setupData.teamB = TEAMS[bId];

  // Find fixture index
  setupData.fixtureIdx = state.fixtures.findIndex(f =>
    (f.teamA === aId && f.teamB === bId) || (f.teamA === bId && f.teamB === aId)
  );
  if (state.fixtures[setupData.fixtureIdx].played) {
    if (!confirm('This match has already been played. Replay?')) return;
  }

  document.getElementById('setupStep1').classList.add('hidden');
  document.getElementById('setupStep2').classList.remove('hidden');

  // Toss buttons
  document.getElementById('tossInfo').textContent = 'Who won the toss?';
  const tossBtns = document.getElementById('tossBtns');
  tossBtns.innerHTML = '';
  [setupData.teamA, setupData.teamB].forEach(t => {
    const b = document.createElement('button');
    b.className = 'toss-btn'; b.textContent = t.name;
    b.onclick = () => {
      document.querySelectorAll('.toss-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      setupData.tossWinner = t;
      document.getElementById('choiceRow').classList.remove('hidden');
    };
    tossBtns.appendChild(b);
  });
  document.getElementById('choiceRow').classList.add('hidden');
  document.getElementById('step2Next').classList.add('hidden');
  setupData.tossChoice = null;
}

function setTossChoice(choice) {
  document.querySelectorAll('.btn-choice').forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
  setupData.tossChoice = choice;
  document.getElementById('step2Next').classList.remove('hidden');
}

function setupStep3() {
  if (!setupData.tossWinner || !setupData.tossChoice) { alert('Complete the toss step.'); return; }
  document.getElementById('setupStep2').classList.add('hidden');
  document.getElementById('setupStep3').classList.remove('hidden');

  // Determine attacker / defender for inning 1
  if (setupData.tossChoice === 'attack') {
    setupData.inning1Attacker = setupData.tossWinner;
    setupData.inning1Defender = (setupData.tossWinner === setupData.teamA) ? setupData.teamB : setupData.teamA;
  } else {
    setupData.inning1Defender = setupData.tossWinner;
    setupData.inning1Attacker = (setupData.tossWinner === setupData.teamA) ? setupData.teamB : setupData.teamA;
  }

  renderOrderUI('orderTeamA', setupData.teamA);
  renderOrderUI('orderTeamB', setupData.teamB);
}

function getMatchesInSlot(order, attackerSlot) {
  const slot = order?.[attackerSlot];
  return slot && slot.type === 'girl' ? 1 : 3;
}

function getMatchesBeforeSlot(order, attackerSlot) {
  return order.slice(0, attackerSlot)
    .reduce((sum, slot) => sum + (slot.type === 'girl' ? 1 : 3), 0);
}

function getInningTotalMatches(order) {
  return order.reduce((sum, slot) => sum + (slot.type === 'girl' ? 1 : 3), 0);
}

function isFinalActiveSegment() {
  if (!match) return false;
  const currentOrder = match.attackerTeam === 'A' ? match.orderA : match.orderB;
  const matchesInSlot = getMatchesInSlot(currentOrder, match.attackerSlot);
  return match.inning === 2 && match.attackerSlot === currentOrder.length - 1 && match.matchInSlot === matchesInSlot - 1;
}

function advanceToNextSegment() {
  const currentOrder = match.attackerTeam === 'A' ? match.orderA : match.orderB;
  const matchesInSlot = getMatchesInSlot(currentOrder, match.attackerSlot);
  match.matchInSlot++;

  if (match.matchInSlot >= matchesInSlot) {
    match.attackerSlot++;
    match.matchInSlot = 0;
    match.selectedDefender = null;

    if (match.attackerSlot >= currentOrder.length) {
      if (match.inning === 1) {
        match.inning = 2;
        match.attackerTeam = match.defenderTeam;
        match.defenderTeam = match.attackerTeam === 'A' ? 'B' : 'A';
        match.attackerSlot = 0;
        match.matchInSlot = 0;
      } else {
        return false;
      }
    }
  }

  return true;
}

function pauseMatch() {
  if (!match) return;
  if (isFinalActiveSegment() && !(match.pausedSegments && match.pausedSegments.length)) {
    alert('This is the final segment and cannot be paused because there is no later segment to continue with.');
    return;
  }

  if (!confirm('Pause the current segment for injury and continue with the next one?')) return;

  match.pausedSegments = match.pausedSegments || [];
  match.pausedSegments.push({
    inning: match.inning,
    attackerTeam: match.attackerTeam,
    defenderTeam: match.defenderTeam,
    attackerSlot: match.attackerSlot,
    matchInSlot: match.matchInSlot,
    selectedDefender: match.selectedDefender,
    timerRemaining: timerRemaining
  });

  stopTimer();
  if (!advanceToNextSegment()) {
    alert('No further segment available. Resume a paused segment to continue.');
  }
  resetTimerRing();
  updateLiveUI();
}

function resumePausedSegment() {
  if (!match || !match.pausedSegments || !match.pausedSegments.length) return;
  const segment = match.pausedSegments.pop();
  match.inning = segment.inning;
  match.attackerTeam = segment.attackerTeam;
  match.defenderTeam = segment.defenderTeam;
  match.attackerSlot = segment.attackerSlot;
  match.matchInSlot = segment.matchInSlot;
  match.selectedDefender = segment.selectedDefender;
  match.timerRemaining = segment.timerRemaining;
  stopTimer();
  resetTimerRing();
  updateLiveUI();
}

function renderOrderUI(containerId, team) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h4>${team.name}</h4><div class="order-list" id="orderList_${team.id}"></div>`;
  const list = document.getElementById(`orderList_${team.id}`);

  // Default: Boy, Boy, Boy (third slot is now selectable as boy or girl)
  const defaultOrder = [
    { type: 'boy', options: team.boys },
    { type: 'boy', options: team.boys },
    { type: 'boy', options: team.boys }
  ];

  defaultOrder.forEach((slot, idx) => {
    const row = document.createElement('div');
    row.className = 'order-slot';

    const numSpan = document.createElement('span');
    numSpan.className = 'slot-num'; numSpan.textContent = idx + 1;

    const typeSelect = document.createElement('select');
    typeSelect.innerHTML = `<option value="boy">Boy</option><option value="girl">Girl</option>`;
    typeSelect.value = slot.type;

    const nameSelect = document.createElement('select');
    populateNameSelect(nameSelect, team, slot.type);

    typeSelect.onchange = () => {
      populateNameSelect(nameSelect, team, typeSelect.value);
    };

    row.appendChild(numSpan);
    row.appendChild(typeSelect);
    row.appendChild(nameSelect);
    list.appendChild(row);
  });
}

function populateNameSelect(sel, team, type) {
  const players = type === 'girl' ? team.girls : team.boys;
  sel.innerHTML = '';
  players.forEach(p => {
    const o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o);
  });
}

function getOrderFromUI(team) {
  const list = document.getElementById(`orderList_${team.id}`);
  const slots = list.querySelectorAll('.order-slot');
  return Array.from(slots).map(s => {
    const selects = s.querySelectorAll('select');
    return { type: selects[0].value, name: selects[1].value };
  });
}

/* ============================================================
   7. START MATCH
   ============================================================ */
function startMatch() {
  const orderA = getOrderFromUI(setupData.teamA);
  const orderB = getOrderFromUI(setupData.teamB);
  const timerDuration = parseInt(document.getElementById('timerInput').value) || 60;

  match = {
    teamA: setupData.teamA,
    teamB: setupData.teamB,
    fixtureIdx: setupData.fixtureIdx,
    inning1Attacker: setupData.inning1Attacker,
    inning1Defender: setupData.inning1Defender,
    orderA,        // [{type,name}, ...]
    orderB,
    scoreA: 0,
    scoreB: 0,
    timerDuration,

    // Current state
    inning: 1,           // 1 or 2
    attackerTeam: null,  // 'A' or 'B'
    defenderTeam: null,
    attackerSlot: 0,     // 0,1,2 → which attacker (slot in order)
    matchInSlot: 0,      // 0,1,2 → match within a slot (slot 0,1 have 3; slot 2 has 1)
    selectedDefender: null,
    pausedSegments: [],

    // Progress tracking: 2 innings × 7 matches each = 14 dots
    progress: [],
  };

  // Determine first inning's attacker/defender team
  match.attackerTeam = (match.inning1Attacker === match.teamA) ? 'A' : 'B';
  match.defenderTeam = match.attackerTeam === 'A' ? 'B' : 'A';

  showScreen('live');
  document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));

  // Apply split background colors for the full live screen
  const liveScreen = document.getElementById('screenLive');
  if (liveScreen) {
    liveScreen.style.setProperty('--left-color', hexToRgba(match.teamA.color, 0.14));
    liveScreen.style.setProperty('--right-color', hexToRgba(match.teamB.color, 0.14));
    liveScreen.style.setProperty('--left-solid', match.teamA.color);
    liveScreen.style.setProperty('--right-solid', match.teamB.color);
  }

  stopTimer();
  resetTimerRing();
  updateLiveUI();
}

function updatePausedControls() {
  const resumeBtn = document.getElementById('resumeSegmentBtn');
  if (!resumeBtn || !match) return;
  resumeBtn.classList.toggle('hidden', !(match.pausedSegments && match.pausedSegments.length));
}

/* ============================================================
   8. LIVE SCORING UI
   ============================================================ */
function updateLiveUI() {
  const tA = match.teamA, tB = match.teamB;
  const inInning2 = match.inning === 2;
  const attTeam  = match.attackerTeam === 'A' ? tA : tB;
  const defTeam  = match.attackerTeam === 'A' ? tB : tA;
  const attOrder = match.attackerTeam === 'A' ? match.orderA : match.orderB;
  const defOrder = match.attackerTeam === 'A' ? match.orderB : match.orderA;
  const defTeamObj = match.defenderTeam === 'A' ? match.teamA : match.teamB;

  // Meta labels
  document.getElementById('liveMatchLabel').textContent =
    `${tA.name}  VS  ${tB.name}`;
  document.getElementById('liveInningsLabel').textContent = `INNING ${match.inning}`;
  document.getElementById('livePhaseLabel').textContent =
    match.attackerTeam === 'A' ? `${tA.name} ATTACKS` : `${tB.name} ATTACKS`;

  // Team names & scores
  document.getElementById('liveTeamAName').textContent = tA.name;
  document.getElementById('liveTeamBName').textContent = tB.name;
  document.getElementById('liveScoreA').textContent = match.scoreA;
  document.getElementById('liveScoreB').textContent = match.scoreB;

  // Attacker
  const attSlotData = attOrder[match.attackerSlot];
  document.getElementById('attackerName').textContent = attSlotData.name;
  document.getElementById('attackerTeam').textContent = attTeam.name;

  const matchesInSlot = getMatchesInSlot(attOrder, match.attackerSlot);
  document.getElementById('matchCounter').textContent =
    `Match ${match.matchInSlot + 1} / ${matchesInSlot}`;

  // Defender
  const selDef = match.selectedDefender;
  document.getElementById('defenderName').textContent = selDef ? selDef.name : '— Choose defender —';
  document.getElementById('defenderTeam').textContent = selDef ? defTeam.name : '';

  // Swap attacker/defender card positions to match which side is attacking
  const playersRow = document.querySelector('.players-row');
  if (playersRow) {
    // attacker on left when team A attacks, on right when team B attacks
    playersRow.classList.toggle('attacker-right', match.attackerTeam === 'B');
  }

  // Defender selector
  const defBtns = document.getElementById('defenderBtns');
  defBtns.innerHTML = '';
  const isGirlAttacker = attSlotData.type === 'girl';
  const eligibleDefs = isGirlAttacker
    ? defTeamObj.girls.map(n => ({ type: 'girl', name: n }))
    : [...defTeamObj.boys.map(n => ({ type: 'boy', name: n })),
       ...defTeamObj.girls.map(n => ({ type: 'girl', name: n }))];

  eligibleDefs.forEach(p => {
    const b = document.createElement('button');
    b.className = 'ds-btn' + (selDef && selDef.name === p.name ? ' selected' : '');
    b.textContent = p.name;
    b.onclick = () => { match.selectedDefender = p; updateLiveUI(); };
    defBtns.appendChild(b);
  });

  // Progress dots
  renderProgressDots();
  const pauseInfo = match.pausedSegments && match.pausedSegments.length ? ` · Paused ${match.pausedSegments.length}` : '';
  document.getElementById('progressLabel').textContent =
    `Inning ${match.inning} · Attacker ${match.attackerSlot + 1}/3 · Match ${match.matchInSlot + 1}/${matchesInSlot}${pauseInfo}`;

  updateLiveTimeInput();
  updatePausedControls();
}

function renderProgressDots() {
  const container = document.getElementById('progressDots');
  container.innerHTML = '';
  const firstOrder = match.inning1Attacker === match.teamA ? match.orderA : match.orderB;
  const secondOrder = firstOrder === match.orderA ? match.orderB : match.orderA;
  const firstTotal = getInningTotalMatches(firstOrder);
  const totalDots = firstTotal + getInningTotalMatches(secondOrder);
  const currentGlobal = (match.inning === 2 ? firstTotal : 0) + getGlobalMatchInInning();

  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('div');
    dot.className = 'pdot';
    if (i < currentGlobal) dot.classList.add('done');
    else if (i === currentGlobal) dot.classList.add('active');
    container.appendChild(dot);
    if (i === firstTotal - 1) {
      const sep = document.createElement('div');
      sep.style.cssText = 'width:12px;border-right:2px solid var(--border);margin:0 4px;';
      container.appendChild(sep);
    }
  }
}

function getGlobalMatchInInning() {
  const currentOrder = match.attackerTeam === 'A' ? match.orderA : match.orderB;
  return getMatchesBeforeSlot(currentOrder, match.attackerSlot) + match.matchInSlot;
}

/* ============================================================
   9. SCORE CONTROLS
   ============================================================ */
function addScore(team, pts) {
  if (team === 'A') {
    match.scoreA = Math.max(0, match.scoreA + pts);
    animateScore('liveScoreA');
  } else {
    match.scoreB = Math.max(0, match.scoreB + pts);
    animateScore('liveScoreB');
  }
  document.getElementById(`liveScore${team}`).textContent = match[`score${team}`];
}

function animateScore(id) {
  const el = document.getElementById(id);
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

/* ============================================================
   10. TIMER
   ============================================================ */
let timerInterval = null;
let timerRunning = false;
let timerRemaining = 0;

function resetTimerRing() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = match ? (match.timerRemaining ?? match.timerDuration) : 60;
  document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
  document.getElementById('timerBtn').textContent = '▶ START';
  document.getElementById('timerBtn').classList.remove('running');
  setRingProgress(1);
  document.getElementById('ringProgress').classList.remove('urgent');
  updateAllTimerUI();
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  } else {
    timerRunning = true;
    timerInterval = setInterval(() => {
      timerRemaining--;
      document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
      setRingProgress(timerRemaining / match.timerDuration);
      updateAllTimerUI();
      if (timerRemaining <= 10) document.getElementById('ringProgress').classList.add('urgent');
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timerDisplay').textContent = '0:00';
      }
    }, 1000);
  }
  updateAllTimerUI();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

function setRingProgress(fraction) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - Math.max(0, Math.min(1, fraction)));
  document.getElementById('ringProgress').style.strokeDashoffset = offset;
}

function adjustMatchTime(seconds) {
  if (!match) return;
  timerRemaining = Math.max(0, timerRemaining + seconds);
  match.timerDuration = Math.max(match.timerDuration, timerRemaining);
  document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
  setRingProgress(timerRemaining / match.timerDuration);
  updateAllTimerUI();
}

function syncLiveTimeInput() {
  const input = document.getElementById('liveTimeInput');
  if (!input || !match) return;
  const value = parseInt(input.value, 10);
  if (isNaN(value) || value < 0) return;
  timerRemaining = value;
  match.timerDuration = Math.max(match.timerDuration, timerRemaining);
  document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
  setRingProgress(timerRemaining / match.timerDuration);
  updateAllTimerUI();
}

function updateLiveTimeInput() {
  const input = document.getElementById('liveTimeInput');
  if (!input) return;
  input.value = timerRemaining;
  updateAllTimerUI();
}

/* ============================================================
   11. NEXT SEGMENT
   ============================================================ */
function nextSegment() {
  if (!match.selectedDefender) { alert('Please select a defender first.'); return; }
  stopTimer();

  const currentOrder = match.attackerTeam === 'A' ? match.orderA : match.orderB;
  const matchesInSlot = getMatchesInSlot(currentOrder, match.attackerSlot);
  match.matchInSlot++;

  if (match.matchInSlot >= matchesInSlot) {
    match.attackerSlot++;
    match.matchInSlot = 0;
    match.selectedDefender = null;

    if (match.attackerSlot >= currentOrder.length) {
      if (match.inning === 1) {
        match.inning = 2;
        match.attackerTeam = match.defenderTeam;
        match.defenderTeam = match.attackerTeam === 'A' ? 'B' : 'A';
        match.attackerSlot = 0;
        match.matchInSlot = 0;
        match.selectedDefender = null;
      } else {
        matchOver();
        return;
      }
    }
  }

  resetTimerRing();
  updateLiveUI();
}

/* ============================================================
   12. MATCH OVER / SUPER ROUND
   ============================================================ */
function matchOver() {
  stopTimer();
  if (match.scoreA === match.scoreB) {
    showSuperRound();
  } else {
    showResult();
  }
}

let srScoreA = 0, srScoreB = 0;

function showSuperRound() {
  srScoreA = 0; srScoreB = 0;
  document.getElementById('srTeamA').textContent = match.teamA.name;
  document.getElementById('srTeamB').textContent = match.teamB.name;
  document.getElementById('srScoreA').textContent = '0';
  document.getElementById('srScoreB').textContent = '0';

  const playersA = [...match.teamA.boys, ...match.teamA.girls];
  const playersB = [...match.teamB.boys, ...match.teamB.girls];
  const selectA = document.getElementById('srPlayerASelect');
  const selectB = document.getElementById('srPlayerBSelect');

  selectA.innerHTML = playersA.map(p => `<option value="${p}">${p}</option>`).join('');
  selectB.innerHTML = playersB.map(p => `<option value="${p}">${p}</option>`).join('');

  selectA.value = match.orderA[0]?.name || playersA[0] || '';
  selectB.value = match.orderB[0]?.name || playersB[0] || '';

  updateSuperRoundPlayers();

  timerRemaining = match.timerDuration;
  stopTimer();
  updateAllTimerUI();

  document.getElementById('superRoundOverlay').classList.remove('hidden');
}

function updateSuperRoundPlayers() {
  const aSelect = document.getElementById('srPlayerASelect');
  const bSelect = document.getElementById('srPlayerBSelect');
  const pA = aSelect?.value || '—';
  const pB = bSelect?.value || '—';
  document.getElementById('srPlayers').innerHTML =
    `<div class="sr-player" style="color:var(--red)">${pA}</div>
     <div class="vs-badge">VS</div>
     <div class="sr-player" style="color:#2196f3">${pB}</div>`;
}

function updateAllTimerUI() {
  document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
  const liveInput = document.getElementById('liveTimeInput');
  if (liveInput) liveInput.value = timerRemaining;
  const srInput = document.getElementById('srTimeInput');
  if (srInput) srInput.value = timerRemaining;

  const liveBtn = document.getElementById('timerBtn');
  const srBtn = document.getElementById('srTimerBtn');
  const label = timerRunning ? '⏸ PAUSE' : '▶ START';
  if (liveBtn) {
    liveBtn.textContent = label;
    liveBtn.classList.toggle('running', timerRunning);
  }
  if (srBtn) {
    srBtn.textContent = label;
    srBtn.classList.toggle('running', timerRunning);
  }
  const srDisplay = document.getElementById('srTimerDisplay');
  if (srDisplay) srDisplay.textContent = formatTime(timerRemaining);
}

function toggleSuperRoundTimer() {
  toggleTimer();
}

function adjustSuperRoundTime(seconds) {
  if (!match) return;
  timerRemaining = Math.max(0, timerRemaining + seconds);
  match.timerDuration = Math.max(match.timerDuration, timerRemaining);
  updateAllTimerUI();
}

function syncSuperRoundTimeInput() {
  const input = document.getElementById('srTimeInput');
  if (!input || !match) return;
  const value = parseInt(input.value, 10);
  if (isNaN(value) || value < 0) return;
  timerRemaining = value;
  match.timerDuration = Math.max(match.timerDuration, timerRemaining);
  updateAllTimerUI();
}

function addSRScore(team, pts) {
  if (team === 'A') { srScoreA += pts; document.getElementById('srScoreA').textContent = srScoreA; }
  else             { srScoreB += pts; document.getElementById('srScoreB').textContent = srScoreB; }
}

function endSuperRound() {
  if (srScoreA === srScoreB) {
    // senshu tie-break: last scorer wins → just alert for now
    alert('SENSHU tie-break! Referee declares winner manually.');
    // For simplicity, treat as Team A win if both 0
    if (srScoreA === 0) srScoreA = 1;
  }
  match.scoreA += srScoreA;
  match.scoreB += srScoreB;
  document.getElementById('superRoundOverlay').classList.add('hidden');
  showResult();
}

function showResult() {
  const tA = match.teamA, tB = match.teamB;
  const winner = match.scoreA > match.scoreB ? tA : tB;

  document.getElementById('resultTeams').textContent = `${tA.name}  vs  ${tB.name}`;
  document.getElementById('resultScore').textContent = `${match.scoreA}  —  ${match.scoreB}`;
  document.getElementById('resultWinner').textContent = `🏆 ${winner.name} WINS`;

  spawnConfetti();
  document.getElementById('resultOverlay').classList.remove('hidden');
}

function spawnConfetti() {
  const container = document.getElementById('resultConfetti');
  container.innerHTML = '';
  const colors = ['#ffd600','#e53935','#2196f3','#00c853','#fff'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*30}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${1.5+Math.random()*2}s;
      animation-delay:${Math.random()*0.8}s;
    `;
    container.appendChild(piece);
  }
}

function finaliseMatch() {
  // Update fixture
  const f = state.fixtures[match.fixtureIdx];
  const isFlipped = f.teamA !== match.teamA.id; // fixture might have A/B flipped
  if (!isFlipped) {
    f.scoreA = match.scoreA; f.scoreB = match.scoreB;
  } else {
    f.scoreA = match.scoreB; f.scoreB = match.scoreA;
  }
  f.played = true;
  f.winner = match.scoreA > match.scoreB ? match.teamA.id : match.teamB.id;

  // Update standings
  const winnerTeam = match.scoreA > match.scoreB ? match.teamA : match.teamB;
  const loserTeam  = match.scoreA > match.scoreB ? match.teamB : match.teamA;

  const wRow = state.standings.find(s => s.id === winnerTeam.id);
  const lRow = state.standings.find(s => s.id === loserTeam.id);
  // Update played/wins/losses/points
  wRow.played++; wRow.wins++; wRow.points += 2;
  lRow.played++; lRow.losses++;

  // Track total points scored for each team (shown in standings)
  const rowA = state.standings.find(s => s.id === match.teamA.id);
  const rowB = state.standings.find(s => s.id === match.teamB.id);
  if (rowA) rowA.pointsScored = (rowA.pointsScored || 0) + match.scoreA;
  if (rowB) rowB.pointsScored = (rowB.pointsScored || 0) + match.scoreB;

  // Maintain scoreDiff for backward compatibility (not displayed)
  const diff = Math.abs(match.scoreA - match.scoreB);
  if (match.scoreA > match.scoreB) {
    wRow.scoreDiff += diff;
    lRow.scoreDiff -= diff;
  } else {
    wRow.scoreDiff += diff;
    lRow.scoreDiff -= diff;
  }

  // History
  state.history.unshift({
    teamA: match.teamA.name, teamB: match.teamB.name,
    scoreA: match.scoreA, scoreB: match.scoreB,
    winner: winnerTeam.name,
    date: new Date().toLocaleString()
  });

  saveState();
  document.getElementById('resultOverlay').classList.add('hidden');

  // Clear split background styles
  const sb = document.querySelector('.scoreboard');
  const liveScreen = document.getElementById('screenLive');
  if (liveScreen) {
    liveScreen.style.removeProperty('--left-color');
    liveScreen.style.removeProperty('--right-color');
    liveScreen.style.removeProperty('--left-solid');
    liveScreen.style.removeProperty('--right-solid');
  }

  match = null;
  showScreen('home');
}

function confirmEndMatch() {
  if (confirm('End this match and return to home?')) {
    stopTimer();
    // Clear split background styles if present
    const liveScreen = document.getElementById('screenLive');
    if (liveScreen) {
      liveScreen.style.removeProperty('--left-color');
      liveScreen.style.removeProperty('--right-color');
      liveScreen.style.removeProperty('--left-solid');
      liveScreen.style.removeProperty('--right-solid');
    }
    match = null;
    showScreen('home');
  }
}

/* ============================================================
   13. STANDINGS
   ============================================================ */
function renderStandings() {
  // Sort: points DESC, then total points scored DESC
  const sorted = [...state.standings].sort((a, b) =>
    b.points !== a.points ? b.points - a.points : (b.pointsScored || 0) - (a.pointsScored || 0)
  );

  const tbody = document.getElementById('standingsTbody');
  tbody.innerHTML = '';
  sorted.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.className = `rank-${idx+1}` + (idx < 2 ? ' qualify-row' : '');
    const ptsSc = row.pointsScored || 0;
    tr.innerHTML = `
      <td><span class="rank-num">${idx + 1}</span></td>
      <td style="font-weight:700">${row.name}</td>
      <td>${row.played}</td>
      <td style="color:var(--green)">${row.wins}</td>
      <td style="color:var(--red)">${row.losses}</td>
      <td class="pts-cell">${row.points}</td>
      <td class="pts-cell">${ptsSc}</td>`;
    tbody.appendChild(tr);
  });

  // Qualifier note
  const leagueMatchesTotal = state.fixtures.length;
  const played = state.fixtures.filter(f => f.played).length;
  const note = document.getElementById('qualifierNote');
  if (played === leagueMatchesTotal) {
    note.textContent = `QUALIFIED FOR FINAL: ${sorted[0].name}  &  ${sorted[1].name}`;
  } else {
    note.textContent = `${played} / ${leagueMatchesTotal} league matches completed`;
  }
}

/* ============================================================
   14. HISTORY
   ============================================================ */
function renderHistory() {
  const list = document.getElementById('historyList');
  if (!state.history.length) {
    list.innerHTML = '<div class="empty-state">No matches played yet.</div>';
    return;
  }
  list.innerHTML = '';
  state.history.forEach((h, i) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="hc-match">MATCH ${state.history.length - i} · ${h.date}</div>
      <div class="hc-teams">${h.teamA} <span style="color:var(--muted)">vs</span> ${h.teamB}</div>
      <div class="hc-score">${h.scoreA} — ${h.scoreB}</div>
      <div class="hc-winner">🏆 ${h.winner}</div>`;
    list.appendChild(card);
  });
}

/* ============================================================
   15. RESET
   ============================================================ */
function confirmReset() {
  if (confirm('Reset ALL tournament data? This cannot be undone.')) {
    state = { fixtures: generateFixtures(), standings: initStandings(), history: [] };
    saveState();
    renderStandings();
  }
}

/* ============================================================
   16. INIT
   ============================================================ */
renderHome();
