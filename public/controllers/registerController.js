angularApp.controller('registerController', function ($rootScope, $scope, $location, $http, $window) {
  if (isLoggedIn()) {
    $location.path('/home').replace();
  }
  if ($location.path() === '/register/confirmation' && !$rootScope.registered) {
    $location.path('/404').replace();
  }
  var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  $scope.email = null;
  $scope.status = null;

  $scope.emailError = function (email) {
    if (email === null)
      return null;
    if (email === "" || !emailRegex.test(email) || !email.endsWith("@ucsd.edu")) {
      return "Please enter a valid UCSD email."
    }
  };

  $scope.register = function () {
    if ($scope.emailError($scope.email))
      return;

    $scope.submitting = true;
    FB.login(function(response) {
      if (response.status === 'connected') {
        var data = {token: response.authResponse.accessToken, email: $scope.email};
        $http.post('/api/register', data)
          .then(function success(response) {
            // Take them to the email verification page
            $rootScope.registered = true;
            $location.path('/register/confirmation');
          }, function failure(response) {
            if (response.status === 400) {
              $scope.error = response.data.error;
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
  };

  $scope.resendConfirmation = function () {
    $scope.submitting = true;
    FB.login(function (response) {
      if (response.status === 'connected') {
        var data = {token: response.authResponse.accessToken};
        $http.post('/api/resend_verification', data)
          .then(function success(response) {
            $scope.status = 'Verification email sent.';
            $scope.submitting = false;
          }, function failure(response) {
            if (response.status === 400) {
              $scope.status = response.data.error;
            } else {
              $scope.status = 'Unknown error occurred. Please try again later.';
            }
            $scope.submitting = false;
          });
      } else { // User didn't go through with the FB login
        $scope.$apply(function () {
          $scope.submitting = false;
        });
      }
    });
  };
});