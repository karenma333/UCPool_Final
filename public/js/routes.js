var angularApp = angular.module('UCPool', ['ngRoute', 'ngAnimate']);
angularApp.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', {
        templateUrl: isLoggedIn() ? './partials/homeLoggedIn.html' : './partials/homeStatic.html',
        controller: 'homeController',
        unauthenticated: true
    })
    .when('/register', {
      templateUrl: './partials/register.html',
      controller: 'registerController',
      hideNavBar: true,
      unauthenticated: true
    })
    .when('/register/confirmation', {
      templateUrl: './partials/register.html',
      controller: 'registerController',
      hideNavBar: true,
      unauthenticated: true
    })
    .when('/settings', {
      templateUrl: './partials/settings.html',
      controller: 'settingsController'
    })
    .when('/history', {
      templateUrl: './partials/history.html',
      controller: 'historyController'
    })
    .when('/rides/pending', {
      templateUrl: './partials/ridesPending.html',
      controller: 'ridesController'
    })
    .when('/rides/confirmed', {
      templateUrl: './partials/ridesConfirmed.html',
      controller: 'ridesController'
    })
    .when('/404', {
      templateUrl: './partials/404.html',
      hideNavBar: true,
      unauthenticated: true
    })
    .when('/dismissed', {
      templateUrl: './partials/dismissed.html',
      controller: 'dismissedController'
    })
    .when('/', {
      redirectTo: 'home'
    })
    .otherwise({
      redirectTo: '404'
    });

  $locationProvider.html5Mode(true);
});