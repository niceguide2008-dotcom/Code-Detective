// =============================================
// UTILITY FUNCTIONS
// =============================================
import { AuthService } from './services/auth.js';
import { DBService } from './services/db.js';
import { supabase } from './supabase.js';

function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.threshold) rank = r;
    else break;
  }
  return rank;
}

function formatXP(n) {
  return n.toLocaleString();
}

function showToast(type, icon, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function animateNumber(el, from, to, duration = 800) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatXP(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// =============================================
// NAVIGATION
// =============================================
function showScreen(screenId) {
  // Route Protection
  if (screenId !== 'login' && !sessionStorage.getItem('auth_token')) {
    screenId = 'login';
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const screen = document.getElementById(`screen-${screenId}`);

  // Handle Nav Bar Visibility
  const nav = document.getElementById('main-nav');
  const appContainer = document.getElementById('app-container');
  if (screenId === 'login') {
    if (nav) nav.style.display = 'none';
    if (appContainer) appContainer.style.marginTop = '0';
  } else {
    if (nav) nav.style.display = 'flex';
    if (appContainer) appContainer.style.marginTop = '64px';
  }
  const tab = document.getElementById(`tab-${screenId}`);

  if (screen) screen.classList.add('active');
  if (tab) tab.classList.add('active');
  state.currentScreen = screenId;

  if (screenId === 'crime-scene') renderCrimeScene();
  if (screenId === 'criminal-db') {
    renderCriminalDatabase();
    renderCaseLibrary();
  }
  if (screenId === 'mastery') renderMasteryBoard();
  if (screenId === 'dashboard') updateDashboard();
}

// Profile Dropdown Logic
document.getElementById('nav-avatar-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('profile-dropdown').classList.toggle('active');
});
document.getElementById('nav-xp-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('profile-dropdown').classList.toggle('active');
});
document.addEventListener('click', () => {
  document.getElementById('profile-dropdown').classList.remove('active');
});

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    showScreen(tab.dataset.screen);
  });
});

function goToCrimeScene() {
  showScreen('crime-scene');
}

// =============================================
// DASHBOARD
// =============================================
function updateDashboard() {
  const rank = getRank(state.totalXP);
  document.getElementById('stat-cases').textContent = state.casesCompleted;
  document.getElementById('stat-streak').textContent = state.streak;
  document.getElementById('stat-accuracy').textContent = state.accuracy + '%';
  document.getElementById('profile-rank').textContent = rank.name;
  document.getElementById('dash-streak').textContent = state.streak + ' Day Streak';

  const nextRankIdx = RANKS.findIndex(r => r.name === rank.name) + 1;
  const nextRank = RANKS[nextRankIdx];
  const xpDisplay = `${formatXP(state.totalXP)} / ${formatXP(nextRank ? nextRank.threshold : 9999)}`;
  document.getElementById('xp-display').textContent = xpDisplay;

  const pct = nextRank
    ? ((state.totalXP - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100
    : 100;
  document.getElementById('xp-bar').style.width = pct + '%';

  if (nextRank) {
    document.getElementById('xp-to-next').innerHTML = `${formatXP(nextRank.threshold - state.totalXP)} DXP to <strong style="color:var(--amber)">${nextRank.name}</strong>`;
  }

  document.getElementById('nav-xp').textContent = formatXP(state.totalXP) + ' DXP';
}

// =============================================
// CRIME SCENE RENDERER
// =============================================
function renderCrimeScene() {
  const c = CASES[state.currentCaseIndex];
  resetCaseState();

  // Header
  document.getElementById('crime-case-id').textContent = `CASE ${c.id} — ${c.topic.toUpperCase()} DIVISION`;
  document.getElementById('crime-case-title').textContent = c.title;
  document.getElementById('terminal-filename').textContent = c.filename;

  // Tags
  const tagsEl = document.getElementById('crime-case-tags');
  tagsEl.innerHTML = `
    <div class="badge badge-${c.difficultyColor}">⚡ ${c.difficulty}</div>
    <div class="badge badge-crimson">🏷️ ${c.topic}</div>
    <div class="badge badge-cyan">+${c.xpReward} DXP</div>
  `;

  // Case file
  document.getElementById('case-file-id').textContent = c.id;
  document.getElementById('case-file-topic').textContent = c.topic;
  document.getElementById('case-file-reward').textContent = `+${c.xpReward} DXP`;
  document.getElementById('case-file-diff').innerHTML = `<span class="badge badge-${c.difficultyColor}">${c.difficulty}</span>`;
  document.getElementById('detective-notes').textContent = c.detectorNote;

  // Code block
  const codeBlock = document.getElementById('code-block');
  codeBlock.innerHTML = '';
  c.code.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'code-line' + (line.bug ? ' bug-line' : '');
    div.innerHTML = `<span class="line-number">${i + 1}</span><span class="line-content">${line.text || '&nbsp;'}</span>`;
    codeBlock.appendChild(div);
  });

  // Evidence
  renderEvidence(c);

  // Suspects
  renderSuspects(c);

  // Update nav buttons
  document.getElementById('prev-case-btn').disabled = state.currentCaseIndex === 0;
  document.getElementById('next-case-nav-btn').disabled = state.currentCaseIndex === CASES.length - 1;

  // Steps
  updateSteps();
}

