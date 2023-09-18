function loadCSS(url) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

loadCSS('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

function incEltNbr(e) {
  var t = document.getElementById(e);
  t && incNbrRec(0, (endNbr = Number(document.getElementById(e).innerHTML)), t);
}

function incNbrRec(e, t, i) {
  e <= t &&
  ((i.innerHTML = e),
  setTimeout(function () {
    incNbrRec(e + 1, t, i);
  }, 10));
}

function updateTimeAgo() {
  const myDiv = document.getElementById('timestampDiv');
  const timestamp = parseInt(myDiv.getAttribute('data-ts'), 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDifference = currentTime - timestamp;
  myDiv.textContent = `${timeDifference} seconds ago`;
}

(window.onload = (e) => {
  incEltNbr('servers');
  incEltNbr('players');
  if (document.getElementById('timestampDiv')) {
    updateTimeAgo();
    setInterval(updateTimeAgo, 1000);
  }
});
