import './styles.css';

import {
  createInitialState,
  updatePassword,
  validateAllRevealedRules,
  startRetypePhase,
  getRetypeSecondsLeft,
  checkRetypeSuccess,
  getTotalRules,
  getRule,
  revealRuleRequirements
} from './game/game';

type State = ReturnType<typeof createInitialState>;

let state: State = createInitialState();
let retypeInput = '';
let retypeInterval: number | null = null;
let idleTimer: number | null = null;
let idleSecondsLeft = 4;
let chaosMode = false;
let chaosEffect: 'none' | 'move' | 'blindfold' | 'invert' | 'flip' | 'shake' | 'blur' | 'grayscale' | 'zoom' | 'shaketype' = 'none';
let chaosInterval: number | null = null;
let impossibleMode = false;
const IDLE_SECONDS_NORMAL = 4;
const IDLE_SECONDS_IMPOSSIBLE = 3;

const app = document.getElementById('app')!;

const NO_GRASS_TEXTS = ['go outside', 'touch grass', 'step outside'];
let noGrassAnimationId: number | null = null;

interface Bouncer {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function startNoGrassBouncers() {
  stopNoGrassBouncers();
  const container = document.createElement('div');
  container.className = 'no-grass-container';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  const bouncers: Bouncer[] = [];
  const speed = 1.2;

  NO_GRASS_TEXTS.forEach((text, i) => {
    const el = document.createElement('div');
    el.className = 'no-grass-bouncer';
    el.textContent = text;
    container.appendChild(el);

    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - 120;
    const maxY = window.innerHeight - 40;
    bouncers.push({
      el,
      x: Math.random() * Math.max(0, maxX),
      y: Math.random() * Math.max(0, maxY),
      vx: (Math.random() - 0.5) * 2 * speed,
      vy: (Math.random() - 0.5) * 2 * speed
    });
  });

  function animate() {
    const maxX = window.innerWidth - 120;
    const maxY = window.innerHeight - 40;
    bouncers.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x <= 0) { b.vx = Math.abs(b.vx); b.x = 0; }
      if (b.x >= maxX) { b.vx = -Math.abs(b.vx); b.x = maxX; }
      if (b.y <= 0) { b.vy = Math.abs(b.vy); b.y = 0; }
      if (b.y >= maxY) { b.vy = -Math.abs(b.vy); b.y = maxY; }
      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    });
    noGrassAnimationId = requestAnimationFrame(animate);
  }
  noGrassAnimationId = requestAnimationFrame(animate);
}

function stopNoGrassBouncers() {
  if (noGrassAnimationId) cancelAnimationFrame(noGrassAnimationId);
  noGrassAnimationId = null;
  document.querySelectorAll('.no-grass-container').forEach(el => el.remove());
}

function getIdleSeconds() {
  return impossibleMode ? IDLE_SECONDS_IMPOSSIBLE : IDLE_SECONDS_NORMAL;
}

function resetIdleTimer() {
  idleSecondsLeft = getIdleSeconds();
  if (idleTimer) clearInterval(idleTimer);
  idleTimer = window.setInterval(() => {
    if (state.phase !== 'playing') return;
    idleSecondsLeft--;
    updateGameDisplay();
    if (idleSecondsLeft <= 0) {
      if (idleTimer) clearInterval(idleTimer);
      idleTimer = null;
      state = createInitialState();
      state = updatePassword(state, '');
      render();
    }
  }, 1000);
}

function clearIdleTimer() {
  if (idleTimer) clearInterval(idleTimer);
  idleTimer = null;
  idleSecondsLeft = getIdleSeconds();
}

function pickRandomChaosEffect(): typeof chaosEffect {
  const effects: Array<typeof chaosEffect> = ['move', 'blindfold', 'invert', 'flip', 'shake', 'blur', 'grayscale', 'zoom', 'shaketype'];
  return effects[Math.floor(Math.random() * effects.length)];
}

