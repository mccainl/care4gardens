(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = cents => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(cents/100);
  const key = 'care4gardens-demo-cart-v1';
  const quantity = value => Math.max(1, Math.min(99, Math.floor(Number(value)||1)));
  let memory = [], cataloguePromise, products = [], completed = false;
  const icon = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  function read() {
    try { const raw = JSON.parse(localStorage.getItem(key)||'[]'); memory = Array.isArray(raw) ? raw.filter(x=>x&&typeof x.productId==='string'&&/^\d+$/.test(String(x.variantId))).slice(0,100).map(x=>({productId:x.productId,variantId:String(x.variantId),quantity:quantity(x.quantity)})) : []; }
    catch {}
    return memory;
  }
  function write(items) {
    memory = items;
    try { localStorage.setItem(key,JSON.stringify(items)); } catch {}
    refreshBadges();
    document.dispatchEvent(new CustomEvent('care4gardens:cart'));
  }
  function catalogue() {
    if (!cataloguePromise) cataloguePromise = fetch('catalogue.json').then(r=>{if(!r.ok)throw Error('catalogue');return r.json();}).then(data=>{products=data.products;return data;}).catch(error=>{cataloguePromise=null;throw error;});
    return cataloguePromise;
  }
  function lines() {
    return read().flatMap(item=>{
      const product=products.find(p=>p.id===item.productId);
      const variant=product?.variants.find(v=>String(v.id)===item.variantId&&v.available);
      return product&&variant?[{...item,product,variant,cents:Math.round(variant.price*100)}]:[];
    });
  }
  const total = items => items.reduce((sum,item)=>sum+item.cents*item.quantity,0);
  function refreshBadges() {
    const count=read().reduce((sum,item)=>sum+item.quantity,0);
    $$('[data-cart-count]').forEach(el=>el.textContent=count);
    $$('[data-open-cart]').forEach(el=>el.setAttribute('aria-label','Winkelmandje openen, '+count+' producten'));
  }
  const header=$('.header-actions');
  if(header){
    const button=document.createElement('button');
    button.type='button';button.className='cart-trigger';button.dataset.openCart='';
    button.innerHTML=icon+'<span class="cart-word">Winkelmandje</span><span data-cart-count>0</span>';
    header.prepend(button);
  }
  const dialog=document.createElement('dialog');
  dialog.id='cart-dialog';dialog.className='cart-dialog';dialog.setAttribute('aria-labelledby','cart-title');
  dialog.innerHTML='<div class="cart-top"><div><p class="eyebrow">UW SELECTIE</p><h2 id="cart-title">Uw winkelmandje.</h2></div><button class="dialog-close" type="button" aria-label="Winkelmandje sluiten"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div><p class="demo-note">Een voorproefje van uw buitenleven. Dit is een demo, u plaatst geen echte bestelling.</p><div id="cart-content" aria-live="polite"></div>';
  document.body.append(dialog);
  function lineMarkup(item,editable) {
    const p=item.product,v=item.variant;
    return '<article class="basket-line"><img src="'+escape(p.images[0])+'" alt="'+escape(p.title)+'" width="112" height="96"><div class="basket-line-copy"><h3>'+escape(p.displayTitle||p.title)+'</h3><p>'+escape(p.specs?.join(' · ')||'')+'</p><p>'+escape(v.title==='Default Title'?'Standaard uitvoering':v.title)+'</p>'+(editable?'<div class="basket-actions"><label>Aantal <input type="number" min="1" max="99" step="1" value="'+item.quantity+'" data-cart-quantity="'+item.variantId+'" aria-label="Aantal '+escape(p.title)+'"></label><button class="remove-item" type="button" data-remove-item="'+item.variantId+'" aria-label="Verwijder '+escape(p.title)+'">Verwijderen</button></div>':'<p>Aantal: '+item.quantity+'</p>')+'</div><strong class="basket-price">'+money(item.cents*item.quantity)+'</strong></article>';
  }
  function renderCart() {
    const items=lines();
    $('#cart-content').innerHTML=items.length?'<div class="basket-lines">'+items.map(item=>lineMarkup(item,true)).join('')+'</div><div class="cart-bottom"><p class="basket-total"><span>Producttotaal</span><strong>'+money(total(items))+'</strong></p><p class="form-note">Voorbeeldprijzen uit de collectie. De definitieve uitvoering en levering worden afgestemd.</p><a class="button button-dark cart-checkout" href="checkout.html">Verder naar demo checkout</a><button type="button" class="text-link" data-close-cart>Verder ontdekken</button></div>':'<div class="cart-empty"><p>Hier begint uw nieuwe buitenruimte.</p><p>Kies een product en bewaar uw favoriete uitvoering.</p><a class="button button-dark" href="collectie.html">Ontdek de collectie</a></div>';
  }
  async function openCart() {
    $$('dialog[open]').forEach(d=>{if(d!==dialog)d.close();});
    if(!dialog.open)dialog.showModal();document.body.classList.add('locked');
    $('#cart-content').innerHTML='<p class="cart-loading">Uw selectie wordt geladen…</p>';
    try { await catalogue(); renderCart(); }
    catch { $('#cart-content').innerHTML='<div class="cart-empty"><p>Uw selectie kon niet worden geladen.</p><button type="button" class="button button-dark" data-retry-cart>Opnieuw proberen</button></div>'; }
  }
  function add(product,variant,count=1) {
    if(!product||!variant?.available)return false;
    const items=read().slice(), existing=items.find(x=>x.variantId===String(variant.id));
    if(existing)existing.quantity=quantity(existing.quantity+quantity(count));
    else items.push({productId:product.id,variantId:String(variant.id),quantity:quantity(count)});
    write(items);openCart();return true;
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-open-cart],[data-retry-cart]'))openCart();
    if(event.target.closest('[data-close-cart]'))dialog.close();
    const remove=event.target.closest('[data-remove-item]');
    if(remove){write(read().filter(x=>x.variantId!==remove.dataset.removeItem));renderCart();}
  });
  dialog.addEventListener('change',event=>{
    const input=event.target.closest('[data-cart-quantity]');if(!input)return;
    write(read().map(item=>item.variantId===input.dataset.cartQuantity?{...item,quantity:quantity(input.value)}:item));
    renderCart();
  });
  $('.dialog-close',dialog).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.classList.toggle('locked',!!$('dialog[open]')));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  addEventListener('storage',event=>{if(event.key===key){refreshBadges();if(dialog.open)renderCart();if($('#checkout-form'))renderCheckout();}});
  window.Care4Shop={add,catalogue,read,openCart};
  refreshBadges();

  const form=$('#checkout-form');
  if(!form)return;
  function renderCheckout() {
    if(completed)return;
    const items=lines();$('#checkout-loading').hidden=true;
    $('#checkout-empty').hidden=!!items.length;$('#checkout-layout').hidden=!items.length;
    $('#checkout-summary-lines').innerHTML=items.map(item=>lineMarkup(item,false)).join('');
    $('#checkout-total').textContent=money(total(items));
  }
  catalogue().then(renderCheckout).catch(()=>{$('#checkout-loading').textContent='De collectie kon niet worden geladen. Herlaad de pagina om het opnieuw te proberen.';});
  document.addEventListener('care4gardens:cart',renderCheckout);
  $('#checkout-next').addEventListener('click',()=>{
    if(!form.reportValidity())return;
    $('#checkout-delivery').hidden=true;$('#checkout-payment').hidden=false;
    const details=new FormData(form);
    $('#delivery-summary').textContent=details.get('name')+' · '+details.get('street')+' · '+details.get('postcode')+' '+details.get('city');
    $('#checkout-step-one').removeAttribute('aria-current');$('#checkout-step-two').setAttribute('aria-current','step');
    $('#payment-heading').focus();
  });
  $('#checkout-back').addEventListener('click',()=>{$('#checkout-payment').hidden=true;$('#checkout-delivery').hidden=false;$('#checkout-step-two').removeAttribute('aria-current');$('#checkout-step-one').setAttribute('aria-current','step');$('#checkout-name').focus();});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if($('#checkout-payment').hidden){$('#checkout-next').click();return;}
    if(!form.reportValidity()||!lines().length)return;
    const items=lines();completed=true;
    $('#confirmation-total').textContent=money(total(items));
    $('#confirmation-items').textContent=items.reduce((sum,item)=>sum+item.quantity,0)+' producten in uw voorbeeldbestelling.';
    $('#checkout-layout').hidden=true;$('#checkout-success').hidden=false;
    write([]);form.reset();$('#checkout-success-title').focus();
  });
})();
