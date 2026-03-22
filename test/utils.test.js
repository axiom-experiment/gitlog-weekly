'use strict';

const {
  formatDate,
  formatDateHuman,
  daysAgo,
  renderBar,
  formatNumber,
  padRight,
  padLeft
} = require('../src/utils');

// ─── formatDate ──────────────────────────────────────────

describe('formatDate', () => {
  test('formats a Date object as YYYY-MM-DD', () => {
    // Use a specific timestamp to avoid timezone ambiguity
    const d = new Date(2026, 2, 20, 12, 0, 0); // March 20, 2026 noon local
    expect(formatDate(d)).toBe('2026-03-20');
  });

  test('pads single-digit months and days with leading zero', () => {
    const d = new Date(2026, 0, 5, 12, 0, 0); // Jan 5
    expect(formatDate(d)).toBe('2026-01-05');
  });

  test('handles December correctly', () => {
    const d = new Date(2026, 11, 31, 12, 0, 0); // Dec 31
    expect(formatDate(d)).toBe('2026-12-31');
  });

  test('accepts a timestamp number', () => {
    const d = new Date(2026, 2, 20, 12, 0, 0);
    expect(formatDate(d.getTime())).toBe('2026-03-20');
  });
});

// ─── formatDateHuman ─────────────────────────────────────

describe('formatDateHuman', () => {
  test('returns month name, day, and year', () => {
    const d = new Date(2026, 2, 20, 12, 0, 0); // March 20
    const result = formatDateHuman(d);
    expect(result).toContain('Mar');
    expect(result).toContain('20');
    expect(result).toContain('2026');
  });

  test('January produces "Jan"', () => {
    const d = new Date(2026, 0, 1, 12, 0, 0);
    expect(formatDateHuman(d)).toContain('Jan');
  });

  test('December produces "Dec"', () => {
    const d = new Date(2026, 11, 15, 12, 0, 0);
    expect(formatDateHuman(d)).toContain('Dec');
  });
});

// ─── daysAgo ─────────────────────────────────────────────

describe('daysAgo', () => {
  test('returns a Date approximately N days in the past', () => {
    const now = new Date();
    const result = daysAgo(7);
    const diffMs = now - result;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Allow ±1 day for test timing and midnight reset
    expect(diffDays).toBeGreaterThanOrEqual(6.9);
    expect(diffDays).toBeLessThanOrEqual(8.1);
  });

  test('resets to midnight (hours, minutes, seconds = 0)', () => {
    const result = daysAgo(3);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  test('daysAgo(0) returns today at midnight', () => {
    const result = daysAgo(0);
    const today = new Date();
    expect(result.getFullYear()).toBe(today.getFullYear());
    expect(result.getMonth()).toBe(today.getMonth());
    expect(result.getDate()).toBe(today.getDate());
  });
});

// ─── renderBar ───────────────────────────────────────────

describe('renderBar', () => {
  test('renders a full bar (fraction = 1)', () => {
    expect(renderBar(1, 10)).toBe('██████████');
  });

  test('renders an empty bar (fraction = 0)', () => {
    expect(renderBar(0, 10)).toBe('░░░░░░░░░░');
  });

  test('renders a half bar (fraction = 0.5)', () => {
    expect(renderBar(0.5, 10)).toBe('█████░░░░░');
  });

  test('uses default width of 20', () => {
    const bar = renderBar(1);
    expect([...bar].length).toBe(20); // character count, not byte count
  });

  test('clamps fractions above 1', () => {
    expect(renderBar(2, 8)).toBe('████████');
  });

  test('clamps fractions below 0', () => {
    expect(renderBar(-1, 8)).toBe('░░░░░░░░');
  });

  test('total bar length always equals width', () => {
    for (const frac of [0, 0.1, 0.33, 0.5, 0.75, 0.99, 1]) {
      const bar = renderBar(frac, 15);
      expect([...bar].length).toBe(15);
    }
  });
});

// ─── formatNumber ────────────────────────────────────────

describe('formatNumber', () => {
  test('formats thousands with comma separator', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  test('formats millions', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  test('handles numbers below 1000', () => {
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(0)).toBe('0');
  });

  test('handles negative numbers', () => {
    // Negative numbers should still format correctly
    const result = formatNumber(-5000);
    expect(result).toContain('5,000');
  });
});

// ─── padRight ────────────────────────────────────────────

describe('padRight', () => {
  test('pads a short string to the desired length', () => {
    expect(padRight('hi', 10)).toBe('hi        ');
    expect(padRight('hi', 10).length).toBe(10);
  });

  test('leaves a string at exact length unchanged', () => {
    expect(padRight('hello', 5)).toBe('hello');
  });

  test('truncates strings longer than the desired length', () => {
    expect(padRight('hello world', 5)).toBe('hello');
    expect(padRight('hello world', 5).length).toBe(5);
  });

  test('converts non-string to string first', () => {
    expect(padRight(42, 6)).toBe('42    ');
  });
});

// ─── padLeft ─────────────────────────────────────────────

describe('padLeft', () => {
  test('left-pads a string to the desired length', () => {
    expect(padLeft('42', 5)).toBe('   42');
    expect(padLeft('42', 5).length).toBe(5);
  });

  test('converts numbers to strings', () => {
    expect(padLeft(42, 5)).toBe('   42');
  });

  test('leaves strings at exact length unchanged', () => {
    expect(padLeft('hello', 5)).toBe('hello');
  });

  test('returns string as-is when longer than desired length', () => {
    expect(padLeft('toolongstring', 5)).toBe('toolongstring');
  });
});
