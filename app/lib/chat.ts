import {apiEndpoint} from '../../config.json';
import {Context} from './context';
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
export const GetCommunityChatrooms = async (context:Context) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };

  try {
    const res = await Http.get<Community[]>(`${apiEndpoint}/chat/community`, new Headers(Http.authHeader(token)));
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
export const GetCommunityName = async (context:Context) => {
  const token = context.token;
  const chatroomId = context.chatroomId;
  if (!token || !chatroomId) return { error: 'Token or Chatroom ID not found in page context.' };

  try {
    const res = await Http.get<Community[]>(`${apiEndpoint}/chat/community/name/${chatroomId}`, new Headers(Http.authHeader(token)));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};
