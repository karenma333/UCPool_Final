var placeSearch, autoCompleteRide;
function initAutoComplete() {
  // Create the autoCompleteRide object, restricting the search to geographical
  // location types.
  function init() {
    autoCompleteRide = new google.maps.places.Autocomplete(
      document.getElementById('autoCompleteRide'),
      {types: ['address']});
  }
  if (document.readyState === "complete") {
    init();
  } else {
    $(document).ready(init);
  }
}