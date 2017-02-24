angularApp.controller('ridesController', function($scope, $http, $rootScope, $location, $window, $animate) {
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

  $scope.confirmRide = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    showSnackBar('Confirming ride', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    }, function onTimeOut() {
      $rootScope.confirmedRides.push(ride);
    });
  };

  $scope.declineRide = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    showSnackBar('Declining ride', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    });
  };

  $scope.confirmPickup = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    showSnackBar('Confirming pickup', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    }, function onTimeOut() {
      $rootScope.confirmedRides.push(ride);
    });
  };

  $scope.notDriving = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    showSnackBar('Removing event', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    });
  };
});