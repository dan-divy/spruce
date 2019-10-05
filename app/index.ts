import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap-social/bootstrap-social.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import 'bootstrap';
import 'jquery';
import './style.css'
import Socket from 'socket.io-client';

// Libraries
import * as AuthLib from './lib/authentication';
import * as ChatLib from './lib/chat';
import * as CommLib from './lib/community';
import * as PostLib from './lib/post';
import * as UserLib from './lib/user';
import * as Env from './lib/context';
import * as Utils from './lib/utils';
// Socket Libraries
import * as Chat from './lib/socket/chat';

// Templates
import * as admin from './templates/admin';
import * as chat from './templates/chat';
import * as comm from './templates/community';
import * as main from './templates/main';
import * as profile from './templates/profile';

const name = 'Spruce';

var context:Env.Context;
var chatNsp:Socket;

/**
 * Show an alert to the user
 */
const showAlert = (message, type = main.ALERT_DANGER) => {
  const alertElement = document.getElementById('app-alerts');
  const html = main.alert({ type, message });
  alertElement.insertAdjacentHTML('beforeend', html);
}

/**
 * Handle errors in each response JSON object
 * @param  {object} response A fetch response
 */
const noErrors = (response) => {
  console.log(response)
  if (response.error) {
    showAlert(response.error);
  }
  return !response.error;
}

/**
 * Clear view
 */
const clearView = () => {
  const alertElement = document.getElementById('app-alerts');
  const navbarElement = document.getElementById('app-navbar');
  const tabsElement = document.getElementById('app-tabs');
  const mainElement = document.getElementById('app-main');  
  const postElement = document.getElementById('app-post');

  alertElement.innerHTML = '';
  navbarElement.innerHTML = '';
  tabsElement.innerHTML = '';
  mainElement.innerHTML = '';
  postElement.innerHTML = '';
};

/**
 * Show the login view
 */
const showLogin = () => {
  clearView();
  const navbarElement = document.getElementById('app-navbar');
  const mainElement = document.getElementById('app-main');  

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
      window.location.reload();
    }
  });
};

/**
 * Use window location hash to show the specified view
 */
