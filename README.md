# passgen

[![npm version](https://img.shields.io/npm/v/@v0idd0/passgen.svg?color=A0573A)](https://www.npmjs.com/package/@v0idd0/passgen)
[![npm downloads](https://img.shields.io/npm/dw/@v0idd0/passgen.svg?color=1F1A14)](https://www.npmjs.com/package/@v0idd0/passgen)
[![License: MIT](https://img.shields.io/badge/license-MIT-A0573A.svg)](LICENSE)
[![Node ≥14](https://img.shields.io/badge/node-%E2%89%A514-1F1A14)](package.json)

Generate cryptographically random passwords + diceware-style passphrases. Reports entropy in bits and a cracking-time estimate. Zero deps..

```
$ passgen
<7}S2HF8dUbz;ii)
  entropy 103.1 bits  very strong  · cracking time effectively forever

$ passgen --passphrase --words 5 --capitalize --number-suffix
Casual-Define-Cover-Hybrid-Axis-5742
  entropy 63.3 bits  strong  · cracking time 2 years
```

## Why passgen

Most "online password generators" are happy to use `Math.random()` (a PRNG that an attacker reading your timestamp can rewind), and most CLI alternatives use byte-modulo (which gives an off-by-one bias when modulus doesn't divide 256). passgen uses node's CSPRNG with **rejection sampling on uint32**, every character of the alphabet (or every word of the wordlist) appears with exactly equal probability. That extra rigor is invisible in the output but visible in the entropy report.

## Install

```bash
npm install -g @v0idd0/passgen
```

## Usage

```bash
# Default: one 16-char password (alpha + digits + symbols)
passgen

# Custom length
passgen --length 32

# Generate many at once
passgen --count 10

# Diceware-style passphrase (5 words, ~50 bits entropy from a 1024-word list)
passgen --passphrase

# Beefier passphrase (~63 bits)
passgen --passphrase --words 5 --capitalize --number-suffix

# Restrict character set (e.g. for systems that reject symbols)
passgen --length 20 --no-symbols
passgen --length 24 --no-upper --no-symbols

# Bare output for scripting (no entropy report)
passgen --bare --count 100 > seed.txt

# JSON for CI / programmatic use
passgen --json | jq .password
```

## How random is it?

Entropy comes from `crypto.randomBytes`: node's CSPRNG (kernel `getrandom()` on Linux, `BCryptGenRandom` on Windows). Indices are derived via **rejection sampling on uint32**, which means every character of the alphabet (or every word of the wordlist) appears with exactly equal probability. No off-by-one bias from naïve `% N`.

## Strength scale

| bits | label | rough crack time at 10¹¹ guesses/sec |
|---|---|---|
| < 28 | weak | seconds: minutes |
| 28-60 | reasonable | hours: months |
| 60-90 | strong | years |
| 90-128 | very strong | thousands: millions of years |
| ≥ 128 | paranoid | effectively forever |

Crack times assume an offline attack against a fast hash (SHA-256, MD5). bcrypt / Argon2 / scrypt are 10⁶, 10⁸× slower, so even "reasonable" entropy is safe in practice when the server hashes properly.

## Compared to alternatives

| tool | RNG | unbiased sampling | passphrase mode | offline | install |
|---|---|---|---|---|---|
| passgen | CSPRNG (`randomBytes`) | yes (rejection on uint32) | yes (1024-word list) | yes | one npm install |
| `pwgen` | non-cryptographic | no | no | yes | bundled (Linux) |
| `openssl rand -base64 N` | CSPRNG | yes | no | yes | bundled |
| `1password generate` | CSPRNG | yes | yes | requires app | app |
| Web generators | varies | rarely documented | varies | no | web |

If you're already in 1Password or Bitwarden, use those, they sync. passgen is for the cases where you need a one-shot strong string in your shell (provisioning, CI seeds, DB roots).

## FAQ

**Why diceware over random characters?** Because 5 short words are easier to memorize than 9 random characters of equivalent entropy. Memorability matters when the password is for something you'll type, not paste.

**Why a custom wordlist instead of EFF's 7776?** Smaller (1024 entries → 10 bits/word vs EFF's ~12.92), curated for shorter words (4-8 letters) and no homoglyph confusion. Trade-off: you need slightly more words (5 → 50 bits vs EFF's ~38.7) for the same entropy budget.

**Should I use `--no-symbols`?** Only if your target system rejects them. Letters+digits gives ~5.95 bits/char vs full mixed at ~6.55, a 16-char password drops from 105 to 95 bits, both still in "very strong" territory.

**Is "1024 word list" not power-of-two-suspicious for rejection sampling?** Caught one yourself. Naive single-byte rejection deadlocks when the wordlist size divides 256 (the rejection range becomes empty). passgen reads 4 bytes per index and rejects on `remainder == 0 ? range : range - remainder`, the same gate works for 256-, 1024-, and 65536-word lists.

## Programmatic API

```javascript
const { generatePassword, generatePassphrase, entropyBits } =
  require('@v0idd0/passgen');

const pw = generatePassword(20, { symbols: false });
console.log(pw, entropyBits(pw).toFixed(1) + ' bits');

const phrase = generatePassphrase(5, { capitalize: true, numberSuffix: true });
console.log(phrase);
```

## Wordlist

passgen ships with a 1024-word built-in list (4-8 letter, lowercase, no homoglyphs). log₂(1024) = 10 bits per word, five words = 50 bits, the same ballpark as a 9-character mixed password but vastly more memorable.

## License

MIT.

---

Maintained by v0idd0.
