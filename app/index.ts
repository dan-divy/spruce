import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap-social/bootstrap-social.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import 'bootstrap';
import 'jquery';
import './style.css'

//var jwt = require('jsonwebtoken');

import {apiEndpoint, name} from '../config.json';
// Libraries
import * as Auth from './lib/authentication';
import * as Comm from './lib/community';
import * as Http from './lib/http';
import * as Post from './lib/post';
import * as Token from './lib/token';
import * as User from './lib/user';
import * as Utils from './lib/utils';
// Templates
import * as admin from './templates/admin';
import * as main from './templates/main';
import * as profile from './templates/profile';

var refreshContext = false;

/**
 * Show an alert to the user
 */
const showAlert = (message, type = 'danger') => {
  const alertElement = document.getElementById('app-alerts');
  const html = main.alert({ type, message });
  alertElement.insertAdjacentHTML('beforeend', html);
}

/**
 * Fetch error handler
 * Parses the JSON returned by a network request
 * @param  {object} response A fetch response
 */
const handleErrors = async (response) => {
  if (!response.ok) {
    const resJSON = await response.json();
    showAlert(resJSON.message);
  }
}

/**
 * Use window location hash to show the specified view
 */
const showView = async () => {
  const navbarElement = document.getElementById('app-navbar');
  const tabsElement = document.getElementById('app-tabs');
  const mainElement = document.getElementById('app-main');  
  const postElement = document.getElementById('app-post');  
  const [view, ...params] = window.location.hash.split('/');
  var context:User.Context;

  const buildContext = async () => {
    if (Auth.validSession()) {
      var token = Auth.readToken();
      if (!token || Auth.isExpired(token) || refreshContext) {
        token = await Token.GetNewToken();
        Auth.saveToken(token);
      }
      context = await Auth.decodeToken(token);
      refreshContext = false;
    }

    // temp - for troubleshooting
    if (Auth.isExpired(token)) {
      alert('error, expired token')
    }
    console.log('build context ', context)
    // END temp

    navbarElement.innerHTML = '';
    tabsElement.innerHTML = '';
  }

  await buildContext();
  switch (view) {
    case '#admin':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({name, context});
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.landing();      
      break;
    case '#admin-user':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({name, context});
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.user();      
      break;
    case '#admin-collection':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({name, context});
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.collection();      
      break;
    case '#admin-file':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({name, context});
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.files();      
      break;
    case '#admin-notification':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({name, context});
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.notification();      
      break;
    case '#register':
      if (Auth.validSession()) return window.location.hash = '#main';

      mainElement.innerHTML = main.register();
      const firstnameInput = <HTMLInputElement>document.getElementById('firstname');
      const lastnameInput = <HTMLInputElement>document.getElementById('lastname');
      const usernameInput = <HTMLInputElement>document.getElementById('username');
      const emailnameInput = <HTMLInputElement>document.getElementById('email')
      const passwordInput = <HTMLInputElement>document.getElementById('password');
      const password2Input = <HTMLInputElement>document.getElementById('password2');

      const registerForm = document.forms['form-register'];
      registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (passwordInput.value != password2Input.value) {
          showAlert('Passwords do not match.');
          password2Input.focus();
        } else {
          const newUser:User.User = {
            firstname: firstnameInput.value,
            lastname: lastnameInput.value,
            username: usernameInput.value,
            email: emailnameInput.value,
            password: passwordInput.value
          }
          const refreshToken = await Auth.register(newUser);
          if (refreshToken) {
            Auth.saveToken(refreshToken, 'refresh');
            window.location.hash = '#main';
          }
        }
      });
      break;
    case '#login':
      if (Auth.validSession()) return window.location.hash = '#main';

      mainElement.innerHTML = main.login();
      const btnFacebook = <HTMLButtonElement>document.getElementById('button-facebook');
      btnFacebook.onclick = () => Auth.socialSignon(Auth.FACEBOOK);
      const btnGoogle = <HTMLButtonElement>document.getElementById('button-google');
      btnGoogle.onclick = () => Auth.socialSignon(Auth.GOOGLE);
      const btnTwitter = <HTMLButtonElement>document.getElementById('button-twitter');
      btnTwitter.onclick = () => Auth.socialSignon(Auth.TWITTER);
      const signinForm = document.forms['form-signin'];

      signinForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const refreshToken = await Auth.login(
            (<HTMLInputElement>document.getElementById('email')).value,
            (<HTMLInputElement>document.getElementById('password')).value
          );
        if (refreshToken) {
          Auth.saveToken(refreshToken, 'refresh');
          window.location.hash = '#main';
        }
      });
      break;
    case '#logout':
      Auth.logout();
      context = null;
      Auth.clearTokens()
      window.location.hash = '#login';
      break;
    case '#main':
      if (!Auth.validSession()) return window.location.hash = '#login';

      /**
       * Prepends post
       * Adds a post to the main view
       * @param  {Post} post message
       */
      const prependPost = async (post:Post.Post) => {
        const msgBody = document.createElement('p');
        const node = document.createTextNode(`${post.user.username}: ${post.message_body}`);
        msgBody.appendChild(node);
        const msgTime = document.createElement('p');
        const datetime = document.createTextNode(`@ ${Utils.FormatDate(post.created_at)} `);
        msgTime.appendChild(datetime);
        postContainer
        .prepend(msgTime);
        postContainer
        .prepend(msgBody);
      };
      
      /**
       * Appends post
       * Adds a post to the main view
       * @param  {Post} post message
       */
      const appendPost = async (post:Post.Post) => {
        const msgBody = document.createElement('p');
        const node = document.createTextNode(`${post.user.username}: ${post.message_body}`);
        msgBody.appendChild(node);
        const msgTime = document.createElement('p');
        const datetime = document.createTextNode(`@ ${Utils.FormatDate(post.created_at)} `);
        msgTime.appendChild(datetime);
        postContainer
        .append(msgBody);
        postContainer
        .append(msgTime);
      };

      navbarElement.innerHTML = main.navbar({name, context});
      tabsElement.innerHTML = main.tabs({context});
      mainElement.innerHTML = main.welcome({context});

      var postContainer = <HTMLElement>document.getElementById('postContainer');
      const posts = await Post.GetPosts(new Date().toISOString());
      posts.forEach(post => appendPost(post));

      const buttonPost = <HTMLButtonElement>document.getElementById('button-post');
      buttonPost.addEventListener('click', event => {
        if (postElement.innerHTML == '') {
          postElement.innerHTML = main.postInput();

          const buttonSend = <HTMLButtonElement>document.getElementById('button-send');
          buttonSend.addEventListener('click', async event => {
            console.log('send')
            // send the message to the server; success = append to top of view
            const message_body = (<HTMLInputElement>document.getElementById('message_body')).value;
            if (message_body.length) {
              const result = await Post.CreatePost({message_body});
              prependPost(result);
            }
          });
        } else {
          postElement.innerHTML = '';
        }
      });

      break;
    case '#profile':
      navbarElement.innerHTML = main.navbar({name, context});
      const resProfile = await User.GetProfile();
      const resAvailComms = await Comm.GetAvailableCommunities();
      mainElement.innerHTML = profile.profile({name, context, profile: resProfile});

      const inputNewCommunity = <HTMLInputElement>document.getElementById('newCommunity');
      const communityDatalist = <HTMLInputElement>document.getElementById('communityList');
      const btnNewCommunity = <HTMLButtonElement>document.getElementById('btnCreateNewCommunity');
      const communityTable = <HTMLTableElement>document.getElementById('communityTable');
      const listCommunity = (community:Comm.Community) => {
        const row = communityTable.insertRow(1);
        const cellName = row.insertCell(0);
        const cellLeave = row.insertCell(1);

        cellName.innerHTML = `<a href="#community/${community._id}">${community.name}</a>`;
        // Not sure how I did this before. Use a table event listener?
        cellLeave.innerHTML = `<button class="btn delete" data-id="${community._id}">Leave(TODO)</button>`;
      };
      context.community.forEach(item => {
        listCommunity(item);
      })

      if (resAvailComms) {
        resAvailComms.forEach(item => {
          //listCommunity(item);
          const option = document.createElement('option');
          option.value = item.name;
          communityDatalist.appendChild(option);
        });
      }
      inputNewCommunity.addEventListener('input', event => {
        //if input is in resAvailComms change button to join
        var match = false;
        resAvailComms.forEach(item => {
          if (item.name.toLowerCase() == inputNewCommunity.value.toLowerCase()) {
            match = true;
          }
        });
        if (match) {
          btnNewCommunity.innerHTML = 'Join';
        } else {
          btnNewCommunity.innerHTML = 'Create';
        }
      });
      btnNewCommunity.onclick = async () => {
        const body = {
          name: inputNewCommunity.value,
          private: false
        }
        const result = await Comm.CreateJoinCommunity(body);
        if (result._id) {
          // append to current list
          inputNewCommunity.value = '';
          listCommunity(result);
          context.community.push(result);
          refreshContext = true;
        }
      };
      break;
    default:
      // Unrecognized view
      window.location.hash = '#main';
  }
};

(() => {
  document.body.innerHTML = main.main();

  window.addEventListener('hashchange', showView, false);
  showView().catch(err => window.location.hash = '#main');
})();

