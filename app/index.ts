import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap-social/bootstrap-social.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import 'bootstrap';
import 'jquery';
import './style.css'
import Socket from 'socket.io-client';


import {apiEndpoint, name} from '../config.json';
// Libraries
import * as AuthLib from './lib/authentication';
import * as ChatLib from './lib/chat';
import * as CommLib from './lib/community';
//import * as HttpLib from './lib/http';
import * as PostLib from './lib/post';
import * as TokenLib from './lib/token';
import * as UserLib from './lib/user';
import * as Utils from './lib/utils';
// Socket Libraries
import * as Chat from './lib/socket/chat';

// Templates
import * as admin from './templates/admin';
import * as chat from './templates/chat';
import * as main from './templates/main';
import * as profile from './templates/profile';

var refreshContext = false;
var chatNsp:Socket;

/**
 * Show an alert to the user
 */
const showAlert = (message, type = 'danger') => {
  const alertElement = document.getElementById('app-alerts');
  const html = main.alert({ type, message });
  alertElement.insertAdjacentHTML('beforeend', html);
}

/**
 * Handle errors in each response JSON object
 * @param  {object} response A fetch response
 */
const noErrors = (response) => {
  if (response.error) {
    showAlert(response.error);
  }
  return !response.error;
}

/**
 * Use window location hash to show the specified view
 */
