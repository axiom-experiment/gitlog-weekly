'use strict';

/**
 * collector.js — Runs git commands and collects log data from one or more repos.
 */

const { execSync } = require('child_process');
const path = require('path');
const { getLogFormat, parseCommits, parseNumstat } = require('./parser');

/**
 * Get the ISO date string for N days ago at 00:00:00.
 * @param {number} daysAgo
 * @returns {string}
 */
function getDateSince(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Run a shell command and return stdout, or '' on failure.
 * @param {string} cmd
 * @param {string} cwd
 * @returns {string}
 */
function runSafe(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return '';
  }
}

/**
 * Check if a directory is a git repo.
 * @param {string} dir
 * @returns {boolean}
 */
function isGitRepo(dir) {
  const result = runSafe('git rev-parse --is-inside-work-tree', dir);
  return result.trim() === 'true';
}

/**
 * Get the remote origin URL for a repo (for display purposes).
 * @param {string} dir
 * @returns {string}
 */
function getRemoteUrl(dir) {
  return runSafe('git remote get-url origin', dir).trim() || 'local';
}

/**
 * Get the current branch name.
 * @param {string} dir
 * @returns {string}
 */
function getCurrentBranch(dir) {
  return runSafe('git rev-parse --abbrev-ref HEAD', dir).trim() || 'unknown';
}

/**
 * Collect commits from a single repo for a given period.
 * @param {string} repoPath - Absolute path to the git repo
 * @param {Object} opts
 * @param {string} opts.since - ISO date (YYYY-MM-DD), e.g. '2026-03-13'
 * @param {string} [opts.until] - ISO date (YYYY-MM-DD), defaults to today
 * @param {string} [opts.author] - Filter by author (partial name/email match)
 * @param {string} [opts.branch] - Branch to collect from, defaults to HEAD
 * @returns {{ repoPath, repoName, branch, remoteUrl, commits, stats }}
 */
function collectFromRepo(repoPath, opts = {}) {
  const absPath = path.resolve(repoPath);

  if (!isGitRepo(absPath)) {
    return {
      repoPath: absPath,
      repoName: path.basename(absPath),
      error: 'Not a git repository'
    };
  }

  const since = opts.since || getDateSince(7);
  const until = opts.until || new Date().toISOString().slice(0, 10);
  const branch = opts.branch || 'HEAD';
  const authorFilter = opts.author ? `--author="${opts.author}"` : '';

  // Build git log command
  const formatStr = getLogFormat();
  const logCmd = [
    'git', 'log', branch,
    `--since="${since}"`,
    `--until="${until} 23:59:59"`,
    `--format="${formatStr}"`,
    authorFilter,
    '--no-merges'
  ].filter(Boolean).join(' ');

  const rawLog = runSafe(logCmd, absPath);
  const commits = parseCommits(rawLog);

  // Get numstat for the period
  const numstatCmd = [
    'git', 'log', branch,
    `--since="${since}"`,
    `--until="${until} 23:59:59"`,
    '--numstat',
    '--format=""',
    authorFilter,
    '--no-merges'
  ].filter(Boolean).join(' ');

  const rawNumstat = runSafe(numstatCmd, absPath);
  const stats = parseNumstat(rawNumstat);

  return {
    repoPath: absPath,
    repoName: path.basename(absPath),
    branch: getCurrentBranch(absPath),
    remoteUrl: getRemoteUrl(absPath),
    since,
    until,
    commits,
    stats
  };
}

/**
 * Collect commits from multiple repos.
 * @param {string[]} repoPaths
 * @param {Object} opts - Same options as collectFromRepo
 * @returns {Array}
 */
function collectFromRepos(repoPaths, opts = {}) {
  return repoPaths.map(p => collectFromRepo(p, opts));
}

module.exports = { collectFromRepo, collectFromRepos, getDateSince };
