#!/usr/bin/env node
'use strict';

const {
  generatePassword, generatePassphrase, entropyBits,
  crackTimeEstimate, strengthLabel, WORDLIST_SIZE,
} = require('../src/index');

const HELP = `passgen — generate cryptographically random passwords + passphrases.

Usage:
  passgen                          one 16-char password (default)
  passgen --length 32              custom length
  passgen --count 5                generate N at once
  passgen --passphrase             diceware-style 5-word phrase
  passgen --passphrase --words 7   custom word count

Options:
  --length <n>            Password length in chars (default 16, min 4).
  --count  <n>            Generate N at once (default 1).
  --passphrase, -p        Generate a diceware-style passphrase.
  --words  <n>            Words in passphrase (default 5, min 3).
  --separator <s>         Passphrase separator (default "-").
  --capitalize            Capitalize each passphrase word.
  --number-suffix         Append a 4-digit number to the passphrase.
  --no-symbols            Exclude symbols from passwords.
  --no-numbers            Exclude digits from passwords.
  --no-upper              Exclude uppercase from passwords.
  --json                  JSON output with entropy + crack-time estimate.
  --bare                  Print just the password(s), no entropy report.
  -h, --help              Show this help.

Examples:
  passgen
  passgen --length 24 --count 3
  passgen --passphrase --words 6 --capitalize --number-suffix
  passgen --bare --count 10 > passwords.txt
  passgen --json | jq .password
`;

function parseArgs(argv) {
  const opts = {
    length: 16, count: 1, words: 5,
    upper: true, numbers: true, symbols: true,
    passphrase: false, separator: '-',
    capitalize: false, numberSuffix: false,
    json: false, bare: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { opts.help = true; continue; }
    if (a === '--length') { opts.length = parseInt(argv[++i], 10); continue; }
    if (a === '--count')  { opts.count = parseInt(argv[++i], 10); continue; }
    if (a === '--words')  { opts.words = parseInt(argv[++i], 10); continue; }
    if (a === '--separator') { opts.separator = argv[++i]; continue; }
    if (a === '-p' || a === '--passphrase') { opts.passphrase = true; continue; }
    if (a === '--capitalize') { opts.capitalize = true; continue; }
    if (a === '--number-suffix') { opts.numberSuffix = true; continue; }
    if (a === '--no-symbols') { opts.symbols = false; continue; }
    if (a === '--no-numbers') { opts.numbers = false; continue; }
    if (a === '--no-upper')   { opts.upper = false; continue; }
    if (a === '--json') { opts.json = true; continue; }
    if (a === '--bare') { opts.bare = true; continue; }
    console.error('unknown option: ' + a);
    process.exit(2);
  }
  return opts;
}

const isTTY = process.stdout.isTTY;
const C = {
  reset: isTTY ? '\x1b[0m' : '',
  dim:   isTTY ? '\x1b[2m' : '',
  bold:  isTTY ? '\x1b[1m' : '',
  grn:   isTTY ? '\x1b[32m' : '',
  yel:   isTTY ? '\x1b[33m' : '',
  red:   isTTY ? '\x1b[31m' : '',
};

function strengthColor(label) {
  if (label === 'weak') return C.red;
  if (label === 'reasonable') return C.yel;
  return C.grn;
}

function printOne(password, opts) {
  const bits = entropyBits(password, opts);
  const label = strengthLabel(bits);
  const crack = crackTimeEstimate(bits);
  if (opts.bare) {
    process.stdout.write(password + '\n');
    return { password, entropy_bits: bits, strength: label, crack_time: crack };
  }
  if (opts.json) return { password, entropy_bits: parseFloat(bits.toFixed(2)), strength: label, crack_time: crack };
  console.log(C.bold + password + C.reset);
  console.log('  ' + C.dim + 'entropy ' + C.reset + bits.toFixed(1) + ' bits  ' +
    strengthColor(label) + label + C.reset + C.dim +
    '  · cracking time ' + C.reset + crack);
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);
  if (opts.help) { process.stdout.write(HELP); process.exit(0); }
  if (!opts.count || opts.count < 1) opts.count = 1;
  if (opts.count > 1000) { console.error('count capped at 1000'); process.exit(2); }

  const results = [];
  for (let i = 0; i < opts.count; i++) {
    const pw = opts.passphrase
      ? generatePassphrase(opts.words, opts)
      : generatePassword(opts.length, opts);
    const r = printOne(pw, opts);
    if (r) results.push(r);
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify({
      count: opts.count,
      mode: opts.passphrase ? 'passphrase' : 'password',
      wordlist_size: WORDLIST_SIZE,
      results,
    }, null, 2) + '\n');
  }
}

main();
