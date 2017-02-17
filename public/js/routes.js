var angularApp = angular.module('UCPool', ['ngRoute', 'ngAnimate']);
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
      templateUrl: './partials/eventRide.html',
      controller: 'eventRideController'
      //templateUrl: './partials/eventDrive.html',
      //controller: 'eventDriveController'
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
  .run(function ($rootScope, $location, $timeout) {
    $rootScope.isLoggedIn = isLoggedIn;
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
      if (!next.$$route || next.$$route.redirectTo) {
        return;
      }
      if (!next.$$route.unauthenticated && !isLoggedIn()) {
        $location.path('/404');
        return;
      }
      $rootScope.hideNavBar = next.$$route.hideNavBar;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
      $rootScope.eventsRoute = window.location.pathname === "/home";
      $rootScope.ridesRoute = window.location.pathname === "/rides";
      $rootScope.historyRoute = window.location.pathname === "/history";
      $rootScope.settingsRoute = window.location.pathname === "/settings";
    });

    $rootScope.$on('$viewContentLoaded', ()=> {
      $timeout(() => {
        componentHandler.upgradeAllRegistered();
      })
    });

    $rootScope.toggleDrawer = function () {
      setTimeout(() => {
        var d = document.querySelector('.mdl-layout');
        d.MaterialLayout.toggleDrawer();
      }, 100);
    };
  });