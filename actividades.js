// ─── Rebbe Club · Otras actividades + hoja inferior reutilizable ─────────────
// Pilates, barre, clases del gimnasio, correr… Se guardan en 'bloco_history'
// con type: 'activity'. Cuentan para la racha y el calendario de la semana,
// pero NO para la meta semanal de entrenos (esa es solo para el plan del gym,
// porque de ella sale cuál es el siguiente entreno A/B/C).

// Bottom sheet that any module can open with its own content
window.RebbeSheet = (function () {
  let el = null;
  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'modal-overlay';
    el.onclick = close;
    el.innerHTML = '<div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div id="sheetBody"></div></div>';
    document.body.appendChild(el);
    return el;
  }
  function open(html) { ensure(); document.getElementById('sheetBody').innerHTML = html; el.classList.add('open'); }
  function close() { if (el) el.classList.remove('open'); }
  return { open, close, body: () => document.getElementById('sheetBody') };
})();

window.RebbeActivity = (function () {
  const TYPES = [
    ['Pilates', '🧘‍♀️'], ['Barre', '🩰'], ['Zumba', '💃'], ['GAP', '🦵'], ['V Power', '⚡'],
    ['Spinning', '🚴‍♀️'], ['Correr', '🏃‍♀️'], ['Caminar', '🚶‍♀️'], ['Yoga', '🧘'], ['Natación', '🏊‍♀️'], ['Otra clase', '✨'],
  ];
  let form = null;

  function html() {
    return `
      <div class="modal-title">Otra actividad</div>
      <div class="modal-sub">Suma a tu racha y a tu semana. No cambia tu plan de entrenos.</div>
      <label class="act-field">¿Qué has hecho?</label>
      <div class="act-types">${TYPES.map(([t, e], i) => `<button class="chip ${form.type === i ? 'on' : ''}" onclick="RebbeActivity.set('type', ${i})">${e} ${t}</button>`).join('')}</div>
      ${form.type === TYPES.length - 1 ? `<input class="text-input" style="width:100%;box-sizing:border-box;margin:-4px 0 14px" maxlength="30" placeholder="¿Qué clase?" value="${esc(form.custom)}" oninput="RebbeActivity.set('custom', this.value, true)">` : ''}
      <label class="act-field">Duración</label>
      <div class="act-row">${[30, 45, 60, 90].map(m => `<button class="chip ${form.mins === m ? 'on' : ''}" onclick="RebbeActivity.set('mins', ${m})">${m} min</button>`).join('')}</div>
      <label class="act-field">¿Cuándo?</label>
      <div class="act-row">${[['Hoy', 0], ['Ayer', -1]].map(([l, d]) => `<button class="chip ${form.day === d ? 'on' : ''}" onclick="RebbeActivity.set('day', ${d})">${l}</button>`).join('')}</div>
      <label class="act-field">Nota (opcional)</label>
      <input class="text-input" style="width:100%;box-sizing:border-box;margin-bottom:16px" maxlength="120" placeholder="Ej.: clase de pilates reformer, muy intensa" value="${esc(form.note)}" oninput="RebbeActivity.set('note', this.value, true)">
      <button class="start-workout-btn" style="margin:0 0 10px;${form.type === null ? 'opacity:.5' : ''}" ${form.type === null ? 'disabled' : ''} onclick="RebbeActivity.save()">Guardar actividad</button>
      <button class="modal-close" onclick="RebbeSheet.close()">Cancelar</button>`;
  }

  function open() {
    form = { type: null, custom: '', mins: 60, day: 0, note: '' };
    RebbeSheet.open(html());
  }

  // quiet = typing in a text field: keep the value but don't re-render (keeps focus)
  function set(k, v, quiet) { form[k] = v; if (!quiet) RebbeSheet.open(html()); }

  function save() {
    if (form.type === null) return;
    const [label, emoji] = TYPES[form.type];
    const name = form.type === TYPES.length - 1 ? (form.custom.trim() || label) : label;
    const entry = { date: shiftDate(today(), form.day), type: 'activity', level: 'activity', name, emoji, focus: 'Actividad', doneSets: 0, totalSets: 0, volume: 0, duration: form.mins };
    if (form.note.trim()) entry.note = form.note.trim();
    const history = loadHistory();
    history.unshift(entry);
    history.sort((a, b) => b.date.localeCompare(a.date)); // keeps "ayer" in its place (stable sort)
    saveHistory(history);
    RebbeSheet.close();
    refresh();
    showToast(`${emoji} ${name} guardado · ${form.mins} min`);
    if (window.RebbeStory && form.day === 0) setTimeout(() => RebbeStory.open(entry), 900);
    setTimeout(() => checkAwards(), 3000);
  }

  function remove(idx) {
    const history = loadHistory();
    const h = history[idx];
    if (!h || h.type !== 'activity') return;
    if (!confirm(`¿Borrar "${h.name}" del ${shortDate(h.date)}?`)) return;
    history.splice(idx, 1);
    saveHistory(history);
    closeModal();
    refresh();
    showToast('Actividad borrada');
  }

  function refresh() {
    renderHistory(); renderStats(); renderWeekGrid(); updateStreak();
    if (currentSection === 'home') renderHome();
    if (currentSection === 'challenge' && window.RebbeChallenge) RebbeChallenge.render();
  }

  return { open, set, save, remove, TYPES };
})();
