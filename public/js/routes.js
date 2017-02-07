var angularApp = angular.module('UCPool', ['ngRoute']);
angularApp.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', {
      templateUrl:  isLoggedIn() ? './partials/homeLoggedIn.html' : './partials/homeStatic.html',
      controller: 'homeController'
    })
    .when('/event/:id/ride', {
      templateUrl: './partials/eventRide.html',
      controller: 'eventRideController'
    })
    .when('/event/:id/drive', {
      templateUrl: './partials/eventDrive.html',
      controller: 'eventDriveController'
    })
    .when('/register', {
      templateUrl: './partials/register.html',
      controller: 'registerController'
    })
    .when('/register/confirmation', {
      templateUrl: './partials/register.html',
      controller: 'registerController'
    })
    .when('/404', {
      templateUrl: './partials/404.html'
    })
    .when('/', {
      redirectTo: 'home'
    })
    .otherwise({
      redirectTo: '404'
    });

  $locationProvider.html5Mode(true);
})
  .run(function ($rootScope) {
    $rootScope.isLoggedIn = isLoggedIn;
  });