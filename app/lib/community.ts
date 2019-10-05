import {apiEndpoint} from '../../config.json';
import {Context} from './context';

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
export const getAvailableCommunities = async (context:Context) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };

  try {
    const res = await Http.get<Community[]>(`${apiEndpoint}/community/available`, new Headers(Http.authHeader(token)));
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
export const createJoinCommunity = async (context:Context, body:any) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };

  try {
    const res = await Http.post<Community>(`${apiEndpoint}/community`, new Headers(Http.authHeader(token)), body);
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
export const getCommunity = async (context:Context, communityId:string) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };
  if (!communityId) return { error: 'Missing community ID.' };

  try {
    const res = await Http.get<Community>(`${apiEndpoint}/community/${communityId}`, new Headers(Http.authHeader(token)));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};