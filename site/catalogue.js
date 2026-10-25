(() => {
  'use strict';
  const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
  if(!$('#product-grid'))return;
  const labels={aluminium:'Aluminium overkappingen',glas:'Glazen schuifwanden',screens:'Screens & zonwering',accessoires:'Accessoires'};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:Number.isInteger(value)?0:2}).format(value);
  const params=new URLSearchParams(location.search);
  let category=labels[params.get('categorie')]?params.get('categorie'):'all',products=[],limit=12,activeProduct=null,activeVariant=null;
  const grid=$('#product-grid'),status=$('#catalogue-count'),dialog=$('#product-dialog');
  function picture(p,index,attrs='') {
    const src=p.images[index],source=p.imageSources?.[index];
    return '<img src="'+escape(src)+'" data-image-fallback="'+escape(src)+'" '+(source?'srcset="'+escape(source.small)+' 900w, '+escape(source.large)+' 1800w" sizes="(max-width:600px) 46vw, (max-width:900px) 45vw, 32vw" ':'')+'alt="'+escape(p.title)+'" '+attrs+'>';
  }
  document.addEventListener('error',event=>{
    const img=event.target;
    if(img.tagName==='IMG'&&img.dataset.imageFallback&&!img.dataset.fallbackUsed){
      img.dataset.fallbackUsed='true';img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=img.dataset.imageFallback;
    }
  },true);
  function filtered() {
    const query=$('#product-search').value.trim().toLocaleLowerCase('nl'),width=$('#width-filter').value;
    const list=products.filter(p=>(category==='all'||p.category===category)&&(!query||(p.title+' '+(p.specs||[]).join(' ')).toLocaleLowerCase('nl').includes(query))&&(!width||String(p.width)===width));
    const sort=$('#product-sort').value;
    if(sort==='price-desc')list.sort((a,b)=>b.price-a.price);
    else if(sort==='name')list.sort((a,b)=>a.title.localeCompare(b.title,'nl'));
    else if(sort==='price-asc')list.sort((a,b)=>a.price-b.price);
    else {const order={aluminium:0,glas:1,screens:2,accessoires:3};list.sort((a,b)=>order[a.category]-order[b.category]||a.price-b.price);}
    return list;
  }
  function render() {
    const list=filtered();
    status.textContent=list.length+' '+(list.length===1?'product':'producten')+(category!=='all'?' · '+labels[category]:'');
    $$('[data-category]').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#width-filter').disabled=category!=='aluminium';
    grid.innerHTML=list.slice(0,limit).map(p=>'<button class="product-card" data-product="'+escape(p.id)+'" data-product-category="'+p.category+'" aria-label="Bekijk '+escape(p.title)+'"><div class="product-photo">'+picture(p,0,'width="720" height="600" loading="lazy" decoding="async"')+(p.category==='aluminium'&&p.images[1]?picture(p,1,'class="photo-secondary" aria-hidden="true" width="720" height="600" loading="lazy" decoding="async"'):'')+(p.specs?.[0]?'<span class="product-size">'+escape(p.specs[0])+'</span>':'')+'</div><p class="product-category">'+labels[p.category]+'</p><h3>'+escape(p.displayTitle||p.title)+'</h3><p class="product-specs">'+escape((p.specs||[]).join(' · '))+'</p><p class="product-price"><small>Vanaf</small>'+money(p.price)+'</p><p class="product-meta">Bekijk uitvoeringen</p></button>').join('');
    if(!list.length)grid.innerHTML='<div class="empty-state"><h3>Even anders zoeken?</h3><p>Er zijn geen producten met deze combinatie van filters.</p><button class="text-link" id="clear-filters">Wis de filters</button></div>';
    $('#load-more').hidden=list.length<=limit;$('#shown-count').textContent=Math.min(limit,list.length)+' van '+list.length+' weergegeven';
  }
  function categoryChange(value) {
    category=value;limit=12;$('#width-filter').value='';render();
    const url=new URL(location.href);if(value==='all')url.searchParams.delete('categorie');else url.searchParams.set('categorie',value);url.searchParams.delete('product');history.replaceState({},'',url);
  }
  $$('[data-category]').forEach(b=>b.addEventListener('click',()=>categoryChange(b.dataset.category)));
  ['product-search','width-filter','product-sort'].forEach(id=>$('#'+id).addEventListener(id==='product-search'?'input':'change',()=>{limit=12;render();}));
  $('#load-more').addEventListener('click',()=>{limit+=12;render();});
  grid.addEventListener('click',event=>{const card=event.target.closest('[data-product]');if(card)openProduct(card.dataset.product);if(event.target.closest('#clear-filters')){$('#product-search').value='';categoryChange('all');}});
  function setPhoto(index) {
    const p=activeProduct,img=$('#detail-image'),source=p.imageSources?.[index];
    img.src=p.images[index];img.dataset.imageFallback=p.images[index];delete img.dataset.fallbackUsed;
    if(source){img.srcset=source.small+' 900w, '+source.large+' 1800w';img.sizes='(max-width:600px) 85vw, 550px';}else img.removeAttribute('srcset');
    $$('[data-image]',dialog).forEach(b=>{const active=Number(b.dataset.image)===index;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function updateVariant() {
    const choices=$$('.variant-select',dialog).map(s=>s.value);
    activeVariant=activeProduct.variants.find(v=>choices.every((choice,i)=>v.options[i]===choice));
    $('#detail-price').textContent=activeVariant?money(activeVariant.price):'Op aanvraag';
    $('#variant-status').textContent=activeVariant?(activeVariant.available?'Kies uw uitvoering en voeg deze toe aan uw demo winkelmandje.':'Deze uitvoering was niet beschikbaar bij de catalogusopname.'):'Deze combinatie is niet beschikbaar.';
    $('#add-to-cart').disabled=!activeVariant?.available;
    const original=$('#original-product');original.href=activeProduct.url+(activeVariant?'?variant='+activeVariant.id:'');
    if(activeVariant?.imageIndex!==undefined)setPhoto(activeVariant.imageIndex);
  }
  function openProduct(id) {
    const p=products.find(item=>item.id===id);if(!p)return;activeProduct=p;
    $('#detail-content').innerHTML='<div class="product-detail"><div class="detail-gallery">'+picture(p,0,'id="detail-image"')+'<div class="detail-thumbs">'+p.images.map((src,i)=>'<button type="button" data-image="'+i+'" class="'+(i===0?'active':'')+'" aria-pressed="'+(i===0)+'" aria-label="Productafbeelding '+(i+1)+'"><img src="'+escape(src)+'" alt="" loading="lazy"></button>').join('')+'</div>'+(p.imageNote?'<p class="product-image-note">'+escape(p.imageNote)+'</p>':'')+'</div><div class="detail-copy"><p class="product-category">'+labels[p.category]+'</p><h2 id="product-title">'+escape(p.displayTitle||p.title)+'</h2><p class="detail-product-specs">'+escape((p.specs||[]).join(' · '))+'</p><p class="detail-price" id="detail-price"></p><p class="detail-price-note">Voorbeeldprijs uit de catalogus van 25 oktober 2026.</p>'+p.options.filter(o=>o.name!=='Title').map((o,i)=>'<label class="variant-label">'+escape(o.name)+'<select class="variant-select" data-option="'+i+'">'+o.values.map(v=>'<option>'+escape(v)+'</option>').join('')+'</select></label>').join('')+'<div class="detail-action"><label class="detail-quantity">Aantal<input id="product-quantity" type="number" min="1" max="99" step="1" value="1"></label><button type="button" class="button button-dark" id="add-to-cart">In het winkelmandje</button><p class="shop-demo-caption">Demo winkelervaring. Geen echte bestelling of betaling.</p><a class="text-link" id="original-product" target="_blank" rel="noopener">Bekijk in de originele webshop</a></div><p class="form-note" id="variant-status"></p><div class="detail-spec"><details><summary>Meer over dit product</summary><p class="source-description">'+escape(p.description)+'</p></details></div></div></div>';
    $$('.variant-select',dialog).forEach(s=>s.addEventListener('change',updateVariant));
    $$('[data-image]',dialog).forEach(b=>b.addEventListener('click',()=>setPhoto(Number(b.dataset.image))));
    $('#add-to-cart').addEventListener('click',()=>{const input=$('#product-quantity');if(!input.reportValidity())return;window.Care4Shop.add(p,activeVariant,Number(input.value));});
    setPhoto(0);updateVariant();dialog.showModal();document.body.classList.add('locked');
    const url=new URL(location.href);url.searchParams.set('product',p.id);history.replaceState({},'',url);
  }
  $('.dialog-close',dialog).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.toggle('locked',!!$('dialog[open]'));const url=new URL(location.href);url.searchParams.delete('product');history.replaceState({},'',url);});
  window.Care4Shop.catalogue().then(data=>{
    products=data.products;const widths=[...new Set(products.map(p=>p.width).filter(Boolean))].sort((a,b)=>a-b);
    $('#width-filter').innerHTML='<option value="">Alle breedtes</option>'+widths.map(w=>'<option value="'+w+'">'+String(w).replace('.',',')+' meter</option>').join('');
    render();if(params.get('product'))openProduct(params.get('product'));
  }).catch(()=>{status.textContent='De collectie kon niet worden geladen.';grid.innerHTML='<div class="empty-state"><h3>De collectie is even niet beschikbaar.</h3><p>Herlaad de pagina of bekijk de originele webshop.</p><a class="text-link" href="https://care4gardens.nl/collections/all">Naar Care4Gardens</a></div>';$('#load-more').hidden=true;});
})();
