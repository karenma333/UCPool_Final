angularApp.controller('ridesController', function($scope, $http, $rootScope, $location, $window, $animate) {
  if ($rootScope.pendingRides && $rootScope.pendingRides.length === 0) {
    $rootScope.pendingRides = null;
  }

  $rootScope.fetchPendingRides();
  $rootScope.fetchConfirmedRides();
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
        $http.post('/api/events/' + ride._id + '/driver_confirmation', {confirm: true})
          .then(function success() {}, function failure(response) {
            $rootScope.pendingRides.splice(index, 0, ride);
            $rootScope.showSnackbar({
              message: response.status === 400 ? response.data.error : 'Unknown Error'
            });
          });
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
      },
      timeoutHandler: function () {
        $http.post('/api/events/' + ride._id + '/driver_confirmation', {confirm: false})
          .then(function success() {}, function failure(response) {
            $rootScope.pendingRides.splice(index, 0, ride);
            $rootScope.showSnackbar({
              message: response.status === 400 ? response.data.error : 'Unknown Error'
            });
          });
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
        var ids = ride.riders.filter(function (rider) {
          return rider.canPick;
        }).map(function (rider) {
          return rider._id;
        });
        $http.post('/api/events/' + ride._id + '/rider_confirmation', {riders: ids})
          .then(function success(){}, function failure(response) {
            $rootScope.pendingRides.splice(index, 0, ride);
            $rootScope.showSnackbar({
              message: response.status === 400 ? response.data.error : 'Unknown Error'
            });
          });
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