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

export interface Collection {

};

/**
 * Fetch a collection
 *
 * @return  {[Collection]} collection[], list of files
 */
export const GetCollection = async (context:Context, pageNumber:Number = 1, filesPerPage:Number = 25) => {
  const token = context.token;
  const collectionId = context.collectionId;
  if (!token || !collectionId) return { error: 'Token/collectionId not found in page context.' };

  var query = '?';
  query += `collectionId=${collectionId}&pageNumber=${pageNumber}&filesPerPage=${filesPerPage}`;

  try {
    const res = await Http.get<Collection[]>(`${apiEndpoint}/collection${query}`, new Headers(Http.authHeader(token)));
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};

/**
 * Create new collection
 *
 * @return  {Collection} collection
 */
export const CreateCollection = async (context:Context, body:any) => {
  const token = context.token;
  const communityId = context.communityId;
  const name = body.name;
  if (!token || !name || !communityId) return { error: 'Token/communityId/name not found.' };

  body.communityId = communityId;

  try {
    const res = await Http.post<Collection>(`${apiEndpoint}/collection`, new Headers(Http.authHeader(token)), body);
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
};
