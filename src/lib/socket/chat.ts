import io from 'socket.io-client';

import {apiEndpoint, host, servicePort} from '../../../config.json';

interface Query {
  token: string,
}

interface chatOptions {
  autoConnect?: boolean,
  query: Query,
  transports: string[]
}

interface User {
  userId?: string;
  username: string;
};

export interface Message {
  message_body: string;
  user?: User;
  sent_at?: Date;
};

export const Socket = (token:string) => {
  if (!token) return null;

  const options:chatOptions = {
    query: {
      token: token
    },
    transports: ['websocket']
  };
  return io(`${host}:${servicePort}/chat`, options);
};