(() => {
  const track = document.querySelector('.ca-client-track');
  if (track) {
    const copy = track.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('[tabindex]').forEach(item => item.removeAttribute('tabindex'));
    track.appendChild(copy);
  }
  const form = document.getElementById('ca-enquiry');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const body = `Name: ${data.get('name')}\nCompany: ${data.get('company')}\nPhone: ${data.get('phone')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
    window.location.href = `mailto:info@cameoadvt.com?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(body)}`;
    document.getElementById('ca-form-status').textContent = 'Your email app has been requested. Send the prepared email to complete your enquiry, or contact info@cameoadvt.com directly.';
  });
})();
