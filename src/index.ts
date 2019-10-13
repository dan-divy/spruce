import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap-social/bootstrap-social.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import '../node_modules/bootstrap/dist/js/bootstrap.min.js';
import '../node_modules/jquery/dist/jquery.min.js';

import './style.css';

import * as bootstrap from 'bootstrap';
import Socket from 'socket.io-client';

// Libraries
import * as AuthLib from './lib/authentication';
import * as ChatLib from './lib/chat';
import * as CollLib from './lib/collections';
import * as CommLib from './lib/community';
import * as FileLib from './lib/file';
import * as PostLib from './lib/post';
import * as UserLib from './lib/user';
import * as Env from './lib/context';
import * as Utils from './lib/utils';
// Socket Libraries
import * as Chat from './lib/socket/chat';
import * as Notifications from './lib/socket/notification';

// Templates
import * as admin from './templates/admin';
import * as chat from './templates/chat';
import * as coll from './templates/collection';
import * as comm from './templates/community';
import * as file from './templates/file';
import * as main from './templates/main';
import * as profile from './templates/profile';

const name = 'Spruce';

var apiVersion:string;
var context:Env.Context;
var notifications:Array<string> = [];
var chatNsp:Socket;
var notifNsp:Socket;

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
  if (!response) return false;
  if (response.error) {
    showAlert(response.error);
  }
  return !response.error;
}

/**
 * Clear view
 */
const clearView = () => {
  const navbarElement = document.getElementById('navbar');
  const footerElement = document.getElementById('footer');  
  const alertElement = document.getElementById('app-alerts');
  const tabsElement = document.getElementById('app-tabs');
  const mainElement = document.getElementById('app-main');  
  const postElement = document.getElementById('app-post');

  navbarElement.innerHTML = '';
  footerElement.innerHTML = '';
  alertElement.innerHTML = '';
  tabsElement.innerHTML = '';
  mainElement.innerHTML = '';
  postElement.innerHTML = '';
};

/**
 * Show the login view
 */
const showLogin = () => {
  clearView();
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

      AuthLib.saveToken(response.token, AuthLib.expires(response.token));
      window.location.hash = '#main';
      window.location.reload();
    }
  });
};

/**
 * Show the registration view
 */
const showRegister = () => {
  const mainElement = document.getElementById('app-main');  

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
        AuthLib.saveToken(response.token);
        window.location.hash = '#main';
        window.location.reload();
      }
    }
  });
};

/**
 * Prepends post
 * Adds a post to the main view
 * @param  {Post} post message
 */
