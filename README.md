# passgen

Generate cryptographically random passwords + diceware-style passphrases. Reports entropy in bits and a cracking-time estimate. Zero deps. Free forever from vøiddo.

```
$ passgen
<7}S2HF8dUbz;ii)
  entropy 103.1 bits  very strong  · cracking time effectively forever

$ passgen --passphrase --words 5 --capitalize --number-suffix
Casual-Define-Cover-Hybrid-Axis-5742
  entropy 63.3 bits  strong  · cracking time 2 years
```

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

Entropy comes from `crypto.randomBytes` — node's CSPRNG (kernel `getrandom()` on Linux, `BCryptGenRandom` on Windows). Indices are derived via **rejection sampling on uint32**, which means every character of the alphabet (or every word of the wordlist) appears with exactly equal probability. No off-by-one bias from naïve `% N`.

## Strength scale

| bits | label | rough crack time at 10¹¹ guesses/sec |
|---|---|---|
| < 28 | weak | seconds–minutes |
| 28–60 | reasonable | hours–months |
| 60–90 | strong | years |
| 90–128 | very strong | thousands–millions of years |
| ≥ 128 | paranoid | effectively forever |

Crack times assume an offline attack against a fast hash (SHA-256, MD5). bcrypt / Argon2 / scrypt are 10⁶–10⁸× slower, so even "reasonable" entropy is safe in practice when the server hashes properly.

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

passgen ships with a 1024-word built-in list (4–8 letter, lowercase, no homoglyphs). log₂(1024) = 10 bits per word — five words = 50 bits, the same ballpark as a 9-character mixed password but vastly more memorable.

## License

MIT — part of the [vøiddo](https://voiddo.com) tools collection.

Built by vøiddo, a small studio shipping AI-flavoured tools, browser extensions and weird browser games.
