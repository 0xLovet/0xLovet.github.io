const MAX_SUPPLY = 1024;
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"
/* Loading */
$(window).on("load",function(){
  $(".loader-wrapper").fadeOut("slow");
});

function scrollSmoothTo(elementId) {
  var element = document.getElementById(elementId);
      element.scrollIntoView({
      block: 'start',
      behavior: 'smooth'
  });
}
swapBgButton.onclick = () => {
  refreshIcon.src = "images/refresh_animated.svg";
  var newBg = new Image;
  var n = Math.floor(Math.random() * MAX_SUPPLY);
  newBg.onload = function() {
    document.body.style.backgroundImage = "url('" + newBg.src + "')";
    refreshIcon.src = "images/refresh.svg";
  };			
  newBg.src = IPFS_GATEWAY + "QmcqwVZVEiZv3yAzVF7T2zRxPfGem4L6kKwsGo2Vq2D7QD/" + n + ".svg";
};

function month() {
  var months = document.querySelectorAll(".month");

  for (var i = 0; i < months.length; i++) {
    var windowHeight = window.innerHeight;
    var elementTop = months[i].getBoundingClientRect().top;
    var elementVisible = 50;

    if (elementTop < windowHeight - elementVisible) {
      months[i].classList.add("active");
    } else {
      months[i].classList.remove("active");
    }
  }
}

window.addEventListener("scroll", month);