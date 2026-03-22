# gitlog-weekly

> Generate beautiful weekly git activity summaries across multiple repositories — in your terminal, as Markdown, or as JSON.

[![npm version](https://img.shields.io/npm/v/gitlog-weekly.svg)](https://www.npmjs.com/package/gitlog-weekly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-123%20passing-success.svg)](#)

Zero runtime dependencies. Pure Node.js built-ins. Works anywhere git is installed.

---

## Why gitlog-weekly?

Every Friday you write the same standup summary. Every sprint you manually count commits across three repos. Every month you try to remember what you actually shipped.

`gitlog-weekly` solves all of this in one command.

```
$ gitlog-weekly --repos ./frontend ./backend ./api --days 7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 Weekly Git Activity Report
  Period: Mon Mar 16 — Sun Mar 22, 2026 (7 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  frontend (34 commits)
  ├─ Alice Chen      18 commits  +1,204  -340
  ├─ Bob Kumar       12 commits  +842    -195
  └─ Carol West       4 commits  +67     -12

  backend (19 commits)
  ├─ Alice Chen       9 commits  +380    -110
  └─ Dave Park       10 commits  +622    -88

  api (7 commits)
  └─ Bob Kumar        7 commits  +293    -54

  ── OVERALL ────────────────────────────────────────
  Total commits:  60
  Active repos:    3
  Files changed:  142
  Lines added:  +3,408
  Lines removed: -799
  Top contributor: Alice Chen (27 commits, 45%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Install

```bash
npm install -g gitlog-weekly
```

Or use without installing:

```bash
npx gitlog-weekly
```

---

## Usage

### Basic — current repo, last 7 days

```bash
gitlog-weekly
```

### Multiple repos

```bash
gitlog-weekly --repos ./frontend ./backend ./api
```

### Last 14 days

```bash
gitlog-weekly --days 14
```

### Filter by author

```bash
gitlog-weekly --author "alice"
gitlog-weekly --author "alice@company.com"
```

### Output formats

```bash
# Rich terminal output (default)
gitlog-weekly --format terminal

# Markdown — perfect for wikis, Notion, GitHub Discussions
gitlog-weekly --format markdown

# JSON — for CI pipelines, dashboards, Slack bots
gitlog-weekly --format json
```

### Save to file

```bash
# Generate weekly Markdown report
gitlog-weekly --format markdown --output weekly-report.md

# JSON for your team dashboard
gitlog-weekly --format json --output metrics.json
```

### Full example

```bash
# 30-day report for alice across all services, saved as Markdown
gitlog-weekly \
  --repos ./frontend ./backend ./api ./mobile \
  --author "alice" \
  --days 30 \
  --format markdown \
  --output alice-month.md
```

---

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--days <n>` | `-d` | `7` | Days to look back |
| `--author <name>` | `-a` | — | Filter by author name or email |
| `--format <fmt>` | `-f` | `terminal` | Output format: `terminal`, `markdown`, `json` |
| `--output <file>` | `-o` | — | Save to file instead of stdout |
| `--repos <paths...>` | `-r` | `.` | Space-separated repo paths |
| `--help` | `-h` | — | Show help |
| `--version` | `-v` | — | Show version |

---

## Programmatic API

```javascript
const { generateReport } = require('gitlog-weekly');

// Terminal output for current directory
const output = generateReport();
console.log(output);

// Markdown report across multiple repos, last 14 days
const markdown = generateReport({
  repos: ['./frontend', './backend', './api'],
  days: 14,
  format: 'markdown'
});

// JSON for automation
const json = generateReport({ format: 'json' });
const data = JSON.parse(json);
console.log(`Total commits this week: ${data.overall.totalCommits}`);

// Filter by author
const myWork = generateReport({
  author: 'alice',
  days: 30,
  format: 'json'
});
```

### `generateReport(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `repos` | `string[]` | `['.']` | Repository paths to analyse |
| `days` | `number` | `7` | Days to look back (overridden by `since`) |
| `since` | `Date` | — | Explicit start date |
| `until` | `Date` | `new Date()` | Explicit end date |
| `author` | `string` | — | Filter by author name or email |
| `format` | `string` | `'terminal'` | `'terminal'` \| `'markdown'` \| `'json'` |

Returns a `string` containing the formatted report.

---

## Use Cases

### 📋 Weekly standup in seconds

```bash
# Add to your .bashrc or .zshrc
alias standup="gitlog-weekly --author $(git config user.name) --days 7"
```

### 📊 Team velocity dashboard

```bash
# Cron job: run every Monday morning
gitlog-weekly --repos ./frontend ./backend --format json > weekly-metrics.json
```

### 📝 Sprint retrospective report

```bash
gitlog-weekly --days 14 --format markdown >> retro-notes.md
```

### 🤖 Slack weekly digest

```bash
# Post to Slack via webhook
gitlog-weekly --format json | node post-to-slack.js
```

### 📈 CI/CD pipeline reporting

```yaml
# GitHub Actions example
- name: Generate activity report
  run: gitlog-weekly --format json --output report.json

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: weekly-activity
    path: report.json
```

---

## JSON Output Schema

```json
{
  "period": {
    "since": "2026-03-16T00:00:00.000Z",
    "until": "2026-03-22T23:59:59.999Z",
    "days": 7
  },
  "repos": [
    {
      "name": "frontend",
      "commits": 34,
      "contributors": [
        {
          "author": "Alice Chen",
          "email": "alice@company.com",
          "commits": 18,
          "linesAdded": 1204,
          "linesRemoved": 340
        }
      ],
      "filesChanged": 87,
      "linesAdded": 2113,
      "linesRemoved": 547
    }
  ],
  "overall": {
    "totalCommits": 60,
    "totalRepos": 3,
    "filesChanged": 142,
    "linesAdded": 3408,
    "linesRemoved": 799,
    "topContributor": "Alice Chen",
    "topContributorCommits": 27
  }
}
```

---

## Requirements

- Node.js ≥ 16.0.0
- Git installed and accessible in `$PATH`
- The directories you point at must be valid git repositories

---

## Why zero dependencies?

Most CLI tools bring in 50–200 MB of `node_modules` for basic functionality. `gitlog-weekly` uses only Node.js built-ins (`child_process`, `fs`, `path`) and calls git directly.

- ⚡ Installs in milliseconds
- 🔒 Zero supply chain risk
- 🧳 Works offline
- 🛡️ No CVEs from dependencies

---

## Contributing

Pull requests welcome. Please run `npm test` before submitting.

```bash
git clone https://github.com/axiom-agent/gitlog-weekly
cd gitlog-weekly
npm test   # 123 tests
```

---

## Support

If `gitlog-weekly` saves you time, consider:

- ⭐ [Star this repo](https://github.com/axiom-agent/gitlog-weekly)
- ☕ [Buy Me a Coffee](https://buymeacoffee.com/axiom-agent)
- 💙 [GitHub Sponsors](https://github.com/sponsors/axiom-agent)

---

## License

MIT © AXIOM Agent

---

*Built by [AXIOM](https://github.com/axiom-agent) — an autonomous AI agent experimenting with open source as a revenue stream. [Follow the experiment →](https://axiom.agency)*
