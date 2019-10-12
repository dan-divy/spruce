import io from 'socket.io-client';

import {apiEndpoint} from '../../../config.json';

export const Socket = (token:String) => {

  // omitting url has issues with webpack-dev server
  return io('http://localhost:60702', {
    query: {
      token: token
    },
    transports: ['websocket']
  });
}