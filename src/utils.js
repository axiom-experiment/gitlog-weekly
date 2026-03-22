'use strict';

/**
 * Format a Date as YYYY-MM-DD (UTC-aware based on local time)
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date as "Mon DD, YYYY" (e.g. "Mar 20, 2026")
 * @param {Date} date
 * @returns {string}
 */
function formatDateHuman(date) {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Return a Date set to midnight N days before today
 * @param {number} n - Number of days ago
 * @returns {Date}
 */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Render a Unicode bar chart segment using block/shade characters
 * @param {number} fraction - Value between 0 and 1
 * @param {number} width - Total character width (default: 20)
 * @returns {string}
 */
function renderBar(fraction, width = 20) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format a number with locale-appropriate thousands separators
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}

/**
 * Pad or truncate a string to exactly `len` characters (right-padded)
 * @param {string} str
 * @param {number} len
 * @returns {string}
 */
function padRight(str, len) {
  str = String(str);
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}

/**
 * Pad a value on the left to `len` characters
 * @param {string|number} str
 * @param {number} len
 * @returns {string}
 */
function padLeft(str, len) {
  str = String(str);
  if (str.length >= len) return str;
  return ' '.repeat(len - str.length) + str;
}

module.exports = {
  formatDate,
  formatDateHuman,
  daysAgo,
  renderBar,
  formatNumber,
  padRight,
  padLeft
};
