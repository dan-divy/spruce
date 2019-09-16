import {apiEndpoint} from '../../config.json';
import * as Auth from './authentication';
import * as Http from './http';

export interface Token {
  token: string;
  error: string;
};

/**
 * Fetch a new access token
 *
 * @return  {string} token Token
 */
export const GetNewToken = async () => {
  const refreshToken = Auth.readToken('refresh');
  if (!refreshToken) return null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${refreshToken}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const res = await Http.get<Token>(`${apiEndpoint}/auth/access`, new Headers(headers));
  const resBody = res.parsedBody;
  if (resBody.token) {
    return resBody.token;
  }
  if (resBody.error) {
    console.log(resBody.error);
  }
  return null;
};