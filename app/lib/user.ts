import {apiEndpoint} from '../../config.json';
import {Context} from './context';
import * as Auth from './authentication';
import * as Http from './http';


export interface User {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
};

interface Follower {
  _id: string;
  username: string;
};

export interface Profile {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  bio: string;
  followers: Follower[];
  lastLogin: string;
  error?: string;
};

/**
 * Fetch a user's profile
 *
 * @return  {Profile} profile, a users profile
 */
export const GetProfile = async (context:Context) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };

  try {
    const res = await Http.get<Profile>(`${apiEndpoint}/user/profile`, new Headers(Http.authHeader(token)));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};
