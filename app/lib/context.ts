import * as AuthLib from './authentication';
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

export const invalidSession = async () => {
  const refreshToken = AuthLib.readToken(AuthLib.REFRESH);

  if (AuthLib.isExpired(refreshToken)) return true;

  return await AuthLib.RevokedRefreshToken(refreshToken);
};

export const buildContext = async () => {
  const refreshToken = AuthLib.readToken(AuthLib.REFRESH);

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

/*
  const buildContext = async () => {
    if (validSession()) {
      var token = AuthLib.readToken();

      if (!token || AuthLib.isExpired(token) || shouldRefreshContext) {
        const tokenResponse = await AuthLib.getNewToken();
        if (noErrors(tokenResponse)) {
          AuthLib.saveToken(tokenResponse.token);
        }
      }
      const contextResponse = await AuthLib.decodeToken(AuthLib.readToken());
      if (noErrors(contextResponse)) {
        context = contextResponse.context;
        shouldRefreshContext = false;
      }
    }
  };
*/
/*
export const decodeContext = async (refreshToken:string) => {
  const response = await AuthLib.decodeToken(refreshToken);

  var context:Context;

  if (!response) {
   context.error = 'Could not decode access token.';
   return context;
  }
  context = response.context;
  context.shouldRefreshContext = false;
    console.log('decodeContext', context)

  return context;
};*/