function resetCaseState() {
  state.caseState = {
    suspectSelected: null,
    reasonSelected: null,
    fixSelected: null,
    cluesRevealed: 0,
    step: 1,
  };
  document.getElementById('root-cause-section').style.display = 'none';
  document.getElementById('code-fix-section').style.display = 'none';
  document.getElementById('submit-section').style.display = 'none';
  document.getElementById('clues-unlocked').textContent = '0/3 Clues Revealed';
}

function renderEvidence(c) {
  const body = document.getElementById('evidence-body');
  body.innerHTML = '';
  c.clues.forEach((clue, i) => {
    const div = document.createElement('div');
    const isRevealed = i < state.caseState.cluesRevealed;
    div.className = `clue-item ${isRevealed ? 'revealed' : (i === 0 ? '' : 'locked')}`;
    div.id = `clue-${i}`;
    div.innerHTML = `
      <div class="clue-icon ${isRevealed ? 'clue-icon-unlocked' : 'clue-icon-locked'}">${isRevealed ? clue.icon : '🔒'}</div>
      <div class="clue-content">
        <div class="clue-num">Clue #${i + 1}</div>
        ${isRevealed
        ? `<div class="clue-text">${clue.text}</div>`
        : (i === 0
          ? `<div class="clue-text">Click to reveal first clue...</div><div class="clue-reveal-hint">→ Tap to examine evidence</div>`
          : `<div class="clue-text">🔒 Solve step ${i} to unlock this clue</div>`
        )
      }
      </div>
    `;
    if (!isRevealed && i === 0) {
      div.addEventListener('click', () => revealClue(i));
    } else if (!isRevealed && i > 0 && state.caseState.cluesRevealed >= i) {
      div.classList.remove('locked');
      div.addEventListener('click', () => revealClue(i));
    } else if (isRevealed) {
      div.style.cursor = 'default';
    }
    body.appendChild(div);
  });
  updateClueCounter();
}

function revealClue(index) {
  const c = CASES[state.currentCaseIndex];
  if (index !== state.caseState.cluesRevealed) return;

  state.caseState.cluesRevealed++;
  renderEvidence(c);
  updateClueCounter();
  showToast('info', c.clues[index].icon, `Clue #${index + 1} revealed!`);
}

function updateClueCounter() {
  document.getElementById('clues-unlocked').textContent = `${state.caseState.cluesRevealed}/3 Clues Revealed`;
}

function renderSuspects(c) {
  const grid = document.getElementById('suspects-grid');
  grid.innerHTML = '';
  c.suspects.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'suspect-card';
    div.id = `suspect-${i}`;
    div.innerHTML = `<div class="suspect-icon">${s.icon}</div><div class="suspect-name">${s.name}</div>`;
    div.addEventListener('click', () => selectSuspect(i, s, c));
    grid.appendChild(div);
  });
}

