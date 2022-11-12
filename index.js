import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import cssbun from 'cssbun';
import jsBeautify from 'js-beautify';
import objectPath from 'object-path';
import micromatch from 'micromatch';

const { html: beautifyHtml, css: beautifyCss } = jsBeautify;

const loopRegex = /\[.* of .*\]/;
const variableRegex = /\[(.*?)\]/g;

const formatPath = (source, file) => path.relative(source, file);

async function inject (file, scope, options) {
  const fileExists = await fs.access(file).then(() => true).catch(() => false);

  if (!fileExists) {
    file = path.resolve(options.source, file);
  }

  const data = await fs.readFile(file, 'utf8');
  return ejs.render(data, {
    ...scope,
    async: true,
    include: (resolvedFile) => inject(resolvedFile, scope, options)
  });
}

async function render (source, destination, options) {
  options?.logger?.('exploring', `"${formatPath(options.source, source)}" => "${formatPath(options.source, destination)}"`);

  const files = await fs.readdir(source);

  return new Promise(async resolve => {
    for (const file of files) {
      const fullFile = path.resolve(source, file);
      const relativeFile = path.relative(options.source, fullFile);
      const stats = await fs.stat(fullFile);
      const isDirectory = stats.isDirectory();
      const isLoop = !!file.match(loopRegex);
      const isVariable = !!file.match(variableRegex);
      const shouldIgnore = micromatch.isMatch(relativeFile, options.ignore || [], {
        cwd: path.resolve(options.source),
        basename: true
      });

      if (shouldIgnore) {
        continue;
      }

      if (isLoop) {
        const [left, right] = file.slice(1, -1).split(' of ');
        const gotted = objectPath.get(options.scope, right);
        if (!gotted) {
          continue;
        }
        for (const item of gotted) {
          await render(fullFile, destination, {
            ...options,
            scope: {
              ...options.scope,
              [left]: item
            }
          });
        }
        continue;
      }

      const parsedFile = isVariable
        ? file.replace(variableRegex, (_, b) => objectPath.get(options.scope, b))
        : file;

      if (isDirectory) {
        await render(fullFile, path.resolve(destination, parsedFile), options);
        continue;
      }

      let loaderFound = false;
      for (const loader of options.loaders || []) {
        const loaderResult = await loader({ file, fullFile, destination, parsedFile }, options);
        if (loaderResult) {
          loaderFound = true;
        }
      }

      if (loaderFound) {
        continue;
      }

      await fs.cp(fullFile, path.resolve(destination, parsedFile), { recursive: true, force: true });
    }
    resolve();
  });
}

async function statictron (options) {
  const { source, output } = options;

  try {
    await fs.rm(output, { recursive: true });
  } catch (error) {}

  await render(source, output, options);
}

statictron.loaders = {
  css: async function cssLoader ({ file, fullFile, destination, parsedFile }, options) {
    if (file.endsWith('.css')) {
      if (file !== 'index.css') {
        return true;
      }

      options?.logger?.('rendering', 'css', `"${formatPath(options.source, fullFile)}" => "${formatPath(options.source, destination)}"`);
      const result = await cssbun(fullFile);
      const prettyResult = beautifyCss(result);

      const finalPath = path.resolve(destination, parsedFile);

      await fs.mkdir(path.dirname(finalPath), { recursive: true });
      await fs.writeFile(finalPath, prettyResult);

      return true;
    }
  },

  ejs: async function ejsLoader ({ file, fullFile, destination, parsedFile }, options) {
    if (file.endsWith('.ejs')) {
      options?.logger?.('rendering', 'ejs', `"${formatPath(options.source, fullFile)}" => "${formatPath(options.source, destination)}"`);
      const result = await inject(fullFile, options.scope, options);
      const prettyResult = beautifyHtml(result.replace(/^\s*\n/gm, ''), { no_preserve_newlines: true });

      const finalPath = file.endsWith('index.ejs')
        ? path.resolve(destination, 'index.html')
        : path.resolve(destination, parsedFile.slice(0, -4), 'index.html');

      await fs.mkdir(path.dirname(finalPath), { recursive: true });
      await fs.writeFile(finalPath, prettyResult);

      return true;
    }
  }
};

export default statictron;
