# Welcome

![](.gitbook/assets/banner.png)

Spruce is a tiny but powerful open-source social networking platform made with Node.js and MongoDB. 

[![Gitter](https://badges.gitter.im/spruce-social/community.svg)](https://gitter.im/spruce-social/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/fae0af1cd8784133bdb3e86727e3ff2a)](https://www.codacy.com/app/DivySrivastava/spruce?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=DivySrivastava/spruce&amp;utm_campaign=Badge_Grade) ![](https://img.shields.io/badge/license-MIT-green.svg) ![](https://api.travis-ci.org/DivySrivastava/spruce.svg?branch=master)

_Deployed_ [_here_](http://spruce.dancodes.online)

Get the live MongoDB stats out [here](https://cloud.mongodb.com/freemonitoring/cluster/SQXXT6OAMR757LIEYJRN3WDUCIRAEYYV).

![](.gitbook/assets/intro.gif)

## Features

* Sign in using local authentication, Instagram or Google.
* Search for your other users.
* Chat with your friends in realtime.
* All feeds divided into 3 categories 
  * thoughts \(tweets\)
  * events \(location can be specified\)
  * moments \(personal post\)
* Like and comment on a feed.
* View your/others profile.
* Follow a particular user and get notified for his/her activities.
* Change your profile picture, bio, people who follow you etc.

And a lot more to be added soon...

## To Do's

* Activity feature for user to see follow requests and his/her daily activity.
* Notifications

## Requirements

* [Node.js](https://nodejs.org)  
  * expressjs [ExpressJS HTTP middleware](https://npmjs.org/package/express)
  * ejs [Embedded JavaScript templates](https://npmjs.org/package/ejs)        
* [MongoDB](http://mongodb.org)

## Installation

Clone the repo locally then install all the dependencies using [NPM](https://npmjs.org/)

```bash
$ git clone https://github.com/dan-divy/spruce.git
$ cd spruce
$ npm i
```

## Local Development

To sign/verify the access tokens public/private RSA keys need to be generated. Paths to the cert and key must be noted in config.json.

Before running, you need to add the social media API Credentials to the project. In the config.json file you will find `google`, `facebook` and `instagram` client/secret pairs. You need to add the `clientId`, and `secret` with your own API credentials

```javascript
/** REPLACE YOUR API CREDENTIALS HERE **/
      "clientID": "<client id>",
      "secret"  : "<client secret>",
```

Now Replace the `<host>` & `<port>` with the redirect uri specified in the [Instagram API Dashboard](https://www.instagram.com/developer) and [Google API Dashboard](https://developers.google.com). Default is `http://localhost:80/account/oauth`.

Finally start the MongoDB server in a seperate bash/pm2

```bash
$ mongod
```

and then start the spruce server via `npm`.

```bash
$ npm start
```

## To know

spruce uses [mongoose](https://npmjs.org/package/mongoose) as an ORM for performing CRUD operations on MongoDB and [express.js](https://npmjs.com/package/express) for server-side HTTP routing.

NGINX site example for reverse proxy of TLS/SSL connections with Socket.IO websockets:

server {
    listen 8443 ssl;

    server_name <{fully qualified domain name}>;
    ssl_certificate     /etc/ssl/certs/chain.pem; # The certificate file
    ssl_certificate_key /etc/ssl/private/server.key; # The private key file
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;

        proxy_pass http://127.0.0.1:8080;
        proxy_redirect off;

        # Socket.IO Support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}


**This project needs contributors!!**

## Authors

* [Divy Srivastava](http://github.com/DivySrivastava)
* [Dan](https://github.com/dan-online)
* [Robert](https://github.com/rburckner)

## License

\(The MIT License\)

Copyright \(c\) 2019 Divy Srivastava [dj.srivastava23@gmail.com](mailto:dj.srivastava23@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files \(the 'Software'\), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

