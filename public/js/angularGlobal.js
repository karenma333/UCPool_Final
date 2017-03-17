angularApp.run(function ($rootScope, $location, $timeout, $http) {
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

  $rootScope.fetchPendingRides = function () {
    $http.get('/api/events/pending')
      .then(function (response) {
        response.data.forEach(event => {
          event.startTime = new Date(event.startTime);
          if (event.riders) {
            event.riders.forEach(rider => {
              rider.canPick = true;
            });
          }
        });
        $rootScope.pendingRides = response.data;
        // TODO add badge to nav bar button
      });
  };
  $rootScope.fetchPendingRides();

  $rootScope.fetchConfirmedRides = function () {
    $http.get('/api/events/confirmed')
      .then(function (response) {
        response.data.forEach(event => {
          event.startTime = new Date(event.startTime);
        });
        $rootScope.confirmedRides = response.data;
      });
  };

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

    return weekDays[day] + ', ' + dateNum + ' ' + monthNames[monthIndex];
  };

  $rootScope.getFormattedTime = function (date) {
    var hours = date.getHours();
    var half = (hours >= 12) ? 'PM' : 'AM';
    hours = (hours >= 12) ? (hours - 12) : hours;
    hours = (hours == 0) ? 12 : hours;
    return hours + ':' + (date.getMinutes()/10 == 0 ? '0' : '') + date.getMinutes() + ' ' + half;
  };


  // Firebase Cloud Messaging
  function isChrome() {
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1,
      isIOSChrome = winNav.userAgent.match("CriOS");

    if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
      return false;
    } else {
      return false;
    }
  }

  if (isLoggedIn() && isChrome()) {
    const messaging = firebase.messaging();
    messaging.requestPermission()
      .then(function() {
        console.log('Notification permission granted.');
        messaging.getToken()
          .then(function(currentToken) {
            if (currentToken) {
              $http.post('/api/user/register_fcm_token', {token: currentToken})
                .then(function success() {}, function failure(response) {
                  console.log('Failed to register fcm token. Response: ', response);
                });
            } else {
              // Show permission request.
              console.log('No Instance ID token available. Request permission to generate one.');
            }
          })
          .catch(function(err) {
            console.log('An error occurred while retrieving token. ', err);
          });
      })
      .catch(function(err) {
        console.log('Unable to get permission to notify.', err);
      });

    messaging.onMessage(function () {
      $rootScope.fetchPendingRides();
    });

    messaging.onTokenRefresh(function () {
      messaging.getToken()
        .then(function (refreshedToken) {
          if (refreshedToken) {
            $http.post('/api/user/refresh_fcm_token', {token: refreshedToken});
          }
        });
    });
  }
})
  .directive('backImg', function () {
    return function (scope, element, attrs) {
      var url = attrs.backImg;
      element.css({
        'background': 'url(' + url + ') center / cover'
      });
    };
  });