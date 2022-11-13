#!/usr/bin/env node

import { readFile } from 'fs/promises';
import minimist from 'minimist';
import chokidar from 'chokidar';
import debounce from 'debounce';
import statictron from '../lib/index.js';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));

const argv = minimist(process.argv.slice(2));

const ensureArray = thing => Array.isArray(thing) ? thing : [thing];

const args = {
  watch: argv.w || argv.watch || false,
  loaders: ensureArray(argv.l || argv.loader || []),
  ignore: ensureArray(argv.i || argv.ignore || []),
  scope: ensureArray(argv.s || argv.scope || [])
    .reduce((scope, expression) => {
      const [left, ...right] = expression.split('=');
      scope[left] = right.join('=');
      return scope;
    }, {}),
  source: argv._[0],
  output: argv.o || argv.output,
  clean: argv.clean === false ? false : true,
  help: argv.help
};

if (args.help || !args.source) {
  console.log([
    `${packageJson.name} cli - v${packageJson.version}`,
    '',
    'Example usage:',
    '  statictron --loader ejs --loader css --watch --output=dist --ignore _partials/** --scope abc=123 src',
    '  statictron -l ejs -l css -w -o=dist -i _partials/** -s abc=123 src',
    '',
    'Options:',
    '  --watch                        watch the source directory for changes and rebuild',
    '  --output (-o) pathName         specify a directory to save the generated files to',
    '  --no-clean                     keep existing files in output directory',
    '  --ignore[] (-i) pattern        a (or list of) glob pattern(s) that should be ignored from source',
    '  --scope[] var=val              build an object to be passed to all loaders',
    '  --loader[] loaderName          specify a built in loader to use',
    '      ejs                        parse any *.ejs file as ejs templates',
    '      css                        bundle any index.css files and ignore other css files',
    '  --help                         show this help screen'
  ].join('\n'));
  process.exit(0);
}

const render = () => {
  statictron({
    loaders: args.loaders.map(name => {
      if (!statictron.loaders[name]) {
        throw new Error(`could not find loader from the name "${name}"`)
      }
      return statictron.loaders[name]
    }),
    source: args.source,
    output: args.output,
    cleanOutputDirectory: args.cleanOutputDirectory,
    ignore: args.ignore,
    scope: args.scope,
    logger: console.log
  });
}

if (args.watch) {
  const debouncedBuild = debounce(render, 300);
  chokidar.watch(args.source).on('all', debouncedBuild);
} else {
  render();
}
