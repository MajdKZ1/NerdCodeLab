import {
  rules,
  randomCaptcha,
  randomHexColor,
  randomDigitSum,
  type RuleContext
} from './rules';

export interface GameState {
  password: string;
  currentRule: number;
  captcha: string | null;
  hexColor: string | null;
  digitSum: number | null;
  phase: 'playing' | 'confirm' | 'retype' | 'won' | 'lost';
  retypeStartTime: number | null;
  copyPromptShown: boolean;
}

const CONFIRM_SECONDS = 120;

export function createInitialState(): GameState {
  return {
    password: '',
    currentRule: 1,
    captcha: null,
    hexColor: null,
    digitSum: null,
    phase: 'playing',
    retypeStartTime: null,
    copyPromptShown: false
  };
}

export function getRuleContext(state: GameState): RuleContext {
  return {
    password: state.password,
    currentRule: state.currentRule,
    captcha: state.captcha ?? undefined,
    hexColor: state.hexColor ?? undefined,
    digitSum: state.digitSum ?? undefined
  };
}

export function revealRuleRequirements(state: GameState): GameState {
  let s = { ...state };
  if (state.currentRule >= 14 && s.digitSum == null) {
    s.digitSum = randomDigitSum();
  }
  if (state.currentRule >= 20 && !s.captcha) {
    s.captcha = randomCaptcha();
  }
  if (state.currentRule >= 23 && !s.hexColor) {
    s.hexColor = randomHexColor();
  }
  return s;
}

export function validateAllRevealedRules(state: GameState): boolean[] {
  const ctx = getRuleContext(state);
  const results: boolean[] = [];
  for (let i = 0; i < state.currentRule && i < rules.length; i++) {
    results.push(rules[i].validate({ ...ctx, currentRule: i + 1 }));
  }
  return results;
}

export function updatePassword(state: GameState, password: string): GameState {
  let currentState = revealRuleRequirements({ ...state, password });
  let ctx = getRuleContext(currentState);
  let nextRule = currentState.currentRule;
  while (nextRule <= rules.length && rules[nextRule - 1].validate(ctx)) {
    nextRule++;
    if (nextRule <= rules.length) {
      currentState = revealRuleRequirements({ ...currentState, currentRule: nextRule });
      ctx = getRuleContext(currentState);
    }
  }
  return { ...currentState, currentRule: nextRule };
}

export function startRetypePhase(state: GameState): GameState {
  return {
    ...state,
    phase: 'retype',
    retypeStartTime: Date.now(),
    copyPromptShown: true
  };
}

export function getRetypeSecondsLeft(state: GameState): number {
  if (!state.retypeStartTime) return CONFIRM_SECONDS;
  const elapsed = (Date.now() - state.retypeStartTime) / 1000;
  return Math.max(0, Math.ceil(CONFIRM_SECONDS - elapsed));
}

export function checkRetypeSuccess(state: GameState, typed: string): boolean {
  return typed === state.password;
}

export function getTotalRules(): number {
  return rules.length;
}

export function getRule(index: number) {
  return rules[index - 1];
}
