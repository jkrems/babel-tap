# Babel Blue Tap

Like `blue-tape` for `tap` but also brings in `babel` support.

## Usage

```js
import {testAsync} from 'babel-blue-tap';

testAsync('my test', async t => {
  t.equal(await fs.readFileAsync('package.json', 'utf8'), '{}');
});
```
