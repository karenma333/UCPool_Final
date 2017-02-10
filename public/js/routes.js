var angularApp = angular.module('UCPool', ['ngRoute', 'mobile-angular-ui']);
angularApp.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', {
      templateUrl:  isLoggedIn() ? './partials/homeLoggedIn.html' : './partials/homeStatic.html',
      controller: 'homeController',
      unauthenticated: true
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
    .when('/profile', {
      templateUrl: './partials/profile.html',
      controller: 'profileController'
    })
    .when('/rides', {
      templateUrl: './partials/rides.html',
      controller: 'ridesController'
    })
    .when('/404', {
      templateUrl: './partials/404.html',
      hideNavBar: true,
      unauthenticated: true
    })
    .when('/', {
      redirectTo: 'home'
    })
    .otherwise({
      redirectTo: '404'
    });

  $locationProvider.html5Mode(true);
})
  .run(function ($rootScope, $location) {
    $rootScope.isLoggedIn = isLoggedIn;
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
      if (next.$$route.redirectTo) {
        return;
      }
      if (!next.$$route.unauthenticated && !isLoggedIn()) {
        $location.path('/404');
        return;
      }
      $rootScope.hideNavBar = next.$$route.hideNavBar;
    });
  });