function applyChaosEffects() {
  document.body.classList.remove('wobble-invert', 'wobble-flip', 'wobble-shake', 'wobble-grayscale', 'wobble-zoom');
  document.querySelectorAll('.wobble-blindfold').forEach(el => el.remove());
  document.querySelectorAll('.input-wrapper').forEach(el => {
    el.classList.remove('wobble-drift', 'wobble-shake-input', 'wobble-blur', 'wobble-shaketype');
  });
  if (!chaosMode) return;
  switch (chaosEffect) {
    case 'invert':
      document.body.classList.add('wobble-invert');
      break;
    case 'flip':
      document.body.classList.add('wobble-flip');
      break;
    case 'shake':
      document.body.classList.add('wobble-shake');
      break;
    case 'grayscale':
      document.body.classList.add('wobble-grayscale');
      break;
    case 'zoom':
      document.body.classList.add('wobble-zoom');
      break;
    case 'blur':
      document.querySelectorAll('.input-wrapper').forEach(el => el.classList.add('wobble-blur'));
      break;
    case 'shaketype':
      document.querySelectorAll('.input-wrapper').forEach(el => el.classList.add('wobble-shaketype'));
      break;
    case 'blindfold': {
      const overlay = document.createElement('div');
      overlay.className = 'wobble-blindfold';
      document.body.appendChild(overlay);
      break;
    }
    case 'move':
      document.querySelectorAll('.input-wrapper').forEach(el => el.classList.add('wobble-drift'));
      break;
  }
}

function updateGameDisplay() {
  if (state.phase !== 'playing' && state.phase !== 'confirm') return;
  const container = app.querySelector('.game-container');
  if (!container) return;

  const idleEl = container.querySelector('.idle-timer');
  if (idleEl) {
    idleEl.textContent = state.phase === 'playing' ? `${idleSecondsLeft}s idle → wipe` : '';
    idleEl.classList.toggle('warning', idleSecondsLeft <= 1);
    idleEl.classList.toggle('impossible-timer', impossibleMode);
  }

  const progressBar = container.querySelector('.progress-bar');
  const progressText = container.querySelector('.progress-text');
  if (progressBar && progressText) {
    const rulesPassed = state.currentRule - 1;
    const total = getTotalRules();
    (progressBar as HTMLElement).style.width = `${(rulesPassed / total) * 100}%`;
    progressText.textContent = `${rulesPassed}/${total}`;
  }

  const charCount = container.querySelector('.char-count');
  if (charCount) charCount.textContent = `${state.password.length} characters`;

  const rulesList = container.querySelector('.rules-list');
  if (!rulesList) return;

  const validations = validateAllRevealedRules(state);
  const revealedState = revealRuleRequirements(state);
  let html = '';
  for (let i = 0; i < state.currentRule && i < getTotalRules(); i++) {
    const rule = getRule(i + 1);
    const pass = validations[i];
    const isCurrent = i === state.currentRule - 1;
    let msg = rule.msg;
    if (i === 13 && revealedState.digitSum != null) msg = `Digits must add up to <code>${revealedState.digitSum}</code>`;
    if (i === 19 && revealedState.captcha) msg = `Include this exact string: <code>${revealedState.captcha}</code>`;
    if (i === 22 && revealedState.hexColor) msg = `Include this hex color: <span class="color-swatch" style="background:${revealedState.hexColor}"></span> <code>${revealedState.hexColor}</code>`;
    const cls = `rule-item ${pass ? 'pass' : isCurrent ? 'next' : 'fail'}`;
    const icon = pass ? '✓' : '○';
    html += `<div class="${cls}"><span class="rule-icon">${icon}</span><span class="rule-msg">${msg}</span></div>`;
  }
  rulesList.innerHTML = html;
}

function startChaosRotation() {
  if (chaosInterval) clearInterval(chaosInterval);
  if (!chaosMode) return;
  chaosEffect = pickRandomChaosEffect();
  applyChaosEffects();
  chaosInterval = window.setInterval(() => {
    chaosEffect = pickRandomChaosEffect();
    applyChaosEffects();
  }, 6000);
}

function render() {
  if (!impossibleMode) stopNoGrassBouncers();
  app.innerHTML = '';
  if (state.phase === 'playing' || state.phase === 'confirm') {
    renderGame();
  } else if (state.phase === 'retype') {
    renderRetype();
  } else if (state.phase === 'won') {
    renderWon();
  } else if (state.phase === 'lost') {
    renderLost();
  }
  if (chaosMode) applyChaosEffects();
}

