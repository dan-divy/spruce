
	angular.module("profile", [])
 	.controller("profileController",['$scope', '$http', '$templateCache', function($scope, $http, $templateCache) {
 		$scope.app = {};
		$scope.app.title = "Pudding";
		$scope.app.currentPage = "Home"
		$scope.app.user = window.location.pathname.split('/')[2];
    $scope.selfUser = localStorage.getItem("pudding_id");
    $scope.selfPass = localStorage.getItem("pudding_pass");

    if($scope.selfUser == $scope.app.user) {
        document.getElementById("follow").setAttribute("disabled","");
        document.getElementById("follow").style.display = 'none';
        document.getElementById('dp').style.display = 'inherit';
      }
      
		$scope.getUser = function () {
      $http({method: 'GET', url: '/api/profile/'+$scope.app.user,cache: $templateCache}).
          then(function(response) {
            if (response == false) {
              window.location.href='/profile/not_existing';
            }
            console.log(response)
            $scope.app.followers = response.data.followers.length;
            $scope.app.posts = response.data.posts;
            $scope.app.dp = response.data.profilePic;
            
              
              for(var i=0;i<$scope.app.followers;i++) {
                if (response.data.followers[i]==$scope.selfUser){
                  document.getElementById("follow").setAttribute("disabled","")
                  break;
                }
              }              
            
          }, function(response) {
            
          });
      }
    $scope.follow = function () {
      if($scope.selfUser == $scope.app.user) {
        document.getElementById("follow").setAttribute("disabled","")
      }
      else {
      $http({method: 'GET', url: '/api/profile/'+$scope.app.user+'?action=follow&user='+$scope.selfUser+'&pass='+$scope.selfPass,cache: $templateCache}).
          then(function(response) {
            if (response == false) {
              console.log('Cannot follow')
            }
            console.log(response);
            document.getElementById("follow").setAttribute("disabled","")

          }, function(response) {
            
          });
        }
    }
    $scope.getUser();
 }]);
