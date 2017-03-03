angularApp.controller('dismissedController', function ($scope, $rootScope, $http) {
  function fetchDismissedEvents() {
    $http.get('/api/events/dismissed')
      .then(function success(response) {
        response.data.forEach(function (event) {
          event.startTime = new Date(event.startTime);
        });
        $scope.events = response.data;
      }, function failure() {
        $rootScope.showSnackbar({
          message: 'Unknown error occurred',
          actionText: 'Retry',
          actionHandler: fetchDismissedEvents
        });
      });
  }

  fetchDismissedEvents();

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
    $rootScope.showSnackbar({
      message: 'Restoring Event',
      actionText: 'Undo',
      actionHandler: function () {
        $scope.events.splice(index, 0, event);
        $scope.$apply();
      },
      timeoutHandler: function () {
        $http.put('/api/events/' + event._id + '/restore', null)
          .then(function () {}, function () {
            $rootScope.showSnackbar({message: 'Unknown error occurred'});
          });
      }
    });
  };

  $scope.hasPastEvents = function () {
    if (!$scope.events) {
      return false;
    }
    for (var i = 0; i < $scope.events.length; i++) {
      if ($scope.isInPast($scope.events[i]))
        return true;
    }
    return false;
  };

  $scope.hasFutureEvents = function () {
    if (!$scope.events) {
    return false;
  }
    for (var i = 0; i < $scope.events.length; i++) {
      if ($scope.isInFuture($scope.events[i]))
        return true;
    }
    return false;
  };
});