(() => {
  const original = document.getElementById('address');
  if (!original) return;

  const input = original.cloneNode(true);
  input.dataset.autocompleteFix = 'places-v2';
  original.replaceWith(input);

  ['addressSuggestions', 'addressSuggestionsFix'].forEach(id => {
    const node = document.getElementById(id);
    if (node) node.remove();
  });

  const box = document.createElement('div');
  box.id = 'addressSuggestionsPlaces';
  box.style.cssText = 'display:none;position:relative;z-index:2200;background:#fff;border:1px solid #d7d3cb;border-radius:6px;overflow:auto;max-height:330px;margin-top:-7px;box-shadow:0 4px 12px rgba(0,0,0,.12)';
  input.insertAdjacentElement('afterend', box);

  const style = document.createElement('style');
  style.textContent = '#addressSuggestionsPlaces.open{display:block}#addressSuggestionsPlaces button{display:block;width:100%;padding:10px 11px;border:0;border-bottom:1px solid #eeeae3;background:#fff;text-align:left;font:inherit;font-size:12px;line-height:1.35;cursor:pointer}#addressSuggestionsPlaces button:hover,#addressSuggestionsPlaces button:focus{background:#f0eee8}';
  document.head.appendChild(style);

  let timer = null;
  let requestId = 0;
  const unwanted = /^(France|France métropolitaine|Maine-et-Loire|Pays de la Loire)$/i;
  const cleanLabel = result => {
    const raw = String(result.display_name || '').split(',').map(x => x.trim()).filter(Boolean);
    const parts = raw.filter(x => !unwanted.test(x));
    return parts.slice(0, 4).join(', ') || String(result.display_name || 'Lieu trouvé');
  };
  const hide = () => { box.classList.remove('open'); box.replaceChildren(); };
  const uniqueResults = results => {
    const seen = new Set();
    return results.filter(result => {
      const key = `${Number(result.lat).toFixed(6)},${Number(result.lon).toFixed(6)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  input.addEventListener('input', () => {
    delete input.dataset.lat;
    delete input.dataset.lon;
    clearTimeout(timer);
    const typed = input.value.trim();
    if (typed.length < 3) { hide(); return; }

    timer = setTimeout(async () => {
      const current = ++requestId;
      try {
        const variants = [
          typed,
          `${typed}, Saumur, France`,
          `${typed}, Saumur Val de Loire, France`,
          `${typed}, Maine-et-Loire, France`
        ];
        const responses = await Promise.all(variants.map(query =>
          fetch('/api/geocode?' + new URLSearchParams({q: query}), {headers:{Accept:'application/json'}})
            .then(response => response.ok ? response.json() : [])
            .catch(() => [])
        ));
        if (current !== requestId) return;

        const results = uniqueResults(responses.flat());
        box.replaceChildren();
        results.slice(0, 30).forEach(result => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = cleanLabel(result);
          button.title = result.display_name || '';
          button.addEventListener('click', () => {
            const lat = Number(result.lat);
            const lon = Number(result.lon);
            input.value = cleanLabel(result);
            input.dataset.lat = String(lat);
            input.dataset.lon = String(lon);
            if (typeof setPick === 'function') setPick(lat, lon, input.value);
            if (typeof pickMap !== 'undefined' && pickMap) pickMap.setView([lat, lon], 17);
            hide();
            if (typeof message === 'function') message('Lieu sélectionné.');
          });
          box.appendChild(button);
        });
        box.classList.toggle('open', results.length > 0);
      } catch {
        hide();
      }
    }, 250);
  });

  document.addEventListener('click', event => {
    if (event.target !== input && !box.contains(event.target)) hide();
  });
})();
