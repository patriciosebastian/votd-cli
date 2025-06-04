# verse-of-the-day-cli 📖

**A zero-config command-line tool that prints the Bible “Verse of the Day” in your terminal once per day.**  

It pulls the official Verse-of-the-Day RSS from [Bible Gateway](https://www.biblegateway.com/info/rss/). Verses are cached locally on a per-day basis by default, but you can use the force flag to do a fresh pull.

---

## Features

* **Zero setup** – just `npm i -g verse-of-the-day-cli`.
* **Auto-cache** – one network call per day, saved under `~/.config/verse-cli`.
* **Clipboard copy** – `-c | --copy` adds the verse to your system clipboard.
* **Force refresh** – `-f | --force` bypasses today’s cache.
* **Init helper** – `verse init` appends a one-liner to your shell profile so the verse greets you the first time you open a terminal each day.
* **Colour output** – powered by [Chalk](https://www.npmjs.com/package/chalk).

---

## Installation

```bash
npm i -g verse-of-the-day-cli
verse --help

---

## Roadmap

* Would you like to see new features? Submit a PR or make a comment on the issues tab.
