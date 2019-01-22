
	angular.module("main", [])
 	.controller("mainController",['$scope', '$http', '$templateCache', function($scope, $http, $templateCache) {
 		$scope.app = {};
		$scope.app.title = "Pudding";
		$scope.app.currentPage = "Home"
		$scope.app.user = localStorage.getItem("pudding_id");
    $scope.app.pass = localStorage.getItem("pudding_pass");

    $scope.addUser = function () {
      this.username = $("#inputEmail").val();
      this.password = $("#inputPassword").val();
      localStorage.setItem("pudding_id",this.username);
      localStorage.setItem("pudding_pass",this.password);
    }
		$scope.checkUser = function (user) {
       $scope.userMsg = ''; 
			$http({method: 'GET', url: '/api/checkUserExistence/'+user, cache: $templateCache}).
          then(function(response) {
            console.log(response)
            if(response.data === false) {
              $scope.userMsg = true; 
            }
           /*else {
            $scope.userMsg = '' 
           }*/
          }, function(response) {
            $scope.data = response.data || 'Request failed';
            $scope.status = response.status;
        });
      
		};
 }])