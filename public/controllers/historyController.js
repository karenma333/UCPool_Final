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

  function showSnackBar(message, undoHandler, onTimeout) {
    var snackbarContainer = document.querySelector('#events-snackbar');
    var timeout = 2500;
    var undo = false;
    let options = {
      message: message,
      timeout: timeout
    };
    if (undoHandler) {
      options.actionText = 'Undo';
      options.actionHandler = function () {
        if (undo)
          return;

        undo = true;
        undoHandler();
      }
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(options);
    setTimeout(function () {
      if (undo) {
        return;
      }
      if (onTimeout) {
        onTimeout();
      }
    }, timeout + 500);
  }
});