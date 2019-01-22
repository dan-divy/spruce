#! /usr/bin/env node

'use strict';

const pkcs7 = require('../dist/pkcs7.cjs.js');
const fs = require('fs');
const path = require('path');

const userArgs = process.argv;

if (userArgs.indexOf('-h') !== -1 || userArgs.indexOf('--help') !== -1) {
  // eslint-disable-next-line
  console.log('usage: pkcs7');
  // eslint-disable-next-line
  return console.log('pkcs7 expects input on stdin and outputs to stdout');
}

if (userArgs.indexOf('-v') !== -1 || userArgs.indexOf('--version') !== -1) {
  // eslint-disable-next-line
  return console.log(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'))).version);
}

const data = [];

process.stdin.on('readable', function() {
  const chunk = process.stdin.read();

  if (chunk !== null) {
    data.push(chunk);
  }
});

process.stdin.on('end', function() {
  const buffer = Buffer.concat(data);
  const bytes = new Uint8Array(buffer.length);
  let i = buffer.length;

  while (i--) {
    bytes[i] = buffer[i];
  }

  // output the padded input
  process.stdout.write(new Buffer(pkcs7.pad(bytes)));
});
