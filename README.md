# statictron
Build a static website using ejs.

## Installation
```
npm install --save statictron
```

## Demo
1. Clone this repo `git clone https://github.com/markwylde/statictron.git`
2. Install statictron globally `npm install --global statictron`
3. Change into the demo directory `cd demo`
4. Run statictron
```
statictron --output=./demo/dist --ignore _paritals/** ./demo/src
```

> You can server the outputted `dist` directory using any web server.
>
> Try [servatron](https://github.com/markwylde/servatron) then browse to `http://0.0.0.0:8000`.
>
> ```
> servatron --port 8000 --directory dist
> ```

## Usage

### Via the CLI
```
statictron cli - v1.0.0

Example usage:
  statictron --watch --output=dist --ignore _partials/** --scope abc=123 src
  statictron -w -o=dist -i _partials/** -s abc=123 src

Options:
  --watch                        watch the source directory for changes and rebuild
  --output (-o) pathName         specify a directory to save the generated files to
  --ignore[] (-i) pattern        a (or list of) glob pattern(s) that should be ignored from source
  --scope[] var=val              build an object to be passed to all ejs files
  --help                         show this help screen
```

### Via the API

```javascript
import statictron from 'statictron';

await statictron({
  source: './src',
  output: './dist',
  scope: {
    exampleVariable: 'test123'
  },
  logger: console.log // default is undefined which means no logging
});
```


## Looping file structure
You can loop through an array on the scope. For example:

```javascript
await statictron({
  source: './src',
  output: './dist',
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

The left part of the folder structure would will be use as the key, passed into the scope.

So in the above `[person.id].ejs` file:
- the filename will be rendered to `first-person/index.html` and `second-person/index.html`
- the content `<%= person.name =>` will render 'First Person' and 'Second Person'

For a full example, look at the [demo](./demo) or the [api - file based loop](./test) test.
