import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import cssbun from 'cssbun';
import jsBeautify from 'js-beautify';
import objectPath from 'object-path';
import micromatch from 'micromatch';
import { globby } from 'globby';

const { html: beautifyHtml } = jsBeautify;

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

      options?.logger?.('rendering', `"${formatPath(options.source, fullFile)}" => "${formatPath(options.source, destination)}"`);
      if (file.endsWith('.ejs')) {
        const result = await inject(fullFile, options.scope, options);
        const prettyResult = beautifyHtml(result.replace(/^\s*\n/gm, ''), { no_preserve_newlines: true });

        const finalPath = file.endsWith('index.ejs')
          ? path.resolve(destination, 'index.html')
          : path.resolve(destination, parsedFile.slice(0, -4), 'index.html');

        await fs.mkdir(path.dirname(finalPath), { recursive: true });
        await fs.writeFile(finalPath, prettyResult);
      }
    }
    resolve();
  });
}

export default async function statictron (options) {
  const { source, output } = options;

  try {
    await fs.rm(output, { recursive: true });
  } catch (error) {}

  await fs.mkdir(output);

  const files = await globby('**/index.css', { cwd: source });

  await Promise.all(
    files.map(async file => {
      const finalDirectory = path.resolve(output, file);
      const css = cssbun(path.resolve(source, file));
      await fs.mkdir(path.dirname(finalDirectory), { recursive: true });
      await fs.writeFile(finalDirectory, css);
    })
  );

  await render(source, output, options);
}
