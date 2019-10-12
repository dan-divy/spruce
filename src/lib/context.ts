import * as AuthLib from './authentication';
import * as Http from './http';
import * as UserLib from './user';
import {Community} from './community'

export interface Context {
  // Token populated variables
  admin: boolean;
  community: Community[];
  sessionId: string;
  userId: string;
  username: string;
  // Non-token populated variable
  error: string;
  token: string;
  shouldRefreshContext: boolean;
  collectionId:string;
  communityId:string;
  chatroomId:string;
  fileId:string;
};

export interface APIVersion {
  apiVersion?:string;
  error?:any;
}

export const invalidSession = async () => {
  const refreshToken = AuthLib.readToken();

  if (AuthLib.isExpired(refreshToken)) return true;

  return await AuthLib.RevokedRefreshToken(refreshToken);
};

export const buildContext = async () => {
  const refreshToken = AuthLib.readToken();

  var context:Context;

  if (refreshToken == '') {
    context.error = 'Refresh token is empty. Cannot build context.';
    return context;
  };

  const response = await AuthLib.getNewToken(refreshToken);
  if (response.error) {
    context.error = response.error;
    return context;
  }

  if (response.token) {
    const decodeResponse = await AuthLib.decodeToken(response.token);
    if (decodeResponse.error) {
      context.error = decodeResponse.error;
      return context;
    }

    if (decodeResponse.context) {
      context = decodeResponse.context;
      context.token = response.token;
      return context;
    }
  }
  context.error = 'Could not build context.'
  return context;
};

export const setRefreshContext = (context:Context) => {
  context.shouldRefreshContext = true;
};

export const getToken = (context:Context) => {
  return context.token;
};

export const logout = (context:Context) => {
  AuthLib.logout(context);
  context = null;
};

/**
 * Get API version
 *
 */
export const getAPIVersion = async () => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await Http.get<APIVersion>(`/api/version`, new Headers(headers));
    if (res.parsedBody.apiVersion) {
      return res.parsedBody;
    }
    return { error: 'API version not present' };
  } catch (err) {
    return { error: err };
  }
};