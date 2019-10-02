import {apiEndpoint} from '../../config.json';
import {Community} from './community'
import * as Auth from './authentication';
import * as Http from './http';

export interface Context {
  admin: boolean;
  community: Community[];
  sessionId: string;
  userId: string;
  username: string;
  error?: string;
};

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
export const GetProfile = async () => {
  const token = Auth.readToken();
  if (!token) return { error: 'Token not found' };

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.get<Profile>(`${apiEndpoint}/user/profile`, new Headers(headers));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};
