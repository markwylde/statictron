#!/usr/bin/env node
import { readFile } from 'fs/promises';
import minimist from 'minimist';
import chokidar from 'chokidar';
import debounce from 'debounce';
import statictron from './index.js';

const packageJson = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

const argv = minimist(process.argv.slice(2));

const ensureArray = thing => Array.isArray(thing) ? thing : [thing];

const args = {
  watch: argv.w || argv.watch || false,
  ignore: ensureArray(argv.i || argv.ignore || []),
  scope: ensureArray(argv.s || argv.scope || [])
    .reduce((scope, expression) => {
      const [left, ...right] = expression.split('=');
      scope[left] = right.join('=');
      return scope;
    }, {}),
  source: argv._[0],
  output: argv.o || argv.output,
  help: argv.help
};

if (args.help || !args.source) {
  console.log([
    `${packageJson.name} cli - v${packageJson.version}`,
    '',
    'Example usage:',
    '  statictron --watch --output=dist --ignore _partials/** --scope abc=123 src',
    '  statictron -w -o=dist -i _partials/** -s abc=123 src',
    '',
    'Options:',
    '  --watch                        watch the source directory for changes and rebuild',
    '  --output (-o) pathName         specify a directory to save the generated files to',
    '  --ignore[] (-i) pattern        a (or list of) glob pattern(s) that should be ignored from source',
    '  --scope[] var=val              build an object to be passed to all ejs files',
    '  --help                         show this help screen'
  ].join('\n'));
  process.exit(0);
}

const render = () => {
  statictron({
    source: args.source,
    output: args.output,
    ignore: args.ignore,
    logger: console.log
  });
}

if (args.watch) {
  const debouncedBuild = debounce(render, 300);
  chokidar.watch(args.source).on('all', debouncedBuild);
} else {
  render();
}
