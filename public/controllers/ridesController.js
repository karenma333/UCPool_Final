/*angularApp.controller('ridesController', function ($scope) {

});*/
//temp code
angularApp.controller('ridesController', function($scope, $http, $rootScope, $location, $window, $animate) {
  $http.get('/api/events/all')
    .then(function success(response) {
      $scope.events = response.data;
    }, function failure(response) {
      // TODO
    });

  var bound = false;
  function bindAutoComplete() {
    autocomplete.addListener('place_changed', function () {
      let place = autocomplete.getPlace();
      if (place.place_id)
        $scope.place = place;
    });
    bound = true;
  }
  if (autocomplete) {
    bindAutoComplete();
  }

  var modal = $('#eventsRideModal');
  var currentEvent = null;
  $scope.getRide = function (event) {
    if (!bound && !autocomplete) {
      var snackbarContainer = document.querySelector('#events-snackbar');
      snackbarContainer.MaterialSnackbar.showSnackbar({
        message: 'Please wait',
        timeout: 2500
      });
      return;
    }
    if (!bound && autocomplete) {
      bindAutoComplete();
    }

    modal.modal('show');
    modal.find('input').focus();
    currentEvent = event;
  };

  modal.find('form').submit(function (e) {
    e.preventDefault();
    if ($scope.place) {
      console.log('Successfully selected place:', $scope.place, ' for event ', currentEvent);
      // TODO
      modal.modal('toggle');
    }
  });
  modal.on('hidden.bs.modal', function () {
    $scope.place = undefined;
    modal.find('input').val('');
    currentEvent = null;
  });
});