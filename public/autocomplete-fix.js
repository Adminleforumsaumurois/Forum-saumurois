(() => {
  const input = document.getElementById('address');
  if (!input || input.dataset.autocompleteFix === '1') return;
  input.dataset.autocompleteFix = '1';
  const box = document.createElement('div');
  box.id = 'addressSuggestionsFix';
  box.style.cssText = 'display:none;position:relative;z-index:2200;background:#fff;border:1px solid #d7d3cb;border-radius:6px;overflow:hidden;margin-top:-7px;box-shadow:0 4px 12px rgba(0,0,0,.12)';
  input.insertAdjacentElement('afterend', box);
  const style = document.createElement('style');
  style.textContent = '#addressSuggestionsFix.open{display:block}#addressSuggestionsFix button{display:block;width:100%;padding:11px;border:0;border-bottom:1px solid #eeeae3;background:#fff;text-align:left;font:inherit;font-size:12px;cursor:pointer}#addressSuggestionsFix button:hover{background:#f0eee8}';
  document.head.appendChild(style);
  let timer = null;
  let requestId = 0;
  const hide = () => { box.classList.remove('open'); box.innerHTML = ''; };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  input.addEventListener('input', () => {
    delete input.dataset.lat;
    delete input.dataset.lon;
    clearTimeout(timer);
    const query = input.value.trim();
    if (query.length < 3) { hide(); return; }
    timer = setTimeout(async () => {
      const current = ++requestId;
      try {
        const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=fr&addressdetails=1&q=' + encodeURIComponent(query + ', Saumur');
        const response = await fetch(url, {headers:{Accept:'application/json'}});
        if (!response.ok) throw new Error('geocoding');
        const results = await response.json();
        if (current !== requestId) return;
        box.innerHTML = '';
        results.slice(0, 5).forEach(result => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = result.display_name || query;
          button.addEventListener('click', () => {
            const lat = Number(result.lat), lon = Number(result.lon);
            input.value = result.display_name || query;
            input.dataset.lat = String(lat);
            input.dataset.lon = String(lon);
            if (typeof setPick === 'function') setPick(lat, lon, input.value);
            if (typeof pickMap !== 'undefined' && pickMap) pickMap.setView([lat, lon], 17);
            hide();
            if (typeof message === 'function') message('Adresse sélectionnée.');
          });
          box.appendChild(button);
        });
        box.classList.toggle('open', results.length > 0);
      } catch (error) {
        hide();
      }
    }, 300);
  });
  document.addEventListener('click', event => {
    if (event.target !== input && !box.contains(event.target)) hide();
  });
})();
