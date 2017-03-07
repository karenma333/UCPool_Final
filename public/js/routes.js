var angularApp = angular.module('UCPool', ['ngRoute', 'ngAnimate']);
angularApp.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', function () {
      if (!isLoggedIn()) {
        return {
          templateUrl: './partials/homeStatic.html',
          controller: 'homeController',
          unauthenticated: true
        };
      }
      var versionA = (Math.floor(Math.random() * 2) == 0);
      return {
        redirectTo: versionA ? '/homeA' : '/homeB'
      };
    }())
    .when('/homeA', {
      templateUrl: './partials/homeLoggedInA.html',
      controller: 'homeController'
    })
    .when('/homeB', {
      templateUrl: './partials/homeLoggedInB.html',
      controller: 'homeController'
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

    /**
     * Show snack bar on the screen
     * @param snackBarOptions that can have
     * message,
     * timeout (optional),
     * actionText (optional),
     * actionHandler (optional),
     * timeoutHandler (optional)
     */
    $rootScope.showSnackbar = function (snackBarOptions) {
      var snackbarContainer = document.querySelector('#snackbar');
      var timeout = 3000;
      var clickedAction = false;
      var options = {
        message: snackBarOptions.message,
        timeout: snackBarOptions.timeout || timeout
      };
      options.actionText = snackBarOptions.actionText || (snackBarOptions.actionHandler ? 'Undo' : undefined);
      if (snackBarOptions.actionHandler) {
        options.actionHandler = function () {
          if (clickedAction)
            return;

          clickedAction = true;
          snackBarOptions.actionHandler();
        }
      }
      snackbarContainer.MaterialSnackbar.showSnackbar(options);
      if (snackBarOptions.timeoutHandler) {
        setTimeout(function () {
          if (clickedAction) {
            return;
          }
          snackBarOptions.timeoutHandler();
        }, timeout + 500);
      }
    };

    $rootScope.$on('$routeChangeSuccess', function () {
      $rootScope.eventsRoute = window.location.pathname.startsWith("/home");
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

      return weekDays[day] + ', ' + dateNum + ' ' + monthNames[monthIndex];
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