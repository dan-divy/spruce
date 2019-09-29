import {apiEndpoint} from '../../config.json';
import * as Auth from './authentication';
import * as Http from './http';

export interface Community {
  _id: string;
  name: string;
  private: boolean;
};

export const LeaveCommunity = (data) => {
  // TODO
  console.log('leave comm')
  console.log(data.getAttribute('data-id'))
};


/**
 * Fetch the communities available to the user
 *
 * @return  {Community} community[], list of communitites
 */
export const GetAvailableCommunities = async () => {
  const token = Auth.readToken();
  if (!token) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const res = await Http.get<Community[]>(`${apiEndpoint}/community/available`, new Headers(headers));

  return res.parsedBody;
};

/**
 * Create or join community
 *
 * @return  {Community} community, new/joined community
 */
export const CreateJoinCommunity = async (body:any) => {
  const token = Auth.readToken();
  if (!token) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const res = await Http.post<Community>(`${apiEndpoint}/community`, new Headers(headers), body);
  return res.parsedBody;
};
