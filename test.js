'use strict';

import {test} from './';

function eventualOne() {
  return new Promise(resolve => {
    setTimeout(() => resolve(1), 50);
  });
}

test('my test', async t => {
  t.equal(await eventualOne(), 1);
});
