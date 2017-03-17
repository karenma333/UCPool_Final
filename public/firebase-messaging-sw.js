importScripts("https://www.gstatic.com/firebasejs/3.7.2/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/3.7.2/firebase-messaging.js");

var config = {
  apiKey: "AIzaSyCBPOUw1NwotsyLJRMMVZT7mtEPykmZo2c",
  authDomain: "uc-pool.firebaseapp.com",
  databaseURL: "https://uc-pool.firebaseio.com",
  storageBucket: "uc-pool.appspot.com",
  messagingSenderId: "1095339758651"
};
firebase.initializeApp(config);

const messaging = firebase.messaging();