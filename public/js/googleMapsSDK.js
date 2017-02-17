var placeSearch, autocomplete;
function initAutoComplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  function init() {
    autocomplete = new google.maps.places.Autocomplete(
      document.getElementById('autoComplete'),
      {types: ['address']});
  }
  if (document.readyState === "complete") {
    init();
  } else {
    $(document).ready(init);
  }
}