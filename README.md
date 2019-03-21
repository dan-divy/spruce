[![leaflet-banner](./public/images/logo/banner.png)](http://passportjs.org)

Leaflet is a 

**Deployed on Amazon EC2-instance [here](http://mygurukulonline.in)**

## Requirements

* Node.js   
	- expressjs [ExpressJS HTTP middleware](https://npmjs.org/package/express)	
	- ejs [Embedded JavaScript templates](https://npmjs.org/package/ejs)		
* MongoDB

```bash
$ [sudo] apt install nodejs
$ [sudo] apt install mongodb
```

## Installation
```bash
$ git clone https://github.com/DivySrivastava/leaflet
$ cd leaflet
$ npm i
```

## Usage
   
First start the MongoDB server 

```bash
$ sudo service mongod start 
```
or 
```bash
$ mongod &
```
and then start the leaflet server with <code> node.js </code> 

```bash
$ npm start
```   
or
```bash
$ node ./bin/www
```   

## Authors
 - [Divy Srivastava](http://instagram.com/undefined_void)

## License

(The MIT License)

Copyright (c) 2019 Divy Srivastava <dj.srivastava23@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 
 