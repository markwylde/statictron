import { stat, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export default async function convertFilesToUseHashes(baseDir, lookup) {
  for (const file of await readdir(baseDir)) {
    const filePath = path.resolve(baseDir, file);
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      await convertFilesToUseHashes(filePath, lookup);
      continue;
    }

    let content = await readFile(filePath, 'utf8');
    Object.keys(lookup).forEach((filepath) => {
      content = content.replaceAll(`"${filepath}"`, `"./${lookup[filepath]}"`);
      content = content.replaceAll(`"./${filepath}"`, `"./${lookup[filepath]}"`);
      content = content.replaceAll(`"/${filepath}"`, `"./${lookup[filepath]}"`);
      content = content.replaceAll(`'${filepath}'`, `"./${lookup[filepath]}"`);
      content = content.replaceAll(`'./${filepath}'`, `"./${lookup[filepath]}"`);
      content = content.replaceAll(`'/${filepath}'`, `"./${lookup[filepath]}"`);
    });
    await writeFile(filePath, content);
  }
}
