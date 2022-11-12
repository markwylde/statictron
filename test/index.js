import test from 'basictap';
import { promises as fs } from 'fs';
import { globby } from 'globby';
import statictron from '../index.js';

test('api - source and output', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist'
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    [
      '_partials/foot/index.html',
      '_partials/head/index.html',
      '_partials/header/index.html',
      'index.html'
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
</head>

<body>
    <header>
        Example Site
    </header>
    <h1>Home Page</h1>
    <p>This is a test</p>
</body>

</html>
  `.trim());
});

test('api - scope', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
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
      'index.html'
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
</head>

<body>
    <header>
        Example Site
    </header>
    <h1>Test Title From Scope</h1>
    <p>This is a test</p>
</body>

</html>
  `.trim());
});

test('api - ignore as a string', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    ignore: '_partials/**'
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    ['index.html']
  );
});

test('api - ignore as an array', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    ignore: ['_partials/**']
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    ['index.html']
  );
});

test('api - multiple ignore', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
    ignore: [
      '_partials/foot.ejs',
      '_partials/head.ejs'
    ]
  });

  const files = await globby('**/*', { cwd: './demo/dist' });
  t.deepEqual(
    files.sort(),
    ['_partials/header/index.html', 'index.html']
  );
});

test('api - file based loop', async t => {
  await statictron({
    source: './demo/src',
    output: './demo/dist',
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
      'index.html',
      'second/index.html',
    ]
  );

  t.equal(await fs.readFile('./demo/dist/first/index.html', 'utf8'), `This is item Number One`);
  t.equal(await fs.readFile('./demo/dist/second/index.html', 'utf8'), `This is item Number Two`);
});