function renderGame() {
  const ctx = document.createElement('div');
  ctx.className = `game-container ${impossibleMode ? 'impossible' : ''}`;

  const header = document.createElement('header');
  header.className = `game-header ${impossibleMode ? 'impossible' : ''}`;
  header.innerHTML = `
    <h1 class="title ${impossibleMode ? 'impossible-shake' : ''}">craft a <span class="accent">perfect</span> password</h1>
    <p class="subtitle">Satisfy every rule. Stay focused. Don't stop typing.</p>
  `;
  ctx.appendChild(header);

  const idleWrap = document.createElement('div');
  idleWrap.className = 'idle-wrap';
  idleWrap.innerHTML = `
    <span class="idle-timer ${idleSecondsLeft <= 1 ? 'warning' : ''} ${impossibleMode ? 'impossible-timer' : ''}">${state.phase === 'playing' ? `${idleSecondsLeft}s idle → wipe` : ''}</span>
    <div class="mode-toggles">
      <label class="tryme-toggle ${chaosMode ? 'on' : ''}">
        <input type="checkbox" ${chaosMode ? 'checked' : ''}>
        <span class="tryme-track">
          <span class="tryme-thumb"></span>
        </span>
        <span class="tryme-label">Try me :)</span>
      </label>
      <label class="impossible-toggle tryme-toggle ${impossibleMode ? 'on' : ''}">
        <input type="checkbox" ${impossibleMode ? 'checked' : ''}>
        <span class="tryme-track">
          <span class="tryme-thumb"></span>
        </span>
        <span class="tryme-label">NO GRASS</span>
      </label>
    </div>
  `;
  idleWrap.querySelectorAll('.tryme-toggle').forEach((label, idx) => {
    const input = label.querySelector('input');
    if (!input) return;
    input.addEventListener('change', (ev) => {
      const checked = (ev.target as HTMLInputElement).checked;
      if (idx === 0) {
        chaosMode = checked;
        if (chaosMode) startChaosRotation();
        else {
          if (chaosInterval) clearInterval(chaosInterval);
          chaosInterval = null;
          chaosEffect = 'none';
          document.body.classList.remove('wobble-invert', 'wobble-flip', 'wobble-shake', 'wobble-grayscale', 'wobble-zoom');
          document.querySelectorAll('.wobble-blindfold').forEach(el => el.remove());
        }
      } else {
        impossibleMode = checked;
        if (impossibleMode) startNoGrassBouncers();
        else stopNoGrassBouncers();
        resetIdleTimer();
      }
      render();
    });
  });
  ctx.appendChild(idleWrap);

  const rulesPassed = state.currentRule - 1;
  const total = getTotalRules();
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-wrap';
  progressBar.innerHTML = `
    <div class="progress-bar" style="width: ${(rulesPassed / total) * 100}%"></div>
    <span class="progress-text">${rulesPassed}/${total}</span>
  `;
  ctx.appendChild(progressBar);

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'input-wrapper';
  const inputWrap = document.createElement('div');
  inputWrap.className = 'input-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'password-input';
  input.placeholder = 'Type your password...';
  input.value = state.password;
  input.autocomplete = 'off';
  input.autocapitalize = 'off';

  input.addEventListener('focus', () => resetIdleTimer());
  input.addEventListener('input', (e) => {
    resetIdleTimer();
    const val = (e.target as HTMLInputElement).value;
    state = updatePassword(state, val);
    updateGameDisplay();
  });
  input.addEventListener('keydown', () => {
    resetIdleTimer();
    if (chaosMode && chaosEffect === 'shaketype') {
      const wrap = input.closest('.input-wrapper');
      wrap?.classList.remove('wobble-shaketype-hit');
      void (wrap as HTMLElement)?.offsetWidth;
      wrap?.classList.add('wobble-shaketype-hit');
      setTimeout(() => wrap?.classList.remove('wobble-shaketype-hit'), 200);
    }
  });

  inputWrap.appendChild(input);

  const charCount = document.createElement('div');
  charCount.className = 'char-count';
  charCount.textContent = `${state.password.length} characters`;
  inputWrap.appendChild(charCount);
  inputWrapper.appendChild(inputWrap);
  ctx.appendChild(inputWrapper);

  const rulesList = document.createElement('div');
  rulesList.className = 'rules-list';

  const validations = validateAllRevealedRules(state);
  const revealedState = revealRuleRequirements(state);

  for (let i = 0; i < state.currentRule && i < getTotalRules(); i++) {
    const rule = getRule(i + 1);
    const pass = validations[i];
    const isCurrent = i === state.currentRule - 1;
    const item = document.createElement('div');
    item.className = `rule-item ${pass ? 'pass' : isCurrent ? 'next' : 'fail'}`;
    let msg = rule.msg;

    if (i === 13 && revealedState.digitSum != null) {
      msg = `Digits must add up to <code>${revealedState.digitSum}</code>`;
    }
    if (i === 19 && revealedState.captcha) {
      msg = `Include this exact string: <code>${revealedState.captcha}</code>`;
    }
    if (i === 22 && revealedState.hexColor) {
      msg = `Include this hex color: <span class="color-swatch" style="background:${revealedState.hexColor}"></span> <code>${revealedState.hexColor}</code>`;
    }

    item.innerHTML = `
      <span class="rule-icon">${pass ? '✓' : '○'}</span>
      <span class="rule-msg">${msg}</span>
    `;
    rulesList.appendChild(item);
  }

  ctx.appendChild(rulesList);

  if (rulesPassed === total && state.phase === 'playing') {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn';
    confirmBtn.textContent = 'Confirm password →';
    confirmBtn.addEventListener('click', () => {
      clearIdleTimer();
      state = { ...state, phase: 'confirm' };
      render();
    });
    ctx.appendChild(confirmBtn);
  }

  if (state.phase === 'confirm') {
    const confirmBox = document.createElement('div');
    confirmBox.className = 'confirm-box';
    confirmBox.innerHTML = `
      <p>Copy your password. You have 120 seconds to retype it.</p>
      <button class="confirm-btn primary">I've copied it — start</button>
    `;
    confirmBox.querySelector('button')!.addEventListener('click', () => {
      clearIdleTimer();
      state = startRetypePhase(state);
      retypeInput = '';
      retypeInterval = window.setInterval(() => {
        if (getRetypeSecondsLeft(state) <= 0) {
          if (retypeInterval) clearInterval(retypeInterval);
          state = { ...state, phase: 'lost' };
          render();
        } else {
          render();
        }
      }, 1000);
      render();
    });
    ctx.appendChild(confirmBox);
  }

  app.appendChild(ctx);
  if (chaosMode) applyChaosEffects();
}

