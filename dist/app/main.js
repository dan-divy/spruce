"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Handlebars = require("../node_modules/handlebars/dist/handlebars.js");
exports.navbar = Handlebars.compile("\n  <div class=\"container-fluid navbar-fixed-top box-shadow\" style=\"background-color:#fff; margin-bottom:2rem\">\n    <a class=\"float-left\" href=\"/\">\n    <h2>\n      <img src=\"/images/logo/logo.png\" class=\"logo\">\n      <%= title %>\n    </h2>\n    </a>\n    <div class=\"float-right margin-top-20\">\n      <a href=\"/u\" class=\"btn btn-link hidden-xs\">\n        <i class=\"fa fa-lg fa-search pills\"></i>\n      </a>\n      <button style=\"outline: none\" type=\"button\" class=\"btn btn-link\" id=\"sidebarToggle\">\n        <i class=\"fa fa-lg fa-align-left pills\"></i>\n      </button>\n    </div>\n  </div>\n");
exports.main = Handlebars.compile("\n  <h1>Oak</h1>\n  <div class=\"app-alerts\"></div>\n  <div class=\"app-main\"></div>\n");
exports.tabs = Handlebars.compile("\n\n\n");
exports.footer = Handlebars.compile("\n\n\n");
exports.welcome = Handlebars.compile("\n  <div class=\"jumbotron\">\n    <h1>Welcome!</h1>\n    <p>Hello</p>\n  </div>\n");
exports.alert = Handlebars.compile("\n  <div class=\"alert alert-{{type}} alert-dismissible fade show\" role=\"alert\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n      <span aria-hidden=\"true\">&times;</span>\n    </button>\n    {{message}}\n  </div>\n");
//# sourceMappingURL=main.js.map