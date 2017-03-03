angularApp.controller('ridesController', function($scope, $http, $rootScope, $location, $window, $animate) {
  $scope.confirmRide = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar({
      message: 'Confirming ride',
      actionText: 'Undo',
      actionHandler: function () {
        $rootScope.pendingRides.splice(index, 0, ride);
        $rootScope.$apply();
      },
      timeoutHandler: function () {
        $rootScope.confirmedRides.push(ride);
      }
    });
  };

  $scope.declineRide = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar({
      message: 'Cancelling Match',
      actionText: 'Undo',
      actionHandler: function () {
        $rootScope.pendingRides.splice(index, 0, ride);
        $rootScope.$apply();
      }
    });
  };

  $scope.confirmPickup = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar({
      message: 'Confirming pickup',
      actionText: 'Undo',
      actionHandler: function () {
        $rootScope.pendingRides.splice(index, 0, ride);
        $rootScope.$apply();
      },
      timeoutHandler: function () {
        $rootScope.confirmedRides.push(ride);
      }
    });
  };

  $scope.notDriving = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar({
      message: 'Cancelling Match',
      actionText: 'Undo',
      actionHandler: function () {
        $rootScope.pendingRides.splice(index, 0, ride);
        $rootScope.$apply();
      }
    });
  };
});