function renderRetype() {
  const secondsLeft = getRetypeSecondsLeft(state);
  const ctx = document.createElement('div');
  ctx.className = 'game-container retype';

  const header = document.createElement('header');
  header.className = 'game-header';
  header.innerHTML = `
    <h1 class="title">retype your <span class="accent">password</span></h1>
    <p class="timer ${secondsLeft <= 30 ? 'urgent' : ''}">${secondsLeft}s</p>
  `;
  ctx.appendChild(header);

  const inputWrap = document.createElement('div');
  inputWrap.className = 'input-wrap';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'password-input retype-input';
  input.placeholder = 'Paste or type your password...';
  input.value = retypeInput;
  input.autocomplete = 'off';

  input.addEventListener('input', (e) => {
    retypeInput = (e.target as HTMLInputElement).value;
    if (checkRetypeSuccess(state, retypeInput)) {
      if (retypeInterval) clearInterval(retypeInterval);
      state = { ...state, phase: 'won' };
      render();
    }
  });

  inputWrap.appendChild(input);
  ctx.appendChild(inputWrap);

  app.appendChild(ctx);
}

function renderWon() {
  app.innerHTML = `
    <div class="game-container win-screen">
      <div class="win-content">
        <h1>you found <span class="accent">peace</span></h1>
        <p>Against all odds, you crafted the perfect password.</p>
        <p class="zen">a calmer victory</p>
      </div>
    </div>
  `;
}

function renderLost() {
  app.innerHTML = `
    <div class="game-container lose-screen">
      <div class="lose-content">
        <h1>time's up</h1>
        <p>Your password is lost. Start again when you're ready.</p>
        <button class="restart-btn" onclick="location.reload()">try again</button>
      </div>
    </div>
  `;
}

const THEME_KEY = 'password-challenge-theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

initTheme();
document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);

resetIdleTimer();
render();
