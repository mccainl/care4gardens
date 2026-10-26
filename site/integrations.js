(() => {
  'use strict';
  const target = document.getElementById('quote-embed');
  const start = document.getElementById('quote-start');
  if (!start || !target) return;
  document.addEventListener('care4gardens:request-quote', event => {
    if (target.querySelector('iframe')) return;
    // Public prefill interface. Both dimension branches share question names,
    // so always let visitors confirm their active dimensions at step four.
    const url = new URL('https://directsamenstellen.nl/configurator/8a87f60b-3112-4e43-8906-a4fce59cdc14/reuzenpanda-embedded/4');
    const messageId = 'care4gardens-' + (crypto.randomUUID?.() || Date.now().toString(36));
    url.searchParams.set('messageId', messageId);
    for (const [name, value] of Object.entries(event.detail.prefill)) url.searchParams.set('pf_' + name, value);
    const header = document.createElement('div');
    header.className = 'quote-handoff';
    header.innerHTML = '<div class="quote-handoff-top"><div><span class="eyebrow">VAN ONTWERP NAAR AANVRAAG</span><h3>Uw keuzes gaan met u mee.</h3></div><button type="button" id="edit-visual-design">Ontwerp aanpassen</button></div><p>Controleer uw maten en keuzes in de calculator hieronder en vul daarna uw contactgegevens in. Dit is een live aanvraagformulier: pas na de laatste bevestiging wordt uw aanvraag verzonden.</p><details><summary>Bekijk uw ontwerpoverzicht</summary><pre></pre></details>';
    header.querySelector('pre').textContent = event.detail.summary;
    const iframe = document.createElement('iframe');
    iframe.className = 'quote-iframe';
    iframe.title = 'Controleer uw Care4Gardens ontwerp en vraag een offerte aan';
    iframe.src = url.href;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    let stepTimer, ready = false;
    const onProviderReady = message => {
      if (ready || message.origin !== url.origin || message.source !== iframe.contentWindow || message.data?.id !== 'snippet-iframe-ready' || message.data?.data?.messageId !== messageId) return;
      ready = true;
      // The provider initializes at question one even when the URL ends in /4.
      // Its supported ready/step messages avoid racing that initialization.
      iframe.contentWindow.postMessage({id: 'prefill', data: event.detail.prefill}, url.origin);
      stepTimer = setTimeout(() => {
        if (iframe.isConnected) iframe.contentWindow.postMessage({id: 'set-step-position', messageId, data: {stepPosition: 3}}, url.origin);
      }, 350);
    };
    window.addEventListener('message', onProviderReady);
    const button = document.getElementById('load-configurator');
    const direct = document.getElementById('quote-direct');
    direct.href = url.href;
    direct.textContent = 'Open uw aanvraag rechtstreeks';
    document.getElementById('quote-status').textContent = 'Uw keuzes worden in de bestaande calculator geopend…';
    iframe.addEventListener('load', () => {
      document.getElementById('quote-status').textContent = 'Geen formulier zichtbaar? Open uw aanvraag rechtstreeks.';
    });
    target.hidden = false;
    target.replaceChildren(header, iframe);
    button.setAttribute('aria-expanded', 'true');
    start.hidden = true;
    header.querySelector('button').addEventListener('click', () => {
      clearTimeout(stepTimer);window.removeEventListener('message', onProviderReady);
      target.replaceChildren();target.hidden = true;start.hidden = false;
      button.setAttribute('aria-expanded', 'false');
      document.getElementById('atelier-title').focus({preventScroll: true});
      start.scrollIntoView?.({block: 'start'});
    });
    target.scrollIntoView?.({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
})();
