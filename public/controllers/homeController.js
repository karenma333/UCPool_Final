angularApp.controller('homeController', function($scope, $http, $rootScope, $location, $window) {
  if (!isLoggedIn()) {
    $rootScope.hideNavBar = true;
  }
  $scope.submitting = $rootScope.FB;
  $scope.fbLogin = function () {
    $scope.error = null;
    FB.login(function(response) {
      if (response.status === 'connected') {
        if (response.authResponse.grantedScopes.split(',').length !== 2) {
          $scope.$apply(function () {
            $scope.error = 'This app needs permissions to your Facebook events to work.';
          });
          return;
        }
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
    }, {scope: 'user_events', return_scopes: true, auth_type: 'rerequest'});
    $scope.submitting = true;
  };

  $scope.events = [
    {
      title: 'Event 1',
      description: 'Description...',
      location: '123 Stanford St.',
      date: 'Friday, 10 Feb 2017',
      time: '7:30 PM'
    },
    {
      title: 'Event 2',
      description: 'Description...',
      location: '123 Stanford St.',
      date: 'Friday, 10 Feb 2017',
      time: '7:30 PM'
    },
    {
      title: 'Event 3',
      description: 'Description...',
      location: '123 Stanford St.',
      date: 'Friday, 10 Feb 2017',
      time: '7:30 PM'
    },
    {
      title: 'Event 4',
      description: 'Description...',
      location: '123 Stanford St.',
      date: 'Friday, 10 Feb 2017',
      time: '7:30 PM'
    },
    {
      title: 'Event 5',
      description: 'Description...',
      location: '123 Stanford St.',
      date: 'Friday, 10 Feb 2017',
      time: '7:30 PM'
    }
  ];
});