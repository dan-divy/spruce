import * as Handlebars from '../../node_modules/handlebars/dist/handlebars.js'

export const main = Handlebars.compile(`
  <nav id="app-navbar" class="navbar site-header sticky-top py-1 navbar-expand-sm navbar-dark bg-dark"></nav>
  <main role="main" class="flex-shrink-0">
    <div id="app-tabs" class="row bg-secondary"></div>
    <div id="app-alerts" class="bg-secondary"></div>
    <div id="app-main" class="container-fluid.body-content" ></div>
    <div id="app-post"></div>
  </main>
  <footer id="footer" class="footer mt-auto py-3"></footer>
`);

export const navbar = Handlebars.compile(`
  <img src="/images/logo/logo.png" class="logo" width="30" height="30" alt="{{name}}">
  <a class="navbar-brand" href="/#main"> {{name}} </a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExample03" aria-controls="navbarsExample03" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>

  {{#if context.sessionId}}
    <div class="collapse navbar-collapse" id="navbar">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="dropdown03" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> Hi, {{context.username}}!</a>
          <div class="dropdown-menu" aria-labelledby="dropdown03">
            <a class="dropdown-item" href="#chat"><i class="fa fa-paper-plane">Chat</i></a>
            <a class="dropdown-item" href="#profile">Profile</a>
            {{#if context.admin}}
              <a class="dropdown-item" href="#admin">Admin</a>
            {{/if}}
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="#logout">Log Out</a>
          </div>
        </li>
      </ul>
    </div>
  {{/if}}
`);

export const tabs = Handlebars.compile(`
  <!-- https://support.litmos.com/hc/en-us/articles/115001428953-Sample-HTML-Banner-code -->

  {{#if context.sessionId}}
    <div class="list-group-item">
      <button id="button-post" class="btn btn-lg btn-primary btn-block ">
        <i class="fa fa-plus"> Post </i>
      </button>
    </div>
    {{#each context.community}}
      <div class="list-group-item">
        <a href="#community/comm/{{this._id}}">{{this.name}}</a>
      </div>
    {{/each}}
  {{/if}}
`);

export const postInput = Handlebars.compile(`
  <div id="postContainer" class="container">
    <div class="form-label-group">
      <input type="text" id="message_body" class="form-control" placeholder="Post a new message" autofocus>
      <label for="message_body">New post</label>
      <button id="button-send" class="btn btn-lg btn-primary btn-block text-uppercase" type="submit"><i class="fa fa-plus"></i></button>
    </div>
  </div>
`);

/*
  <div class="alert alert-primary" role="alert">
  <div class="alert alert-secondary" role="alert">
  <div class="alert alert-success" role="alert">
  <div class="alert alert-danger" role="alert">
  <div class="alert alert-warning" role="alert">
  <div class="alert alert-info" role="alert">
  <div class="alert alert-light" role="alert">
  <div class="alert alert-dark" role="alert">
*/
export const alert = Handlebars.compile(`
  <div class="alert alert-{{type}} alert-dismissible fade show" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
    {{message}}
  </div>
`);

export const login = Handlebars.compile(`
  <body>
    <div class="container">
      <div class="row">
        <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
          <div class="card card-signin my-5">
            <div class="card-body">
              <h5 class="card-title text-center">Sign In</h5>
              <form id="form-signin" class="form-signin" autocomplete="on">
                <div class="form-label-group">
                  <input type="email" id="email" class="form-control" placeholder="Email address" autofocus>
                  <label for="inputEmail">Email address</label>
                </div>

                <div class="form-label-group">
                  <input type="password" id="password" class="form-control" placeholder="Password">
                  <label for="inputPassword">Password</label>
                </div>

                <button class="btn btn-lg btn-primary btn-block text-uppercase" type="submit" title="Alright!">Sign in</button>
              </form>
              <hr class="my-4">
              <button class="btn btn-lg btn-primary btn-block text-uppercase" onclick="window.location.href = '/#register';" title="Awesome!"><i class="fa fa-email-f mr-2"></i> Register </button>
              <hr class="my-4">
              <button id="button-facebook" class="btn btn-lg btn-facebook btn-block text-uppercase" type="submit" title="Really?"><i class="fa fa-facebook-f mr-2"></i> Sign in with Facebook</button>
              <button id="button-google" class="btn btn-lg btn-google btn-block text-uppercase" type="submit" title="Really?"><i class="fa fa-google mr-2"></i> Sign in with Google</button>
              <button id="button-twitter" class="btn btn-lg btn-twitter btn-block text-uppercase" type="submit" title="Really?"><i class="fa fa-twitter mr-2"></i> Sign in with Twitter</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
`);

export const register = Handlebars.compile(`
  <body>
    <div class="container">
      <div class="row">
        <div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
          <div class="card card-signin my-5">
            <div class="card-body">
              <h5 class="card-title text-center">Register</h5>
              <form id="form-register" class="form-signin" autocomplete="on" novalidate>
                <div class="form-label-group">
                  <input type="text" id="firstname" class="form-control" placeholder="First name" required autofocus>
                  <label for="firstname">First Name</label>
                </div>

                <div class="form-label-group">
                  <input type="text" id="lastname" class="form-control" placeholder="Last name" required>
                  <label for="lastname">Last Name</label>
                </div>

                <div class="form-label-group">
                  <input type="text" id="username" class="form-control" placeholder="System user name">
                  <label for="username">Username</label>
                </div>

                <div class="form-label-group">
                  <input type="email" id="email" class="form-control" placeholder="Email address" required>
                  <label for="email">Email address</label>
                </div>

                <div class="form-label-group">
                  <input type="password" id="password" class="form-control" placeholder="Password" required>
                  <label for="password">Password</label>
                </div>

                <div class="form-label-group">
                  <input type="password" id="password2" class="form-control" placeholder="Confirm" required>
                  <label for="password2">Confirm Password</label>
                </div>

                <button class="btn btn-lg btn-primary btn-block text-uppercase" type="submit">Register</button>
                <hr class="my-4">
                <button class="btn btn-lg btn-primary btn-block text-uppercase" onclick="window.location.href = '/#login';" title="Awesome!"><i class="fa fa-email-f mr-2"></i> Login </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
`);

export const welcome = Handlebars.compile(`
  <div id="postContainer" class="container">
  </div>
`);
