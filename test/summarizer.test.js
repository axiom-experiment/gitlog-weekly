'use strict';

const { summarizeRepo, mergeSummaries } = require('../src/summarizer');

// ─── Test helpers ─────────────────────────────────────────

/**
 * Create a mock commit object.
 * daysOld controls the commit date relative to now.
 */
function makeCommit(hash, authorName, daysOld, subject = 'test commit') {
  const date = new Date(Date.now() - daysOld * 86400000);
  return {
    hash,
    authorName,
    authorEmail: `${authorName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    timestamp: Math.floor(date.getTime() / 1000),
    date,
    subject
  };
}

/**
 * Create a mock numstat entry.
 */
function makeStats(added, deleted, files = []) {
  return { added, deleted, files };
}

// ─── summarizeRepo ────────────────────────────────────────

describe('summarizeRepo', () => {
  test('returns zero-value summary for empty commits array', () => {
    const result = summarizeRepo('myrepo', [], new Map());

    expect(result.repoName).toBe('myrepo');
    expect(result.totalCommits).toBe(0);
    expect(result.authors).toEqual([]);
    expect(result.filesChanged).toBe(0);
    expect(result.insertions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.activeDays).toBe(0);
    expect(result.commitsByDay).toEqual({});
    expect(result.topFiles).toEqual([]);
    expect(result.firstCommit).toBeNull();
    expect(result.lastCommit).toBeNull();
  });

  test('returns zero-value summary for null commits', () => {
    const result = summarizeRepo('repo', null, new Map());
    expect(result.totalCommits).toBe(0);
  });

  test('counts total commits correctly', () => {
    const commits = [
      makeCommit('h1', 'Alice', 1),
      makeCommit('h2', 'Bob', 2),
      makeCommit('h3', 'Alice', 3)
    ];
    const result = summarizeRepo('repo', commits, new Map());
    expect(result.totalCommits).toBe(3);
  });

  test('counts unique authors and sorts by commit count', () => {
    const commits = [
      makeCommit('h1', 'Alice', 1),
      makeCommit('h2', 'Bob', 2),
      makeCommit('h3', 'Alice', 3),
      makeCommit('h4', 'Alice', 4)
    ];

    const result = summarizeRepo('repo', commits, new Map());
    expect(result.authors).toHaveLength(2);
    expect(result.authors[0].name).toBe('Alice');
    expect(result.authors[0].commits).toBe(3);
    expect(result.authors[1].name).toBe('Bob');
    expect(result.authors[1].commits).toBe(1);
  });

  test('counts active days (distinct calendar days)', () => {
    // Two commits on the same day should count as 1 active day
    const commits = [
      makeCommit('h1', 'Alice', 0),  // today
      makeCommit('h2', 'Bob', 0),    // also today
      makeCommit('h3', 'Alice', 2),  // 2 days ago
      makeCommit('h4', 'Alice', 5)   // 5 days ago
    ];

    const result = summarizeRepo('repo', commits, new Map());
    expect(result.activeDays).toBe(3); // today, 2 days ago, 5 days ago
  });

  test('builds commitsByDay map correctly', () => {
    const commits = [
      makeCommit('h1', 'Alice', 0),
      makeCommit('h2', 'Bob', 0),
      makeCommit('h3', 'Alice', 1)
    ];

    const result = summarizeRepo('repo', commits, new Map());
    const dayCounts = Object.values(result.commitsByDay);
    // Two different days
    expect(Object.keys(result.commitsByDay).length).toBe(2);
    // One day has 2 commits, one has 1
    expect(dayCounts.sort((a, b) => b - a)[0]).toBe(2);
    expect(dayCounts.sort((a, b) => b - a)[1]).toBe(1);
  });

  test('aggregates insertions and deletions from numstat', () => {
    const commits = [
      makeCommit('h1', 'Alice', 1),
      makeCommit('h2', 'Bob', 2)
    ];

    const numstatMap = new Map([
      ['h1', makeStats(50, 20, [{ file: 'src/a.js', added: 50, deleted: 20 }])],
      ['h2', makeStats(30, 10, [{ file: 'src/b.js', added: 30, deleted: 10 }])]
    ]);

    const result = summarizeRepo('repo', commits, numstatMap);
    expect(result.insertions).toBe(80);
    expect(result.deletions).toBe(30);
    expect(result.filesChanged).toBe(2);
  });

  test('counts 0 insertions/deletions when numstat is empty', () => {
    const commits = [makeCommit('h1', 'Alice', 1)];
    const result = summarizeRepo('repo', commits, new Map());
    expect(result.insertions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.filesChanged).toBe(0);
  });

  test('counts unique files changed (not total file appearances)', () => {
    const commits = [
      makeCommit('h1', 'Alice', 1),
      makeCommit('h2', 'Alice', 2)
    ];

    const numstatMap = new Map([
      ['h1', makeStats(10, 5, [
        { file: 'shared.js', added: 5, deleted: 2 },
        { file: 'only-h1.js', added: 5, deleted: 3 }
      ])],
      ['h2', makeStats(8, 3, [
        { file: 'shared.js', added: 8, deleted: 3 }  // same file again
      ])]
    ]);

    const result = summarizeRepo('repo', commits, numstatMap);
    expect(result.filesChanged).toBe(2);  // 2 unique files
  });

  test('ranks top files by number of commits touching them', () => {
    const commits = [
      makeCommit('h1', 'Alice', 1),
      makeCommit('h2', 'Alice', 2),
      makeCommit('h3', 'Bob', 3)
    ];

    const numstatMap = new Map([
      ['h1', makeStats(10, 5, [
        { file: 'hot.js', added: 5, deleted: 2 },
        { file: 'cold.js', added: 5, deleted: 3 }
      ])],
      ['h2', makeStats(8, 3, [
        { file: 'hot.js', added: 8, deleted: 3 }
      ])],
      ['h3', makeStats(20, 10, [
        { file: 'hot.js', added: 20, deleted: 10 }
      ])]
    ]);

    const result = summarizeRepo('repo', commits, numstatMap);
    expect(result.topFiles[0].file).toBe('hot.js');
    expect(result.topFiles[0].changes).toBe(3);  // touched in 3 commits
    expect(result.topFiles[1].file).toBe('cold.js');
    expect(result.topFiles[1].changes).toBe(1);
  });

  test('limits topFiles to 10 entries maximum', () => {
    const commits = [makeCommit('h1', 'Alice', 1)];
    const files = Array.from({ length: 15 }, (_, i) => ({
      file: `file${i}.js`,
      added: i,
      deleted: 0
    }));

    const numstatMap = new Map([
      ['h1', { added: 100, deleted: 0, files }]
    ]);

    const result = summarizeRepo('repo', commits, numstatMap);
    expect(result.topFiles.length).toBeLessThanOrEqual(10);
  });

  test('sets firstCommit and lastCommit correctly', () => {
    const commits = [
      makeCommit('newer', 'Alice', 1),   // 1 day old
      makeCommit('oldest', 'Bob', 5),    // 5 days old
      makeCommit('middle', 'Alice', 3)   // 3 days old
    ];

    const result = summarizeRepo('repo', commits, new Map());
    expect(result.firstCommit.hash).toBe('oldest');
    expect(result.lastCommit.hash).toBe('newer');
  });
});

// ─── mergeSummaries ───────────────────────────────────────

describe('mergeSummaries', () => {
  test('handles empty array', () => {
    const result = mergeSummaries([]);
    expect(result.totalCommits).toBe(0);
    expect(result.repos).toBe(0);
    expect(result.authors).toEqual([]);
  });

  test('handles single summary passthrough', () => {
    const summary = {
      totalCommits: 10,
      insertions: 100,
      deletions: 50,
      filesChanged: 15,
      activeDays: 5,
      commitsByDay: { '2026-03-14': 5, '2026-03-15': 5 },
      authors: [{ name: 'Alice', email: 'a@ex.com', commits: 10 }]
    };

    const result = mergeSummaries([summary]);
    expect(result.totalCommits).toBe(10);
    expect(result.totalInsertions).toBe(100);
    expect(result.totalDeletions).toBe(50);
    expect(result.repos).toBe(1);
    expect(result.authors[0].name).toBe('Alice');
  });

  test('sums commits, insertions, deletions across multiple repos', () => {
    const s1 = {
      totalCommits: 10,
      insertions: 100,
      deletions: 50,
      filesChanged: 15,
      activeDays: 5,
      commitsByDay: { '2026-03-14': 5, '2026-03-15': 5 },
      authors: [{ name: 'Alice', email: 'a@ex.com', commits: 10 }]
    };
    const s2 = {
      totalCommits: 5,
      insertions: 40,
      deletions: 20,
      filesChanged: 8,
      activeDays: 3,
      commitsByDay: { '2026-03-14': 3, '2026-03-16': 2 },
      authors: [
        { name: 'Bob', email: 'b@ex.com', commits: 3 },
        { name: 'Alice', email: 'a@ex.com', commits: 2 }
      ]
    };

    const result = mergeSummaries([s1, s2]);
    expect(result.totalCommits).toBe(15);
    expect(result.totalInsertions).toBe(140);
    expect(result.totalDeletions).toBe(70);
    expect(result.totalFilesChanged).toBe(23);
    expect(result.repos).toBe(2);
  });

  test('counts distinct active days across repos', () => {
    const s1 = {
      totalCommits: 5, insertions: 0, deletions: 0, filesChanged: 0,
      activeDays: 2,
      commitsByDay: { '2026-03-14': 3, '2026-03-15': 2 },
      authors: []
    };
    const s2 = {
      totalCommits: 3, insertions: 0, deletions: 0, filesChanged: 0,
      activeDays: 2,
      commitsByDay: { '2026-03-14': 1, '2026-03-16': 2 },  // 2026-03-14 shared
      authors: []
    };

    const result = mergeSummaries([s1, s2]);
    // Distinct days: 2026-03-14, 2026-03-15, 2026-03-16 = 3
    expect(result.activeDays).toBe(3);
  });

  test('merges same author across repos and sums their commits', () => {
    const s1 = {
      totalCommits: 10, insertions: 0, deletions: 0, filesChanged: 0,
      activeDays: 5, commitsByDay: {},
      authors: [{ name: 'Alice', email: 'a@ex.com', commits: 10 }]
    };
    const s2 = {
      totalCommits: 5, insertions: 0, deletions: 0, filesChanged: 0,
      activeDays: 3, commitsByDay: {},
      authors: [
        { name: 'Bob', email: 'b@ex.com', commits: 3 },
        { name: 'Alice', email: 'a@ex.com', commits: 2 }
      ]
    };

    const result = mergeSummaries([s1, s2]);
    const alice = result.authors.find(a => a.name === 'Alice');
    const bob = result.authors.find(a => a.name === 'Bob');

    expect(alice.commits).toBe(12); // 10 + 2
    expect(bob.commits).toBe(3);
  });

  test('sorts merged authors by commit count descending', () => {
    const s1 = {
      totalCommits: 3, insertions: 0, deletions: 0, filesChanged: 0,
      activeDays: 1, commitsByDay: {},
      authors: [{ name: 'Charlie', email: 'c@ex.com', commits: 3 }]
    };
    const s2 = {
      totalCommits: 10, insertions: 0, deletions: 0, filesChanged: 0,
      activeDays: 2, commitsByDay: {},
      authors: [{ name: 'Alice', email: 'a@ex.com', commits: 10 }]
    };

    const result = mergeSummaries([s1, s2]);
    expect(result.authors[0].name).toBe('Alice');   // 10 commits
    expect(result.authors[1].name).toBe('Charlie'); // 3 commits
  });
});
