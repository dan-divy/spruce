import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const landing = Handlebars.compile(`
  <div class="jumbotron">
    TODO
  </div> <!-- container.// -->
`);

export const tabs = Handlebars.compile(`
    <div class="list-group-item">
      <a href="#admin-user">Users</a>
    </div>
    <div class="list-group-item">
      <a href="#admin-collection">Collections</a>
    </div>
    <div class="list-group-item">
      <a href="#admin-file">Files</a>
    </div>
    <div class="list-group-item">
      <a href="#admin-notification">Notifications</a>
    </div>
`);

export const user = Handlebars.compile(`
  <div class="jumbotron">
    TODO
  </div> <!-- container.// -->
`);

export const collection = Handlebars.compile(`
  <div class="jumbotron">
    TODO
  </div> <!-- container.// -->
`);

export const files = Handlebars.compile(`
  <div class="jumbotron">
    TODO
  </div> <!-- container.// -->
`);

export const notification = Handlebars.compile(`
  <div class="jumbotron">
    TODO
  </div> <!-- container.// -->
`);