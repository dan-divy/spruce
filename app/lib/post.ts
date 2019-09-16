import {apiEndpoint} from '../../config.json';
import * as auth from './authentication';
import * as http from './http';

interface User {
  username: string;
};

interface File {
  fileUrl: string;
};

export interface Post {
  _id: string;
  user: User;
  message_body: string;
  file: File;
  created_at: Date;
};

/**
 * Fetch current posts
 *
 * @return  {Post} community[], list of communitites
 */
export const GetPosts = async (pointInTime?:string, pageNumber:Number = 1, postsPerPage:Number = 25) => {
  const token = auth.readToken();
  if (!token) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  var query = '?';
  if (pointInTime) {
    query += `pointInTime=${encodeURIComponent(pointInTime)}&`;
  }
  query += `pageNumber=${pageNumber}&postsPerPage=${postsPerPage}`;

  const res = await http.get<Post[]>(`${apiEndpoint}/post${query}`, new Headers(headers));
  return res.parsedBody;
};

/**
 * Create new post
 *
 * @return  {Community} community, new/joined community
 */
export const CreatePost = async (body:any) => {
  const token = auth.readToken();
  if (!token) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const res = await http.post<Post>(`${apiEndpoint}/post`, new Headers(headers), body);
  return res.parsedBody;
};
