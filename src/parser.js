'use strict';

/**
 * parser.js — Parses raw git log output into structured commit objects.
 */

const COMMIT_SEPARATOR = '---COMMIT---';
const FIELD_SEPARATOR = '|||';

/**
 * Build the git log format string used by collector.js
 * Format: hash|author|email|date_iso|subject
 */
function getLogFormat() {
  return `${COMMIT_SEPARATOR}%n%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%aI${FIELD_SEPARATOR}%s`;
}

/**
 * Parse raw git log output into an array of commit objects.
 * @param {string} raw - Raw stdout from git log
 * @returns {Array<{hash: string, author: string, email: string, date: Date, subject: string}>}
 */
function parseCommits(raw) {
  if (!raw || !raw.trim()) return [];

  const blocks = raw.split(COMMIT_SEPARATOR).filter(b => b.trim());
  const commits = [];

  for (const block of blocks) {
    const line = block.trim();
    if (!line) continue;

    const parts = line.split(FIELD_SEPARATOR);
    if (parts.length < 5) continue;

    const [hash, author, email, dateStr, ...subjectParts] = parts;
    const subject = subjectParts.join(FIELD_SEPARATOR).trim(); // restore any ||| in subject

    const date = new Date(dateStr.trim());
    if (isNaN(date.getTime())) continue;

    commits.push({
      hash: hash.trim(),
      author: author.trim(),
      email: email.trim(),
      date,
      subject: subject.trim()
    });
  }

  return commits;
}

/**
 * Parse git diff --shortstat or --numstat output into file change counts.
 * @param {string} raw - Raw numstat output (lines of: added\tdeleted\tfilepath)
 * @returns {{ filesChanged: number, insertions: number, deletions: number }}
 */
function parseNumstat(raw) {
  if (!raw || !raw.trim()) {
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  }

  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  const lines = raw.trim().split('\n');
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    // numstat uses '-' for binary files — treat as 0
    const added = /^\d+$/.test(parts[0]) ? parseInt(parts[0], 10) : 0;
    const deleted = /^\d+$/.test(parts[1]) ? parseInt(parts[1], 10) : 0;

    filesChanged++;
    insertions += added;
    deletions += deleted;
  }

  return { filesChanged, insertions, deletions };
}

/**
 * Group commits by author name.
 * @param {Array} commits
 * @returns {Map<string, Array>}
 */
function groupByAuthor(commits) {
  const map = new Map();
  for (const commit of commits) {
    const key = commit.author;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(commit);
  }
  return map;
}

/**
 * Group commits by date (YYYY-MM-DD).
 * @param {Array} commits
 * @returns {Map<string, Array>}
 */
function groupByDate(commits) {
  const map = new Map();
  for (const commit of commits) {
    const key = commit.date.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(commit);
  }
  return map;
}

module.exports = { getLogFormat, parseCommits, parseNumstat, groupByAuthor, groupByDate };
