// Real World — marketing site v0. Vanilla JS, no dependencies.
(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", links.classList.contains("open"));
    });
  }

  // Screenshot lightbox
  var lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML =
    '<button class="close" aria-label="Close">&times;</button>' +
    '<img alt="">' +
    '<div class="cap"></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector("img");
  var lbCap = lb.querySelector(".cap");

  document.querySelectorAll(".gallery img").forEach(function (img) {
    img.addEventListener("click", function () {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent =
        (img.closest("figure") && img.closest("figure").querySelector("figcaption"))
          ? img.closest("figure").querySelector("figcaption").textContent
          : img.alt;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLb() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  lb.addEventListener("click", function (e) {
    if (e.target !== lbImg) closeLb();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLb();
  });

  // Footer year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
