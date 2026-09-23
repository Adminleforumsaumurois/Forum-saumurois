(() => {
  const original = document.getElementById('address');
  if (!original || original.dataset.autocompleteFix === '1') return;
  const input = original.cloneNode(true);
  input.dataset.autocompleteFix = '1';
  original.replaceWith(input);
  for (const id of ['addressSuggestions','addressSuggestionsFix']) document.getElementById(id)?.remove();
  const box = document.createElement('div');
  box.id = 'addressSuggestionsFix';
  input.insertAdjacentElement('afterend', box);
  const style = document.createElement('style');
  style.textContent = '#addressSuggestionsFix{display:none;position:relative;z-index:2200;background:#fff;border:1px solid #d7d3cb;border-radius:6px;overflow:hidden;margin-top:-7px;box-shadow:0 4px 12px rgba(0,0,0,.12)}#addressSuggestionsFix.open{display:block}#addressSuggestionsFix button{display:block;width:100%;padding:11px;border:0;border-bottom:1px solid #eeeae3;background:#fff;text-align:left;font:inherit;font-size:12px;cursor:pointer}#addressSuggestionsFix button:hover,#addressSuggestionsFix button:focus{background:#f0eee8}';
  document.head.appendChild(style);
  let timer = null, requestId = 0;
  const hide = () => { box.classList.remove('open'); box.replaceChildren(); };
  const shortLabel = result => {
    const a = result.address || {};
    const place = a.city || a.town || a.village || a.municipality || a.hamlet || a.county || '';
    const road = a.road || a.pedestrian || a.footway || a.path || '';
    const number = a.house_number ? a.house_number + ' ' : '';
    const name = a.name && !road ? a.name : '';
    const main = [number + (road || name)].filter(Boolean).join('');
    const poi = a.amenity || a.shop || a.tourism || a.historic ? (a.name || result.name || '') : '';
    const first = poi || main || result.name || result.display_name?.split(',')[0] || '';
    return [first, place].filter((v,i,arr) => v && arr.indexOf(v)===i).join(', ');
  };
  input.addEventListener('input', () => {
    delete input.dataset.lat; delete input.dataset.lon; clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 3) { hide(); return; }
    timer = setTimeout(async () => {
      const current = ++requestId;
      try {
        const response = await fetch('/api/geocode?q=' + encodeURIComponent(q), {headers:{Accept:'application/json'}});
        if (!response.ok) throw new Error('geocoding');
        const results = await response.json();
        if (current !== requestId) return;
        const unique = [], seen = new Set();
        for (const result of (Array.isArray(results) ? results : [])) {
          const key = `${Number(result.lat).toFixed(6)},${Number(result.lon).toFixed(6)}`;
          if (!seen.has(key)) { seen.add(key); unique.push(result); }
        }
        box.replaceChildren();
        unique.slice(0, 20).forEach(result => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = shortLabel(result) || result.display_name || q;
          button.title = result.display_name || '';
          button.addEventListener('click', () => {
            const lat = Number(result.lat), lon = Number(result.lon);
            input.value = shortLabel(result) || result.display_name || q;
            if (typeof setPick === 'function') setPick(lat, lon, input.value);
            if (typeof pickMap !== 'undefined' && pickMap) pickMap.setView([lat, lon], 17);
            hide();
            if (typeof message === 'function') message('Adresse sélectionnée.');
          });
          box.appendChild(button);
        });
        box.classList.toggle('open', unique.length > 0);
      } catch { hide(); }
    }, 220);
  });
  document.addEventListener('click', event => { if (event.target !== input && !box.contains(event.target)) hide(); });
})();
