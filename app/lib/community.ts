import {apiEndpoint} from '../../config.json';
import * as auth from './authentication';
import * as http from './http';

export interface Community {
  _id: string;
  name: string;
  private: boolean;
};

export const LeaveCommunity = (data) => {
  console.log('leave comm')
  console.log(data.getAttribute('data-id'))
};


/**
 * Fetch the communities available to the user
 *
 * @return  {Community} community[], list of communitites
 */
export const GetAvailableCommunities = async () => {
  const token = auth.readToken();
  if (!token) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const res = await http.get<Community[]>(`${apiEndpoint}/community/available`, new Headers(headers));

  return res.parsedBody;
};

/**
 * Create or join community
 *
 * @return  {Community} community, new/joined community
 */
export const CreateJoinCommunity = async (body:any) => {
  const token = auth.readToken();
  if (!token) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const res = await http.post<Community>(`${apiEndpoint}/community`, new Headers(headers), body);
  return res.parsedBody;
};
