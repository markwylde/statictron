import test from 'basictap';
import { promises as fs } from 'fs';
import path from 'path';
import { globby } from 'globby';
import statictron from '../lib/index.js';

async function helloExampleLoader (sourceFile, targetFile) {
  if (path.basename(sourceFile) !== 'index.ejs') {
    return;
  }

  const result = 'Hello World';

  const finalPath = path.join(
    path.dirname(targetFile),
    path.basename(targetFile).replace('.ejs', '.html')
  );

  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, result);

  return finalPath;
}

async function goodbyeReplaceExampleLoader (sourceFile, targetFile) {
  if (path.basename(sourceFile) !== 'index.html') {
    return;
  }

  const data = await fs.readFile(sourceFile, 'utf8');
  const result = data.replace(/Hello/g, 'Goodbye');

  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, result);

  return targetFile;
}

test('api - source and output', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      '_partials/foot/index.html',
      '_partials/head/index.html',
      '_partials/header/index.html',
      'index-bfb298cd.css',
      'index.html',
      'plane-4dc849bc.svg'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index.html', 'utf8'), `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Site</title>
    <link rel="stylesheet" href="/index-bfb298cd.css">
</head>

<body>
    <header>
        Example Site
    </header>
    <h1>Home Page</h1>
    <p>This is a test</p>
    <img src="/plane-4dc849bc.svg" />
</body>

</html>
  `.trim());
});

test('api - example loader', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    ignore: ['_partials/**', '**/*.css', '**/*.svg'],
    loaders: [
      helloExampleLoader
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      'index.html'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index.html', 'utf8'), `
Hello World
  `.trim());
});

test('api - loader chain works on file rename', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    ignore: ['_partials/**', '**/*.css', '**/*.svg'],
    loaders: [
      helloExampleLoader,
      goodbyeReplaceExampleLoader
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      'index.html'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index.html', 'utf8'), `
Goodbye World
  `.trim());
});

test('api - css gets bundled', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      '_partials/foot/index.html',
      '_partials/head/index.html',
      '_partials/header/index.html',
      'index-bfb298cd.css',
      'index.html',
      'plane-4dc849bc.svg'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index-bfb298cd.css', 'utf8'), `
header {
    background-color: black;
    color: white;
}
  `.trim());
});

test('api - scope', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ],
    scope: {
      title: 'Test Title From Scope'
    }
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      '_partials/foot/index.html',
      '_partials/head/index.html',
      '_partials/header/index.html',
      'index-bfb298cd.css',
      'index.html',
      'plane-4dc849bc.svg'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index.html', 'utf8'), `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Site</title>
    <link rel="stylesheet" href="/index-bfb298cd.css">
</head>

<body>
    <header>
        Example Site
    </header>
    <h1>Test Title From Scope</h1>
    <p>This is a test</p>
    <img src="/plane-4dc849bc.svg" />
</body>

</html>
  `.trim());
});

test('api - ignore as a string', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ],
    ignore: '_partials/**'
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    ['index-bfb298cd.css', 'index.html', 'plane-4dc849bc.svg']
  );
});

test('api - ignore as an array', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ],
    ignore: ['_partials/**']
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    ['index-bfb298cd.css', 'index.html', 'plane-4dc849bc.svg']
  );
});

test('api - multiple ignore', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ],
    ignore: [
      '_partials/foot.ejs',
      '_partials/head.ejs'
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    ['_partials/header/index.html', 'index-bfb298cd.css', 'index.html', 'plane-4dc849bc.svg']
  );
});

test('api - file based loop', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    loaders: [
      statictron.loaders.ejs,
      statictron.loaders.css
    ],
    scope: {
      items: [{
        name: 'first',
        title: 'Number One'
      }, {
        name: 'second',
        title: 'Number Two'
      }]
    },
    ignore: [
      '_partials/**'
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      'first/index.html',
      'index-bfb298cd.css',
      'index.html',
      'plane-4dc849bc.svg',
      'second/index.html'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/first/index.html', 'utf8'), 'This is item Number One');
  t.equal(await fs.readFile('./demo/dist/second/index.html', 'utf8'), 'This is item Number Two');
});
