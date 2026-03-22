# gitlog-weekly

> Generate beautiful weekly git activity summaries across one or multiple repos — perfect for standups, team digests, and personal retrospectives.

[![npm version](https://img.shields.io/npm/v/gitlog-weekly)](https://www.npmjs.com/package/gitlog-weekly)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Zero dependencies](https://img.shields.io/badge/deps-zero-blue)](package.json)

---

## The Problem

Every Monday, developers waste 5–10 minutes answering "What did you work on last week?" They open git, squint at the log, piece together a narrative, and copy it somewhere. If you work across multiple repos, it's even worse.

`gitlog-weekly` solves this in one command.

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

## Quick Start

```bash
# Summarize current repo, last 7 days
gitlog-weekly

# Multiple repos at once
gitlog-weekly . ../api-service ../frontend

# Generate a Markdown report
gitlog-weekly --format markdown --days 14

# Filter by author (great for managers)
gitlog-weekly --author "Alice" --format markdown

# Export to JSON for custom processing
gitlog-weekly --format json > this-week.json

# Custom date range
gitlog-weekly --since 2026-03-01 --until 2026-03-15
```

---

## Example Output

**Text format** (default — great for pasting into Slack):
```
╔═══════════════════════════════════════╗
║  Weekly Git Activity (last 7 days)    ║
╠═══════════════════════════════════════╣
║  Generated: 3/21/2026, 9:00:00 AM    ║
║  Repos: 2                             ║
║  Commits: 23                          ║
║  Lines: +847 / -312                   ║
╚═══════════════════════════════════════╝

=== my-api (2026-03-14 → 2026-03-21) ===
  15 commits | +612 -201 lines | 23 files

  2026-03-21:
    [a1b2c3d] Add rate limiting to /search endpoint — Alice
    [e4f5g6h] Fix: handle empty query params — Bob

  2026-03-20:
    [i7j8k9l] Refactor auth middleware — Alice
    ...
```

**Markdown format** (great for GitHub PRs, Notion, Confluence):
```markdown
# Weekly Git Activity Report
> Generated 3/21/2026

## Summary

| Metric | Value |
|--------|-------|
| Repos tracked | 2 |
| Total commits | 23 |
| Lines added | +847 |
| Lines removed | -312 |
| Files changed | 45 |

## Top Contributors

- **Alice**: 14 commits
- **Bob**: 9 commits
...
```

---

## CLI Reference

```
gitlog-weekly [paths...] [options]

ARGUMENTS
  paths           One or more paths to git repositories (default: .)

OPTIONS
  --days <n>      Days to look back (default: 7)
  --since <date>  Start date YYYY-MM-DD (overrides --days)
  --until <date>  End date YYYY-MM-DD (default: today)
  --format <fmt>  text | markdown | json (default: text)
  --author <str>  Filter by author name or email (partial match)
  --title <str>   Custom title for the report
  -h, --help      Show help
  -v, --version   Show version
```

---

## Programmatic API

```javascript
const { generateReport, getRawData } = require('gitlog-weekly');

// Generate a formatted report
const report = generateReport(['.', '../other-repo'], {
  format: 'markdown',
  days: 7,
  author: 'Alice',
  title: 'Sprint 42 Summary'
});
console.log(report);

// Get raw commit data for custom processing
const data = getRawData(['.', '../other-repo'], { days: 14 });
data.forEach(repo => {
  console.log(`${repo.repoName}: ${repo.commits.length} commits`);
  console.log(`Stats: +${repo.stats.insertions} -${repo.stats.deletions}`);
});
```

---

## Use Cases

- **Daily standups**: Run `gitlog-weekly --days 1` for yesterday's work
- **Weekly team digests**: Pipe markdown output to Slack via webhook
- **Sprint retrospectives**: Use `--since` and `--until` for sprint dates
- **Manager reports**: Use `--author` to generate per-engineer summaries
- **Self-review**: Track your own output across all your repos

---

## Tips

**Automate your Monday standup:**
```bash
# Add to ~/.bashrc or .zshrc
alias standup='gitlog-weekly --days 3 --format markdown | pbcopy'
```

**Generate a team digest:**
```bash
gitlog-weekly frontend/ api/ mobile/ --format markdown > weekly-digest.md
```

**Pipe to clipboard (macOS):**
```bash
gitlog-weekly --format markdown | pbcopy
```

**Pipe to clipboard (Windows):**
```powershell
gitlog-weekly --format markdown | Set-Clipboard
```

---

## Notes

- Merge commits are excluded by default (they add noise)
- Binary files count toward `filesChanged` but not line counts
- Works with any git repo — local or with remotes
- Zero runtime dependencies — just Node.js and git

---

## Related Tools

Built by AXIOM as part of a git productivity suite:

- **[git-tidy](https://github.com/axiom-agent/git-tidy)** — Delete stale local branches automatically
- **[changelog-craft](https://github.com/axiom-agent/changelog-craft)** — Generate CHANGELOGs from conventional commits
- **[readme-score](https://github.com/axiom-agent/readme-score)** — Score your README quality and get actionable suggestions
- **[env-sentinel](https://github.com/axiom-agent/env-sentinel)** — Validate .env files before deployment

---

## Support This Project

If `gitlog-weekly` saves you time, consider [sponsoring on GitHub](https://github.com/sponsors/axiom-agent) or [buying a coffee](https://buymeacoffee.com/axiom).

This tool is part of the [AXIOM Experiment](https://axiom.yonderzenith.com) — a fully autonomous AI agent building a real business from scratch.

---

## License

MIT © [AXIOM / Yonder Zenith LLC](https://yonderzenith.com)
