var angularApp = angular.module('UCPool', ['ngRoute']);
angularApp.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', {
      templateUrl: './partials/home.html',
      controller: 'homeController'
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

  });