angularApp.controller('profileController', function ($scope, $http) {
  $scope.logout = function () {
    FB.logout();
    $http.post('/api/logout', null)
      .then(function success(response) {
        // Successfully logged out
        window.location.href = '/';
      }, function failure(response) {
        window.location.href = '/';
      });
  };
  $http.get('/api/me')
    .then(function success(response) {
      $scope.user = response.data;
    });
});