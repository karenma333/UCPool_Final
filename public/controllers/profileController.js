angularApp.controller('profileController', function ($scope, $http, $location) {
  $scope.logout = function () {
    FB.logout();
    $http.post('/api/logout', null)
      .then(function success(response) {
        // Successfully logged out
        $location.path('home');
      }, function failure(response) {
        $location.path('home');
      });
  };
});