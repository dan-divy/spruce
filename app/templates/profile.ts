import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const profile = Handlebars.compile(`
  <div class="jumbotron">
    <div class="row justify-content-md-center">
    <article class="col-sm-4">
      <h1 class="h3 mb-3 font-weight-normal">Profile</h1> 
      <hr>
      <form class="form-profile" action="/save" method="post">
        <label for="inputFirstName" class="sr-only">First Name</label>
        <input name="firstName" type="text" id="inputFirstName" value="{{profile.firstname}}" class="form-control" placeholder="First Name" required="" autofocus="" disabled>
        
        <label for="inputLastName" class="sr-only">Last Name</label>
        <input name="lastName" type="text" id="inputLastName" value="{{profile.lastname}}" class="form-control" placeholder="Last Name" required="" autofocus="" disabled>
        
        <label for="inputUserame" class="sr-only">Username</label>
        <input name="userName" type="text" id="inputUserame" value="{{profile.username}}" class="form-control" placeholder="Username" required="" autofocus="" disabled>
        
        <label for="inputEmail" class="sr-only">Email address</label>
        <input name="email" type="email" id="inputEmail" value="{{profile.email}}" class="form-control" placeholder="Email address" required="" autofocus="" disabled>

        <label for="inputBio" class="sr-only">Biography</label>
        <input name="bio" type="text" id="inputBio" value="{{profile.bio}}" class="form-control" placeholder="Biography" disabled>

        <p>Last Login: {{formatDate profile.lastLogin}} </p>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <button type="button" class="btn btn-primary btn-block" id="editSaveButton"> Edit </button>
            </div> <!-- form-group// -->
          </div>                                         
        </div> <!-- .row// -->
      </form>
    </article> <!-- col.// -->
    <aside class="col-sm-4">
      <div class="row">
        <h1 class="h3 mb-3 font-weight-normal">Communities</h1>
        <label for="newCommunity" class="sr-only">New Community</label>
        <input name="newCommunity" type="text" id="newCommunity" class="form-control" list="communityList" class="form-control" placeholder="Enter a new community name" >
        <datalist id="communityList"></datalist>
        <button type="button" class="btn btn-primary btn-block" id="btnCreateNewCommunity"> Create </button>
        <div class="panel panel-default">
          <table id="communityTable" class="table">
            <thead>
              <tr>
                <th>Your Communities</th>
                <th class="actions">Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </aside> <!-- col.// -->
    </div> <!-- row.// -->
  </div> <!-- container.// -->
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