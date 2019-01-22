# Simple SSE Server

Simple middleware that will leave the HTTP connection and use it for SSE communication.

[![NPM Version][npm-image]][npm-url]
[![NPM Monthly][downloads-month-image]][npm-url]
[![NPM Downloads][downloads-total-image]][npm-url]

Below is an example of setting up the server on the ```/events``` route.

```javascript
var SSEServer = require('expresse');
var sse = new SSEServer('events');

app.get('/events', function(req, res) {
    sse.connect(req, res);
    sse.broadcast('greeting', {message: 'hello world'});
});
```

Client code is simple too!

```javascript
var events = new EventSource('http://localhost:4000/events');

events.addEventListener('greeting', function(event) {
    var data = JSON.parse(event.data);
    console.log('greeting: '+ data);
});

events.onopen = function(e) {
    //called when socket is listenning
}

events.onerror = function(e) {
    events.close();
}
```
[npm-url]: https://npmjs.org/package/expresse

[npm-image]: https://img.shields.io/npm/v/expresse.svg?maxAge=2592000
[downloads-total-image]: https://img.shields.io/npm/dt/expresse.svg?maxAge=2592000
[downloads-month-image]: https://img.shields.io/npm/dm/expresse.svg?maxAge=2592000
