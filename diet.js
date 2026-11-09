// ─── Rebbe Club · Dieta ──────────────────────────────────────────────────────
// Los planes del mes están en la tabla 'diets' de Supabase (se cargan con un
// SQL como supabase/7-dietas-noviembre.sql). El plan que elige cada clienta se
// guarda en 'rebbe_diet', que se sincroniza con su cuenta y lo ve la coach.

(function () {
  let plans = null;          // null = not loaded yet
  let picking = false;       // true while she is changing plan
  const optIdx = {};         // meal index -> chosen option (this session)

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => String(n).replace('.', ',');

  async function load() {
    const sb = window.RebbeCloud && RebbeCloud.client && RebbeCloud.client();
    if (!sb) return;
    const { data, error } = await sb.from('diets').select('id,month,title,subtitle,kcal,position,data').eq('active', true).order('position');
    if (error) { console.warn('No se pudieron cargar las dietas', error); return; }
    setPlans(data || []);
  }

  function setPlans(list) {
    plans = list;
    if (typeof currentSection !== 'undefined' && currentSection === 'diet') render();
  }

  function current() {
    const id = storage.get('rebbe_diet');
    return (plans || []).find(p => p.id === id) || null;
  }

  // ─── choose a plan ─────────────────────────────────────────────────────────

  function pickerHtml(cur) {
    const month = plans[0].month;
    return `
      <div class="classes-head">
        <div class="card-title" style="font-size:28px">Dieta</div>
        <div class="card-muted">${esc(month)} · elige el plan que vas a seguir.</div>
      </div>
      <div class="diet-rule">🧮 <b>¿Cuál es tu plan?</b> Usa la <a href="https://rebecadossantis.systeme.io/rebbeclubcalculadora" target="_blank" rel="noopener">calculadora del Rebbe Club</a> y elige la dieta que más se acerque a tu déficit del 15 %. Si no sabes usarla, mira el <a href="https://youtu.be/zu356NqrGQc" target="_blank" rel="noopener">vídeo de cómo usar la calculadora</a>.<br><br>¿Tienes dudas? Escríbeme y te ayudo a elegir 💗</div>
      ${plans.map(p => `<div class="diet-plan ${cur && cur.id === p.id ? 'on' : ''}" onclick="RebbeDiet.choose('${esc(p.id)}')">
        <div class="diet-plan-kcal">${p.kcal ? `${p.kcal}<span>kcal</span>` : '🍽️'}</div>
        <div style="flex:1;min-width:0">
          <div class="lesson-title">${esc(p.title)}</div>
          <div class="card-muted">${esc(p.subtitle || '')}</div>
        </div>
        <span class="card-muted">${cur && cur.id === p.id ? '✓' : '›'}</span>
      </div>`).join('')}
      <div class="card-muted" style="margin:14px 4px">Puedes cambiar de plan cuando quieras.</div>
      ${cur ? `<button class="btn-ghost" style="width:100%" onclick="RebbeDiet.cancelPick()">Volver a mi plan</button>` : ''}`;
  }

  // ─── the plan, meal by meal ────────────────────────────────────────────────

  function itemHtml(it, groups) {
    if (it.group) {
      const g = groups[it.group] || { items: [] };
      return `<div class="diet-item">
        <div><b>${esc(it.t)}</b> · ${esc(it.q)}</div>
        <div class="diet-alts">${g.items.slice(0, 3).map(x => `<div>${esc(x.t)} · ${esc(x.q)}</div>`).join('')}</div>
        ${g.items.length > 3 ? `<details class="diet-more"><summary>Ver las ${g.items.length} opciones</summary>
          <div class="diet-alts">${g.items.slice(3).map(x => `<div>${esc(x.t)} · ${esc(x.q)}</div>`).join('')}</div></details>` : ''}
      </div>`;
    }
    return `<div class="diet-item">
      <div><b>${esc(it.t)}</b> · ${esc(it.q)}</div>
      ${(it.alts || []).map(a => `<div class="diet-alt">o ${esc(a.t)} · ${esc(a.q)}</div>`).join('')}
    </div>`;
  }

  function mealHtml(m, i, groups) {
    const n = m.options.length;
    const k = Math.min(optIdx[i] || 0, n - 1);
    const o = m.options[k];
    return `<div class="card diet-meal">
      <div class="diet-meal-head">
        <div class="card-title">${esc(m.time)} · ${esc(m.name)}</div>
        <div class="card-muted">${o.kcal} kcal</div>
      </div>
      ${n > 1 ? `<div class="diet-opts">${m.options.map((x, j) => `<button class="diet-opt ${j === k ? 'on' : ''}" onclick="RebbeDiet.option(${i}, ${j})">${esc(x.label || `Opción ${j + 1}`)}</button>`).join('')}</div>` : ''}
      ${o.items.map(it => itemHtml(it, groups)).join('')}
      ${o.note ? `<div class="diet-note">💡 ${esc(o.note)}</div>` : ''}
      ${o.macros ? `<div class="diet-macros">Hidratos ${fmt(o.macros.c)} g · Proteína ${fmt(o.macros.p)} g · Grasa ${fmt(o.macros.f)} g</div>` : ''}
    </div>`;
  }

  // Shopping-list name: drop amounts in brackets and cooking words, so "Arroz blanco cocido" and
  // "Cerdo magro (lomo…)" become what she actually buys
  const SHOP_ALIAS = { 'Huevo': 'Huevos', 'Patata cocida': 'Patata', 'Skyr natural 0 %': 'Skyr', 'Queso fresco batido o yogur griego 0 %': 'Yogur griego 0 %' };
  const shopName = t => {
    const n = t.replace(/\s*\([^)]*\)/g, '').replace(/\s+(cocid[oa]s?|o asada|a la plancha)$/i, '').trim();
    return SHOP_ALIAS[n] || n;
  };

  // Everything she may need to buy for this plan (all options and alternatives)
  function shoppingHtml(p) {
    const names = new Set();
    p.data.meals.forEach(m => m.options.forEach(o => o.items.forEach(it => {
      if (it.group) { (p.data.groups[it.group] || { items: [] }).items.length && names.add('Fruta de temporada'); return; }
      [it, ...(it.alts || [])].forEach(x => { if (!/^(Café o té|Ensalada y verduras)/.test(x.t)) names.add(shopName(x.t)); });
    })));
    const done = new Set(loadJSON('rebbe_diet_shop', []));
    const list = [...names].sort((a, b) => a.localeCompare(b, 'es'));
    return `<details class="card"><summary>🛒 Lista de la compra</summary>
      <div class="club-body">${list.map(n => `<label class="diet-shop"><input type="checkbox" ${done.has(n) ? 'checked' : ''} onchange="RebbeDiet.shop(this, '${esc(n.replace(/'/g, "\\'"))}')"> ${esc(n)}</label>`).join('')}</div>
    </details>`;
  }

  function planHtml(p) {
    const d = p.data;
    return `
      <div class="card diet-hero">
        <div class="card-label" style="color:var(--bg2);opacity:.8">Tu dieta · ${esc(p.month)}</div>
        <div class="card-title" style="color:var(--bg2)">${esc(p.title)}</div>
        <div style="color:var(--bg2);opacity:.85;font-size:14px;margin-top:4px">${esc(d.goal || p.subtitle || '')}</div>
        <button class="diet-change" onclick="RebbeDiet.change()">Cambiar plan</button>
      </div>
      ${d.rule ? `<div class="diet-rule">📌 <b>Regla de oro:</b> ${esc(d.rule)}</div>` : ''}
      ${d.meals.map((m, i) => mealHtml(m, i, d.groups || {})).join('')}
      ${(d.notes || []).length ? `<details class="card"><summary>🥤 Bebidas y notas</summary><div class="club-body">${d.notes.map(n => `<p>${esc(n)}</p>`).join('')}</div></details>` : ''}
      ${shoppingHtml(p)}
      ${d.author ? `<div class="card-muted" style="text-align:center;margin:16px 0">Plan elaborado por ${esc(d.author)}</div>` : ''}`;
  }

  function render() {
    const el = document.getElementById('sec-diet');
    if (!el) return;
    if (!plans) { el.innerHTML = `<div class="classes-head"><div class="card-title" style="font-size:28px">Dieta</div><div class="card-muted">Cargando tu plan…</div></div>`; return; }
    if (!plans.length) { el.innerHTML = `<div class="classes-head"><div class="card-title" style="font-size:28px">Dieta</div><div class="card-muted">Pronto tendrás aquí la dieta del mes.</div></div>`; return; }
    const cur = current();
    el.innerHTML = picking || !cur ? pickerHtml(cur) : planHtml(cur);
  }

  function choose(id) {
    storage.set('rebbe_diet', id);
    picking = false;
    Object.keys(optIdx).forEach(k => delete optIdx[k]);
    render();
    window.scrollTo(0, 0);
    showToast('✓ Plan guardado');
  }

  function change() { picking = true; render(); window.scrollTo(0, 0); }
  function cancelPick() { picking = false; render(); window.scrollTo(0, 0); }
  function option(i, j) { optIdx[i] = j; render(); }

  function shop(box, name) {
    const done = new Set(loadJSON('rebbe_diet_shop', []));
    if (box.checked) done.add(name); else done.delete(name);
    saveJSON('rebbe_diet_shop', [...done]);
  }

  window.RebbeDiet = { load, setPlans, render, choose, change, cancelPick, option, shop };
})();
