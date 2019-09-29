import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'


export const communityIndex = Handlebars.compile(`
  <h1 class="h3 mb-3 font-weight-normal">Profile</h1>
  <ul>
    {{#each communities}}
      <li><a href="/#chat/room/{{chatroom}}">{{name}}</a></li>
    {{/each}}
  </ul>
`);

export const userIndex = Handlebars.compile(`
  TODO - Create a view to build chats with other users.
`);

export const chatRoomName = Handlebars.compile(`
  <h1>
    {{name}}
  </h1>
`);

export const chatRoom = Handlebars.compile(`
  <ul class="pages">
    <li class="chat page">
      <div class="chatArea">
        <ul id="message" class="messages"></ul>
      </div>
      <input id="inputMessage" class="inputMessage" placeholder="Type here..."/>
    </li>
  </ul>
`);

export const message = Handlebars.compile(`
  {{#if user}}
    <li>
      {{message_body}} - {{user.username}} - {{formatDate sent_at}}      
    </li>
  {{else}}
    <li>
      --> {{message_body}}
    </li>
  {{/if}}
`);


Handlebars.registerHelper("formatDate", function(datetimeStr) {
  const datetime = Date.parse(datetimeStr);
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric',
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  return new Intl.DateTimeFormat('en-US', options).format(datetime);
});