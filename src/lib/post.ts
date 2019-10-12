import {apiEndpoint} from '../../config.json';
import {Context} from './context';
import * as Auth from './authentication';
import * as Http from './http';

interface User {
  username: string;
};

interface File {
  fileUrl: string;
};

export interface Post {
  _id?: string;
  user?: User;
  message_body?: string;
  file?: File;
  created_at?: Date;
  error?:string;
};

/**
 * Fetch current posts
 *
 * @return  {Post} community[], list of communitites
 */
export const GetPosts = async (context:Context, pointInTime?:string, pageNumber:Number = 1, postsPerPage:Number = 25) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };

  var query = '?';
  if (pointInTime) {
    query += `pointInTime=${encodeURIComponent(pointInTime)}&`;
  }
  query += `pageNumber=${pageNumber}&postsPerPage=${postsPerPage}`;

  try {
    const res = await Http.get<Post[]>(`${apiEndpoint}/post/set${query}`, new Headers(Http.authHeader(token)));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};

/**
 * Create new post
 *
 * @return  {Community} community, new/joined community
 */
export const CreatePost = async (context:Context, body:Post) => {
  const token = context.token;
  if (!token) return { error: 'Token not found in page context.' };

  try {
    const res = await Http.post<Post>(`${apiEndpoint}/post`, new Headers(Http.authHeader(token)), body);
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};
