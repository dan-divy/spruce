var debug = require('debug')('express-sse');

/**
 * @class Client
 * @param {string} username - the username provided by req.query.username
 * @param {Object} connection - Express response object used for the SSE connection
 */
var Client = function(username, connection) {
    this.username = username;
    this.connection = connection;
};

/**
 * Simple SSE Server for Express
 * @param {string} name - name used for logging connections i.e. 'playlist-events'
 * @class SSEServer
 */
var SSEServer = function(name) {

    this.name = name;
    this._clients = [];
    this._lastMessageId = 0;

    setTimeout(this._heartBeat.bind(this), 10000);
};

/**
 * Set up SSE connection and start heartbeat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
SSEServer.prototype.connect = function(req, res) {

    // change from default node timeout
    req.socket.setTimeout(Number.MAX_SAFE_INTEGER || Infinity);

    // tell the client you are switching to event-stream
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });

    // add client to collection
    var client = this._addClient(req.query.username || 'Client', res);

    // set connection close handler to clean up client
    req.on('close', this._removeClient.bind(this, client));
};

/**
 * Broadcast and event to all connected clients
 * @param {string} event - event type
 * @param {string} data - JSON data to send
 */
SSEServer.prototype.broadcast = function(event, data) {
    var id = ++this._lastMessageId;
    this._clients.forEach(this._send.bind(this, id, event, data));
};

/**
 * Add a connection to broadcast messaging
 * @param {string} username - username of client
 * @param {Object} connection - SSE connection to client
 */
SSEServer.prototype._addClient = function(username, connection) {
    var client = new Client(username, connection);
    this._clients.push(client);
    this.broadcast('connections', this._clients.length.toString(10));
    debug('info', username + ' connected to ' + this.name + ' event source.');
    return client;
};

/**
 * Remove a client from broadcast messaging
 * @param {Client} client - client to remove
 */
SSEServer.prototype._removeClient = function(client) {
    var index = this._clients.indexOf(client);
    if (index !== -1) {
        this._clients.splice(index, 1);
        this.broadcast('connections', this._clients.length.toString(10));
        debug('info', client.username + ' disconnected from ' + this.name + ' event source.');
    }
};

/**
 * Send an event to just one client
 * @param {number} id - message ID
 * @param {string} event - event type
 * @param {Object} data - object to send
 * @param {Object} client - client connection aka express response object
 */
SSEServer.prototype._send = function(id, event, data, client) {
    client.connection.write('id: ' + id + '\n');
    client.connection.write('event: ' + event + '\n');
    client.connection.write('data: ' + JSON.stringify(data) + '\n');
    client.connection.write('\n');
};

/**
 * Send heartbeat every 10 seconds
 */
SSEServer.prototype._heartBeat = function() {
    this.broadcast('heartbeat', {time: Date.now()});
    setTimeout(this._heartBeat.bind(this), 10000);
};

module.exports = SSEServer;
