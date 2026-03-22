'use strict';

const path = require('path');
const fs = require('fs');
const { generateReport } = require('./index');

/**
 * Parse command-line arguments into an options object.
 *
 * @param {string[]} argv - process.argv array
 * @returns {Object} Parsed options
 */
function parseArgs(argv) {
  const args = argv.slice(2);

  const options = {
    repos: [],
    days: 7,
    author: null,
    format: 'terminal',
    output: null,
    help: false,
    version: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;

      case '--version':
      case '-v':
        options.version = true;
        break;

      case '--days':
      case '-d':
        options.days = parseInt(args[++i], 10) || 7;
        break;

      case '--author':
      case '-a':
        options.author = args[++i];
        break;

      case '--format':
      case '-f':
        options.format = args[++i];
        break;

      case '--output':
      case '-o':
        options.output = args[++i];
        break;

      case '--repos':
      case '-r':
        // Collect all following non-flag arguments as repo paths
        while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options.repos.push(args[++i]);
        }
        break;

      default:
        // Positional argument — treat as a repo path
        if (!arg.startsWith('-')) {
          options.repos.push(arg);
        } else {
          process.stderr.write(`Warning: Unknown flag "${arg}" — ignored.\n`);
        }
    }

    i++;
  }

  // Default repo is current directory
  if (options.repos.length === 0) {
    options.repos = ['.'];
  }

  return options;
}

/**
 * Print usage/help information to stdout.
 */
function printHelp() {
  process.stdout.write(`
gitlog-weekly — Generate beautiful weekly git activity summaries

USAGE
  gitlog-weekly [repos...] [options]

ARGUMENTS
  repos                    One or more repository paths (default: current directory)

OPTIONS
  --days,    -d <n>        Number of days to look back (default: 7)
  --author,  -a <name>     Filter commits by author name or email
  --format,  -f <format>   Output format: terminal | markdown | json
                           (default: terminal)
  --output,  -o <file>     Save report to a file instead of printing to stdout
  --repos,   -r <paths...> Explicit list of repo paths (space-separated)
  --help,    -h            Show this help message
  --version, -v            Show version number

EXAMPLES
  # Summary of current repo, last 7 days
  gitlog-weekly

  # Last 14 days
  gitlog-weekly --days 14

  # Markdown report saved to file
  gitlog-weekly --format markdown --output weekly-report.md

  # Multiple repos
  gitlog-weekly --repos ./frontend ./backend ./api

  # Filter by author, last 30 days
  gitlog-weekly --author "alice" --days 30

  # JSON output for CI / dashboards
  gitlog-weekly --format json | jq '.overall.totalCommits'

  # Absolute path
  gitlog-weekly /path/to/repo --format terminal

`);
}

/**
 * Main CLI entry point. Parses argv, runs generateReport(), writes output.
 */
function run() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    try {
      const pkg = require('../package.json');
      process.stdout.write(`gitlog-weekly v${pkg.version}\n`);
    } catch {
      process.stdout.write('gitlog-weekly (version unknown)\n');
    }
    process.exit(0);
  }

  // Validate format
  const validFormats = ['terminal', 'markdown', 'json'];
  if (!validFormats.includes(options.format)) {
    process.stderr.write(`Error: Invalid format "${options.format}". Choose from: terminal, markdown, json\n`);
    process.exit(1);
  }

  try {
    const output = generateReport(options);

    if (options.output) {
      const outPath = path.resolve(options.output);
      fs.writeFileSync(outPath, output, 'utf8');
      process.stdout.write(`✅  Report saved to: ${outPath}\n`);
    } else {
      process.stdout.write(output);
    }
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}

module.exports = { parseArgs, run };
