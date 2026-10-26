(() => {
  'use strict';
  const button = document.getElementById('load-configurator');
  const target = document.getElementById('quote-embed');
  if (!button || !target) return;
  button.addEventListener('click', () => {
    if (target.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'quote-iframe';
    iframe.title = 'Stel uw Care4Gardens terrasoverkapping samen';
    // Public embedded route from the existing Reuzenpanda integration.
    // Do not copy runtime tracking IDs or create a replacement lead endpoint.
    iframe.src = 'https://directsamenstellen.nl/configurator/8a87f60b-3112-4e43-8906-a4fce59cdc14/reuzenpanda-embedded/1';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    document.getElementById('quote-status').textContent = 'Calculator openen… Werkt het formulier niet? Gebruik de link naar de bestaande calculator.';
    iframe.addEventListener('load', () => {
      document.getElementById('quote-status').textContent = 'Geen formulier zichtbaar? Open de bestaande calculator rechtstreeks.';
    });
    target.hidden = false;
    target.appendChild(iframe);
    button.setAttribute('aria-expanded', 'true');
    document.getElementById('quote-start').hidden = true;
    iframe.focus();
  });
})();
