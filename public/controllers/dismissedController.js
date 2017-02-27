angularApp.controller('dismissedController', function ($scope, $rootScope, $http) {
  $http.get('/api/events/dismissed')
    .then(function success(response) {
      response.data.forEach(function (event) {
        event.startTime = new Date(event.startTime);
      });
      $scope.events = response.data;
    }, function failure() {
      $rootScope.showSnackbar('Unknown error occurred');
    });

  var now = new Date();
  $scope.isInFuture = function (event) {
    return event.startTime.getTime() > now.getTime();
  };

  $scope.isInPast = function (event) {
    return event.startTime.getTime() <= now.getTime();
  };

  $scope.restoreEvent = function (event) {
    var index = $scope.events.indexOf(event);
    $scope.events.splice(index, 1);
    $rootScope.showSnackbar('Restoring Event', function undoHandler() {
      $scope.events.splice(index, 0, event);
      $scope.$apply();
    }, function onTimeout() {
      $http.put('/api/events/' + event._id + '/restore', null)
        .then(function () {}, function () {
          $rootScope.showSnackbar('Unknown error occurred');
        });
    });
  };
});