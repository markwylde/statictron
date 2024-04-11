import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function hashFiles(directory, hashTable = {}, relativePath = '') {
  const files = await fs.promises.readdir(directory, { withFileTypes: true });
  const promises = files.map(file => new Promise(async (resolve) => {
    const sourceFile = path.resolve(directory, file.name);
    const stats = await fs.promises.stat(sourceFile);
    if (stats.isDirectory()) {
      await hashFiles(sourceFile, hashTable, path.join(relativePath, file.name));
      resolve();
      return;
    }
    if (sourceFile.endsWith('.html')) {
      resolve();
      return;
    }

    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(sourceFile);
    stream.on('data', data => hash.update(data));
    stream.on('end', async () => {
      const hashString = hash.digest('hex');
      const fileName = path.basename(file.name, path.extname(file.name));
      const fileExt = path.extname(file.name);
      const targetFile = path.resolve(directory, `${fileName}-${hashString.slice(0, 8)}${fileExt}`);
      await fs.promises.rename(sourceFile, targetFile);
      hashTable[path.join(relativePath, file.name)] = path.join(relativePath, `${fileName}-${hashString.slice(0, 8)}${fileExt}`);
      resolve();
    });
  }));
  await Promise.all(promises);
  return hashTable;
}
