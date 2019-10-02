import {apiEndpoint} from '../../config.json';
import * as Auth from './authentication';
import * as Http from './http';

export interface Community {
  _id: string;
  name: string;
  chatroom: string;
};

/**
 * Fetch the community chatrooms available to the user
 *
 * @return  {Community} community[], list of communitites
 */
export const GetCommunityChatrooms = async () => {
  const token = Auth.readToken();
  if (!token) return { error: 'Token not found' };

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.get<Community[]>(`${apiEndpoint}/chat/community`, new Headers(headers));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }

};

/**
 * Fetch the community name
 * @params  {string} chatroomId
 * @return  {string} community name
 */
export const GetCommunityName = async (chatroomId:string) => {
  const token = Auth.readToken();
  if (!token) return { error: 'Token not found' };

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.get<Community[]>(`${apiEndpoint}/chat/community/name/${chatroomId}`, new Headers(headers));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};
