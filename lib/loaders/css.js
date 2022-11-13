import { promises as fs } from 'fs';
import cssbun from 'cssbun';
import path from 'path';
import jsBeautify from 'js-beautify';
import formatPath from '../utils/formatPath.js';

const { css: beautifyCss } = jsBeautify;

export default async function cssLoader (sourceFile, targetFile, options) {
  if (!sourceFile.endsWith('.css')) {
    return;
  }

  if (path.basename(sourceFile) !== 'index.css') {
    return null;
  }

  options?.logger?.('rendering', 'css', `"${formatPath(options.source, sourceFile)}" => "${formatPath(options.source, targetFile)}"`);
  const result = await cssbun(sourceFile);
  const prettyResult = beautifyCss(result);

  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, prettyResult);

  return targetFile;
}
