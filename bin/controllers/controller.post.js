  
	angular.module("main", [])
 	.controller("mainController",['$scope', '$http', '$templateCache', function($scope, $http, $templateCache) {
 		$scope.app = {};
		$scope.app.title = "Pudding";
		$scope.app.currentPage = "Home"
		$scope.app.user = localStorage.getItem("pudding_id");
    $scope.app.pass = localStorage.getItem("pudding_pass");
    
    
    $scope.load = function () {
      if (!$scope.app.user || !$scope.app.pass) {
        window.location.href='/api/auth?new=true';
      }
      else {
      $("#inputAuthor").val($scope.app.user);
      document.getElementById("loader").style.display = 'inherit';
      }
    };
     $scope.loadPic = function () {
      if (!$scope.app.user || !$scope.app.pass) {
        window.location.href='/api/auth?new=true';
      }
      else {
      $("#inputAuthor").val($scope.app.user);
      $("#inputPass").val($scope.app.pass);
      
      
        document.getElementById("loader").style.display = 'inherit';
      }
    };
   
 }]).directive("navbar",function () {

  return {
    templateUrl:'../directives/navbar.html',
    
  }
});
