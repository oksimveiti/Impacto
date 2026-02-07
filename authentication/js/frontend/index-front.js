document.addEventListener("DOMContentLoaded", () => {
  const signUpBtn = document.querySelector('.sign-up');
  const logInBtn = document.querySelector('.log-in');

  signUpBtn.addEventListener('click', () => {
    window.location.href = "authentication-Francisco/html/sign-up.html";
  })

  logInBtn.addEventListener('click', () => {
    window.location.href = "authentication-Francisco/html/log-in.html";
  })
})