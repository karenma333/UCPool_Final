angularApp.controller('historyController', function($scope, $http, $rootScope, $location, $window, $animate) {

  $http.get('/api/events/upcoming')
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