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
  <div class="album py-5 bg-light">
    <div class="container">
      <div id="collections" class="row">
      </div>
    </div>
  </div>
`);

export const collection = Handlebars.compile(`
  <div class="col-md-4" data-collectionId="{{_id}}">
    <div class="card mb-4 shadow-sm">
      <svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img" aria-label="Placeholder: {{name}}">
        <title>{{name}}</title>
        <rect width="100%" height="100%" fill="#55595c"></rect>
        <text x="50%" y="50%" fill="#eceeef" dy=".3em">Thumbnail</text>
      </svg>
      <div class="card-body">
        <p class="card-text">Name: {{name}} File(s): {{files.length}}</p>
        <div class="d-flex justify-content-between align-items-center">
          <div class="btn-group">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-collectionId="{{_id}}">View</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-collectionId="{{_id}}">Edit</button>
          </div>
          <small class="text-muted">9 mins</small>
        </div>
      </div>
    </div>
  </div>
`);
