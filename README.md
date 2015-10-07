# `babel-tap`

Like `babel-node` but for `tap`.
So you can turn this:

```bash
babel-node node_modules/.bin/tap 'test/**/*.js'
```

Into this:

```bash
babel-tap 'test/**/*.js'
```

## Usage

```js
import {test} from 'babel-tap';

test('my test', async t => {
  t.equal(await fs.readFileAsync('package.json', 'utf8'), '{}');
});
```

The CLI command has the exact same arguments `tap` has
and the export has the exact same interface as `tap`.
