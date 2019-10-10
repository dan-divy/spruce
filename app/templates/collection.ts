import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const tabs = Handlebars.compile(`
    <div class="list-group-item">
      <h1>{{name}}</h1>
    </div>
`);

export const filesContainer = Handlebars.compile(`
  <form>
    Select images: <input id="inputUploadFiles" type="file" name="img" multiple>
    <input id="submitUploadFiles" type="submit">
  </form>
  <div id="files">
  </div>
`);

export const filesImage = Handlebars.compile(`

  Image <a href="#file/file/{{context.collectionId}}/{{file._id}}">{{file.name}} </a> {{file.type}} <br>

`);

export const files = Handlebars.compile(`

  File <a href="#file/file/{{context.collectionId}}/{{file._id}}">{{file.name}} </a> {{file.type}} <br>

`);