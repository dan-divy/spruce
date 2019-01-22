'use strict';

require('chai').should();

const express = require('express');
const EventSource = require('eventsource');

const SSE = require('../index');

describe('express-sse', () => {
  let app;
  let server;

  beforeEach(function (done) {
    app = express();
    server = app.listen(3000, done);
  });

  afterEach(function (done) {
    server.close(done);
  });

  it('should send events', done => {
    const sse = new SSE();
    app.get('/stream', sse.init);

    const es = new EventSource('http://localhost:3000/stream');

    setTimeout(() => {
      sse.send('test message');
    }, 100);

    es.onmessage = e => {
      JSON.parse(e.data).should.equal('test message');
      es.close();
      done();
    };
  });

  it('should allow sending custom events', done => {
    const sse = new SSE();
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000/');

    setTimeout(() => {
      sse.send('test message', 'custom event');
    }, 100);

    es.addEventListener('custom event', event => {
      JSON.parse(event.data).should.equal('test message');
      es.close();
      done();
    });
  });

  it('should allow sending custom IDs', done => {
    const sse = new SSE();
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000/');

    setTimeout(() => {
      sse.send('test message', null, 1337);
    }, 100);

    es.onmessage = e => {
      JSON.parse(e.data).should.equal('test message');
      e.lastEventId.should.equal('1337');
      es.close();
      done();
    };
  });

  it('should allow for serialization of arrays', done => {
    const sse = new SSE();
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000/');

    setTimeout(() => {
      sse.serialize([1, 2, 3, 4, 5]);
    }, 100);

    let counter = 0;

    es.onmessage = e => {
      counter++;
      if (counter === 5) {
        es.close();
        done();
      }
    };
  });

  it('should send a single event if a non-array is passed to serialize', done => {
    const sse = new SSE();
    app.get('/stream', sse.init);

    const es = new EventSource('http://localhost:3000/stream');

    setTimeout(() => {
      sse.serialize('test message');
    }, 100);

    es.onmessage = e => {
      JSON.parse(e.data).should.equal('test message');
      es.close();
      done();
    };
  });

  it('should serve initial data', done => {
    const sse = new SSE('initial message');
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000/');

    es.onmessage = e => {
      JSON.parse(e.data).should.equal('initial message');
      es.close();
      done();
    };
  });

  it('should serialize initial data by default (isSerialized = true)', done => {
    const sse = new SSE([1, 2, 3, 4, 5]);
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000/');

    let counter = 0;

    es.onmessage = e => {
      counter++;
      if (counter === 5) {
        es.close();
        done();
      }
    };
  });

  it('should send initial data as array if isSerialized is false', done => {
    const sse = new SSE([1, 2, 3, 4, 5], { isSerialized: false });
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000/');

    es.onmessage = e => {
      e.data.should.equal(JSON.stringify([1, 2, 3, 4, 5]));
      es.close();
      done();
    };
  });

  it('should be able to update initial data', done => {
    const sse = new SSE(null, { isSerialized: false });
    app.get('/', sse.init);

    sse.updateInit([1, 2, 3, 4, 5]);

    const es = new EventSource('http://localhost:3000/');

    es.onmessage = e => {
      e.data.should.equal(JSON.stringify([1, 2, 3, 4, 5]));
      es.close();
      done();
    };
  });

  it('should update initial data even if a non-array is passed', done => {
    const sse = new SSE(null);
    app.get('/', sse.init);

    sse.updateInit(1);

    const es = new EventSource('http://localhost:3000/');

    es.onmessage = e => {
      JSON.parse(e.data).should.equal(1);
      es.close();
      done();
    };
  });

  it('should allow dropping the initial data', done => {
    const sse = new SSE([1, 2, 3]);
    app.get('/', sse.init);

    sse.dropInit();

    setTimeout(() => {
      sse.send(1);
    }, 100);

    const es = new EventSource('http://localhost:3000/');

    es.onmessage = e => {
      JSON.parse(e.data).should.equal(1);
      es.close();
      done();
    };
  });

  it('should not send an event for an empty array if isSerialized is false', done => {
    const sse = new SSE([1, 2, 3], { isSerialized: false });
    app.get('/', sse.init);

    sse.dropInit();

    setTimeout(() => {
      sse.send(1);
    }, 100);

    const es = new EventSource('http://localhost:3000/');

    es.onmessage = e => {
      JSON.parse(e.data).should.equal(1);
      es.close();
      done();
    };
  });

  it('should send a custom initial event if the option is defined', done => {
    const sse = new SSE([1, 2, 3], { isSerialized: false, initialEvent: 'custom initial event' });
    app.get('/', sse.init);

    const es = new EventSource('http://localhost:3000');

    es.addEventListener('custom initial event', event => {
      event.data.should.equal(JSON.stringify([1, 2, 3]));
      es.close();
      done();
    });
  });
});
