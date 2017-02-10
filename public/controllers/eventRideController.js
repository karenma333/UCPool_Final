angularApp.controller('eventRideController', function ($scope, $routeParams, $location) {
  if (!isLoggedIn()) {
    $location.path('404');
  }
  $scope.id = $routeParams.id;
  $scope.home = true;
  $scope.customAddress = false;
  $scope.selectHome = function () {
    $scope.home = true;
    $scope.customAddress = false;
  };

  $scope.selectCustomAddress = function () {
    $scope.home = false;
    $scope.customAddress = true;
  };

  $scope.goBack = function () {
    window.history.back();
  };
});