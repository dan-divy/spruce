[![leaflet-banner](./public/images/logo/banner.png)](http://mygurukulonline.in)

Leaflet is a tiny but powerful open-source social networking platform made with Node.js and MongoDB

_Deployed on an Amazon EC2 instance [here](http://mygurukulonline.in)_


## Features

* Sign in using local authentication or using your Instagram account.
* Search for your other users.
* All feeds divided into 3 categories -
	* thoughts (tweets)
	* events (location can be specified)
	* moments (personal post)
* Like and comment on a feed.
* View your/others profile.
* Follow a particular user and get notified for his/her activities.
* Change your profile picture, bio, people who follow you etc.
* Chat one-one or create a room/group.
* Some extras (games)
And a lot more to be added soon...

## Requirements

* [Node.js](https://nodejs.org)  
	- expressjs [ExpressJS HTTP middleware](https://npmjs.org/package/express)	
	- ejs [Embedded JavaScript templates](https://npmjs.org/package/ejs)		
* [MongoDB](http://mongodb.org)


## Installation

Clone the repo locally then install all the dependencies using [NPM](https://npmjs.org/)

```bash
$ git clone https://github.com/DivySrivastava/leaflet
$ cd leaflet
$ npm i
```

## Usage
   
First start the MongoDB server 
```bash
$ mongod
```
and then start the leaflet server with ```nodejs```
```bash
$ npm start
```   
## To know

leaflet uses [mongoose](https://npmjs.org/package/mongoose) as a ORM for performing CRUD operations on MongoDB and [express.js](https://npmjs.com/package/express) for server-side HTTP routing.

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

 
 