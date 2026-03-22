'use strict';

const { formatTerminal, formatMarkdown, formatJSON } = require('../src/formatter');

// ─── Shared test fixtures ─────────────────────────────────

const mockSummary = {
  repoName: 'my-project',
  totalCommits: 23,
  authors: [
    { name: 'Alice', email: 'alice@example.com', commits: 15 },
    { name: 'Bob', email: 'bob@example.com', commits: 8 }
  ],
  filesChanged: 42,
  insertions: 1200,
  deletions: 300,
  activeDays: 5,
  commitsByDay: {
    '2026-03-14': 5,
    '2026-03-15': 8,
    '2026-03-16': 3,
    '2026-03-17': 4,
    '2026-03-20': 3
  },
  topFiles: [
    { file: 'src/api/routes.js', changes: 8, added: 400, deleted: 100 },
    { file: 'src/components/App.tsx', changes: 6, added: 300, deleted: 80 }
  ],
  firstCommit: null,
  lastCommit: null
};

const mockOverall = {
  totalCommits: 23,
  totalInsertions: 1200,
  totalDeletions: 300,
  totalFilesChanged: 42,
  activeDays: 5,
  authors: [
    { name: 'Alice', commits: 15 },
    { name: 'Bob', commits: 8 }
  ],
  repos: 1
};

const mockOptions = {
  since: new Date('2026-03-14T00:00:00.000Z'),
  until: new Date('2026-03-20T23:59:59.000Z'),
  days: 7
};

// ─── formatTerminal ───────────────────────────────────────

