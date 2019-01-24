
	var moduleApp = angular.module("main", ['ngRoute'])
  moduleApp.config(function($routeProvider, $locationProvider) {
        $routeProvider
             // route for the about page
            .when('/upload', {
                templateUrl : '../../views/upload.html'
                //controller  : 'mainController'
            })

            // route for the contact page
            .when('/search', {
                templateUrl : '../../views/search.html'
                //controller  : 'mainController'
            })

            .when('/activity', {
                templateUrl : '../../views/activity.html'
            });
            // use the HTML5 History API
            $locationProvider.html5Mode(true);
    });


 	moduleApp.controller("mainController",['$scope', '$http', '$templateCache', function($scope, $http, $templateCache) {
 		$scope.app = {};
		$scope.app.title = "Pudding";
		$scope.app.currentPage = "Home"
		
    var socket = io.connect('/')

    socket.on('connect', () => {
      console.log('connected');
    });

    socket.on('yes', data => {
      $('.refresh')[0].style.display = 'inherit';
    });

    $scope.refresh = function () {
      
      window.location.reload()
    }
		
    /* $scope.update = function (id,index) {
      var postId = "#"+id;
      $http({method: 'GET', url: '/api/posts?action=update&like='+id,cache: $templateCache}).
          then(function(response) {
            if (response.data == true) {
              $scope.data[index].likes++;
              $('.likes')[index].disabled = ''
            }
            else {
              console.log('Already Liked');
              $('.likes')[index].disabled = ''
             }

          }, function(response) {
            
          });
    }*/
    /*$scope.comment = function (id,index) {
      $scope.commVal = $(".comments-input")[index].value;
      $http({method: 'GET', url: '/api/posts?action=comment&comm='+id+'&txt='+$scope.commVal,cache: $templateCache}).
          then(function(response) {
            if (response.data == true) {
             alert('Success');
             
            }
            else {
              alert('Oops')
             }

          }, function(response) {
            
          });
    }*/
    $scope.profile = function (name) {
      window.location.href = '/profile/'+name;

    }
    $scope.redirect = function (link) {
      window.location.href = link;

    }
    $scope.load = function () {
      $("#inputAuthor").val(localStorage.getItem("pudding_id"));
      console.log('Uploading a post')
      
      document.getElementById("loader").style.display = 'inherit';
    }
    $scope.search = function (q) {
      $scope.nonExistingUser = q;     
      if(q !== '' || q) {
      $http({method: 'GET', url: '/search/'+q,cache: $templateCache}).
          then(function(response) {
            if(response.data == false) {
              $('#alert-not-found')[0].style.display == 'inherit';
            }
            else {
              $('#alert-not-found')[0].style.display == 'none';
             console.log('Fetched Users');
             $scope.users = response.data;            
            }
            
            
            

          }, function(response) {
            console.log('Internal Server Error')
          });
        }
    }
    
 }])
