/**
 * Code Challenge – rules that test programming knowledge
 */

const HTTP_STATUS = ['200', '201', '204', '400', '401', '403', '404', '405', '500', '502', '503'];
const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'rust', 'go', 'ruby', 'swift', 'kotlin', 'php', 'csharp'];
const FILE_EXT = ['.js', '.ts', '.py', '.json', '.html', '.css', '.jsx', '.tsx', '.yml', '.md', '.sql'];
const HTML_TAGS = ['div', 'span', 'p', 'a', 'img', 'button', 'form', 'input', 'ul', 'ol', 'li', 'h1', 'h2', 'header', 'main', 'section'];
const SQL_KEYWORDS = ['select', 'from', 'where', 'insert', 'update', 'delete', 'join', 'group', 'order', 'limit', 'and', 'or'];
const GIT_CMDS = ['push', 'pull', 'commit', 'merge', 'branch', 'clone', 'fetch', 'rebase', 'stash', 'status', 'log', 'diff'];
const TS_TYPES = ['string', 'number', 'boolean', 'array', 'object', 'void', 'null', 'undefined', 'any'];
const REGEX_PATTERNS = ['\\d', '\\w', '\\s', '.*', '[a-z]', '[0-9]', '\\n', '\\t', '^', '$'];
const FRAMEWORKS = ['react', 'vue', 'angular', 'express', 'nestjs', 'next', 'svelte', 'django', 'flask', 'rails'];
const DATA_STRUCTURES = ['array', 'object', 'map', 'set', 'list', 'dict', 'tuple', 'hash'];
const LOOP_KEYWORDS = ['for', 'while', 'foreach', 'map', 'filter', 'reduce'];

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function getDigitsSum(s: string): number {
  const digits = s.match(/\d/g) || [];
  return digits.reduce((sum, d) => sum + parseInt(d, 10), 0);
}

function isValidHexColor(s: string): boolean {
  return /#[0-9a-fA-F]{6}\b/.test(s);
}

function isValidSemver(s: string): boolean {
  return /\b\d+\.\d+\.\d+\b/.test(s);
}

function hasEscapeSequence(s: string): boolean {
  return /\\[ntr"'\\]/.test(s) || /\\\\/.test(s);
}

function isValidPort(s: string): boolean {
  const match = s.match(/\b(\d{4,5})\b/g);
  if (!match) return false;
  return match.some(m => {
    const n = parseInt(m, 10);
    return n >= 1024 && n <= 65535;
  });
}

export interface RuleContext {
  password: string;
  currentRule: number;
  captcha?: string;
  hexColor?: string;
  digitSum?: number;
}

export type RuleValidator = (ctx: RuleContext) => boolean;

export const rules: { id: number; msg: string; validate: RuleValidator }[] = [
  {
    id: 1,
    msg: 'At least 8 characters (production minimum)',
    validate: (ctx) => ctx.password.length >= 8
  },
  {
    id: 2,
    msg: 'Include a number',
    validate: (ctx) => /\d/.test(ctx.password)
  },
  {
    id: 3,
    msg: 'Include an uppercase letter',
    validate: (ctx) => /[A-Z]/.test(ctx.password)
  },
  {
    id: 4,
    msg: 'Include a special character',
    validate: (ctx) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(ctx.password)
  },
  {
    id: 5,
    msg: 'Include a valid hex color (#RRGGBB)',
    validate: (ctx) => isValidHexColor(ctx.password)
  },
  {
    id: 6,
    msg: 'Include an HTTP status code (e.g. 200, 404, 500)',
    validate: (ctx) => HTTP_STATUS.some(code => ctx.password.includes(code))
  },
  {
    id: 7,
    msg: 'Include a programming language name',
    validate: (ctx) => LANGUAGES.some(lang => ctx.password.toLowerCase().includes(lang))
  },
  {
    id: 8,
    msg: 'Include a file extension (.js, .ts, .py, etc.)',
    validate: (ctx) => FILE_EXT.some(ext => ctx.password.toLowerCase().includes(ext))
  },
  {
    id: 9,
    msg: 'Include an HTML tag name',
    validate: (ctx) => HTML_TAGS.some(tag => ctx.password.toLowerCase().includes(tag))
  },
  {
    id: 10,
    msg: 'Include a SQL keyword',
    validate: (ctx) => SQL_KEYWORDS.some(kw => ctx.password.toLowerCase().includes(kw))
  },
  {
    id: 11,
    msg: 'Include a Git command',
    validate: (ctx) => GIT_CMDS.some(cmd => ctx.password.toLowerCase().includes(cmd))
  },
  {
    id: 12,
    msg: 'Include a TypeScript/JS type (string, number, boolean, etc.)',
    validate: (ctx) => TS_TYPES.some(t => ctx.password.toLowerCase().includes(t))
  },
  {
    id: 13,
    msg: 'Include a regex pattern (\\d, \\w, .*, [a-z], etc.)',
    validate: (ctx) => REGEX_PATTERNS.some(p => ctx.password.includes(p))
  },
  {
    id: 14,
    msg: 'Digits must add up to this value',
    validate: (ctx) => ctx.digitSum != null && getDigitsSum(ctx.password) === ctx.digitSum
  },
  {
    id: 15,
    msg: 'Include a valid semver (e.g. 1.0.0)',
    validate: (ctx) => isValidSemver(ctx.password)
  },
  {
    id: 16,
    msg: 'Include an escape sequence (\\n, \\t, \\", etc.)',
    validate: (ctx) => hasEscapeSequence(ctx.password)
  },
  {
    id: 17,
    msg: 'Include a framework or library name',
    validate: (ctx) => FRAMEWORKS.some(f => ctx.password.toLowerCase().includes(f))
  },
  {
    id: 18,
    msg: 'Include true or false',
    validate: (ctx) => /\btrue\b/i.test(ctx.password) || /\bfalse\b/i.test(ctx.password)
  },
  {
    id: 19,
    msg: 'Include a port number (1024–65535)',
    validate: (ctx) => isValidPort(ctx.password)
  },
  {
    id: 20,
    msg: 'Include this exact string',
    validate: (ctx) => ctx.captcha != null && ctx.password.includes(ctx.captcha)
  },
  {
    id: 21,
    msg: 'Include a data structure name (array, map, set, etc.)',
    validate: (ctx) => DATA_STRUCTURES.some(ds => ctx.password.toLowerCase().includes(ds))
  },
  {
    id: 22,
    msg: 'Include a loop/iteration keyword',
    validate: (ctx) => LOOP_KEYWORDS.some(kw => ctx.password.toLowerCase().includes(kw))
  },
  {
    id: 23,
    msg: 'Include this hex color',
    validate: (ctx) => ctx.hexColor != null && ctx.password.toLowerCase().includes(ctx.hexColor.toLowerCase())
  },
  {
    id: 24,
    msg: 'Length must be a power of 2 (8, 16, 32, 64...)',
    validate: (ctx) => isPowerOfTwo(ctx.password.length)
  },
  {
    id: 25,
    msg: 'Include the current year',
    validate: (ctx) => ctx.password.includes(String(new Date().getFullYear()))
  },
  {
    id: 26,
    msg: 'Include your password length as a number',
    validate: (ctx) => ctx.password.includes(String(ctx.password.length))
  }
];

export function randomCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function randomHexColor(): string {
  const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function randomDigitSum(): number {
  const sums = [42, 1337, 256, 100, 69, 404, 200, 64];
  return sums[Math.floor(Math.random() * sums.length)];
}
