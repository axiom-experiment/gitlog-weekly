#!/usr/bin/env node
'use strict';

/**
 * gitlog-weekly CLI
 * Usage: gitlog-weekly [paths...] [options]
 */

const { generateReport } = require('./index');

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
gitlog-weekly — Weekly git activity summaries for standups and retrospectives

USAGE
  gitlog-weekly [paths...] [options]

ARGUMENTS
  paths           One or more paths to git repositories (default: current directory)

OPTIONS
  --days <n>      Number of days to look back (default: 7)
  --since <date>  Start date in YYYY-MM-DD format
  --until <date>  End date in YYYY-MM-DD format (default: today)
  --format <fmt>  Output format: text | markdown | json (default: text)
  --author <str>  Filter by author name or email (partial match)
  --title <str>   Custom report title
  -h, --help      Show this help message
  -v, --version   Show version

EXAMPLES
  gitlog-weekly
  gitlog-weekly . ../other-repo
  gitlog-weekly --format markdown --days 14
  gitlog-weekly --author "Alice" --format json
  gitlog-weekly . --since 2026-03-01 --until 2026-03-15

NOTES
  - Merge commits are excluded by default
  - Binary file changes count toward filesChanged but not line counts
  - Use --format markdown to generate a report for Slack, Notion, or GitHub
`);
}

function showVersion() {
  const pkg = require('../package.json');
  console.log(pkg.version);
}

function parseArgs(args) {
  const opts = { paths: [], days: 7, format: 'text' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') { showHelp(); process.exit(0); }
    if (arg === '-v' || arg === '--version') { showVersion(); process.exit(0); }
    if (arg === '--days') { opts.days = parseInt(args[++i], 10) || 7; continue; }
    if (arg === '--since') { opts.since = args[++i]; continue; }
    if (arg === '--until') { opts.until = args[++i]; continue; }
    if (arg === '--format') { opts.format = args[++i]; continue; }
    if (arg === '--author') { opts.author = args[++i]; continue; }
    if (arg === '--title') { opts.title = args[++i]; continue; }
    if (!arg.startsWith('--')) { opts.paths.push(arg); continue; }
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }

  if (opts.paths.length === 0) opts.paths = ['.'];
  return opts;
}

const opts = parseArgs(args);

try {
  const report = generateReport(opts.paths, opts);
  process.stdout.write(report + '\n');
} catch (err) {
  console.error('Error generating report:', err.message);
  process.exit(1);
}
