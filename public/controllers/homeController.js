angularApp.controller('homeController', function($scope, $http, $rootScope, $location, $window) {
  $scope.submitting = $rootScope.FB;
  $scope.fbLogin = function () {
    $scope.error = null;
    FB.login(function(response) {
      if (response.status === 'connected') {
        var data = {token: response.authResponse.accessToken};
        $http.post('/api/login', data)
          .then(function success(response) {
            if ($location.path() === '/home')
              $window.location.reload();
            else
              $location.path('home');
          }, function failure(response) {
            if (response.status === 401) {
              // User never registered. Take him/her to register page
              $location.path('register');
            } else if (response.status === 403) {
              $rootScope.registered = true;
              $location.path('/register/confirmation');
            } else {
              $scope.error = 'Unknown error occurred. Please try again later.';
            }
            $scope.submitting = false;
          });
      } else { // User didn't go through with the FB login
        $scope.$apply(function () {
          $scope.submitting = false;
        });
      }
    });
    $scope.submitting = true;
  };

  $scope.logout = function () {
    $scope.error = null;
    $http.post('/api/logout', null)
      .then(function success(response) {
        // Successfully logged out
        if ($location.path() === '/home')
          $window.location.reload();
        else
          $location.path('home');
      }, function failure(response) {
        if ($location.path() === '/home')
          $window.location.reload();
        else
          $location.path('home');
      });
  };
});