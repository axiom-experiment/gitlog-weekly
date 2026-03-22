'use strict';

const { formatDate } = require('./utils');

/**
 * Summarize commits and numstat data for a single repository.
 *
 * @param {string} repoName - Display name of the repository
 * @param {Array} commits - Parsed commit objects from parser.parseCommits()
 * @param {Map} numstatMap - Map<hash, stats> from parser.parseNumstat()
 * @returns {Object} Summary object with aggregated metrics
 */
function summarizeRepo(repoName, commits, numstatMap) {
  if (!commits || commits.length === 0) {
    return {
      repoName,
      totalCommits: 0,
      authors: [],
      filesChanged: 0,
      insertions: 0,
      deletions: 0,
      activeDays: 0,
      commitsByDay: {},
      topFiles: [],
      firstCommit: null,
      lastCommit: null
    };
  }

  // Aggregation accumulators
  const authorsMap = new Map();   // name -> { name, email, commits }
  const daysSet = new Set();      // Set<"YYYY-MM-DD">
  const filesMap = new Map();     // filename -> { file, changes, added, deleted }
  const commitsByDay = {};        // "YYYY-MM-DD" -> count

  let totalInsertions = 0;
  let totalDeletions = 0;

  for (const commit of commits) {
    // --- Author aggregation ---
    const authorKey = commit.authorName;
    if (!authorsMap.has(authorKey)) {
      authorsMap.set(authorKey, {
        name: authorKey,
        email: commit.authorEmail,
        commits: 0
      });
    }
    authorsMap.get(authorKey).commits++;

    // --- Day aggregation ---
    const day = formatDate(commit.date);
    daysSet.add(day);
    commitsByDay[day] = (commitsByDay[day] || 0) + 1;

    // --- File stats from numstat ---
    const stats = numstatMap.get(commit.hash);
    if (stats) {
      totalInsertions += stats.added;
      totalDeletions += stats.deleted;

      for (const fileChange of stats.files) {
        if (!filesMap.has(fileChange.file)) {
          filesMap.set(fileChange.file, {
            file: fileChange.file,
            changes: 0,
            added: 0,
            deleted: 0
          });
        }
        const f = filesMap.get(fileChange.file);
        f.changes++;        // count = number of commits that touched this file
        f.added += fileChange.added;
        f.deleted += fileChange.deleted;
      }
    }
  }

  // Sort authors by commit count descending
  const authors = Array.from(authorsMap.values())
    .sort((a, b) => b.commits - a.commits);

  // Top 10 files by number of commits that touched them
  const topFiles = Array.from(filesMap.values())
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 10);

  // Sort commits by timestamp for first/last
  const sorted = [...commits].sort((a, b) => a.timestamp - b.timestamp);

  return {
    repoName,
    totalCommits: commits.length,
    authors,
    filesChanged: filesMap.size,
    insertions: totalInsertions,
    deletions: totalDeletions,
    activeDays: daysSet.size,
    commitsByDay,
    topFiles,
    firstCommit: sorted[0],
    lastCommit: sorted[sorted.length - 1]
  };
}

/**
 * Merge multiple per-repository summaries into a single overall summary.
 *
 * @param {Array} summaries - Array of repo summary objects from summarizeRepo()
 * @returns {Object} Merged overall summary
 */
function mergeSummaries(summaries) {
  const authorsMap = new Map();
  let totalCommits = 0;
  let totalInsertions = 0;
  let totalDeletions = 0;
  let totalFilesChanged = 0;
  const allDays = new Set();

  for (const summary of summaries) {
    totalCommits += summary.totalCommits;
    totalInsertions += summary.insertions;
    totalDeletions += summary.deletions;
    totalFilesChanged += summary.filesChanged;

    for (const day of Object.keys(summary.commitsByDay)) {
      allDays.add(day);
    }

    for (const author of summary.authors) {
      if (!authorsMap.has(author.name)) {
        authorsMap.set(author.name, {
          name: author.name,
          email: author.email,
          commits: 0
        });
      }
      authorsMap.get(author.name).commits += author.commits;
    }
  }

  return {
    totalCommits,
    totalInsertions,
    totalDeletions,
    totalFilesChanged,
    activeDays: allDays.size,
    authors: Array.from(authorsMap.values()).sort((a, b) => b.commits - a.commits),
    repos: summaries.length
  };
}

module.exports = { summarizeRepo, mergeSummaries };
