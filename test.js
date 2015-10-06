'use strict';

import {testAsync} from './';

function eventualOne() {
  return new Promise(resolve => {
    setTimeout(() => resolve(1), 50);
  });
}

testAsync('my test', async t => {
  t.equal(await eventualOne(), 1);
});
