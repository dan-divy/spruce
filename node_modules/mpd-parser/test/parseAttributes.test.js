import document from 'global/document';
import QUnit from 'qunit';
import { parseAttributes } from '../src/parseAttributes';

QUnit.module('parseAttributes');

QUnit.test('simple', function(assert) {
  const el = document.createElement('el');

  el.setAttribute('foo', 1);

  assert.deepEqual(parseAttributes(el), { foo: '1' });
});

QUnit.test('empty', function(assert) {
  const el = document.createElement('el');

  assert.deepEqual(parseAttributes(el), {});
});
