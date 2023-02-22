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

window.onload = (event) => {
  incEltNbr('servers')
  incEltNbr('players')
  let el = document.querySelector('body > div > div.serverlist > table > thead > tr > th:nth-child(5)')
  if (el) {
    el.click()
    el.click()
  }

  el = document.querySelector("body > div > div > div > div > div:nth-child(2) > table > thead > tr > th:nth-child(3)")
  if (el) {
    el.click()
  }
}