const prependPost = (post:PostLib.Post) => {
  const postContainer = <HTMLElement>document.getElementById('postContainer');
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
const appendPost = (post:PostLib.Post) => {
  const postContainer = <HTMLElement>document.getElementById('postContainer');
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

/**
 * Show a file
 */
const showFile = (blob, filename: string, fileType:string) => {  
  const newBlob = new Blob([blob], { type: fileType });
  // Handle IE
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(newBlob, filename);
    return;
  }

  // All other browsers
  const url = window.webkitURL.createObjectURL(newBlob);
  window.location.replace(url);
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Show a real-time-notification
 */
const showNotificaitons = () => {
  const marquee = <HTMLElement>document.getElementById('real-time-notification');
  if (marquee && notifications.length) {
    marquee.classList.remove('marquee');
    marquee.classList.add('marquee');
    marquee.innerHTML = main.footerMarqueeBody({message : notifications[0] })
  }
};

/**
 * Add a real-time-notification
 */
const addNotificaiton = (message:string) => {
  const marquee = <HTMLElement>document.getElementById('real-time-notification');
  const icons = <HTMLElement>document.getElementById('icons');
  if (marquee && message) {
    notifications.push(message);
    icons.innerHTML = main.footerIcons({ notification : true })
    if (marquee.style.animationPlayState === '') {
      showNotificaitons();
    }
  }
};

/**
 * Listen for real-time-notifications
 */
const listenForNotificaitons = () => {
  if (!context || !context.token || AuthLib.isExpired(context.token)) {
    notifNsp.removeAllListeners();
    notifNsp.close();
    notifNsp = null;
    return;
  };

  if (!notifNsp) {
    notifNsp = Notifications.Socket(AuthLib.readToken());

    notifNsp.on('connect', () => {
      notifNsp.emit('join', { sessionId: context.sessionId });

      notifNsp.on('post', data => {
        if (data.post) prependPost(data.post);
      });

    }); // notifNsp on connect
  };
};

/**
 * Use window location hash to show the specified view
 */
const showView = async () => {
  clearView();
  const navbarElement = document.getElementById('navbar');
  const footerElement = document.getElementById('footer');  
  const alertElement = document.getElementById('app-alerts');
  const tabsElement = document.getElementById('app-tabs');
  const mainElement = document.getElementById('app-main');  
  const postElement = document.getElementById('app-post');

  footerElement.innerHTML = main.footer();
  const marquee = <HTMLElement>document.getElementById('real-time-notification');
  const icons = <HTMLElement>document.getElementById('icons');

  // params ex. /#chat/room/5d8cfa2c3b36e84a1e47dff9
  // [params]; params[0] = resource, params[1] = id
  const [view, ...params] = window.location.hash.split('/');

  // check for valid session
  if (await Env.invalidSession()) {
    if (view.startsWith('#register')) {
      return showRegister();
    } else {
      return showLogin();
    }
  }

  // handle null context
  if (!context) {
    context = await Env.buildContext();
  };

  // verify token is not expired
  if (AuthLib.isExpired(context.token)) {
    context = await Env.buildContext();
  };

  // parse params
  switch (params[0]) {
    case 'coll':
      context.collectionId = params[1];
      break;
    case 'comm':
      context.communityId = params[1];
      break;
    case 'room':
      context.chatroomId = params[1];
      break;
    case 'file':
      context.collectionId = params[1];
      context.fileId = params[2];
      break;
  }

  // Real-time notifications
  listenForNotificaitons();

  // Chatroom cleanup
  if (chatNsp && chatNsp.connected) {
    chatNsp.emit('leave');
    context.chatroomId = null;
    chatNsp.removeAllListeners();
    chatNsp.close();
    chatNsp = null;
  }

  icons.innerHTML = main.footerIcons({ notification : notifications.length });
  if (notifications.length) showNotificaitons();
  marquee.addEventListener('animationend', event => {
    notifications.shift();
    if (notifications.length) {
      showNotificaitons();
      return;
    }
    icons.innerHTML = main.footerIcons({ notification : notifications.length });
    marquee.innerHTML = '';
  });

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
    case '#admin-posts':
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
        
        if (!chatNsp) chatNsp = Chat.Socket(AuthLib.readToken());
        chatNsp.on('connect', () => {
          inputMessage.disabled = false;
          inputMessage.placeholder = 'Type here...';
          inputMessage.focus();

          // add listeners
          chatNsp.on('reconnect_attempt', (attemptNumber) => {
            console.log('Chat Namespace reconnect. Attempt: ', attemptNumber);

            // TODO - redirect to login if refresh token is not valid or expired
            chatNsp.Socket.io.opts.query = {
              token: AuthLib.readToken()
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
            const message = `${username} joined. There are ${roomcount} members`;
            addNotificaiton(message);
          });

          chatNsp.on('user left', data => {
            const { username, roomcount } = data;
            const message = `${username} left. ${roomcount} member(s) remain`;
            addNotificaiton(message);
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
    case '#collection': 
      navbarElement.innerHTML = main.navbar({ name, context });
      const collectionResponse = await CollLib.GetCollection(context);
      if (!noErrors(collectionResponse) || !collectionResponse.collection) break;
      const collection = collectionResponse.collection;
      tabsElement.innerHTML = coll.tabs(collection)
      mainElement.innerHTML = coll.filesContainer();
      const divFiles = <HTMLDivElement>document.getElementById('files');
      if (collection.files && collection.files.length) {
        collection.files.forEach(file => {
          if (file.type.startsWith('image')) {
            divFiles.innerHTML += coll.filesImage({context, file});
          } else {
            divFiles.innerHTML += coll.files({context, file});
          }
        });
      } else {
        divFiles.innerHTML += 'Add some files!';
      }

      const inputUploadFiles = <HTMLInputElement>document.getElementById('inputUploadFiles');
      const submitUploadFiles = <HTMLFormElement>document.getElementById('submitUploadFiles');
      submitUploadFiles.addEventListener('click', async event => {
        event.preventDefault();
        if (!inputUploadFiles.files || !inputUploadFiles.files.length) {
          return showAlert('Please choose one or more files to upload.');
        }

        const encrypt = 'false'; // TEST: encrypt != 'false'
        const uploadResponse = await FileLib.UploadFilesToCollection(context, inputUploadFiles.files, encrypt);
        if (noErrors(uploadResponse) && uploadResponse.files) {
          const files = uploadResponse.files;
          if (divFiles.innerHTML.length < 32) divFiles.innerHTML = '';
          if (files && files.length) {
            files.forEach(file => {
              if (file.type.startsWith('image')) {
                divFiles.innerHTML += coll.filesImage({context, file});
              } else {
                divFiles.innerHTML += coll.files({context, file});
              }
            });
          }
        }
        if (uploadResponse.reject) showAlert(uploadResponse.reject, main.ALERT_INFO);
        inputUploadFiles.value = '';
      });
      break;
    case '#community':
      navbarElement.innerHTML = main.navbar({ name, context });

      const communityResponse = await CommLib.getCommunity(context);
      if (!noErrors(communityResponse) || !communityResponse.community) break;
      
      const community = communityResponse.community;
      tabsElement.innerHTML = comm.tabs(community)
      mainElement.innerHTML = comm.collectionContainer();
      const divCollection = <HTMLDivElement>document.getElementById('collections');

      if (community.collections.length) {
        divCollection.innerHTML = '';
        // add each collection to the view.
        community.collections.forEach(collection => {
          if (collection.files && collection.files.length) {
            divCollection.innerHTML += comm.collection(collection);
          } else {
            divCollection.innerHTML += comm.collectionEmpty(collection);
          }
        })
      }

      const inputCreateColleciton = <HTMLInputElement>document.getElementById('newCollection');
      const buttonCreateCollection = <HTMLButtonElement>document.getElementById('button-create-collection');
      buttonCreateCollection.addEventListener('click', async event => {
        if (!inputCreateColleciton.value) return showAlert('Enter the name of the new collection.');

        const body = {
          name: inputCreateColleciton.value
        };
        const createResponse = await CollLib.CreateCollection(context, body);
        if (noErrors(createResponse) && createResponse.collection) {
          const collection = createResponse.collection;

          if (divCollection.innerHTML.length < 32) divCollection.innerHTML = '';
          if (collection.files && collection.files.length) {
            divCollection.innerHTML += comm.collection(collection);
          } else {
            divCollection.innerHTML += comm.collectionEmpty(collection);
          }
          inputCreateColleciton.value = null;
        }
      });

      break;
    case '#file':
      navbarElement.innerHTML = main.navbar({ name, context });
      var fileName:string;
      var fileType:string;

      const fileRes = FileLib.GetFile(context)

      fileRes.then(response => {
        if (noErrors(response)) {
          fileName = response.fileName;
          fileType = response.fileType;

          response.blob().then(blob => {
            showFile(blob, fileName, fileType);
          })
        }
      })
      .catch(async err => {
        const resonse = await err.json();
        if (noErrors(resonse)) {
          showAlert("Could not retrieve file.");
        }
      });
      break;
    case '#logout':
      Env.logout(context);
      showLogin();
      break;
    case '#main':
      navbarElement.innerHTML = main.navbar({ name, context });
      tabsElement.innerHTML = main.tabs({ context });
      mainElement.innerHTML = main.welcome({ context });

      const postsResponse = await PostLib.GetPosts(context, new Date().toISOString());
      if (!noErrors(postsResponse)) break;
      if (!postsResponse.posts) break;

      var posts:PostLib.Post[];
      posts = postsResponse.posts;
      posts.forEach(post => appendPost(post));

      // Could only accomplish this with jQuery...
      $('#modal-new-post').on('shown.bs.modal', event => {
        setTimeout(() => new_post.focus(), 100);
      });
      const new_post = <HTMLInputElement>document.getElementById('new-post');
      const submitNewPost = (message:string, file?:File) => {
        PostLib.CreatePost(context, {
          message_body: message,
          //file
        }).then(response => {
          if (noErrors(response)) new_post.value = '';
        });
      };

      new_post.addEventListener('keyup', (event: KeyboardEvent) => {
        if (event.isComposing || event.keyCode === 229) return;
        if (event.key === 'Enter' && new_post.value && new_post.value.length) {
          submitNewPost(new_post.value)
        }
      });
      const buttonPostDialog = <HTMLButtonElement>document.getElementById('button-post-dialog');
      buttonPostDialog.addEventListener('click', event => {
        const buttonSendPost = <HTMLButtonElement>document.getElementById('button-send');
        buttonSendPost.addEventListener('click', event => {
          submitNewPost(new_post.value)
        });
      });

      break;
    case '#profile':
      navbarElement.innerHTML = main.navbar({ name, context });
      
      const resProfile = await UserLib.GetProfile(context);
      if (!noErrors(resProfile) || !resProfile.profile) break;

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
      if (noErrors(resAvailComms) && resAvailComms.communities) {
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
        if (noErrors(response)) {
          if (!response.community) return showAlert('Server did not process request.')
          // append to current list
          addCommunity(response.community);
          Env.setRefreshContext(context);   
        }
        if (response.message) showAlert(response.message, main.ALERT_SUCCESS);
        inputNewCommunity.value = '';
      };
      break;
    default:
      // Unrecognized view
      window.location.hash = '#main';
  }
};

(() => {
  document.body.innerHTML = main.main();
  const mainElement = document.getElementById('app-main');  
  // Show a splash page
  mainElement.innerHTML = main.splash();

  Env.getAPIVersion().then(response => {
    if (noErrors(response)) {
      apiVersion = response.apiVersion;
    }
  });

  setTimeout(() => addNotificaiton('added later'), 1000);
  setTimeout(() => addNotificaiton('added later2'), 1000);

  window.addEventListener('hashchange', showView, false);
  showView().catch(err => window.location.hash = '#main');
})();

