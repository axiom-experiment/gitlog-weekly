'use strict';

/**
 * formatter.js — Formats collected git data into text, markdown, or JSON reports.
 */

const { groupByAuthor, groupByDate } = require('./parser');

/**
 * Format a date as a human-readable "Mon Mar 18" string.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format a repo result as plain-text standup format.
 * @param {Object} repoResult
 * @returns {string}
 */
function formatText(repoResult) {
  if (repoResult.error) {
    return `[${repoResult.repoName}] ERROR: ${repoResult.error}\n`;
  }

  const { repoName, since, until, commits, stats } = repoResult;
  const lines = [];

  lines.push(`=== ${repoName} (${since} → ${until}) ===`);

  if (commits.length === 0) {
    lines.push('  No commits in this period.');
    return lines.join('\n') + '\n';
  }

  lines.push(`  ${commits.length} commits | +${stats.insertions} -${stats.deletions} lines | ${stats.filesChanged} files`);
  lines.push('');

  const byDate = groupByDate(commits);
  const sortedDates = [...byDate.keys()].sort().reverse();

  for (const dateStr of sortedDates) {
    const dayCommits = byDate.get(dateStr);
    lines.push(`  ${dateStr}:`);
    for (const c of dayCommits) {
      lines.push(`    [${c.hash.slice(0, 7)}] ${c.subject} — ${c.author}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Format a repo result as Markdown.
 * @param {Object} repoResult
 * @returns {string}
 */
function formatMarkdown(repoResult) {
  if (repoResult.error) {
    return `### ❌ ${repoResult.repoName}\n\n> Error: ${repoResult.error}\n`;
  }

  const { repoName, since, until, commits, stats } = repoResult;
  const lines = [];

  lines.push(`### 📁 ${repoName}`);
  lines.push(`> ${since} → ${until}`);
  lines.push('');

  if (commits.length === 0) {
    lines.push('_No commits in this period._');
    return lines.join('\n') + '\n';
  }

  lines.push(`**${commits.length} commits** · \`+${stats.insertions}\` \`-${stats.deletions}\` · ${stats.filesChanged} files changed`);
  lines.push('');

  const byDate = groupByDate(commits);
  const sortedDates = [...byDate.keys()].sort().reverse();

  for (const dateStr of sortedDates) {
    const dayCommits = byDate.get(dateStr);
    const dateObj = new Date(dateStr + 'T12:00:00Z');
    lines.push(`#### ${formatDate(dateObj)}`);
    lines.push('');
    for (const c of dayCommits) {
      lines.push(`- [\`${c.hash.slice(0, 7)}\`] **${c.subject}** _(${c.author})_`);
    }
    lines.push('');
  }

  return lines.join('\n') + '\n';
}

/**
 * Build a full weekly summary report from multiple repo results.
 * @param {Array} results - Array of repoResult objects
 * @param {Object} opts
 * @param {'text'|'markdown'|'json'} opts.format
 * @param {string} [opts.title] - Optional report title
 * @returns {string}
 */
function buildReport(results, opts = {}) {
  const format = opts.format || 'text';
  const title = opts.title || 'Weekly Git Activity Report';

  if (format === 'json') {
    return JSON.stringify({ title, generatedAt: new Date().toISOString(), results }, null, 2);
  }

  const allCommits = results.flatMap(r => r.commits || []);
  const totalStats = results.reduce(
    (acc, r) => {
      if (r.stats) {
        acc.filesChanged += r.stats.filesChanged;
        acc.insertions += r.stats.insertions;
        acc.deletions += r.stats.deletions;
      }
      return acc;
    },
    { filesChanged: 0, insertions: 0, deletions: 0 }
  );

  if (format === 'markdown') {
    const lines = [];
    lines.push(`# ${title}`);
    lines.push(`> Generated ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push(`## Summary`);
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Repos tracked | ${results.length} |`);
    lines.push(`| Total commits | ${allCommits.length} |`);
    lines.push(`| Lines added | +${totalStats.insertions} |`);
    lines.push(`| Lines removed | -${totalStats.deletions} |`);
    lines.push(`| Files changed | ${totalStats.filesChanged} |`);
    lines.push('');

    // Top contributors
    const allAuthors = groupByAuthor(allCommits);
    if (allAuthors.size > 0) {
      lines.push('## Top Contributors');
      lines.push('');
      const sorted = [...allAuthors.entries()].sort((a, b) => b[1].length - a[1].length);
      for (const [author, commits] of sorted) {
        lines.push(`- **${author}**: ${commits.length} commits`);
      }
      lines.push('');
    }

    lines.push('## By Repository');
    lines.push('');
    for (const result of results) {
      lines.push(formatMarkdown(result));
    }

    return lines.join('\n');
  }

  // Default: text
  const lines = [];
  lines.push(`╔═══════════════════════════════════════╗`);
  lines.push(`║  ${title.slice(0, 37).padEnd(37)} ║`);
  lines.push(`╠═══════════════════════════════════════╣`);
  lines.push(`║  Generated: ${new Date().toLocaleString().slice(0, 26).padEnd(26)} ║`);
  lines.push(`║  Repos: ${String(results.length).padEnd(30)} ║`);
  lines.push(`║  Commits: ${String(allCommits.length).padEnd(28)} ║`);
  lines.push(`║  Lines: +${totalStats.insertions} / -${totalStats.deletions}`.padEnd(42) + '║');
  lines.push(`╚═══════════════════════════════════════╝`);
  lines.push('');

  for (const result of results) {
    lines.push(formatText(result));
  }

  return lines.join('\n');
}

module.exports = { formatText, formatMarkdown, buildReport, formatDate };
