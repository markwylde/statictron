import { promises as fs } from 'fs';
import path from 'path';
import ejs from 'ejs';
import jsBeautify from 'js-beautify';
import formatPath from '../utils/formatPath.js';

const { html: beautifyHtml } = jsBeautify;

async function renderEjs (file, scope, options) {
  const fileExists = await fs.access(file).then(() => true).catch(() => false);

  if (!fileExists) {
    file = path.resolve(options.source, file);
  }

  const data = await fs.readFile(file, 'utf8');
  return ejs.render(data, {
    ...scope,
    async: true,
    include: (resolvedFile, additionalScope) => renderEjs(
      resolvedFile,
      {...scope, ...additionalScope},
      options
    )
  });
}

export default async function ejsLoader (sourceFile, targetFile, options) {
  if (sourceFile.endsWith('.ejs')) {
    options?.logger?.('rendering', 'ejs', `"${formatPath(options.source, sourceFile)}" => "${formatPath(options.source, targetFile)}"`);
    const result = await renderEjs(sourceFile, options.scope, options);
    const prettyResult = beautifyHtml(result.replace(/^\s*\n/gm, ''), { no_preserve_newlines: true });

    const finalPath = sourceFile.endsWith('index.ejs')
      ? path.resolve(targetFile, '../index.html')
      : path.resolve(targetFile.slice(0, -4), 'index.html');

    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.writeFile(finalPath, prettyResult);

    return finalPath;
  }
}
