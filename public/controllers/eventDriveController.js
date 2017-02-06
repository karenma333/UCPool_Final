angularApp.controller('eventDriveController', function ($scope, $routeParams, $location) {
  if (!isLoggedIn()) {
    $location.path('404');
  }
});