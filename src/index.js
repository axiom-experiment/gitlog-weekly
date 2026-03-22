'use strict';

/**
 * gitlog-weekly — Public API
 *
 * Generates weekly git activity summaries across one or more repositories.
 * Zero runtime dependencies — uses Node.js built-ins only.
 *
 * @example
 * const { generateReport } = require('gitlog-weekly');
 *
 * // Terminal output for current directory
 * console.log(generateReport());
 *
 * // Markdown report across multiple repos for the last 14 days
 * const report = generateReport({
 *   repos: ['./frontend', './backend', './api'],
 *   days: 14,
 *   format: 'markdown'
 * });
 *
 * // JSON output filtered by author
 * const json = generateReport({ author: 'alice', format: 'json' });
 */

const path = require('path');
const { isGitRepo, getRepoName, getRawCommits, getRawNumstat } = require('./git');
const { parseCommits, parseNumstat } = require('./parser');
const { summarizeRepo, mergeSummaries } = require('./summarizer');
const { formatTerminal, formatMarkdown, formatJSON } = require('./formatter');
const { daysAgo } = require('./utils');

/**
 * Generate a git activity report for one or more repositories.
 *
 * @param {Object}   [options={}]
 * @param {string[]} [options.repos=['.']          ] - Repository paths to analyse
 * @param {number}   [options.days=7               ] - Days to look back (overridden by options.since)
 * @param {Date}     [options.since                ] - Explicit start date (overrides days)
 * @param {Date}     [options.until=new Date()     ] - Explicit end date
 * @param {string}   [options.author               ] - Filter commits by author name or email
 * @param {string}   [options.format='terminal'    ] - Output format: 'terminal' | 'markdown' | 'json'
 *
 * @returns {string} Formatted report
 *
 * @throws {Error} If a critical error occurs during git operations
 */
function generateReport(options = {}) {
  const repos = options.repos && options.repos.length > 0 ? options.repos : ['.'];
  const days = options.days || 7;
  const until = options.until instanceof Date ? options.until : new Date();
  const since = options.since instanceof Date ? options.since : daysAgo(days);
  const author = options.author || null;
  const format = options.format || 'terminal';

  const summaries = [];
  const skipped = [];

  for (const repoPath of repos) {
    const absPath = path.resolve(repoPath);

    if (!isGitRepo(absPath)) {
      skipped.push(absPath);
      continue;
    }

    const repoName = getRepoName(absPath);
    const rawCommits = getRawCommits(absPath, since, until, author);
    const rawNumstat = getRawNumstat(absPath, since, until, author);

    const commits = parseCommits(rawCommits);
    const numstatMap = parseNumstat(rawNumstat);
    const summary = summarizeRepo(repoName, commits, numstatMap);

    summaries.push(summary);
  }

  // If all paths were invalid, return a helpful error message
  if (summaries.length === 0 && skipped.length > 0) {
    const paths = skipped.map(p => `  • ${p}`).join('\n');
    throw new Error(`No valid git repositories found. Checked:\n${paths}`);
  }

  const overall = mergeSummaries(summaries);
  const formatOptions = { since, until, days };

  switch (format) {
    case 'json':
      return formatJSON(summaries, overall, formatOptions);
    case 'markdown':
      return formatMarkdown(summaries, overall, formatOptions);
    case 'terminal':
    default:
      return formatTerminal(summaries, overall, formatOptions);
  }
}

module.exports = { generateReport };
