import io from 'socket.io-client';

import {apiEndpoint} from '../../../config.json';

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
    //autoConnect: false,
    query: {
      token: token
    },
    transports: ['websocket']
  };
  // omitting url has issues with webpack-dev server
  return io('http://localhost:60702/chat', options);
};