import test from 'basictap';
import { promises as fs } from 'fs';
import path from 'path';
import { globby } from 'globby';
import statictron from '../index.js';

async function helloExampleLoader ({ file, destination, parsedFile }) {
  if (file !== 'index.ejs') {
    return false;
  }

  const result = 'Hello World';

  const finalPath = path.resolve(
    destination,
    parsedFile.replace('.template', '.html')
  );

  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, result);

  return true;
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
      'index.css',
      'index.html',
      'plane.svg'
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
    <link rel="stylesheet" href="index.css">
</head>

<body>
    <header>
        Example Site
    </header>
    <h1>Home Page</h1>
    <p>This is a test</p>
    <img src="plane.svg" />
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
      'index.ejs'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index.ejs', 'utf8'), `
Hello World
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
      'index.css',
      'index.html',
      'plane.svg'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/index.css', 'utf8'), `
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
      'index.css',
      'index.html',
      'plane.svg'
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
    <link rel="stylesheet" href="index.css">
</head>

<body>
    <header>
        Example Site
    </header>
    <h1>Test Title From Scope</h1>
    <p>This is a test</p>
    <img src="plane.svg" />
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
    ['index.css', 'index.html', 'plane.svg']
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
    ['index.css', 'index.html', 'plane.svg']
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
    ['_partials/header/index.html', 'index.css', 'index.html', 'plane.svg']
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
      'index.css',
      'index.html',
      'plane.svg',
      'second/index.html'
    ]
  );

  t.equal(await fs.readFile('./demo/dist/first/index.html', 'utf8'), 'This is item Number One');
  t.equal(await fs.readFile('./demo/dist/second/index.html', 'utf8'), 'This is item Number Two');
});