const showView = async () => {
  const alertElement = document.getElementById('app-alerts');
  const navbarElement = document.getElementById('app-navbar');
  const tabsElement = document.getElementById('app-tabs');
  const mainElement = document.getElementById('app-main');  
  const postElement = document.getElementById('app-post');

  //alertElement.innerHTML = '';
  navbarElement.innerHTML = '';
  tabsElement.innerHTML = '';
  mainElement.innerHTML = '';
  postElement.innerHTML = '';

  // params ex. /#chat/room/5d8cfa2c3b36e84a1e47dff9
  // [params]; params[0] = resource, params[1] = id
  const [view, ...params] = window.location.hash.split('/');

  // check for valid session
  if (await Env.invalidSession()) {
    return showLogin();
  }

  // handle null context
  if (!context) {
    context = await Env.buildContext();
  };

  // verify token is not expired
  if (AuthLib.isExpired(context.token)) {
    context = await Env.buildContext();
  };

  switch (params[0]) {
    case 'comm':
      context.communityId = params[1];
      break;
    case 'room':
      context.chatroomId = params[1];
      break;
  }

  if (chatNsp && chatNsp.connected) {
    chatNsp.emit('leave');
    context.chatroomId = null;
    chatNsp.removeAllListeners();
    chatNsp.close();
    chatNsp = null;
  }

  switch (view) {
    case '#admin':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.landing();      
      break;
    case '#admin-user':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.user();      
      break;
    case '#admin-collection':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.collection();      
      break;
    case '#admin-file':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.files();      
      break;
    case '#admin-notification':
      if (!context.admin) return window.location.hash = '#main';

      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = admin.tabs();
      mainElement.innerHTML = admin.notification();      
      break;
    case '#chat':
      navbarElement.innerHTML = main.navbar({ name, context });

      if (!context.chatroomId) {
        const chatRoomResponse = await ChatLib.GetCommunityChatrooms(context);
        // TODO - not done here.
        const usersChatroomsResponse = { chatrooms: {} };

        if (noErrors(chatRoomResponse) && noErrors(usersChatroomsResponse)) {
          mainElement.innerHTML = chat.communityIndex({ communities: chatRoomResponse.chatrooms });
          mainElement.innerHTML += chat.privateIndex({ private: usersChatroomsResponse.chatrooms });
        }
      } else {
        const chatroomNameResponse = await ChatLib.GetCommunityName(context);
        if (noErrors(chatroomNameResponse)) {  
          tabsElement.innerHTML = chat.chatRoomName({ name: chatroomNameResponse.name })
          mainElement.innerHTML = chat.chatRoom();
        }

        const messageElement = <HTMLElement>document.getElementById('message');
        const inputMessage = <HTMLInputElement>document.getElementById('inputMessage');
        inputMessage.disabled = true;
        inputMessage.placeholder = 'Loading';
        
        if (!chatNsp) chatNsp = Chat.Socket(await AuthLib.readToken(AuthLib.REFRESH));
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

          chatNsp.emit('join', { username: context.username, chatroom: context.chatroomId });
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
    case '#community':
      navbarElement.innerHTML = main.navbar({ name, context });

      const communityResponse = await CommLib.getCommunity(context, context.communityId);
      if (noErrors(communityResponse)) {
        const community = communityResponse.community;
        tabsElement.innerHTML = comm.tabs(community)
        mainElement.innerHTML = comm.collections(community.collections);
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
      showLogin();
      break;
    case '#logout':
      Env.logout(context);
      showLogin();
      break;
    case '#main':
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

      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = main.tabs({ context });
      mainElement.innerHTML = main.welcome({ context });

      var postContainer = <HTMLElement>document.getElementById('postContainer');
      const postsResponse = await PostLib.GetPosts(context, new Date().toISOString());
      if (postsResponse.error) {
        return showAlert(postsResponse.error);
      }
      var posts:PostLib.Post[];
      if (postsResponse.posts) {
        posts = postsResponse.posts;
      }
      posts.forEach(post => appendPost(post));

      const buttonPost = <HTMLButtonElement>document.getElementById('button-post');
      buttonPost.addEventListener('click', event => {
        if (postElement.innerHTML == '') {
          postElement.innerHTML = main.postInput();

          const buttonSend = <HTMLButtonElement>document.getElementById('button-send');
          buttonSend.addEventListener('click', async event => {
            // send the message to the server; success = append to top of view
            const message_body = (<HTMLInputElement>document.getElementById('message_body')).value;
            if (message_body.length) {
              const newPostResponse = await PostLib.CreatePost(context, {message_body});
              if (newPostResponse.error) {
                showAlert(newPostResponse.error);
                return;
              }
              if (newPostResponse.parsedBody) {
                prependPost(newPostResponse.parsedBody);
              }
            }
          });
        } else {
          postElement.innerHTML = '';
        }
      });

      break;
    case '#profile':
      navbarElement.innerHTML = main.navbar({ name, context });
      
      const resProfile = await UserLib.GetProfile(context);
      if (!noErrors(resProfile) || !resProfile.profile) {
        showAlert('Could not retrieve profile.')
        break;
      };
      const usersProfile = resProfile.profile;
      mainElement.innerHTML = profile.profile(usersProfile);
      const inputNewCommunity = <HTMLInputElement>document.getElementById('newCommunity');
      const communityDatalist = <HTMLInputElement>document.getElementById('communityDatalist');
      const btnNewCommunity = <HTMLButtonElement>document.getElementById('btnCreateNewCommunity');
      const communityTable = <HTMLTableElement>document.getElementById('communityTable');

      const addCommunity = (community:CommLib.Community) => {
        const row = communityTable.insertRow(1);
        const cellName = row.insertCell(0);
        const cellLeave = row.insertCell(1);

        cellName.innerHTML = `<a href="#community/${community._id}">${community.name}</a>`;
        // TODO - Not sure how I did this before. Use a table event listener?
        cellLeave.innerHTML = `<button class="btn delete" data-id="${community._id}">Leave(TODO)</button>`;
      };
      context.community.forEach(item => {
        addCommunity(item);
      })

      const resAvailComms = await CommLib.getAvailableCommunities(context);
      if (noErrors(resAvailComms)) {
        if (!resAvailComms.communities) return showAlert('Could not fetch a list of available communities.')
        const communities = resAvailComms.communities;
        communities.forEach(item => {
          const option = document.createElement('option');
          option.value = item.name;
          communityDatalist.appendChild(option);
        });
      }

      inputNewCommunity.addEventListener('input', event => {
        var member = false;
        context.community.forEach(item => {
          if (item.name.toLowerCase() == inputNewCommunity.value.toLowerCase()) {
            member = true;
          }
        })
        btnNewCommunity.disabled = member;

        const communities = resAvailComms.communities;
        var match = false;
        communities.forEach(item => {
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

        // TODO - add error handling and listen for response message. If message (pending membership) alert user.
        const response = await CommLib.createJoinCommunity(context, body);
        if (response.message) return showAlert(response.message, main.ALERT_SUCCESS);
        if (noErrors(response)) {
          if (!response.community) return showAlert('Server did not process request.')
          // append to current list
          addCommunity(response.community);
          Env.setRefreshContext(context);   
        }
        inputNewCommunity.value = '';
      };
      break;
    default:
      // Unrecognized view
      window.location.hash = '#main';
  }
};

(async () => {
  document.body.innerHTML = main.main();

  window.addEventListener('hashchange', showView, false);
  showView().catch(err => window.location.hash = '#main');
})();

