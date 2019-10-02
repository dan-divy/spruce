import {apiEndpoint} from '../../config.json';
import * as Auth from './authentication';
import * as Http from './http';

export interface Community {
  _id: string;
  name: string;
  private: boolean;
  collections: string[];
};

export const leaveCommunity = (data) => {
  // TODO
  console.log('leave comm')
  console.log(data.getAttribute('data-id'))
};


/**
 * Fetch the communities available to the user
 *
 * @return  {Community} community[], list of communitites
 */
export const getAvailableCommunities = async () => {
  const token = Auth.readToken();
  if (!token) return { error: 'Token not found' };

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.get<Community[]>(`${apiEndpoint}/community/available`, new Headers(headers));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};

/**
 * Create or join community
 *
 * @return  {Community} community, new/joined community
 */
export const createJoinCommunity = async (body:any) => {
  const token = Auth.readToken();
  if (!token) return { error: 'Token not found' };

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.post<Community>(`${apiEndpoint}/community`, new Headers(headers), body);
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};

/**
 * Fetch community as an object
 *
 * @return  {Community} community
 */
export const getCommunity = async (communityId:string) => {
  const token = Auth.readToken();
  if (!token) return { error: 'Token not found' };
  if (!communityId) return { error: 'Missing community ID.' };

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.get<Community>(`${apiEndpoint}/community/${communityId}`, new Headers(headers));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};