const showView = async () => {
  const alertElement = document.getElementById('app-alerts');
  const navbarElement = document.getElementById('app-navbar');
  const tabsElement = document.getElementById('app-tabs');
  const mainElement = document.getElementById('app-main');  
  const postElement = document.getElementById('app-post');

  // params ex. /#chat/room/5d8cfa2c3b36e84a1e47dff9
  // [params]; params[0] = resource, params[1] = id
  const [view, ...params] = window.location.hash.split('/');

  var context:UserLib.Context;
  var chatroomId:string;

  const buildContext = async () => {
    if (AuthLib.validSession()) {
      var token = AuthLib.readToken();
      if (!token || AuthLib.isExpired(token) || refreshContext) {
        token = await TokenLib.GetNewToken();
        AuthLib.saveToken(token);
      }
      context = await AuthLib.decodeToken(token);
      refreshContext = false;
    }

    if (params[0] == 'room') {
      chatroomId = params[1]
    }
    
    if (chatNsp && chatNsp.connected && !chatroomId) {
      chatNsp.emit('leave');
      chatNsp.removeAllListeners();
      chatNsp.close();
      chatNsp = null;
    }
    /* temp - for troubleshooting
    if (AuthLib.isExpired(token)) {
      alert('error, expired token')
    }*/
    //console.log('build context ', context)
     //END temp

    alertElement.innerHTML = '';
    navbarElement.innerHTML = '';
    tabsElement.innerHTML = '';
    mainElement.innerHTML = '';
    postElement.innerHTML = '';
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
    case '#chat':
      if (!AuthLib.validSession()) return window.location.hash = '#login';

      navbarElement.innerHTML = main.navbar({name, context});

      if (!chatroomId) {
        const chatRoomResponse = await ChatLib.GetCommunityChatrooms();
        // TODO - not done here.
        const userChatList = {};
        
        console.log(chatroomId)
        if (noErrors(chatRoomResponse)) {
          tabsElement.innerHTML = chat.communityIndex({ communities: chatRoomResponse });
          mainElement.innerHTML = chat.userIndex(userChatList);
        }
      } else {
        const chatroomName = await ChatLib.GetCommunityName(chatroomId);
        tabsElement.innerHTML = chat.chatRoomName({ name: chatroomName })
        mainElement.innerHTML = chat.chatRoom();

        const messageElement = <HTMLElement>document.getElementById('message');
        const inputMessage = <HTMLInputElement>document.getElementById('inputMessage');
        inputMessage.disabled = true;
        inputMessage.placeholder = 'Loading';
        
        if (!chatNsp) chatNsp = Chat.Socket(AuthLib.readToken(AuthLib.REFRESH));
        chatNsp.on('connect', socket => {
          inputMessage.disabled = false;
          inputMessage.placeholder = 'Type here...';
          inputMessage.focus();

          // add listeners
          chatNsp.on('reconnect_attempt', (attemptNumber) => {
            console.log('Chat Namespace reconnect. Attempt: ', attemptNumber);

            // TODO - redirect to login if refresh token is not valid or expired
            socket.io.opts.query = {
              token: AuthLib.readToken(AuthLib.REFRESH)
            }
          });

          chatNsp.on('history', data => {
            messageElement.innerHTML = '';

            data.forEach(message => {
              const { user, message_body, sent_at } = message;
              const mess:Chat.Message = {
                message_body: message_body,
                user: {
                  username: user.username
                },
                sent_at: sent_at
              }
              if (context.username === user.username) {
                mess.user = null;
              }
              messageElement.innerHTML += chat.message(mess);
            });
            window.scrollTo(0, document.body.scrollHeight);
          });

          chatNsp.on('new message', data => {
            const { username, message, sent_at } = data;
            const newMess:Chat.Message = {
              message_body: message,
              sent_at: sent_at
            }
            if (context.username !== username) {
              newMess.user = {
                username: username
              };
            }
            messageElement.innerHTML += chat.message(newMess);
          });

          chatNsp.on('user joined', data => {
            const { username, roomcount } = data;

            console.log('TODO - notify user joined', username, roomcount)
          });

          chatNsp.on('user left', data => {
            const { username, roomcount } = data;

            console.log('TODO - notify user left', username, roomcount)
          });

          chatNsp.on('typing', data => {
            const { username } = data;

            console.log('TODO - notify user typing', username)
          });

          chatNsp.on('stop typing', data => {
            const { username } = data;

            console.log('TODO - notify user stop typing', username)
          });

          chatNsp.emit('join', { username: context.username, chatroom: chatroomId });
        });

        inputMessage.addEventListener('keypress', (event: KeyboardEvent) => {
          if (event.key === 'Enter' && chatNsp) {
            chatNsp.emit('new message', {
              userId: context.userId,
              username: context.username,
              message: inputMessage.value,
              sent_at: new Date()
            });

          if (chatNsp) chatNsp.emit('stop typing');
            inputMessage.value = '';
          };
        });

        inputMessage.addEventListener('focus', (event: KeyboardEvent) => {
          if (chatNsp) chatNsp.emit('typing');
        });

        inputMessage.addEventListener('blur', (event: KeyboardEvent) => {
          if (chatNsp) chatNsp.emit('stop typing');
        });
      }
      break;
    case '#register':
      if (AuthLib.validSession()) return window.location.hash = '#main';

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
          const newUser:UserLib.User = {
            firstname: firstnameInput.value,
            lastname: lastnameInput.value,
            username: usernameInput.value,
            email: emailnameInput.value,
            password: passwordInput.value
          }
          const response = await AuthLib.register(newUser);
          if (noErrors(response) && response.token) {
            AuthLib.saveToken(response.token, AuthLib.REFRESH);
            window.location.hash = '#main';
          }
        }
      });
      break;
    case '#login':
      if (AuthLib.validSession()) return window.location.hash = '#main';

      mainElement.innerHTML = main.login();
      const btnFacebook = <HTMLButtonElement>document.getElementById('button-facebook');
      btnFacebook.onclick = () => AuthLib.socialSignon(AuthLib.FACEBOOK);
      const btnGoogle = <HTMLButtonElement>document.getElementById('button-google');
      btnGoogle.onclick = () => AuthLib.socialSignon(AuthLib.GOOGLE);
      const btnTwitter = <HTMLButtonElement>document.getElementById('button-twitter');
      btnTwitter.onclick = () => AuthLib.socialSignon(AuthLib.TWITTER);
      const signinForm = document.forms['form-signin'];

      signinForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const response = await AuthLib.login(
            (<HTMLInputElement>document.getElementById('email')).value,
            (<HTMLInputElement>document.getElementById('password')).value
          );
        if (noErrors(response) && response.token) {
          AuthLib.saveToken(response.token, AuthLib.REFRESH);
          window.location.hash = '#main';
        }
      });
      break;
    case '#logout':
      AuthLib.logout();
      context = null;
      AuthLib.clearTokens()
      window.location.hash = '#login';
      break;
    case '#main':
      if (!AuthLib.validSession()) return window.location.hash = '#login';

      /**
       * Prepends post
       * Adds a post to the main view
       * @param  {Post} post message
       */
      const prependPost = async (post:PostLib.Post) => {
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
      const appendPost = async (post:PostLib.Post) => {
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
      const posts = await PostLib.GetPosts(new Date().toISOString());
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
              const result = await PostLib.CreatePost({message_body});
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
      const resProfile = await UserLib.GetProfile();
      const resAvailComms = await CommLib.GetAvailableCommunities();
      mainElement.innerHTML = profile.profile({name, context, profile: resProfile});

      const inputNewCommunity = <HTMLInputElement>document.getElementById('newCommunity');
      const communityDatalist = <HTMLInputElement>document.getElementById('communityList');
      const btnNewCommunity = <HTMLButtonElement>document.getElementById('btnCreateNewCommunity');
      const communityTable = <HTMLTableElement>document.getElementById('communityTable');
      const listCommunity = (community:CommLib.Community) => {
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
        const result = await CommLib.CreateJoinCommunity(body);
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

