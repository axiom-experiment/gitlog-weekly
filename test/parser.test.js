'use strict';

const { parseCommits, parseNumstat } = require('../src/parser');

// ─── parseCommits ────────────────────────────────────────

describe('parseCommits', () => {
  test('returns empty array for empty string', () => {
    expect(parseCommits('')).toEqual([]);
  });

  test('returns empty array for null/undefined', () => {
    expect(parseCommits(null)).toEqual([]);
    expect(parseCommits(undefined)).toEqual([]);
  });

  test('returns empty array for whitespace-only string', () => {
    expect(parseCommits('   \n  \n  ')).toEqual([]);
  });

  test('parses a single valid commit line', () => {
    const raw = 'abc123def456|Alice Smith|alice@example.com|1710892800|feat: add new feature';
    const commits = parseCommits(raw);

    expect(commits).toHaveLength(1);
    expect(commits[0].hash).toBe('abc123def456');
    expect(commits[0].authorName).toBe('Alice Smith');
    expect(commits[0].authorEmail).toBe('alice@example.com');
    expect(commits[0].timestamp).toBe(1710892800);
    expect(commits[0].subject).toBe('feat: add new feature');
    expect(commits[0].date).toBeInstanceOf(Date);
    expect(commits[0].date.getTime()).toBe(1710892800 * 1000);
  });

  test('parses multiple commit lines', () => {
    const raw = [
      'hash1|Alice|alice@ex.com|1710892800|first commit',
      'hash2|Bob|bob@ex.com|1710979200|second commit',
      'hash3|Alice|alice@ex.com|1711065600|third commit'
    ].join('\n');

    const commits = parseCommits(raw);
    expect(commits).toHaveLength(3);
    expect(commits[0].hash).toBe('hash1');
    expect(commits[1].authorName).toBe('Bob');
    expect(commits[2].hash).toBe('hash3');
  });

  test('handles subjects that contain pipe characters', () => {
    const raw = 'abc|Alice|alice@ex.com|1710892800|merge: branch|feature into|main';
    const commits = parseCommits(raw);
    expect(commits).toHaveLength(1);
    expect(commits[0].subject).toBe('merge: branch|feature into|main');
  });

  test('skips lines with fewer than 5 pipe-separated fields', () => {
    const raw = [
      'valid|Alice|alice@ex.com|1710892800|commit message',
      'this line has no pipes',
      'onlyone|field',
      'another|valid|bob@ex.com|1710979200|second valid'
    ].join('\n');

    const commits = parseCommits(raw);
    expect(commits).toHaveLength(2);
    expect(commits[0].subject).toBe('commit message');
    expect(commits[1].authorName).toBe('valid');
  });

  test('skips lines with non-numeric timestamps', () => {
    const raw = [
      'hash1|Alice|alice@ex.com|notanumber|commit',
      'hash2|Bob|bob@ex.com|1710979200|valid'
    ].join('\n');

    const commits = parseCommits(raw);
    expect(commits).toHaveLength(1);
    expect(commits[0].hash).toBe('hash2');
  });

  test('handles trailing newlines gracefully', () => {
    const raw = 'hash1|Alice|alice@ex.com|1710892800|commit\n\n\n';
    const commits = parseCommits(raw);
    expect(commits).toHaveLength(1);
  });

  test('trims whitespace from individual lines', () => {
    const raw = '   hash1|Alice|alice@ex.com|1710892800|commit   ';
    const commits = parseCommits(raw);
    expect(commits).toHaveLength(1);
  });

  test('each commit has a valid Date object', () => {
    const raw = 'abc|Alice|alice@ex.com|1710892800|commit';
    const commits = parseCommits(raw);
    expect(commits[0].date).toBeInstanceOf(Date);
    expect(isNaN(commits[0].date.getTime())).toBe(false);
  });
});

// ─── parseNumstat ────────────────────────────────────────

describe('parseNumstat', () => {
  test('returns an empty Map for empty input', () => {
    const result = parseNumstat('');
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  test('returns an empty Map for null/undefined', () => {
    expect(parseNumstat(null).size).toBe(0);
    expect(parseNumstat(undefined).size).toBe(0);
  });

  test('parses a single commit with one file', () => {
    const raw = [
      '---COMMIT:abc123---',
      '',
      '5\t3\tsrc/index.js',
      ''
    ].join('\n');

    const result = parseNumstat(raw);
    expect(result.size).toBe(1);

    const stats = result.get('abc123');
    expect(stats).toBeDefined();
    expect(stats.added).toBe(5);
    expect(stats.deleted).toBe(3);
    expect(stats.files).toHaveLength(1);
    expect(stats.files[0]).toEqual({ file: 'src/index.js', added: 5, deleted: 3 });
  });

  test('parses a single commit with multiple files', () => {
    const raw = [
      '---COMMIT:abc123---',
      '',
      '5\t3\tsrc/index.js',
      '2\t0\tREADME.md',
      '10\t8\tsrc/utils.js',
      ''
    ].join('\n');

    const result = parseNumstat(raw);
    const stats = result.get('abc123');
    expect(stats.files).toHaveLength(3);
    expect(stats.added).toBe(17);    // 5+2+10
    expect(stats.deleted).toBe(11);  // 3+0+8
  });

  test('parses multiple commits', () => {
    const raw = [
      '---COMMIT:hash1---',
      '3\t1\tsrc/a.js',
      '---COMMIT:hash2---',
      '10\t5\tsrc/b.js',
      '2\t2\tsrc/c.js'
    ].join('\n');

    const result = parseNumstat(raw);
    expect(result.size).toBe(2);

    const s1 = result.get('hash1');
    expect(s1.added).toBe(3);
    expect(s1.deleted).toBe(1);
    expect(s1.files).toHaveLength(1);

    const s2 = result.get('hash2');
    expect(s2.added).toBe(12);
    expect(s2.deleted).toBe(7);
    expect(s2.files).toHaveLength(2);
  });

  test('handles binary files marked with dashes', () => {
    const raw = [
      '---COMMIT:abc---',
      '-\t-\timage.png',
      '3\t1\tsrc/file.js'
    ].join('\n');

    const result = parseNumstat(raw);
    const stats = result.get('abc');

    expect(stats.added).toBe(3);     // binary contributes 0
    expect(stats.deleted).toBe(1);
    expect(stats.files).toHaveLength(2);
    expect(stats.files[0]).toEqual({ file: 'image.png', added: 0, deleted: 0 });
    expect(stats.files[1]).toEqual({ file: 'src/file.js', added: 3, deleted: 1 });
  });

  test('handles files with spaces in their names', () => {
    const raw = [
      '---COMMIT:abc---',
      '5\t2\tsrc/my component.jsx'
    ].join('\n');

    const result = parseNumstat(raw);
    const stats = result.get('abc');
    expect(stats.files[0].file).toBe('src/my component.jsx');
  });

  test('initializes empty stats for commits with no file changes', () => {
    const raw = '---COMMIT:emptycommit---\n';
    const result = parseNumstat(raw);
    const stats = result.get('emptycommit');
    expect(stats).toBeDefined();
    expect(stats.added).toBe(0);
    expect(stats.deleted).toBe(0);
    expect(stats.files).toHaveLength(0);
  });
});
