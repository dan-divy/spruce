import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

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