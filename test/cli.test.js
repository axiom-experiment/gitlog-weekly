'use strict';

const { parseArgs } = require('../src/cli');

// Base argv array (simulates: node gitlog-weekly [args...])
const base = ['node', 'gitlog-weekly'];

// ─── parseArgs ────────────────────────────────────────────

describe('parseArgs', () => {
  test('defaults to current directory when no arguments given', () => {
    const opts = parseArgs(base);
    expect(opts.repos).toEqual(['.']);
    expect(opts.days).toBe(7);
    expect(opts.format).toBe('terminal');
    expect(opts.author).toBeNull();
    expect(opts.output).toBeNull();
    expect(opts.help).toBe(false);
    expect(opts.version).toBe(false);
  });

  // ── Days flag ──────────────────────────────────────────

  test('parses --days flag', () => {
    const opts = parseArgs([...base, '--days', '14']);
    expect(opts.days).toBe(14);
  });

  test('parses -d short flag', () => {
    const opts = parseArgs([...base, '-d', '30']);
    expect(opts.days).toBe(30);
  });

  test('defaults days to 7 for invalid --days value', () => {
    const opts = parseArgs([...base, '--days', 'notanumber']);
    expect(opts.days).toBe(7);
  });

  // ── Format flag ────────────────────────────────────────

  test('parses --format terminal', () => {
    const opts = parseArgs([...base, '--format', 'terminal']);
    expect(opts.format).toBe('terminal');
  });

  test('parses --format markdown', () => {
    const opts = parseArgs([...base, '--format', 'markdown']);
    expect(opts.format).toBe('markdown');
  });

  test('parses --format json', () => {
    const opts = parseArgs([...base, '--format', 'json']);
    expect(opts.format).toBe('json');
  });

  test('parses -f short flag', () => {
    const opts = parseArgs([...base, '-f', 'json']);
    expect(opts.format).toBe('json');
  });

  // ── Author flag ────────────────────────────────────────

  test('parses --author flag', () => {
    const opts = parseArgs([...base, '--author', 'Alice Smith']);
    expect(opts.author).toBe('Alice Smith');
  });

  test('parses -a short flag', () => {
    const opts = parseArgs([...base, '-a', 'alice@example.com']);
    expect(opts.author).toBe('alice@example.com');
  });

  // ── Output flag ────────────────────────────────────────

  test('parses --output flag', () => {
    const opts = parseArgs([...base, '--output', 'report.md']);
    expect(opts.output).toBe('report.md');
  });

  test('parses -o short flag', () => {
    const opts = parseArgs([...base, '-o', './output/weekly.json']);
    expect(opts.output).toBe('./output/weekly.json');
  });

  // ── Help/version flags ─────────────────────────────────

  test('parses --help flag', () => {
    const opts = parseArgs([...base, '--help']);
    expect(opts.help).toBe(true);
  });

  test('parses -h short flag', () => {
    const opts = parseArgs([...base, '-h']);
    expect(opts.help).toBe(true);
  });

  test('parses --version flag', () => {
    const opts = parseArgs([...base, '--version']);
    expect(opts.version).toBe(true);
  });

  test('parses -v short flag', () => {
    const opts = parseArgs([...base, '-v']);
    expect(opts.version).toBe(true);
  });

  // ── Positional repo paths ──────────────────────────────

  test('treats a non-flag positional argument as a repo path', () => {
    const opts = parseArgs([...base, '/path/to/repo']);
    expect(opts.repos).toContain('/path/to/repo');
  });

  test('collects multiple positional repo paths', () => {
    const opts = parseArgs([...base, './frontend', './backend']);
    expect(opts.repos).toContain('./frontend');
    expect(opts.repos).toContain('./backend');
  });

  // ── --repos flag ───────────────────────────────────────

  test('parses --repos flag with multiple paths', () => {
    const opts = parseArgs([...base, '--repos', './frontend', './backend', './api']);
    expect(opts.repos).toContain('./frontend');
    expect(opts.repos).toContain('./backend');
    expect(opts.repos).toContain('./api');
  });

  test('parses -r short flag for repos', () => {
    const opts = parseArgs([...base, '-r', './one', './two']);
    expect(opts.repos).toContain('./one');
    expect(opts.repos).toContain('./two');
  });

  // ── Combined flags ─────────────────────────────────────

  test('parses multiple flags together', () => {
    const opts = parseArgs([
      ...base,
      '--days', '14',
      '--format', 'json',
      '--author', 'bob',
      '--output', 'out.json'
    ]);
    expect(opts.days).toBe(14);
    expect(opts.format).toBe('json');
    expect(opts.author).toBe('bob');
    expect(opts.output).toBe('out.json');
  });

  test('combines positional repo with other flags', () => {
    const opts = parseArgs([...base, '/some/repo', '--days', '30', '--format', 'markdown']);
    expect(opts.repos).toContain('/some/repo');
    expect(opts.days).toBe(30);
    expect(opts.format).toBe('markdown');
  });

  test('--repos flag stops collecting at next flag', () => {
    const opts = parseArgs([...base, '--repos', './a', './b', '--days', '7']);
    expect(opts.repos).toContain('./a');
    expect(opts.repos).toContain('./b');
    expect(opts.days).toBe(7);
  });
});