function selectSuspect(i, suspect, c) {
  if (state.caseState.suspectSelected !== null) return;

  state.caseState.suspectSelected = i;
  const card = document.getElementById(`suspect-${i}`);

  if (suspect.correct) {
    card.classList.add('correct');
    state.caseState.step = 2;
    showToast('success', '🎯', `Correct! The criminal is ${suspect.name}`);
    updateSteps();
    setTimeout(() => {
      document.getElementById('root-cause-section').style.display = 'block';
      renderReasons(c);
      document.getElementById('root-cause-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reveal clue 2 automatically
      if (state.caseState.cluesRevealed < 2) {
        state.caseState.cluesRevealed = Math.max(state.caseState.cluesRevealed, 2);
        renderEvidence(c);
      }
    }, 400);
  } else {
    card.classList.add('wrong');
    showToast('error', '❌', `Wrong! ${suspect.name} is not the culprit. Keep investigating.`);
    state.caseState.suspectSelected = null;
    setTimeout(() => card.classList.remove('wrong'), 800);
  }
}

function renderReasons(c) {
  const container = document.getElementById('reason-options');
  container.innerHTML = '';
  c.reasons.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'reason-option';
    div.id = `reason-${i}`;
    div.innerHTML = `<div class="reason-radio"></div><span>${r.text}</span>`;
    div.addEventListener('click', () => selectReason(i, r, c));
    container.appendChild(div);
  });
}

function selectReason(i, reason, c) {
  if (state.caseState.reasonSelected !== null) return;

  state.caseState.reasonSelected = i;
  const el = document.getElementById(`reason-${i}`);

  if (reason.correct) {
    el.classList.add('correct');
    state.caseState.step = 3;
    showToast('success', '💡', 'Root cause identified!');
    updateSteps();
    setTimeout(() => {
      document.getElementById('code-fix-section').style.display = 'block';
      renderFixes(c);
      document.getElementById('code-fix-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (state.caseState.cluesRevealed < 3) {
        state.caseState.cluesRevealed = 3;
        renderEvidence(c);
      }
    }, 400);
  } else {
    el.classList.add('wrong');
    showToast('error', '❌', 'Incorrect reasoning. Try another theory.');
    state.caseState.reasonSelected = null;
    setTimeout(() => el.classList.remove('wrong'), 800);
  }
}

function renderFixes(c) {
  const container = document.getElementById('fix-options');
  container.innerHTML = '';
  c.fixes.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'fix-option';
    div.id = `fix-${i}`;
    div.innerHTML = `<span class="fix-prefix">→</span><code>${f.text}</code>`;
    div.addEventListener('click', () => selectFix(i, f));
    container.appendChild(div);
  });
}

function selectFix(i, fix) {
  if (state.caseState.fixSelected !== null) return;
  state.caseState.fixSelected = i;
  const el = document.getElementById(`fix-${i}`);

  if (fix.correct) {
    el.classList.add('correct');
    showToast('success', '🔧', 'Correct fix applied! Submit the case.');
    setTimeout(() => {
      document.getElementById('submit-section').style.display = 'block';
      document.getElementById('submit-section').scrollIntoView({ behavior: 'smooth' });
    }, 400);
  } else {
    el.classList.add('wrong');
    showToast('error', '❌', 'This fix won\'t solve the bug. Try another patch.');
    state.caseState.fixSelected = null;
    setTimeout(() => el.classList.remove('wrong'), 800);
  }
}

function updateSteps() {
  const steps = [1, 2, 3];
  steps.forEach(n => {
    const el = document.getElementById(`step-${n}`);
    el.classList.remove('active', 'done');
    if (n < state.caseState.step) el.classList.add('done');
    else if (n === state.caseState.step) el.classList.add('active');
  });
}

async function saveCaseProgress(caseId, xpEarned = 0) {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        '[Code Detective] Failed to get authenticated user:',
        userError
      );
      return false;
    }

    if (!user) {
      console.warn(
        '[Code Detective] Progress not saved because no authenticated user exists.'
      );
      return false;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('case_progress')
      .upsert(
        {
          user_id: user.id,
          case_id: caseId,
          completed: true,
          xp_earned: Number(xpEarned) || 0,
          completed_at: now,
          updated_at: now
        },
        {
          onConflict: 'user_id,case_id'
        }
      );

    if (error) {
      console.error(
        '[Code Detective] Failed to save case progress:',
        error
      );
      return false;
    }

    console.log(
      `[Code Detective] Progress saved successfully for ${caseId}`
    );

    return true;
  } catch (error) {
    console.error(
      '[Code Detective] Unexpected progress save error:',
      error
    );
    return false;
  }
}

