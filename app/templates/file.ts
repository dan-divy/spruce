import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const tabs = Handlebars.compile(`
    <div class="list-group-item">
      <h1>{{name}}</h1>
    </div>

    <div class="list-group-item">
      <label for="addFile" class="sr-only">Add File</label>
      <input name="addFile" type="text" id="addFile" class="form-control" class="form-control" placeholder="Add a file" autocomplete="off" >
      <button id="button-add-file" class="btn btn-lg btn-primary btn-block text-uppercase">Add File</button>
    </div>
`);

export const files = Handlebars.compile(`
  <div id="files" class="jumbotron">
    TODO
  </div> <!-- container.// -->
`);