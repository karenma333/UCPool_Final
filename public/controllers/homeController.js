angularApp.controller('homeController', function($scope, $http, $rootScope, $location, $window, $animate) {
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
            $scope.submitting = false;
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

  $http.get('/api/events/all')
    .then(function success(response) {
      $scope.events = response.data;
    }, function failure(response) {
      // TODO
    });

  function showSnackBar(message, undoHandler, onTimeout) {
    var snackbarContainer = document.querySelector('#events-snackbar');
    var timeout = 2500;
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
  }

  $scope.dismissEvent = function (event) {
    var index = $scope.events.indexOf(event);
    $scope.events.splice(index, 1);
    showSnackBar(event.title + ' dismissed', function undoHandler() {
      $scope.events.splice(index, 0, event);
      $scope.$apply();
    }, function onTimeout() {
      // TODO update event on server
    });
  };

  var bound = false;
  function bindAutoComplete() {
    autoCompleteRide.addListener('place_changed', function () {
      let place = autoCompleteRide.getPlace();
      if (place.place_id)
        $scope.place = place;
    });
    bound = true;
  }
  if (autoCompleteRide) {
    bindAutoComplete();
  }

  var modal = $('#eventsRideModal');
  var currentEvent = null;
  $scope.getRide = function (event) {
    if (!bound && !autoCompleteRide) {
      showSnackBar('Please wait');
      return;
    }
    if (!bound && autoCompleteRide) {
      bindAutoComplete();
    }

    modal.modal('show');
    modal.find('input').focus();
    currentEvent = event;
  };

  var modalForm = modal.find('form');
  modal.find('.submit-btn').click(function () {
    modalForm.submit();
  });
  modal.find('.cancel-btn').click(function () {
    modal.modal('toggle');
  });
  modalForm.submit(function (e) {
    e.preventDefault();
    if ($scope.place) {
      console.log('Successfully selected place:', $scope.place, ' for event ', currentEvent);
      modal.modal('toggle');
      var event = currentEvent;
      var index = $scope.events.indexOf(event);
      $scope.events.splice(index, 1);
      $scope.$apply();
      showSnackBar('We will look for rides', function undoHandler() {
        $scope.events.splice(index, 0, event);
        $scope.$apply();
      }, function onTimeout() {
        // TODO submit request to server to fix a ride
      });
    }
  });
  modal.on('hidden.bs.modal', function () {
    $scope.place = undefined;
    modal.find('input').val('');
    currentEvent = null;
  });
});