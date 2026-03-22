'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseCommits, parseNumstat, groupByAuthor, groupByDate } = require('../src/parser');

describe('parseCommits', () => {
  it('returns empty array for empty input', () => {
    assert.deepEqual(parseCommits(''), []);
    assert.deepEqual(parseCommits(null), []);
    assert.deepEqual(parseCommits('   '), []);
  });

  it('parses a single commit correctly', () => {
    const raw = `---COMMIT---
abc1234567890abcdef|||Alice Smith|||alice@example.com|||2026-03-18T10:00:00Z|||Fix login bug`;
    const result = parseCommits(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].hash, 'abc1234567890abcdef');
    assert.equal(result[0].author, 'Alice Smith');
    assert.equal(result[0].email, 'alice@example.com');
    assert.equal(result[0].subject, 'Fix login bug');
    assert.ok(result[0].date instanceof Date);
    assert.ok(!isNaN(result[0].date.getTime()));
  });

  it('parses multiple commits', () => {
    const raw = `---COMMIT---
aaa000|||Alice|||a@test.com|||2026-03-18T10:00:00Z|||Commit A
---COMMIT---
bbb111|||Bob|||b@test.com|||2026-03-17T09:00:00Z|||Commit B`;
    const result = parseCommits(raw);
    assert.equal(result.length, 2);
    assert.equal(result[0].subject, 'Commit A');
    assert.equal(result[1].subject, 'Commit B');
  });

  it('skips commits with invalid dates', () => {
    const raw = `---COMMIT---
aaa000|||Alice|||a@test.com|||INVALID_DATE|||Subject`;
    const result = parseCommits(raw);
    assert.equal(result.length, 0);
  });

  it('skips lines with insufficient fields', () => {
    const raw = `---COMMIT---
onlytwofields|||here`;
    const result = parseCommits(raw);
    assert.equal(result.length, 0);
  });

  it('handles subjects containing the field separator', () => {
    const raw = `---COMMIT---
abc123|||Dev|||d@x.com|||2026-03-18T10:00:00Z|||Fix: handle ||| in subjects`;
    const result = parseCommits(raw);
    assert.equal(result.length, 1);
    assert.ok(result[0].subject.includes('|||'));
  });

  it('trims whitespace from all fields', () => {
    const raw = `---COMMIT---
  abc123  |||  Alice  |||  a@x.com  |||  2026-03-18T10:00:00Z  |||  My Subject  `;
    const result = parseCommits(raw);
    assert.equal(result[0].hash, 'abc123');
    assert.equal(result[0].author, 'Alice');
    assert.equal(result[0].subject, 'My Subject');
  });
});

describe('parseNumstat', () => {
  it('returns zero stats for empty input', () => {
    assert.deepEqual(parseNumstat(''), { filesChanged: 0, insertions: 0, deletions: 0 });
    assert.deepEqual(parseNumstat(null), { filesChanged: 0, insertions: 0, deletions: 0 });
  });

  it('parses a single file entry', () => {
    const raw = '10\t5\tsrc/index.js';
    const result = parseNumstat(raw);
    assert.equal(result.filesChanged, 1);
    assert.equal(result.insertions, 10);
    assert.equal(result.deletions, 5);
  });

  it('parses multiple file entries', () => {
    const raw = '10\t5\tsrc/a.js\n20\t3\tsrc/b.js\n1\t1\tsrc/c.js';
    const result = parseNumstat(raw);
    assert.equal(result.filesChanged, 3);
    assert.equal(result.insertions, 31);
    assert.equal(result.deletions, 9);
  });

  it('handles binary files (dashes) without crashing', () => {
    const raw = '-\t-\tbinary.png\n5\t2\tapp.js';
    const result = parseNumstat(raw);
    assert.equal(result.filesChanged, 2);
    assert.equal(result.insertions, 5);
    assert.equal(result.deletions, 2);
  });

  it('handles zero insertions/deletions', () => {
    const raw = '0\t0\tempty.txt';
    const result = parseNumstat(raw);
    assert.equal(result.filesChanged, 1);
    assert.equal(result.insertions, 0);
    assert.equal(result.deletions, 0);
  });

  it('skips lines with insufficient fields', () => {
    const raw = 'onlyone';
    const result = parseNumstat(raw);
    assert.deepEqual(result, { filesChanged: 0, insertions: 0, deletions: 0 });
  });

  it('handles large numbers correctly', () => {
    const raw = '10000\t5000\tbig-file.json';
    const result = parseNumstat(raw);
    assert.equal(result.insertions, 10000);
    assert.equal(result.deletions, 5000);
  });
});

describe('groupByAuthor', () => {
  it('returns empty map for empty array', () => {
    assert.equal(groupByAuthor([]).size, 0);
  });

  it('groups commits by author', () => {
    const commits = [
      { author: 'Alice', subject: 'A' },
      { author: 'Bob', subject: 'B' },
      { author: 'Alice', subject: 'C' }
    ];
    const result = groupByAuthor(commits);
    assert.equal(result.size, 2);
    assert.equal(result.get('Alice').length, 2);
    assert.equal(result.get('Bob').length, 1);
  });

  it('is case-sensitive for author names', () => {
    const commits = [
      { author: 'alice', subject: 'a' },
      { author: 'Alice', subject: 'A' }
    ];
    const result = groupByAuthor(commits);
    assert.equal(result.size, 2);
  });
});

describe('groupByDate', () => {
  it('returns empty map for empty array', () => {
    assert.equal(groupByDate([]).size, 0);
  });

  it('groups commits by YYYY-MM-DD date string', () => {
    const commits = [
      { date: new Date('2026-03-18T10:00:00Z'), subject: 'A' },
      { date: new Date('2026-03-18T14:00:00Z'), subject: 'B' },
      { date: new Date('2026-03-17T09:00:00Z'), subject: 'C' }
    ];
    const result = groupByDate(commits);
    assert.equal(result.size, 2);
    assert.equal(result.get('2026-03-18').length, 2);
    assert.equal(result.get('2026-03-17').length, 1);
  });
});
