'use strict';

/**
 * gitlog-weekly — Public API
 *
 * Programmatic usage:
 *   const { generateReport } = require('gitlog-weekly');
 *   const report = generateReport(['.', '../other-repo'], { format: 'markdown', days: 7 });
 *   console.log(report);
 */

const { collectFromRepos, getDateSince } = require('./collector');
const { buildReport } = require('./formatter');

/**
 * Generate a weekly git activity report for one or more repos.
 *
 * @param {string|string[]} repoPaths - One or more paths to git repos
 * @param {Object} [opts]
 * @param {number} [opts.days=7] - How many days back to look
 * @param {string} [opts.since] - Override: ISO date (YYYY-MM-DD)
 * @param {string} [opts.until] - Override: ISO date (YYYY-MM-DD)
 * @param {'text'|'markdown'|'json'} [opts.format='text'] - Output format
 * @param {string} [opts.author] - Filter by author name/email
 * @param {string} [opts.title] - Report title
 * @returns {string} - Formatted report
 */
function generateReport(repoPaths, opts = {}) {
  const paths = Array.isArray(repoPaths) ? repoPaths : [repoPaths];
  const days = opts.days || 7;
  const since = opts.since || getDateSince(days);
  const until = opts.until;
  const format = opts.format || 'text';
  const author = opts.author;
  const title = opts.title || `Weekly Git Activity (last ${days} days)`;

  const results = collectFromRepos(paths, { since, until, author });

  return buildReport(results, { format, title });
}

/**
 * Get raw commit data without formatting.
 *
 * @param {string|string[]} repoPaths
 * @param {Object} [opts]
 * @returns {Array} - Raw result objects from each repo
 */
function getRawData(repoPaths, opts = {}) {
  const paths = Array.isArray(repoPaths) ? repoPaths : [repoPaths];
  const days = opts.days || 7;
  const since = opts.since || getDateSince(days);
  const until = opts.until;
  const author = opts.author;

  return collectFromRepos(paths, { since, until, author });
}

module.exports = { generateReport, getRawData };
