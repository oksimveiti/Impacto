document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("eventTypeModal")
  
  function openModal(){
    modal.classList.add("active");
  }

  window.addEventListener("message", function(event){
    console.log(event.data);
    if(event.data === "openModal"){
      openModal();
    }
  })

});
