import { initializeSettings } from './frontend/settings-ui.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { auth } from "../../config/config.js";

document.addEventListener('DOMContentLoaded', function() {
  // const auth = getAuth();
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Kullanıcı giriş yapmış
      console.log("Giriş yapılmış kullanıcı:", user.uid);
      initializeSettings();
    } else {
      // Kullanıcı giriş yapmamış
      console.log("Giriş yapılmamış");
      // Giriş sayfasına yönlendir veya bir mesaj göster
      document.getElementById('settingsContent').innerHTML = '<h2>Please log-in first.</h2>';
    }
  });
});