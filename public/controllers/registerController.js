angularApp.controller('registerController', function ($scope, $location) {
  if (isLoggedIn()) {
    $location.path('home').replace();
  }
});