angularApp.controller('eventRideController', function ($scope, $routeParams, $location) {
  if (!isLoggedIn()) {
    $location.path('404');
  }
  $scope.id = $routeParams.id;
});