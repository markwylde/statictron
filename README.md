# statictron
Build a static website with built in (optional) ejs and css bundling support.

## Installation
```
npm install --save statictron
```

## Demo
1. Install statictron globally `npm install --global statictron`
2. Clone this repo `git clone https://github.com/markwylde/statictron.git`
3. Change into the demo directory `cd demo`
4. Run statictron
```
statictron --loader ejs --loader css --output=./dist --ignore _paritals/** ./src
```

> You can serve the outputted `dist` directory using any web server.
>
> Try [servatron](https://github.com/markwylde/servatron) then browse to `http://0.0.0.0:8000`.
>
> ```
> servatron --port 8000 --directory dist
> ```

## Usage

### Via the CLI
```
statictron cli - v3.0.3

Example usage:
  statictron --loader ejs --loader css --watch --output=dist --ignore _partials/** --scope abc=123 src
  statictron -l ejs -l css -w -o=dist -i _partials/** -s abc=123 src

Options:
  --watch                        watch the source directory for changes and rebuild
  --output (-o) pathName         specify a directory to save the generated files to
  --no-clean                     keep existing files in output directory
  --ignore[] (-i) pattern        a (or list of) glob pattern(s) that should be ignored from source
  --scope[] var=val              build an object to be passed to all loaders
  --loader[] loaderName          specify a built in loader to use
      ejs                        parse any *.ejs file as ejs templates
      css                        bundle any index.css files and ignore other css files
  --help                         show this help screen
```

### Via the API

```javascript
import statictron from 'statictron';

await statictron({
  source: './src',
  output: './dist',
  loaders: [
    statictron.loaders.ejs,
    statictron.loaders.css
  ],
  scope: {
    exampleVariable: 'test123'
  },
  logger: console.log // default is undefined which means no logging
});
```

## Loaders
Every time a file is found in the `source` directory, it will get passed through the provided loaders (in order);

A loader is a pure function that takes three arguments:
| key         | description                           | example                                    |
| ----------- | ------------------------------------- | ------------------------------------------ |
| sourceFile  | full source file path                 | /home/example/src/index.ejs                |
| targetFile  | full assumed target file path         | /home/example/dist/index.ejs               |
| options     | the options you passed to statictron  | { source, output, loaders, scope, logger } |

Return:
  - a string (or array of strings), to rerun all the loaders again on that file.
  - null to abort the rest of the loaders
  - undefined to move onto the next loader

Note that the `scope` on the options **will** contain additional variables if a loop was present higher up the chain.

### Example loader code
A very basic example that replaces any 'hello.template' file's contents with 'hello world' is:

```javascript
async function helloExampleLoader (sourceFile, targetFile, options) {
  // skip any files that aren't `hello.template`
  if (path.basename(file) !== 'hello.template') {
    return
  }

  // get the source file data
  // however, we won't need it for this example
  // const result = await fs.readFile(sourceFile, 'utf8');
  const result = 'Hello World';

  // rename the file from `hello.template` to `hello.html`
  const finalTarget = targetFile.replace('.template', '.html');

  // save the new file to the new output target
  await fs.mkdir(path.dirname(finalTarget), { recursive: true });
  await fs.writeFile(finalTarget, result);

  // rerun all the loaders again on our new target file
  return finalTarget;
}
```

Now we have created our example loader, we can pass it into statictron as such:

```javascript
await statictron({
  source: './src',
  output: './dist',
  loaders: [
    helloExampleLoader
  ]
})
```

There are two built in loaders, one for `ejs` and one for `css`.

## Looping file structure
You can loop through an array on the scope. For example:

```javascript
await statictron({
  source: './src',
  output: './dist',
  loaders: [
    statictron.loaders.ejs,
    statictron.loaders.css
  ],
  scope: {
    items: [{
      keyA: 'some-example-1',
      keyB: 'some-example-2'
    }],
    people: [{
      id: 'first-person',
      name: 'First Person'
    }, {
      id: 'second-person',
      name: 'Second Person'
    }]
  },
  logger: console.log // default is undefined which means no logging
});
```

**Example file structure**
```
[item of items]
  [item.keyA].ejs
  [item.keyB].ejs

[person of people]
  [person.id].ejs
```

The left part of the folder structure would will be used as the key, passed into the scope.

So in the above `[person.id].ejs` file:
- the filename will be rendered to `first-person/index.html` and `second-person/index.html`
- the content `<%= person.name =>` will render 'First Person' and 'Second Person'

For a full example, look at the [demo](./demo) or the [api - file based loop](./test/index.js) test.
