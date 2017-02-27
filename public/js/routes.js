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

    $rootScope.pendingRides = [];
    $rootScope.confirmedRides = [];

    $rootScope.showSnackbar = function (message, undoHandler, onTimeout) {
      var snackbarContainer = document.querySelector('#snackbar');
      var timeout = 3000;
      var undo = false;
      let options = {
        message: message,
        timeout: timeout
      };
      if (undoHandler) {
        options.actionText = 'Undo';
        options.actionHandler = function () {
          if (undo)
            return;

          undo = true;
          undoHandler();
        }
      }
      snackbarContainer.MaterialSnackbar.showSnackbar(options);
      setTimeout(function () {
        if (undo) {
          return;
        }
        if (onTimeout) {
          onTimeout();
        }
      }, timeout + 500);
    };

    $rootScope.$on('$routeChangeSuccess', function () {
      $rootScope.eventsRoute = window.location.pathname === "/home";
      $rootScope.ridesRoute = window.location.pathname.startsWith("/rides");
      $rootScope.historyRoute = window.location.pathname === "/history";
      $rootScope.settingsRoute = window.location.pathname === "/settings";
      $rootScope.ridesPendingRoute = window.location.pathname === "/rides/pending";
      $rootScope.ridesConfirmedRoute = window.location.pathname === "/rides/confirmed";
      $rootScope.dismissedRoute = window.location.pathname === "/dismissed";
    });

    $rootScope.$on('$viewContentLoaded', () => {
      var tabBarContainer = $('.mdl-layout__tab-bar-container');
      if (window.location.pathname.startsWith('/rides')) {
        tabBarContainer.css('height', '48px');
      } else {
        tabBarContainer.css('height', '0px');
      }
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


    var monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
    ];
    var weekDays = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'
    ];

    $rootScope.getFormattedDate = function (date) {
      var day = date.getDay();
      var dateNum = date.getDate();
      var monthIndex = date.getMonth();
      var year = date.getFullYear();

      return weekDays[day] + ', ' + dateNum + ' ' + monthNames[monthIndex] + ' ' + year;
    };

    $rootScope.getFormattedTime = function (date) {
      var hours = date.getHours();
      var half = (hours >= 12) ? 'PM' : 'AM';
      hours = (hours >= 12) ? (hours - 12) : hours;
      hours = (hours == 0) ? 12 : hours;
      return hours + ':' + (date.getMinutes()/10 == 0 ? '0' : '') + date.getMinutes() + ' ' + half;
    };
  })
  .directive('backImg', function () {
    return function (scope, element, attrs) {
      var url = attrs.backImg;
      element.css({
        'background': 'url(' + url + ') center / cover'
      });
    };
  });