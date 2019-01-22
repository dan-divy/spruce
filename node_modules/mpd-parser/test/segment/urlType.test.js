import QUnit from 'qunit';
import urlTypeConverter from '../../src/segment/urlType';

QUnit.module('urlType - urlTypeConverter');

QUnit.test('returns correct object if given baseUrl only', function(assert) {
  assert.deepEqual(urlTypeConverter({ baseUrl: 'http://example.com' }), {
    resolvedUri: 'http://example.com',
    uri: ''
  });
});

QUnit.test('returns correct object if given baseUrl and source', function(assert) {
  assert.deepEqual(urlTypeConverter({
    baseUrl: 'http://example.com',
    source: 'init.fmp4'
  }), {
    resolvedUri: 'http://example.com/init.fmp4',
    uri: 'init.fmp4'
  });
});

QUnit.test('returns correct object if given baseUrl, source and range', function(assert) {
  assert.deepEqual(urlTypeConverter({
    baseUrl: 'http://example.com',
    source: 'init.fmp4',
    range: '101-105'
  }), {
    resolvedUri: 'http://example.com/init.fmp4',
    uri: 'init.fmp4',
    byterange: {
      offset: 101,
      length: 4
    }
  });
});

QUnit.test('returns correct object if given baseUrl and range', function(assert) {
  assert.deepEqual(urlTypeConverter({
    baseUrl: 'http://example.com',
    range: '101-105'
  }), {
    resolvedUri: 'http://example.com',
    uri: '',
    byterange: {
      offset: 101,
      length: 4
    }
  });
});