describe('formatTerminal', () => {
  let result;

  beforeEach(() => {
    result = formatTerminal([mockSummary], mockOverall, mockOptions);
  });

  test('returns a non-empty string', () => {
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
  });

  test('includes a decorative header box', () => {
    expect(result).toContain('╔');
    expect(result).toContain('╗');
    expect(result).toContain('╚');
    expect(result).toContain('╝');
  });

  test('includes "WEEKLY GIT ACTIVITY SUMMARY" header text', () => {
    expect(result).toContain('WEEKLY GIT ACTIVITY SUMMARY');
  });

  test('includes the repository name', () => {
    expect(result).toContain('my-project');
  });

  test('includes the commit count', () => {
    expect(result).toContain('23');
  });

  test('includes author names with bar charts', () => {
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  test('includes Unicode bar chart characters', () => {
    expect(result).toContain('█');
  });

  test('includes most active files', () => {
    expect(result).toContain('src/api/routes.js');
    expect(result).toContain('src/components/App.tsx');
  });

  test('includes daily activity section', () => {
    expect(result).toContain('2026-03-14');
    expect(result).toContain('2026-03-15');
  });

  test('handles repo with zero commits gracefully', () => {
    const emptySummary = {
      ...mockSummary,
      totalCommits: 0,
      authors: [],
      topFiles: [],
      commitsByDay: {}
    };
    const emptyOverall = { ...mockOverall, totalCommits: 0 };
    const output = formatTerminal([emptySummary], emptyOverall, mockOptions);
    expect(output).toContain('No commits');
  });

  test('does not show overall block for single repo', () => {
    // Overall block with "OVERALL (N repositories)" should only appear for multi-repo
    expect(result).not.toContain('OVERALL');
  });

  test('shows overall block for multiple repos', () => {
    const summary2 = { ...mockSummary, repoName: 'repo-two' };
    const multiOverall = { ...mockOverall, repos: 2 };
    const multiResult = formatTerminal([mockSummary, summary2], multiOverall, mockOptions);
    expect(multiResult).toContain('OVERALL');
    expect(multiResult).toContain('2 repositories');
  });

  test('includes footer attribution', () => {
    expect(result).toContain('gitlog-weekly');
  });
});

// ─── formatMarkdown ───────────────────────────────────────

describe('formatMarkdown', () => {
  let result;

  beforeEach(() => {
    result = formatMarkdown([mockSummary], mockOverall, mockOptions);
  });

  test('starts with an H1 heading', () => {
    expect(result.trim()).toMatch(/^# Weekly Git Activity Summary/);
  });

  test('includes repo name as H2 section', () => {
    expect(result).toContain('## 📁 my-project');
  });

  test('includes a metrics table with correct columns', () => {
    expect(result).toContain('| Commits |');
    expect(result).toContain('| Authors |');
    expect(result).toContain('| Files Changed |');
    expect(result).toContain('| Insertions |');
    expect(result).toContain('| Deletions |');
  });

  test('includes contributors table', () => {
    expect(result).toContain('### Contributors');
    expect(result).toContain('| Alice |');
    expect(result).toContain('| Bob |');
  });

  test('includes top files table with correct columns', () => {
    expect(result).toContain('### Most Active Files');
    expect(result).toContain('| File | Changes | +Lines | -Lines |');
    expect(result).toContain('`src/api/routes.js`');
  });

  test('includes daily activity table', () => {
    expect(result).toContain('### Daily Activity');
    expect(result).toContain('| 2026-03-14 |');
  });

  test('includes link to npm package', () => {
    expect(result).toContain('gitlog-weekly');
  });

  test('includes the period dates', () => {
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
  });

  test('handles repo with zero commits gracefully', () => {
    const emptySummary = { ...mockSummary, totalCommits: 0, authors: [], topFiles: [], commitsByDay: {} };
    const output = formatMarkdown([emptySummary], mockOverall, mockOptions);
    expect(output).toContain('No commits');
  });

  test('shows overall section for multiple repos', () => {
    const summary2 = { ...mockSummary, repoName: 'repo-two' };
    const multiOverall = { ...mockOverall, repos: 2 };
    const output = formatMarkdown([mockSummary, summary2], multiOverall, mockOptions);
    expect(output).toContain('## Overall Statistics');
    expect(output).toContain('### All Contributors');
  });

  test('produces valid markdown table separator rows', () => {
    // Table separators must contain at least one hyphen
    const tableRows = result.split('\n').filter(l => l.match(/^\|[-:]+\|/));
    expect(tableRows.length).toBeGreaterThan(0);
  });
});

// ─── formatJSON ───────────────────────────────────────────

describe('formatJSON', () => {
  let parsed;
  let raw;

  beforeEach(() => {
    raw = formatJSON([mockSummary], mockOverall, mockOptions);
    parsed = JSON.parse(raw);
  });

  test('produces valid JSON that does not throw on parse', () => {
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test('contains required top-level keys', () => {
    expect(parsed).toHaveProperty('generated_at');
    expect(parsed).toHaveProperty('period');
    expect(parsed).toHaveProperty('overall');
    expect(parsed).toHaveProperty('repositories');
  });

  test('generated_at is a valid ISO timestamp', () => {
    expect(new Date(parsed.generated_at).getTime()).not.toBeNaN();
  });

  test('period.days matches options.days', () => {
    expect(parsed.period.days).toBe(7);
  });

  test('period.since and period.until are ISO strings', () => {
    expect(new Date(parsed.period.since).getTime()).not.toBeNaN();
    expect(new Date(parsed.period.until).getTime()).not.toBeNaN();
  });

  test('repositories array has the correct length', () => {
    expect(Array.isArray(parsed.repositories)).toBe(true);
    expect(parsed.repositories).toHaveLength(1);
  });

  test('repositories[0].repoName matches input', () => {
    expect(parsed.repositories[0].repoName).toBe('my-project');
  });

  test('overall contains expected fields', () => {
    expect(parsed.overall).toHaveProperty('totalCommits', 23);
    expect(parsed.overall).toHaveProperty('totalInsertions', 1200);
    expect(parsed.overall).toHaveProperty('totalDeletions', 300);
    expect(parsed.overall).toHaveProperty('repos', 1);
  });

  test('handles null since/until in options', () => {
    const noDateRaw = formatJSON([mockSummary], mockOverall, {});
    const noDateParsed = JSON.parse(noDateRaw);
    expect(noDateParsed.period.since).toBeNull();
    expect(noDateParsed.period.until).toBeNull();
  });

  test('is pretty-printed (indented)', () => {
    // Pretty JSON has newlines and indentation
    expect(raw).toContain('\n');
    expect(raw).toContain('  ');
  });
});
