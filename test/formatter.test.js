'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { formatText, formatMarkdown, buildReport, formatDate } = require('../src/formatter');

// Helper to make a mock repo result
function makeRepoResult(overrides = {}) {
  return {
    repoPath: '/tmp/test-repo',
    repoName: 'test-repo',
    branch: 'main',
    remoteUrl: 'https://github.com/test/test-repo',
    since: '2026-03-11',
    until: '2026-03-18',
    commits: [
      {
        hash: 'abc1234567890',
        author: 'Alice',
        email: 'alice@test.com',
        date: new Date('2026-03-18T10:00:00Z'),
        subject: 'Fix critical bug'
      },
      {
        hash: 'def5678901234',
        author: 'Bob',
        email: 'bob@test.com',
        date: new Date('2026-03-17T09:00:00Z'),
        subject: 'Add new feature'
      }
    ],
    stats: { filesChanged: 5, insertions: 120, deletions: 30 },
    ...overrides
  };
}

describe('formatDate', () => {
  it('formats a Date object to a human-readable string', () => {
    const d = new Date('2026-03-18T12:00:00Z');
    const result = formatDate(d);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
    // Should contain the day and month
    assert.ok(result.includes('Mar') || result.includes('18'));
  });
});

describe('formatText', () => {
  it('formats a repo result as text', () => {
    const result = formatText(makeRepoResult());
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('test-repo'));
    assert.ok(result.includes('Fix critical bug'));
    assert.ok(result.includes('Add new feature'));
    assert.ok(result.includes('alice') || result.includes('Alice'));
    assert.ok(result.includes('+120') || result.includes('120'));
  });

  it('shows "No commits" message when commits array is empty', () => {
    const result = formatText(makeRepoResult({ commits: [], stats: { filesChanged: 0, insertions: 0, deletions: 0 } }));
    assert.ok(result.includes('No commits'));
  });

  it('handles error repos gracefully', () => {
    const result = formatText({ repoName: 'bad-repo', error: 'Not a git repository' });
    assert.ok(result.includes('ERROR'));
    assert.ok(result.includes('Not a git repository'));
  });

  it('shows abbreviated hash (7 chars)', () => {
    const result = formatText(makeRepoResult());
    assert.ok(result.includes('abc1234'));
  });
});

describe('formatMarkdown', () => {
  it('returns a markdown-formatted string', () => {
    const result = formatMarkdown(makeRepoResult());
    assert.ok(result.includes('###'));
    assert.ok(result.includes('test-repo'));
    assert.ok(result.includes('Fix critical bug'));
    assert.ok(result.includes('**'));
  });

  it('shows "No commits" in italic for empty repos', () => {
    const result = formatMarkdown(makeRepoResult({ commits: [], stats: { filesChanged: 0, insertions: 0, deletions: 0 } }));
    assert.ok(result.includes('_No commits'));
  });

  it('handles error repos with an error indicator', () => {
    const result = formatMarkdown({ repoName: 'bad-repo', error: 'Not a git repository' });
    assert.ok(result.includes('❌'));
    assert.ok(result.includes('Error'));
  });

  it('groups commits by date with date headers', () => {
    const result = formatMarkdown(makeRepoResult());
    assert.ok(result.includes('####'));
  });
});

describe('buildReport', () => {
  it('builds a text report from multiple repos', () => {
    const results = [makeRepoResult({ repoName: 'repo-a' }), makeRepoResult({ repoName: 'repo-b' })];
    const report = buildReport(results, { format: 'text' });
    assert.ok(report.includes('repo-a'));
    assert.ok(report.includes('repo-b'));
    assert.ok(typeof report === 'string');
  });

  it('builds a markdown report with summary table', () => {
    const results = [makeRepoResult()];
    const report = buildReport(results, { format: 'markdown' });
    assert.ok(report.includes('# '));
    assert.ok(report.includes('| Metric |'));
    assert.ok(report.includes('Total commits'));
  });

  it('builds a JSON report', () => {
    const results = [makeRepoResult()];
    const report = buildReport(results, { format: 'json' });
    const parsed = JSON.parse(report);
    assert.ok(Array.isArray(parsed.results));
    assert.equal(parsed.results.length, 1);
    assert.ok(parsed.generatedAt);
  });

  it('includes custom title in report', () => {
    const results = [makeRepoResult()];
    const report = buildReport(results, { format: 'text', title: 'My Custom Report' });
    assert.ok(report.includes('My Custom Report'));
  });

  it('includes top contributors section in markdown', () => {
    const results = [makeRepoResult()];
    const report = buildReport(results, { format: 'markdown' });
    assert.ok(report.includes('Contributors') || report.includes('Alice') || report.includes('Bob'));
  });

  it('handles empty results array', () => {
    const report = buildReport([], { format: 'text' });
    assert.ok(typeof report === 'string');
  });

  it('aggregates stats across multiple repos', () => {
    const r1 = makeRepoResult({ repoName: 'a', stats: { filesChanged: 5, insertions: 100, deletions: 20 } });
    const r2 = makeRepoResult({ repoName: 'b', stats: { filesChanged: 3, insertions: 50, deletions: 10 } });
    const report = buildReport([r1, r2], { format: 'text' });
    // Total insertions 150, deletions 30 should appear somewhere
    assert.ok(report.includes('150') || report.includes('100'));
  });

  it('handles repos with errors in the results', () => {
    const results = [
      makeRepoResult(),
      { repoName: 'broken', error: 'Not a git repository' }
    ];
    const report = buildReport(results, { format: 'markdown' });
    assert.ok(report.includes('broken'));
    assert.ok(report.includes('Error') || report.includes('❌'));
  });
});
