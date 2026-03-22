'use strict';

const { execSync } = require('child_process');
const path = require('path');

/**
 * Check whether a directory is a git repository
 * @param {string} dir - Absolute path to directory
 * @returns {boolean}
 */
function isGitRepo(dir) {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the repository name from remote URL or directory basename
 * @param {string} dir - Absolute path to repository
 * @returns {string}
 */
function getRepoName(dir) {
  try {
    const remote = execSync('git remote get-url origin', {
      cwd: dir,
      stdio: 'pipe'
    }).toString().trim();
    // Extract repo name from URL patterns:
    //   https://github.com/user/repo.git  ->  repo
    //   git@github.com:user/repo.git      ->  repo
    const match = remote.match(/\/([^/]+?)(\.git)?$/);
    if (match) return match[1];
  } catch {
    // No remote configured — fall back to directory name
  }
  return path.basename(path.resolve(dir));
}

/**
 * Retrieve raw commit log from a git repository in a date range.
 * Output format per line: "hash|authorName|authorEmail|unixTimestamp|subject"
 *
 * @param {string} dir - Repository path
 * @param {Date} since - Start of period (inclusive)
 * @param {Date} until - End of period (inclusive)
 * @param {string|null} author - Optional author filter (name or email substring)
 * @returns {string} Raw git log output
 */
function getRawCommits(dir, since, until, author) {
  const sinceStr = since.toISOString();
  const untilStr = until.toISOString();

  let cmd = `git log --format="%H|%an|%ae|%at|%s" --since="${sinceStr}" --until="${untilStr}"`;
  if (author) {
    cmd += ` --author="${author}"`;
  }

  try {
    return execSync(cmd, { cwd: dir, stdio: 'pipe' }).toString();
  } catch {
    return '';
  }
}

/**
 * Retrieve raw numstat data from a git repository in a date range.
 * Each commit is preceded by "---COMMIT:<hash>---" separator.
 *
 * @param {string} dir - Repository path
 * @param {Date} since - Start of period (inclusive)
 * @param {Date} until - End of period (inclusive)
 * @param {string|null} author - Optional author filter
 * @returns {string} Raw git log --numstat output
 */
function getRawNumstat(dir, since, until, author) {
  const sinceStr = since.toISOString();
  const untilStr = until.toISOString();

  let cmd = `git log --numstat --format="---COMMIT:%H---" --since="${sinceStr}" --until="${untilStr}"`;
  if (author) {
    cmd += ` --author="${author}"`;
  }

  try {
    return execSync(cmd, { cwd: dir, stdio: 'pipe' }).toString();
  } catch {
    return '';
  }
}

module.exports = {
  isGitRepo,
  getRepoName,
  getRawCommits,
  getRawNumstat
};