function submitCase() {
  const c = CASES[state.currentCaseIndex];
  const xpGain = c.xpReward;
  const oldXP = state.totalXP;
  state.totalXP += xpGain;
  state.casesCompleted += 1;
  state.streak = state.streak; // keep streak
  saveCaseProgress(c.id, xpGain);

  // Update modal
  document.getElementById('modal-xp-value').textContent = `+${xpGain} DXP`;
  document.getElementById('modal-subtitle').textContent = `${c.criminal} has been apprehended. Case ${c.id} officially closed.`;
  document.getElementById('modal-cases-solved').textContent = state.casesCompleted;
  document.getElementById('modal-streak').textContent = state.streak + '🔥';

  // Animate XP
  const xpEl = document.getElementById('modal-total-xp');
  xpEl.textContent = formatXP(oldXP);
  document.getElementById('modal-overlay').classList.add('active');

  setTimeout(() => {
    animateNumber(xpEl, oldXP, state.totalXP);
    spawnParticles();
  }, 300);

  // Update nav XP
  document.getElementById('nav-xp').textContent = formatXP(state.totalXP) + ' DXP';
  document.getElementById('sidebar-xp').textContent = formatXP(state.totalXP);
  updateDashboard();
}

function spawnParticles() {
  const modal = document.getElementById('case-closed-modal');
  const colors = ['var(--cyan)', 'var(--amber)', 'var(--crimson)', 'var(--green)', 'var(--purple)'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const dist = 60 + Math.random() * 120;
    p.style.cssText = `
      left: 50%; top: 30%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      --tx: ${Math.cos(angle) * dist}px;
      --ty: ${Math.sin(angle) * dist}px;
      animation-delay: ${Math.random() * 0.3}s;
      animation-duration: ${0.6 + Math.random() * 0.6}s;
    `;
    modal.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  showScreen('dashboard');
}

function nextCase() {
  document.getElementById('modal-overlay').classList.remove('active');
  if (state.currentCaseIndex < CASES.length - 1) {
    state.currentCaseIndex++;
  } else {
    showToast('info', '🏆', 'You\'ve completed all available cases! More coming soon.');
    showScreen('dashboard');
    return;
  }
  showScreen('crime-scene');
}

function prevCase() {
  if (state.currentCaseIndex > 0) {
    state.currentCaseIndex--;
    showScreen('crime-scene');
  }
}

// =============================================
// CRIMINAL DATABASE
// =============================================
function normalizeCriminal(c) {
  // Support both old rich format and new simplified format
  return {
    alias: c.alias || c.name || 'Unknown Suspect',
    exceptionClass: c.exceptionClass || c.name || 'Java Crime',
    icon: c.icon || '🔴',
    gradient: c.gradient || 'linear-gradient(135deg, rgba(0,243,255,0.08), transparent)',
    borderColor: c.borderColor || 'rgba(0,243,255,0.15)',
    attack: c.attack || (c.description ? c.description.substring(0, 60) + '...' : 'Pattern unknown'),
    cause: c.cause || c.description || 'A cunning Java criminal.',
    solvedCount: c.solvedCount || 0,
    unlocked: c.unlocked !== undefined ? c.unlocked : true
  };
}

function renderCriminalDatabase() {
  const grid = document.getElementById('criminals-grid');
  grid.innerHTML = '';
  const normalized = CRIMINALS.map(normalizeCriminal);
  const unlocked = normalized.filter(c => c.unlocked).length;
  document.getElementById('unlocked-count').textContent = `${unlocked} Unlocked`;

  normalized.forEach(criminal => {
    const card = document.createElement('div');
    card.className = 'criminal-card';
    if (!criminal.unlocked) {
      card.style.opacity = '0.4';
      card.style.filter = 'grayscale(0.8)';
    }
    card.style.borderColor = criminal.unlocked ? criminal.borderColor : 'var(--border)';
    card.innerHTML = `
      <div class="criminal-card-top" style="--criminal-gradient: ${criminal.gradient}">
        ${!criminal.unlocked ? '<div style="position:absolute;top:12px;right:12px;font-size:20px;">🔒</div>' : ''}
        <div class="criminal-mugshot">${criminal.icon}</div>
        <div class="criminal-alias">${criminal.alias}</div>
        <div class="criminal-class">${criminal.exceptionClass}</div>
        <div class="criminal-solved">
          <span>Cases closed:</span>
          <span class="criminal-solved-count">&nbsp;${criminal.solvedCount}</span>
        </div>
      </div>
      <div class="criminal-card-bottom">
        <div class="criminal-attack-label">Attack Pattern</div>
        <div class="criminal-code-snippet">${criminal.attack}</div>
        <div class="criminal-root-cause">${criminal.unlocked ? criminal.cause : '🔒 Solve more cases to unlock criminal profile.'}</div>
      </div>
    `;
    if (criminal.unlocked) {
      card.addEventListener('click', () => showToast('info', criminal.icon, `${criminal.alias} — ${criminal.exceptionClass}`));
    }
    grid.appendChild(card);
  });
}

function renderCaseLibrary() {
  const container = document.getElementById('cases-unit-container');
  container.innerHTML = '';

  const divisionIcons = {
    'Unit I - Basics': '📚',
    'Unit II - OOP': '🧬',
    'Unit III - Exceptions & Threads': '⚡',
    'Unit IV - I/O & Generics': '📂',
    'Unit V - JavaFX': '🖥️'
  };

  // Calculate Unit 1 progress
  let unit1Total = 0;
  let unit1Solved = 0;
  MASTERY_TOPICS.forEach(topic => {
    if (topic.division === 'Unit I - Basics') {
      unit1Total += (topic.cases || []).length;
      unit1Solved += (topic.solved || 0);
    }
  });
  const unitsUnlocked = (unit1Total === 0) ? true : (unit1Solved >= unit1Total / 2);

  const difficultyXPReq = {
    'Rookie': 0,
    'Easy': 500,
    'Medium': 1000,
    'Hard': 2000,
    'Expert': 4000
  };

  // Group cases by Mastery Topic division
  const casesByDivision = {};

  MASTERY_TOPICS.forEach(topic => {
    if (!topic.division) return;
    if (!casesByDivision[topic.division]) {
      casesByDivision[topic.division] = { icon: divisionIcons[topic.division] || '📁', cases: [] };
    }
    // Find actual case objects based on IDs in topic.cases
    (topic.cases || []).forEach(caseId => {
      const caseObj = CASES.find(c => c.id === caseId);
      if (caseObj) {
        casesByDivision[topic.division].cases.push(caseObj);
      }
    });
  });

  // Render sections
  Object.keys(casesByDivision).forEach(division => {
    const data = casesByDivision[division];
    if (data.cases.length === 0) return;

    const isUnitLocked = division !== 'Unit I - Basics' && !unitsUnlocked;

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'unit-section-title';
    sectionTitle.id = 'division-' + division.replace(/\W+/g, '-');
    sectionTitle.innerHTML = `<span style="font-size:24px;">${data.icon}</span> ${division} ${isUnitLocked ? '<span style="font-size:14px; color:var(--red); margin-left:10px;">🔒 Locked</span>' : ''}`;
    container.appendChild(sectionTitle);

    const grid = document.createElement('div');
    grid.className = 'cases-grid';
    if (isUnitLocked) {
      grid.style.opacity = '0.5';
      grid.style.pointerEvents = 'none';
    }

    data.cases.forEach(c => {
      const reqXP = difficultyXPReq[c.difficulty] || 0;
      const isCaseLocked = state.totalXP < reqXP;

      const card = document.createElement('div');
      card.className = 'case-library-card';
      if (isCaseLocked && !isUnitLocked) {
        card.style.opacity = '0.6';
      }

      card.innerHTML = `
        <div class="case-library-header">
          <span class="case-library-id">${c.id}</span>
          <span class="badge badge-${c.difficultyColor}" style="font-size:9px; padding:2px 6px;">${c.difficulty}</span>
        </div>
        <div class="case-library-title">${c.title}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Reward: <span style="color:var(--cyan)">+${c.xpReward} DXP</span></div>
        ${isCaseLocked ? `<div style="font-size:10px; color:var(--red); margin-top:8px;">🔒 Requires ${reqXP} DXP</div>` : ''}
      `;

      card.addEventListener('click', () => {
        if (isUnitLocked) {
          showToast('error', '🔒', 'Finish 50% of Unit I to unlock this unit.');
          return;
        }
        if (isCaseLocked) {
          showToast('error', '🔒', `You need ${reqXP} DXP to attempt this case.`);
              return;
            }
            // Find index of this case in CASES array
            const index = CASES.findIndex(caseObj => caseObj.id === c.id);
            if (index !== -1) {
              state.currentCaseIndex = index;
              showScreen('crime-scene');
            }
          });

          grid.appendChild(card);
        });

        container.appendChild(grid);
      });
    }

    // =============================================
    // MASTERY BOARD
    // =============================================
    function renderMasteryBoard() {
      const list = document.getElementById('mastery-topics-list');
      list.innerHTML = '';

      const divisionColors = {
        'Unit I - Basics': 'var(--cyan)',
        'Unit II - OOP': 'var(--amber)',
        'Unit III - Exceptions & Threads': 'var(--crimson)',
        'Unit IV - I/O & Generics': 'var(--purple)',
        'Unit V - JavaFX': 'var(--green)'
      };
      const divisionIcons = {
        'Unit I - Basics': '📚',
        'Unit II - OOP': '🧬',
        'Unit III - Exceptions & Threads': '⚡',
        'Unit IV - I/O & Generics': '📂',
        'Unit V - JavaFX': '🖥️'
      };

      MASTERY_TOPICS.forEach(t => {
        const solved = t.solved || 0;
        const total = (t.cases || []).length;
        const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
        const color = divisionColors[t.division] || 'var(--cyan)';
        const icon = divisionIcons[t.division] || '🔍';
        const label = t.label || t.name || t.id;
        const division = t.division || '';

        const row = document.createElement('div');
        row.className = 'mastery-topic-row';
        row.innerHTML = `
            < div class= "mastery-row-header" >
            <><div class="mastery-topic-info">
              <div class="mastery-icon">${icon}</div>
              <div>
                <div class="mastery-name">${label}</div>
                <div class="mastery-cases">${division} &nbsp;·&nbsp; ${solved}/${total} cases solved</div>
              </div>
            </div><div class="mastery-percentage" style="color:${color}">${pct}%</div></>
      </div >
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%; background: linear-gradient(90deg, ${color}, var(--purple));"></div>
            </div>
    `;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
          showScreen('criminal-db');
          setTimeout(() => {
            const target = document.getElementById('division-' + t.division.replace(/\W+/g, '-'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        });
        list.appendChild(row);
      });

      // Recommendations — highlight topics with 0% progress
      const recList = document.getElementById('recommendations');
      recList.innerHTML = '';
      MASTERY_TOPICS.filter(t => (t.solved || 0) === 0).slice(0, 3).forEach(t => {
        const icon = divisionIcons[t.division] || '🔍';
        const color = divisionColors[t.division] || 'var(--cyan)';
        const div = document.createElement('div');
        div.innerHTML = `
            < div style = "display:flex; align-items:center; gap:10px; padding:10px 12px; background:rgba(255,255,255,0.02); border-radius:var(--radius-md); border:1px solid var(--border); cursor:pointer;" onclick = "showScreen('crime-scene')" >
        <span style="font-size:18px;">${icon}</span>
        <div>
          <div style="font-size:13px; font-weight:600;">${t.label || t.id}</div>
          <div style="font-size:11px; color:var(--text-muted);">0% mastery · Start investigating!</div>
        </div>
        <span style="margin-left:auto; color:${color}; font-size:12px;">→</span>
      </div >
            `;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          showScreen('criminal-db');
          setTimeout(() => {
            const target = document.getElementById('division-' + t.division.replace(/\W+/g, '-'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        });
        recList.appendChild(div);
      });

      // Rank progression
      const rankProg = document.getElementById('rank-progression');
      rankProg.innerHTML = '';
      RANKS.forEach((rank, i) => {
        const achieved = state.totalXP >= rank.threshold;
        const isCurrent = getRank(state.totalXP).name === rank.name;
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px;';
        if (isCurrent) div.style.background = 'rgba(0, 243, 255, 0.06)';
        div.innerHTML = `
            < span style = "font-size:16px;" > ${ rank.icon }</span >
          <div style="flex:1;">
            <div style="font-size:12px; font-weight:600; color:${achieved ? 'var(--text-primary)' : 'var(--text-muted)'}">${rank.name}</div>
            <div style="font-size:10px; color:var(--text-muted);">${rank.threshold.toLocaleString()} DXP</div>
          </div>
      ${ achieved? '<span style="color:var(--green); font-size:14px;">✓</span>': '' }
      ${ isCurrent? '<span class="badge badge-cyan" style="font-size:9px;">NOW</span>': '' }
            `;
        rankProg.appendChild(div);
      });

      // Update stat cards
      document.getElementById('mastery-total-xp').textContent = formatXP(state.totalXP);
      document.getElementById('mastery-cases-solved').textContent = state.casesCompleted;
      document.getElementById('mastery-accuracy').textContent = state.accuracy + '%';
      document.getElementById('mastery-streak').textContent = state.streak;
    }

    // =============================================
    // INITIALIZATION
    // =============================================
    async function init() {
      // Check auth state
      const { data: { session } } = await AuthService.getSession();
      
      if (!session) {
        showScreen('login');
      } else {
        // Authenticated
        document.getElementById('nav-avatar-btn').title = session.user.email;
        showScreen('dashboard');
        
        // Listen for auth changes
        AuthService.onAuthStateChange((event, newSession) => {
          if (event === 'SIGNED_OUT' || !newSession) {
            showScreen('login');
          }
        });

        // Fetch user data
        const { data: profile } = await DBService.getProfile(session.user.id);
        if (profile) {
          state.totalXP = profile.xp || 0;
          state.casesCompleted = profile.cases_solved || 0;
        }

        // Fetch cases
        const { data: casesData } = await DBService.getCases();
        if (casesData && casesData.length > 0) {
          CASES.length = 0;
          CASES.push(...casesData);
        }
        
        updateDashboard();
        renderCriminalDatabase();
        renderCaseLibrary();
      }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    // =============================================
    // AUTHENTICATION LOGIC (MVP)
    // =============================================
    function toggleAuthMode(mode) {
      const loginView = document.getElementById('auth-login-view');
      const registerView = document.getElementById('auth-register-view');
      
      if (mode === 'register') {
        loginView.style.display = 'none';
        registerView.style.display = 'block';
      } else {
        registerView.style.display = 'none';
        loginView.style.display = 'block';
      }
      
      // Reset forms
      document.getElementById('login-form').reset();
      document.getElementById('register-form').reset();
      document.getElementById('login-error-banner').style.display = 'none';
      document.getElementById('register-error-banner').style.display = 'none';
      checkPasswordReqs();
    }

    function togglePasswordVisibility(inputId) {
      const input = document.getElementById(inputId);
      if (input.type === 'password') {
        input.type = 'text';
      } else {
        input.type = 'password';
      }
    }

    function checkPasswordReqs() {
      const pwd = document.getElementById('reg-password').value || '';
      
      const hasLen = pwd.length >= 8;
      const hasUp = /[A-Z]/.test(pwd);
      const hasLow = /[a-z]/.test(pwd);
      const hasNum = /[0-9]/.test(pwd);

      const setReq = (id, met) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (met) {
          el.classList.add('met');
          el.innerHTML = '✓ ' + el.innerHTML.substring(2);
        } else {
          el.classList.remove('met');
          el.innerHTML = '○ ' + el.innerHTML.substring(2);
        }
      };

      setReq('req-len', hasLen);
      setReq('req-up', hasUp);
      setReq('req-low', hasLow);
      setReq('req-num', hasNum);

      checkPasswordMatch();
      return hasLen && hasUp && hasLow && hasNum;
    }

    function checkPasswordMatch() {
      const pwd = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-password-confirm').value;
      const error = document.getElementById('reg-match-error');
      const input = document.getElementById('reg-password-confirm');

      if (confirm && pwd !== confirm) {
        error.style.display = 'block';
        input.classList.add('error');
        return false;
      } else {
        error.style.display = 'none';
        input.classList.remove('error');
        return true;
      }
    }

    async function handleLoginSubmit(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-submit-btn');
      const errorBanner = document.getElementById('login-error-banner');
      
      if (!email.includes('@')) {
        document.getElementById('login-email-error').style.display = 'block';
        document.getElementById('login-email').classList.add('error');
        return;
      }
      document.getElementById('login-email-error').style.display = 'none';
      document.getElementById('login-email').classList.remove('error');

      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span> VERIFYING IDENTITY...';
      errorBanner.style.display = 'none';

      const { data, error } = await AuthService.signIn(email, password);

      if (!error && data.session) {
        // Success
        document.getElementById('login-success-banner').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.querySelector('#auth-login-view .auth-divider').style.display = 'none';
        document.querySelector('#auth-login-view .auth-secondary-btn').style.display = 'none';
        
        setTimeout(() => {
          showScreen('dashboard');
          // Restore view for future logouts
          document.getElementById('login-success-banner').style.display = 'none';
          document.getElementById('login-form').style.display = 'block';
          document.querySelector('#auth-login-view .auth-divider').style.display = 'flex';
          document.querySelector('#auth-login-view .auth-secondary-btn').style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = 'ACCESS HEADQUARTERS <span style="font-size:16px;">→</span>';
        }, 1500);
      } else {
        // Error
        document.getElementById('login-error-text').textContent = error.message;
        errorBanner.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'ACCESS HEADQUARTERS <span style="font-size:16px;">→</span>';
      }
    }

    async function handleRegisterSubmit(e) {
      e.preventDefault();
      
      if (!checkPasswordReqs() || !checkPasswordMatch()) {
        return;
      }

      const email = document.getElementById('reg-email').value;
      if (!email.includes('@')) {
        document.getElementById('reg-email-error').style.display = 'block';
        document.getElementById('reg-email').classList.add('error');
        return;
      }
      document.getElementById('reg-email-error').style.display = 'none';
      document.getElementById('reg-email').classList.remove('error');

      const password = document.getElementById('reg-password').value;
      const btn = document.getElementById('register-submit-btn');
      
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span> SECURING CREDENTIALS...';

      const { data, error } = await AuthService.signUp(email, password, email.split('@')[0]);

      if (!error) {
        document.getElementById('register-success-banner').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        
        setTimeout(() => {
          showScreen('dashboard');
          btn.disabled = false;
          btn.innerHTML = 'CREATE DETECTIVE ID';
          toggleAuthMode('login'); // reset to login mode for future
          document.getElementById('register-success-banner').style.display = 'none';
          document.getElementById('register-form').style.display = 'block';
        }, 1500);
      } else {
        alert(error.message);
        btn.disabled = false;
        btn.innerHTML = 'CREATE DETECTIVE ID';
      }
    }

    async function handleLogout() {
      await AuthService.signOut();
      sessionStorage.removeItem('auth_token');
      showScreen('login');
      // Hide the profile dropdown immediately
      const dropdown = document.getElementById('profile-dropdown');
      if(dropdown) dropdown.classList.remove('active');
    }

    // Attach logout to the dropdown item
    document.querySelector('.dropdown-item:last-child').addEventListener('click', handleLogout);



// --- GLOBAL WINDOW BINDINGS FOR VITE --- 


// --- GLOBAL WINDOW BINDINGS FOR VITE --- 
window.renderCaseLibrary = renderCaseLibrary;
window.renderEvidence = renderEvidence;
window.renderSuspects = renderSuspects;
window.showScreen = showScreen;
window.updateDashboard = updateDashboard;
window.renderFixes = renderFixes;
window.closeModal = closeModal;
window.selectReason = selectReason;
window.renderMasteryBoard = renderMasteryBoard;
window.spawnParticles = spawnParticles;
window.toggleAuthMode = toggleAuthMode;
window.formatXP = formatXP;
window.renderCrimeScene = renderCrimeScene;
window.showToast = showToast;
window.getRank = getRank;
window.checkPasswordReqs = checkPasswordReqs;
window.prevCase = prevCase;
window.init = init;
window.animateNumber = animateNumber;
window.selectSuspect = selectSuspect;
window.updateClueCounter = updateClueCounter;
window.renderReasons = renderReasons;
window.handleRegisterSubmit = handleRegisterSubmit;
window.checkPasswordMatch = checkPasswordMatch;
window.updateSteps = updateSteps;
window.handleLogout = handleLogout;
window.renderCriminalDatabase = renderCriminalDatabase;
window.goToCrimeScene = goToCrimeScene;
window.selectFix = selectFix;
window.submitCase = submitCase;
window.normalizeCriminal = normalizeCriminal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleLoginSubmit = handleLoginSubmit;
window.resetCaseState = resetCaseState;
window.nextCase = nextCase;
window.revealClue = revealClue;
