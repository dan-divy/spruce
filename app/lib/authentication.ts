var jwt = require('jsonwebtoken');

import {apiEndpoint, name} from '../../config.json';
import {User} from './user';
import {Token} from './token';
import * as auth from './authentication';
import * as http from './http';

export const FACEBOOK = 'facebook';
export const GOOGLE = 'google';
export const TWITTER = 'twitter';

/**
 * Read access token
 *
 * @param  {string} type, optional, defaults to 'access'. 'access' and 'refresh' are acceptable 
 * @return  {string} Access token
 */
export const readToken = (type = 'access') => {
  var token = '';
  if ((type.toLowerCase() != 'access') && (type.toLowerCase() != 'refresh')) return null;
  var name = `${type.toLowerCase()}=`;

  const decodedCookie = decodeURIComponent(document.cookie);

  const ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      token = c.substring(name.length, c.length);
    }
  }
  return token;
};

/**
 * Save token to cookie
 *
 * @param  {string} type Type of token
 * @param  {string} token Token
 * @param  {long}   exp (s) Expiration of token in seconds
 * @param  {object} done Callback once complete
 */
export const saveToken = (token, type = 'access', exp = 0) => {
  const d = new Date();
  d.setTime(exp * 1000);
  var cookieStr = type + '=' + token + ';';
  if (exp) cookieStr += 'expires=' + d.toUTCString() + ';';
  document.cookie = cookieStr + 'path=/';
};

/**
 * Clear tokens from cookies to log out locally
 */
export const clearTokens = () => {
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "")
                       .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

/**
 * Check for valid session, valid refresh token
 *
 * @return  {boolean} True for valid session
 */
export const validSession = () => {
  const refreshToken = readToken('refresh');
  if (isExpired(refreshToken)) {
    return false;
  }
  return true;
};

/**
 * Decode Access Token
 *
 * @param   {string} type, access or refresh
 * @return  {object} Context object
 */
export const decodeToken = async (token) => {
  try {
    return await jwt.decode(token);
  } catch (err) {
    return null;
  }
};

/**
 * Evaluates if token is expired
 *
 * @param  {string} token Token
 * @param  {int} offset Optional offset to prevent the client from using an expired token.
 * @return  {boolean} true if token is expired or errors.
 */
export const isExpired = (token, offset = 60) => {
  if (!token) {
    return true;
  }
  try {
    const tokenObj = jwt.decode(token);
    const now = Date.now().valueOf() / 1000
    // If the token doesn't have an expiration OR it is expired
    if (typeof tokenObj.exp === 'undefined' || tokenObj.exp < (now - offset)) {
      return true;
    }
    /* If the token does have Not BeFore attribute and that is before now
    if (typeof tokenObj.nbf !== 'undefined' && tokenObj.nbf > now) {
      return true;
    }*/
    return false;
  } catch (err) {
    return true;
  }
};

/**
 * Register a new user
 *
 * @param   {NewUser} newUser object
 * @return  {string} token Token
 */
export const register = async (newUser:User) => {
  if (!newUser) return null;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await http.post<Token>(`${apiEndpoint}/user`, new Headers(headers), newUser);
    const resBody = res.parsedBody;
    if (resBody.token) {
      return resBody.token;
    }
    return null;
  } catch (res) {
    console.log('Register Error ', res)
    return null;
  }
};

/**
 * Login
 *
 * @return  {string} token Token
 */
export const login = async (email: string, password: string) => {
  if (!email || !password) return null;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8'
  };

  const body = {
    email: email,
    password: password
  }

  try {
    const res = await http.post<Token>(`${apiEndpoint}/auth`, new Headers(headers), body);
    const resBody = res.parsedBody;
    if (resBody.token) {
      return resBody.token;
    }
    return null;
  } catch (res) {
    console.log('Login Error ', res)
    return null;
  }
};

/**
 * Logout
 *
 */
export const logout = async () => {
  const token = auth.readToken();

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8'
  };

  try {
    const res = await http.get<void>(`${apiEndpoint}/auth/logout`, new Headers(headers));
  } catch (res) {

  }
};

/**
 * Social media signon
 */
export const socialSignon = (provider) => {
  console.log(provider);
}