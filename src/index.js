// passgen — generate cryptographically random passwords or diceware-style
// passphrases. Reports entropy in bits and a cracking-time estimate.
// Zero runtime deps — uses node's crypto.randomBytes for unbiased sampling.

'use strict';

const crypto = require('crypto');
const { WORDLIST } = require('./wordlist');

const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS      = '0123456789';
const SYMBOLS     = '!@#$%^&*()-_=+[]{};:,.<>?';

function buildAlphabet(opts) {
  let a = ALPHA_LOWER;
  if (opts.upper !== false) a += ALPHA_UPPER;
  if (opts.numbers !== false) a += DIGITS;
  if (opts.symbols !== false) a += SYMBOLS;
  return a;
}

// Rejection sampling — produces unbiased indices in [0, modulus).
// We read 4 bytes (uint32) so the working range (2^32) is huge compared to
// any reasonable alphabet/wordlist; rejection nearly never fires.
// When modulus divides 2^32 evenly, every sample is valid (max == range).
function pickIndex(modulus) {
  if (modulus < 2) return 0;
  const range = 0x100000000;
  const remainder = range % modulus;
  const max = remainder === 0 ? range : range - remainder;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const b = crypto.randomBytes(4).readUInt32BE(0);
    if (b < max) return b % modulus;
  }
}

function generatePassword(length, opts) {
  opts = opts || {};
  if (!length || length < 4) length = 16;
  const alpha = buildAlphabet(opts);
  let out = '';
  for (let i = 0; i < length; i++) out += alpha.charAt(pickIndex(alpha.length));
  return out;
}

function generatePassphrase(words, opts) {
  opts = opts || {};
  if (!words || words < 3) words = 5;
  const sep = opts.separator || '-';
  const list = [];
  for (let i = 0; i < words; i++) list.push(WORDLIST[pickIndex(WORDLIST.length)]);
  if (opts.capitalize) for (let i = 0; i < list.length; i++) list[i] = list[i][0].toUpperCase() + list[i].slice(1);
  let out = list.join(sep);
  if (opts.numberSuffix) out += sep + pickIndex(10000);
  return out;
}

function entropyBits(password, opts) {
  opts = opts || {};
  if (opts.passphrase) {
    // Entropy = log2(wordlist_size) per word + log2(10000) per number suffix.
    const words = password.split(opts.separator || '-').filter(p => /[a-z]/i.test(p)).length;
    let bits = words * Math.log2(WORDLIST.length);
    if (opts.numberSuffix) bits += Math.log2(10000);
    return bits;
  }
  // Estimate alphabet size from observed character classes — gives a lower
  // bound that's correct as long as the user actually drew from those classes.
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += SYMBOLS.length;
  if (pool === 0) pool = 26;
  return password.length * Math.log2(pool);
}

function crackTimeEstimate(bits) {
  // Assume a well-funded attacker at 10^11 guesses/sec offline (modern GPU
  // farm against a fast hash). Real-world bcrypt would be far slower.
  const guessesPerSec = 1e11;
  const totalGuesses = Math.pow(2, bits);
  const seconds = totalGuesses / guessesPerSec / 2; // average half the keyspace
  if (seconds < 1) return 'instant';
  if (seconds < 60) return Math.round(seconds) + ' seconds';
  if (seconds < 3600) return Math.round(seconds / 60) + ' minutes';
  if (seconds < 86400) return Math.round(seconds / 3600) + ' hours';
  if (seconds < 31536000) return Math.round(seconds / 86400) + ' days';
  if (seconds < 31536000 * 1000) return Math.round(seconds / 31536000) + ' years';
  if (seconds < 31536000 * 1e6) return Math.round(seconds / 31536000 / 1000) + ' thousand years';
  if (seconds < 31536000 * 1e9) return Math.round(seconds / 31536000 / 1e6) + ' million years';
  if (seconds < 31536000 * 1e12) return Math.round(seconds / 31536000 / 1e9) + ' billion years';
  return 'effectively forever';
}

function strengthLabel(bits) {
  if (bits < 28) return 'weak';
  if (bits < 60) return 'reasonable';
  if (bits < 90) return 'strong';
  if (bits < 128) return 'very strong';
  return 'paranoid';
}

module.exports = {
  generatePassword,
  generatePassphrase,
  entropyBits,
  crackTimeEstimate,
  strengthLabel,
  WORDLIST_SIZE: WORDLIST.length,
};
