import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const tabs = Handlebars.compile(`
    <div class="list-group-item">
      <h1>{{name}}</h1>
    </div>
    <div class="list-group-item">
      <a href="#">TODO</a>
    </div>
`);

export const collections = Handlebars.compile(`
  <div class="jumbotron">
    TODO - show collections
  </div>
`);
