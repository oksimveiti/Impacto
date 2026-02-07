const termForm = document.getElementById('termForm');

// let userdata = JSON.parse(sessionStorage.getItem("userdata"));
// console.log(userdata);
// Just for testing and it works

termForm.addEventListener('submit', function (event) {
  event.preventDefault();

  window.location.href = '../../profile-setup-Semih/html/profileSetup.html';
})