function incEltNbr(e) {
  var elt = document.getElementById(e)
  if (elt) {
    incNbrRec(0, endNbr = Number(document.getElementById(e).innerHTML), elt)
  }
}

function incNbrRec(e, n, c) {
  e <= n && (c.innerHTML = e, setTimeout(function() {
    incNbrRec(e + 1, n, c)
  }, 10))
}

function loadCSSAsync(href) {
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

loadCSSAsync("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap");

window.onload = (event) => {
  incEltNbr('servers')
  incEltNbr('players')
  let el = document.querySelector('body > div > div.serverlist > table > thead > tr > th:nth-child(4)')
  if (el) {
    el.click()
    el.click()
  }
  el = document.querySelector("body > div > div > div > div > div:nth-child(2) > table > thead > tr > th:nth-child(3)")
  if (el) {
    el.click()
  }
}
