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

  if (isLoggedIn()) {
    $http.get('/api/events/upcoming')
      .then(function success(response) {
        response.data.forEach(function (event) {
          event.startTime = new Date(event.startTime);
          event.endTime = new Date(event.endTime);
        });
        console.log(response.data);
        $scope.events = response.data;
      }, function failure(response) {
        // TODO
      });
  }

  $scope.dismissEvent = function (event) {
    var index = $scope.events.indexOf(event);
    $scope.events.splice(index, 1);
    $rootScope.showSnackbar(event.name + ' dismissed', function undoHandler() {
      $scope.events.splice(index, 0, event);
      $scope.$apply();
    }, function onTimeout() {
      $http.put('/api/events/' + event._id + '/dismiss', null, null)
        .then(function success() {}, function failure() {
          $rootScope.showSnackbar('Unknown error occurred');
        });
    });
  };

  var bound = false;
  function bindAutoComplete() {
    autoCompleteRide.addListener('place_changed', function () {
      var placeRide = autoCompleteRide.getPlace();
      if (placeRide.place_id)
        $scope.placeRide = placeRide;
    });
    autoCompleteDrive.addListener('place_changed', function () {
      var placeDrive = autoCompleteDrive.getPlace();
      if (placeDrive.place_id)
        $scope.placeDrive = placeDrive;
    });
    bound = true;
  }
  if (autoCompleteRide) {
    bindAutoComplete();
  }

  var modalRide = $('#eventsRideModal');
  var currentEvent = null;
  $scope.getRide = function (event) {
    if (!bound && !autoCompleteRide) {
      $rootScope.showSnackbar('Please wait');
      return;
    }
    if (!bound && autoCompleteRide) {
      bindAutoComplete();
    }

    modalRide.modal('show');
    modalRide.find('input').focus();
    currentEvent = event;
  };

  var rideForm = modalRide.find('form');
  modalRide.find('.submit-btn').click(function () {
    rideForm.submit();
  });
  modalRide.find('.cancel-btn').click(function () {
    modalRide.modal('toggle');
  });
  rideForm.submit(function (e) {
    e.preventDefault();
    if ($scope.placeRide) {
      console.log('Successfully selected place:', $scope.placeRide, ' for event ', currentEvent);
      modalRide.modal('toggle');
      var event = currentEvent;
      var place = $scope.placeRide;
      var index = $scope.events.indexOf(event);
      $scope.events.splice(index, 1);
      $scope.$apply();
      $rootScope.showSnackbar('We will look for rides', function undoHandler() {
        $scope.events.splice(index, 0, event);
        $scope.$apply();
      }, function onTimeout() {
        event.place = place;
        event.driving = false;
        $rootScope.pendingRides.push(event);
        $rootScope.$apply()
      });
    }
  });
  modalRide.on('hidden.bs.modal', function () {
    $scope.placeRide = undefined;
    modalRide.find('input').val('');
    currentEvent = null;
  });

  /** I'm driving **/

  var modalDrive = $('#eventsDriveModal');
  var currentEventDrive = null;
  $scope.giveRide = function (event) {
    if (!bound && !autoCompleteDrive) {
      $rootScope.showSnackbar('Please wait');
      return;
    }
    if (!bound && autoCompleteDrive) {
      bindAutoComplete();
    }

    modalDrive.modal('show');
    modalDrive.find('input').focus();
    currentEventDrive = event;
  };

  var modalFormDrive = modalDrive.find('form');
  modalDrive.find('.submit-btn').click(function () {
    modalFormDrive.submit();
  });
  modalDrive.find('.cancel-btn').click(function () {
    modalDrive.modal('toggle');
  });
  modalFormDrive.submit(function (e) {
    e.preventDefault();
    if ($scope.placeDrive) {
      console.log('Successfully selected place:', $scope.placeDrive, ' for event ', currentEventDrive);
      modalDrive.modal('toggle');
      var event = currentEventDrive;
      var place = $scope.placeDrive;
      var indexDrive = $scope.events.indexOf(event);
      $scope.events.splice(indexDrive, 1);
      $scope.$apply();
      $rootScope.showSnackbar('We will find riders', function undoHandler() {
        $scope.events.splice(indexDrive, 0, event);
        $scope.$apply();
      }, function onTimeout() {
        event.place = place;
        event.driving = true;
        $rootScope.pendingRides.push(event);
        $rootScope.$apply()
      });
    }
  });

  modalDrive.on('hidden.bs.modal', function () {
    $scope.placeDrive = undefined;
    modalDrive.find('input').val('');
    currentEventDrive = null;
  });

});