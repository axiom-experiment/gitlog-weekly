'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { generateReport, getRawData } = require('../src/index');

// Use the current workspace as a test repo (it's a git repo)
const THIS_REPO = path.resolve(__dirname, '../../../../');

describe('generateReport', () => {
  it('returns a string for valid repo path', () => {
    const report = generateReport(THIS_REPO, { days: 30, format: 'text' });
    assert.ok(typeof report === 'string');
    assert.ok(report.length > 0);
  });

  it('accepts a single string path (not array)', () => {
    const report = generateReport(THIS_REPO, { format: 'text' });
    assert.ok(typeof report === 'string');
  });

  it('accepts an array of paths', () => {
    const report = generateReport([THIS_REPO], { format: 'text' });
    assert.ok(typeof report === 'string');
  });

  it('generates markdown output when format=markdown', () => {
    const report = generateReport(THIS_REPO, { format: 'markdown', days: 30 });
    assert.ok(report.includes('#'));
    assert.ok(report.includes('|'));
  });

  it('generates valid JSON when format=json', () => {
    const report = generateReport(THIS_REPO, { format: 'json', days: 30 });
    const parsed = JSON.parse(report);
    assert.ok(Array.isArray(parsed.results));
    assert.ok(parsed.generatedAt);
  });

  it('uses custom title in output', () => {
    const report = generateReport(THIS_REPO, { format: 'text', title: 'Sprint Recap', days: 30 });
    assert.ok(report.includes('Sprint Recap'));
  });

  it('handles non-existent path gracefully', () => {
    const report = generateReport('/path/that/does/not/exist/abc123', { format: 'text' });
    assert.ok(typeof report === 'string');
    assert.ok(report.includes('ERROR') || report.includes('does-not-exist') || report.includes('abc123'));
  });

  it('handles --since and --until date range', () => {
    const report = generateReport(THIS_REPO, {
      since: '2020-01-01',
      until: '2020-01-31',
      format: 'text'
    });
    assert.ok(typeof report === 'string');
  });
});

describe('getRawData', () => {
  it('returns an array', () => {
    const data = getRawData(THIS_REPO, { days: 30 });
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  it('each result has expected shape', () => {
    const data = getRawData(THIS_REPO, { days: 30 });
    const repo = data[0];
    assert.ok('repoName' in repo || 'error' in repo);
    if (!repo.error) {
      assert.ok(Array.isArray(repo.commits));
      assert.ok('stats' in repo);
      assert.ok('filesChanged' in repo.stats);
    }
  });

  it('accepts single string path', () => {
    const data = getRawData(THIS_REPO);
    assert.ok(Array.isArray(data));
  });

  it('includes repoName as basename of path', () => {
    const data = getRawData(THIS_REPO, { days: 30 });
    const repo = data[0];
    assert.ok(typeof repo.repoName === 'string');
    assert.ok(repo.repoName.length > 0);
  });
});
