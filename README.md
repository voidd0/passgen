# passgen

Generate a random password or a passphrase of random words. It prints an entropy estimate in bits and a rough offline cracking time next to each result.

[![npm](https://img.shields.io/npm/v/@v0idd0/passgen?color=00f6d0&labelColor=050914)](https://www.npmjs.com/package/@v0idd0/passgen)
[![test](https://github.com/voidd0/passgen/actions/workflows/test.yml/badge.svg)](https://github.com/voidd0/passgen/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-00f6d0?labelColor=050914)](LICENSE)

## Install

```bash
npm install -g @v0idd0/passgen
```

Or run it once without installing: `npx @v0idd0/passgen --help`. Needs Node.js 18 or newer. No dependencies.

## Example

One password and one passphrase. The values are random, so yours will differ. Output from real runs on 2026-11-26:

```console
$ passgen
#8uU[mR21jtsVRSE
  entropy 103.1 bits  very strong  · cracking time effectively forever

$ passgen --passphrase --words 6 --capitalize
Kiss-Rotate-Window-Genre-Cup-Twenty
  entropy 64.9 bits  strong  · cracking time 6 years
```

Print only the values, for a script:

```console
$ passgen --bare --count 3 --length 20
{DV%S+$H?mTny8KAPzWH
mngKZK;Y6_It:UvWY3o.
hRQT=LC*zE%b}ld$PbB6
```

## Usage

```text
passgen: generate random passwords and passphrases.

Usage:
  passgen                          one 16-char password (default)
  passgen --length 32              custom length
  passgen --count 5                generate N at once
  passgen --passphrase             passphrase of 5 random words
  passgen --passphrase --words 7   custom word count

Options:
  --length <n>            Password length in chars (default 16, min 4).
  --count  <n>            Generate N at once (default 1).
  --passphrase, -p        Generate a passphrase of random words.
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
  passgen --json | jq '.results[0].password'

Docs and issues: https://github.com/voidd0/passgen
```

## How the randomness works

Every character and every word is picked with `crypto.randomBytes(4)` from the Node.js `crypto` module, which reads the operating system's random number generator. The 32-bit value is mapped to an index with rejection sampling, so there is no modulo bias.

- Passwords draw from lower case letters, plus upper case, digits and symbols unless you switch them off. A password is not forced to contain every class.
- The entropy figure for a password is `length * log2(pool)`, where the pool is built from the character classes that actually appear in that password.
- The passphrase word list has 1,810 common English words (lower case, 3 to 9 letters, no duplicates), so each word adds `log2(1810)`, about 10.8 bits; the default 5 words give about 54 bits. It is our own list, not the EFF list.
- The cracking time assumes an offline attacker making 10^11 guesses per second and finding the secret after half the key space. It is a rough guide, not a promise.

## License

MIT, see [LICENSE](LICENSE).

---

Made by [vøiddo](https://voiddo.com/?src=gh). More command line tools: [voiddo.com/packages](https://voiddo.com/packages/?src=gh).
We also run data scrapers for job boards, shops and ad libraries: [voiddo.com/scrapers](https://voiddo.com/scrapers/?src=gh).
