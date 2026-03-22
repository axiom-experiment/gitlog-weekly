'use strict';

/**
 * Parse raw git log output (pipe-delimited format) into commit objects.
 *
 * Expected input line format:
 *   "hash|authorName|authorEmail|unixTimestamp|subject"
 *
 * Subjects may contain pipe characters — we split on the first 4 pipes only.
 *
 * @param {string} raw - Raw stdout from git log --format="%H|%an|%ae|%at|%s"
 * @returns {Array<{hash: string, authorName: string, authorEmail: string, timestamp: number, date: Date, subject: string}>}
 */
function parseCommits(raw) {
  if (!raw || !raw.trim()) return [];

  return raw
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Find the first 4 pipe positions to isolate the 5 fields
      // (subject can contain pipes — don't split on those)
      const parts = line.split('|');
      if (parts.length < 5) return null;

      const [hash, authorName, authorEmail, timestampStr, ...subjectParts] = parts;
      const timestamp = parseInt(timestampStr, 10);

      if (!hash || isNaN(timestamp)) return null;

      return {
        hash,
        authorName,
        authorEmail,
        timestamp,
        date: new Date(timestamp * 1000),
        subject: subjectParts.join('|')
      };
    })
    .filter(Boolean);
}

/**
 * Parse git log --numstat output into a per-commit file stats map.
 *
 * Expected input format (each commit block):
 *   ---COMMIT:<hash>---
 *   <blank line>
 *   <added>\t<deleted>\t<filename>   (repeated per file)
 *   <blank line>
 *
 * Binary files show "-\t-\t<filename>" — treated as 0 lines changed.
 *
 * @param {string} raw - Raw stdout from git log --numstat --format="---COMMIT:%H---"
 * @returns {Map<string, {added: number, deleted: number, files: Array<{file: string, added: number, deleted: number}>}>}
 */
function parseNumstat(raw) {
  if (!raw || !raw.trim()) return new Map();

  const result = new Map();
  let currentHash = null;
  let currentFiles = [];
  let totalAdded = 0;
  let totalDeleted = 0;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    // Commit separator line
    const commitMatch = trimmed.match(/^---COMMIT:([a-zA-Z0-9]+)---$/);
    if (commitMatch) {
      // Save previous commit's data
      if (currentHash) {
        result.set(currentHash, {
          added: totalAdded,
          deleted: totalDeleted,
          files: currentFiles
        });
      }
      currentHash = commitMatch[1];
      currentFiles = [];
      totalAdded = 0;
      totalDeleted = 0;
      continue;
    }

    // Numstat data line: "<added>\t<deleted>\t<filename>"
    // Binary files: "-\t-\t<filename>"
    const numstatMatch = trimmed.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (numstatMatch && currentHash) {
      const added = numstatMatch[1] === '-' ? 0 : parseInt(numstatMatch[1], 10);
      const deleted = numstatMatch[2] === '-' ? 0 : parseInt(numstatMatch[2], 10);
      const file = numstatMatch[3];

      currentFiles.push({ file, added, deleted });
      totalAdded += added;
      totalDeleted += deleted;
    }
  }

  // Save final commit
  if (currentHash) {
    result.set(currentHash, {
      added: totalAdded,
      deleted: totalDeleted,
      files: currentFiles
    });
  }

  return result;
}

module.exports = { parseCommits, parseNumstat };
