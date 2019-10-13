import io from 'socket.io-client';

import {host, servicePort} from '../../../config.json';

interface Query {
  token: string,
}

interface Options {
  query: Query,
  transports: string[]
}

interface User {
  userId?: string;
  username: string;
};

export interface Notification {
  message: string;
};

export const Socket = (token:string) => {
  if (!token) return null;

  const options:Options = {
    query: {
      token: token
    },
    transports: ['websocket']
  };
  return io(`${host}:${servicePort}/notification`, options);
};