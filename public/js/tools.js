const serverForm = document.getElementById('server-form');
if (serverForm) {
  const alertContainer = document.getElementsByClassName('alert-container')[0];

  serverForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    alertContainer.innerHTML = '';

    const formData = new FormData(this);
    const selectedServers = [];
    formData.forEach((value, key) => {
      if (key === 'servers') {
        selectedServers.push(value);
      }
    });
    if (selectedServers.length === 0) {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('alert', 'err');
      errorDiv.textContent = 'No servers selected.';
      alertContainer.appendChild(errorDiv);
      return;
    }

    const url = formData.get('url');
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d{18,20}\/[A-Za-z0-9_-]{68}$/;
    if (typeof url !== 'string' || !discordWebhookRegex.test(url)) {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('alert', 'err');
      errorDiv.textContent = 'Invalid webhook URL.';
      alertContainer.appendChild(errorDiv);
      return;
    }

    const submitButton = serverForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch('/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servers: selectedServers, url: url })
      });

      const result = await response.json();
      if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('alert', 'err');
        errorDiv.textContent = result.error;
        alertContainer.appendChild(errorDiv);
      } else if (result.msg) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('alert', 'msg');
        msgDiv.textContent = result.msg;
        alertContainer.appendChild(msgDiv);
      }
    } catch (error) {
      const alertContainer = document.getElementsByClassName('alert-container')[0];
      alertContainer.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('alert', 'err');
      errorDiv.textContent = 'An error occurred while submitting the form.';
      alertContainer.appendChild(errorDiv);
    } finally {
      submitButton.disabled = false;
    }
  });
}
