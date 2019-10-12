import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const tabs = Handlebars.compile(`
    <div class="list-group-item">
      <h1>{{name}}</h1>
    </div>

    <div class="list-group-item">
      <label for="newCollection" class="sr-only">New Collection</label>
      <input name="newCollection" type="text" id="newCollection" class="form-control" class="form-control" placeholder="Enter a new collection name" autocomplete="off" >
      <button id="button-create-collection" class="btn btn-lg btn-primary btn-block text-uppercase">Create</button>
    </div>
`);

export const collectionContainer = Handlebars.compile(`
  <div id="collections" class="jumbotron">
    TODO - show collections
  </div>
`);

export const collectionEmpty = Handlebars.compile(`
  ID: {{_id}} <a href="#collection/coll/{{_id}}">Name: {{name}} </a> <br>
`);

export const collection = Handlebars.compile(`
  ID: {{_id}} <a href="#collection/coll/{{_id}}">Name: {{name}} </a> File Count: {{files.length}} <br>
`);
