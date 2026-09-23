(() => {
  const original = document.getElementById('address');
  if (!original || original.dataset.autocompleteFix === '1') return;

  // Remplace le champ afin de supprimer l'ancien écouteur qui affichait une seule suggestion.
  const input = original.cloneNode(true);
  input.dataset.autocompleteFix = '1';
  original.replaceWith(input);
  const oldBox = document.getElementById('addressSuggestions');
  if (oldBox) oldBox.remove();
  const oldFixBox = document.getElementById('addressSuggestionsFix');
  if (oldFixBox) oldFixBox.remove();

  const box = document.createElement('div');
  box.id = 'addressSuggestionsFix';
  box.style.cssText = 'display:none;position:relative;z-index:2200;background:#fff;border:1px solid #d7d3cb;border-radius:6px;overflow:hidden;margin-top:-7px;box-shadow:0 4px 12px rgba(0,0,0,.12)';
  input.insertAdjacentElement('afterend', box);
  const style = document.createElement('style');
  style.textContent = '#addressSuggestionsFix.open{display:block}#addressSuggestionsFix button{display:block;width:100%;padding:11px;border:0;border-bottom:1px solid #eeeae3;background:#fff;text-align:left;font:inherit;font-size:12px;cursor:pointer}#addressSuggestionsFix button:hover,#addressSuggestionsFix button:focus{background:#f0eee8}';
  document.head.appendChild(style);

  let timer = null;
  let requestId = 0;
  const hide = () => { box.classList.remove('open'); box.innerHTML = ''; };
  const streetOnly = value => value.split(',')[0].trim();
  const showLabel = result => result.display_name || [result.address?.road, result.address?.city || result.address?.town || result.address?.village].filter(Boolean).join(', ');

  input.addEventListener('input', () => {
    delete input.dataset.lat;
    delete input.dataset.lon;
    clearTimeout(timer);
    const typed = input.value.trim();
    if (typed.length < 3) { hide(); return; }

    timer = setTimeout(async () => {
      const current = ++requestId;
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          limit: '50',
          dedupe: '0',
          addressdetails: '1',
          countrycodes: 'fr',
          bounded: '1',
          viewbox: '-0.35,47.40,0.20,47.05',
          q: streetOnly(typed)
        });
        const response = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {headers:{Accept:'application/json'}});
        if (!response.ok) throw new Error('geocoding');
        const results = await response.json();
        if (current !== requestId) return;

        const unique = [];
        const seen = new Set();
        for (const result of results) {
          const key = `${Number(result.lat).toFixed(6)},${Number(result.lon).toFixed(6)}`;
          if (!seen.has(key)) { seen.add(key); unique.push(result); }
        }

        box.innerHTML = '';
        unique.slice(0, 20).forEach(result => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = showLabel(result) || typed;
          button.addEventListener('click', () => {
            const lat = Number(result.lat), lon = Number(result.lon);
            input.value = showLabel(result) || typed;
            input.dataset.lat = String(lat);
            input.dataset.lon = String(lon);
            if (typeof setPick === 'function') setPick(lat, lon, input.value);
            if (typeof pickMap !== 'undefined' && pickMap) pickMap.setView([lat, lon], 17);
            hide();
            if (typeof message === 'function') message('Adresse sélectionnée.');
          });
          box.appendChild(button);
        });
        box.classList.toggle('open', unique.length > 0);
      } catch (error) {
        hide();
      }
    }, 350);
  });

  document.addEventListener('click', event => {
    if (event.target !== input && !box.contains(event.target)) hide();
  });
})();
