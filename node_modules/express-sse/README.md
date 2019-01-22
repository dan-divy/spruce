express-sse
============

[![Build Status](https://travis-ci.org/dpskvn/express-sse.svg?branch=master)](https://travis-ci.org/dpskvn/express-sse)  [![Code Climate](https://codeclimate.com/github/dpskvn/express-sse/badges/gpa.svg)](https://codeclimate.com/github/dpskvn/express-sse)  [![Test Coverage](https://codeclimate.com/github/dpskvn/express-sse/badges/coverage.svg)](https://codeclimate.com/github/dpskvn/express-sse/coverage)

[![NPM](https://nodei.co/npm/express-sse.png?downloads=true)](https://nodei.co/npm/express-sse/)

An Express middleware for quick'n'easy server-sent events.

## About
`express-sse` is meant to keep things simple. You need to send server-sent events without too many complications and fallbacks? This is the library to do so.

## Installation:
`npm install --save express-sse`

or

`yarn add express-sse`

## Usage example:
### Options:
You can pass an optional options object to the constructor. Currently it only supports changing the way initial data is treated. If you set `isSerialized` to `false`, the initial data is sent as a single event. The default value is `true`.

```js
var sse = new SSE(["array", "containing", "initial", "content", "(optional)"], { isSerialized: false, initialEvent: 'optional initial event name' });
```

### Server:
```js
var SSE = require('express-sse');
var sse = new SSE(["array", "containing", "initial", "content", "(optional)"]);

...

app.get('/stream', sse.init);

...

sse.send(content);
sse.send(content, eventName);
sse.send(content, eventName, customID);
sse.updateInit(["array", "containing", "new", "content"]);
sse.serialize(["array", "to", "be", "sent", "as", "serialized", "events"]);
```

### Client:
```js
var es = new EventSource('/stream');

es.onmessage = function (event) {
  ...
};

es.addEventListener(eventName, function (event) {
  ...
});
```
