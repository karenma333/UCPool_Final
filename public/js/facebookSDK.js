window.fbAsyncInit = function() {
  FB.init({
    appId      : '1864192320465862',
    // appId      : '1864927797058981', // local development
    xfbml      : true,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  if (isLoggedIn()) {
    FB.getLoginStatus(function (response) {
      if (response.status !== 'connected')
        FB.login(function (response) {
          if (response.status !== 'connected') {
            function goToHome() {
              window.location.href = '/home';
            }
            $.ajax('/api/logout', {
              success: goToHome,
              error: goToHome
            });
          }
        });
    });
  }
};
(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
