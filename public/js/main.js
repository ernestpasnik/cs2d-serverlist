const copyBtn = document.getElementsByClassName('copyBtn')[0];
if (copyBtn) {
  const copyContent = document.getElementsByClassName('copyContent')[0];
  let clicked = false;
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (clicked) return;


    const toCopy = copyContent.getAttribute('data-tocopy');
    const originalText = copyContent.textContent;
    navigator.clipboard.writeText(toCopy).then(() => {
      copyContent.textContent = 'Copied to clipboard';
      clicked = true;
      setTimeout(() => {
        copyContent.textContent = originalText;
        clicked = false;
      }, 2000);
    });
  });
}

tippy('[data-tippy-content]', { allowHTML: true });
