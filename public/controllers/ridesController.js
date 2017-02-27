angularApp.controller('ridesController', function($scope, $http, $rootScope, $location, $window, $animate) {
  $scope.confirmRide = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar('Confirming ride', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    }, function onTimeOut() {
      $rootScope.confirmedRides.push(ride);
    });
  };

  $scope.declineRide = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar('Declining ride', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    });
  };

  $scope.confirmPickup = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar('Confirming pickup', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    }, function onTimeOut() {
      $rootScope.confirmedRides.push(ride);
    });
  };

  $scope.notDriving = function (ride) {
    var index = $rootScope.pendingRides.indexOf(ride);
    $rootScope.pendingRides.splice(index, 1);
    $rootScope.showSnackbar('Removing event', function undo() {
      $rootScope.pendingRides.splice(index, 0, ride);
      $rootScope.$apply();
    });
  };
});