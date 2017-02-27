angularApp.controller('historyController', function($scope, $http, $rootScope, $location, $window, $animate) {

  $http.get('/api/events/upcoming')
    .then(function success(response) {
      response.data.forEach(function (event) {
        event.startTime = new Date(event.startTime);
      });
      $scope.events = response.data;
    }, function failure(response) {
      // TODO
    });
});