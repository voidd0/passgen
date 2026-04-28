/* passgen — smoke tests. Run via: node test.js */
'use strict';

const {
  generatePassword, generatePassphrase, entropyBits,
  crackTimeEstimate, strengthLabel, WORDLIST_SIZE,
} = require('./src/index');

let passed = 0, failed = 0;
function eq(label, a, b) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log('  ok  ' + label); passed++; }
  else { console.log('  FAIL ' + label); console.log('     actual:   ' + JSON.stringify(a)); console.log('     expected: ' + JSON.stringify(b)); failed++; }
}
function truthy(label, v) { if (v) { console.log('  ok  ' + label); passed++; } else { console.log('  FAIL ' + label); failed++; } }

console.log('wordlist:');
eq('size 1024',                       WORDLIST_SIZE, 1024);

console.log('\ngeneratePassword:');
{
  const pw = generatePassword(16);
  eq('default length 16',             pw.length, 16);
  truthy('default has letters',       /[a-z]/.test(pw));
}
{
  const pw = generatePassword(32, { upper: false, symbols: false, numbers: true });
  eq('length 32',                      pw.length, 32);
  truthy('no upper present',           !/[A-Z]/.test(pw));
  truthy('no symbols present',         !/[!@#$%]/.test(pw));
}
{
  const pw = generatePassword(8, { upper: false, symbols: false, numbers: false });
  truthy('lowercase only',             /^[a-z]+$/.test(pw));
}
{
  // Different calls should not produce identical output (extremely unlikely if random).
  const a = generatePassword(20);
  const b = generatePassword(20);
  truthy('two passwords differ',       a !== b);
}

console.log('\ngeneratePassphrase:');
{
  const phrase = generatePassphrase(5);
  const parts = phrase.split('-');
  eq('5 words separated by -',         parts.length, 5);
  truthy('all parts lowercase letters', parts.every(p => /^[a-z]+$/.test(p)));
}
{
  const phrase = generatePassphrase(7, { capitalize: true });
  const parts = phrase.split('-');
  eq('7 words',                        parts.length, 7);
  truthy('parts capitalized',          parts.every(p => /^[A-Z][a-z]*$/.test(p)));
}
{
  const phrase = generatePassphrase(4, { numberSuffix: true });
  const parts = phrase.split('-');
  eq('4 words + suffix → 5 parts',     parts.length, 5);
  truthy('last is digits',             /^\d{1,4}$/.test(parts[4]));
}

console.log('\nentropyBits:');
{
  // 16 chars from 26-char alphabet (lowercase only) ≈ 75.2 bits
  const bits = entropyBits('aaaabbbbccccdddd');
  truthy('low-pool ≥70 bits',          bits >= 70);
  truthy('low-pool ≤80 bits',          bits <= 80);
}
{
  // Mixed alphabet — 16 chars ≈ 100+ bits
  const bits = entropyBits('Ab1!Cd2@Ef3#Gh4$');
  truthy('full-pool ≥90 bits',         bits >= 90);
}
{
  // 5-word passphrase: 5 * log2(1024) = 50 bits
  const bits = entropyBits('apple-banana-coffee-donkey-eagle', { passphrase: true });
  truthy('5-word passphrase ≈50 bits', Math.abs(bits - 50) < 0.1);
}

console.log('\nstrengthLabel:');
eq('weak < 28',                        strengthLabel(20),   'weak');
eq('reasonable 28-60',                 strengthLabel(45),   'reasonable');
eq('strong 60-90',                     strengthLabel(80),   'strong');
eq('very strong 90-128',               strengthLabel(110),  'very strong');
eq('paranoid ≥128',                    strengthLabel(140),  'paranoid');

console.log('\ncrackTimeEstimate:');
truthy('low bits → seconds',           /seconds|instant/.test(crackTimeEstimate(20)));
truthy('80 bits → years',              /years/.test(crackTimeEstimate(80)));
truthy('200 bits → forever',           crackTimeEstimate(200) === 'effectively forever');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
