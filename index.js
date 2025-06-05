#!/usr/bin/env node

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import chalk from 'chalk'
import clipboardy from 'clipboardy'
import readline from 'node:readline/promises'
import getVerse from './lib/getVerse.js'
import { Command } from 'commander'

const program = new Command()
  .name('verse')
  .description('Print the Bible “Verse of the Day” once per day')
  .version('1.0.0');

program
.option('-f, --force', 'fetch a fresh verse even if today\'s is cached')
.option('-c, --copy',  'copy verse to clipboard')
.action(runVerse);

program
  .command('show')
  .alias('s')
  .description('print today’s verse (cached, unless --force)')
  .option('-f, --force', 'fetch a fresh verse even if today’s is cached')
  .option('-c, --copy',  'copy verse to clipboard')
  .action(runVerse);

program
  .command('init')
  .description('add auto-run snippet to your shell profile')
  .action(runInit);

program.addHelpText('after', `
  $ verse                 # print today’s verse (cached if already fetched)
  $ verse --force         # always pull a fresh verse
  $ verse show -c         # show cached verse and copy to clipboard
  $ verse show --force    # force-refresh via the show command
  $ verse init            # greet me once per day on new terminal

  Home page & docs: https://patriciosebastian.github.io/verse-cli/
`);

program.showHelpAfterError('(add --help for more information)');

await program.parseAsync(process.argv);

async function runVerse(opts) {
  const force = opts.force || false;
  const toClip = opts.copy  || false;

  const cfgHome   = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  const verseDir  = path.join(cfgHome, 'verse-cli');
  const cacheFile = path.join(verseDir, 'cache.json');

  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {
    //
  }

  const today = new Date().toISOString().slice(0, 10);
  if (force || data.date !== today) {
    const fresh = await getVerse();
    data = { date: today, ...fresh };
    fs.mkdirSync(verseDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(data));
  }

  printVerse(data.reference, data.verse, data.provider);

  if (toClip) {
    await clipboardy.write(`${data.reference} – ${data.verse}`);
  }
}

function printVerse(reference, verse, provider) {
  console.log(
    chalk.green.bold(reference),
    '\n',
    chalk.white(verse),
    '\n',
    chalk.gray(`Verse courtesy: ${provider}`)
  );
}

async function runInit() {
  const shell = detectShell();
  const { rcPath, snippet } = shellInfo(shell);

  if (!rcPath) {
    console.error(`Unable to determine startup file for shell "${shell}".`);
    process.exit(1);
  }

  if (fs.existsSync(rcPath) && fs.readFileSync(rcPath, 'utf8').includes(snippet)) {
    console.log('⏭  Startup snippet already present – nothing to do.');
    return;
  }

  console.log(`\n👉  About to append the following line to ${rcPath}:\n`);
  console.log(chalk.gray(snippet), '\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('Proceed? (y/N) ')).trim().toLowerCase();
  rl.close();

  if (answer !== 'y') {
    console.log('Aborted.');
    return;
  }

  fs.mkdirSync(path.dirname(rcPath), { recursive: true });
  fs.appendFileSync(rcPath, `\n${snippet}\n`);
  console.log(chalk.green('✓  Added.  Open a new terminal to test.'));
}

function detectShell() {
  if (process.platform === 'win32') return 'powershell';
  const shellPath = process.env.SHELL || '';
  if (shellPath.includes('zsh'))  return 'zsh';
  if (shellPath.includes('fish')) return 'fish';
  if (shellPath.includes('bash')) return 'bash';
  return 'unknown';
}

function shellInfo(shell) {
  const home = os.homedir();
  switch (shell) {
    case 'bash':
      return {
        rcPath: path.join(home, '.bashrc'),
        snippet: 'if [[ $- == *i* ]]; then verse --auto; fi'
      };
    case 'zsh':
      return {
        rcPath: path.join(home, '.zshrc'),
        snippet: 'if [[ $- == *i* ]]; then verse --auto; fi'
      };
    case 'fish':
      return {
        rcPath: path.join(home, '.config', 'fish', 'config.fish'),
        snippet: 'if status --is-interactive; verse --auto; end'
      };
    case 'powershell':
      return {
        rcPath: path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
        snippet: 'if ($Host.UI.RawUI.WindowTitle) { verse --auto }'
      };
    default:
      return { rcPath: null, snippet: '' };
  }
}
