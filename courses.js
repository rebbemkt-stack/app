// ─── Rebbe Club · Contenidos (cursos y clases con vídeo de YouTube) ─────────
// Los cursos los crea la coach desde su panel (tablas courses / lessons en
// Supabase). Las clases completadas se guardan en 'rebbe_lessons_done', que se
// sincroniza con su cuenta como el resto de datos.

(function () {
  let courses = null;      // null = not loaded yet
  let lessonsBy = {};      // course_id -> lessons
  let view = null;         // null | { course } | { course, lesson }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Escaped text with line breaks and clickable links (for lesson notes / materials)
  const richText = s => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');

  function ytId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(url) ? url : null);
  }

  function doneSet() { return new Set(loadJSON('rebbe_lessons_done', [])); }

  function courseProgress(c) {
    const ls = lessonsBy[c.id] || [];
    if (!ls.length) return 0;
    const done = doneSet();
    return Math.round(ls.filter(l => done.has(l.id)).length / ls.length * 100);
  }

  const NEW_BADGE = '<span class="new-badge">Nuevo</span>';
  const courseIsNew = c => c.is_new || (lessonsBy[c.id] || []).some(l => l.is_new);

  function cover(c) {
    if (c.cover_url) return c.cover_url;
    const first = (lessonsBy[c.id] || []).find(l => ytId(l.youtube_url));
    return first ? `https://i.ytimg.com/vi/${ytId(first.youtube_url)}/hqdefault.jpg` : null;
  }

  async function load() {
    const sb = window.RebbeCloud && RebbeCloud.client && RebbeCloud.client();
    if (!sb) return;
    const [cs, ls] = await Promise.all([
      sb.from('courses').select('*').order('position').order('id'),
      sb.from('lessons').select('*').order('position').order('id'),
    ]);
    if (cs.error || ls.error) { console.warn('No se pudieron cargar los contenidos', cs.error || ls.error); return; }
    setData(cs.data || [], ls.data || []);
  }

  function setData(cs, ls) {
    courses = cs;
    lessonsBy = {};
    ls.forEach(l => { (lessonsBy[l.course_id] = lessonsBy[l.course_id] || []).push(l); });
    if (typeof currentSection !== 'undefined' && currentSection === 'club') renderClub();
  }

  // ─── list of courses (top of the Club tab) ─────────────────────────────────

  // "Continúa donde lo dejaste": the last lesson she opened, if it still exists
  function continueHtml() {
    const last = loadJSON('rebbe_last_lesson', null);
    if (!last) return '';
    const c = courses.find(x => x.id === last.course);
    const l = c && (lessonsBy[c.id] || []).find(x => x.id === last.lesson);
    if (!l) return '';
    const id = ytId(l.youtube_url);
    const img = l.cover_url || (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : cover(c));
    return `<div class="continue-card" onclick="RebbeCourses.resume()">
      <div class="continue-thumb" ${img ? `style="background-image:url('${esc(img)}')"` : ''}><span>▶</span></div>
      <div style="min-width:0">
        <div class="course-cat">Continúa donde lo dejaste</div>
        <div class="lesson-title">${esc(l.title)}</div>
        <div class="card-muted">${esc(c.title)} · ${courseProgress(c)}%</div>
      </div>
    </div>`;
  }

  // "Material nuevo": every lesson the coach marked as new, newest first
  function newHtml() {
    const items = [];
    courses.forEach(c => (lessonsBy[c.id] || []).forEach(l => { if (l.is_new) items.push({ c, l }); }));
    if (!items.length) return '';
    items.sort((a, b) => String(b.l.created_at).localeCompare(String(a.l.created_at)));
    return `<div class="row-title">✨ Material nuevo</div>
      <div class="course-row">${items.map(({ c, l }) => {
        const id = ytId(l.youtube_url);
        const img = l.cover_url || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : cover(c));
        const icon = id ? '▶' : (l.attachments || []).length ? '📄' : '✎';
        return `<div class="course-tile" onclick="RebbeCourses.openNew(${c.id}, ${l.id})">
          <div class="course-cover" ${img ? `style="background-image:url('${esc(img)}')"` : ''}>${NEW_BADGE}${img ? '' : `<span>${icon}</span>`}</div>
          <div class="tile-title">${esc(l.title)}</div>
          <div class="card-muted">${esc(c.title)}</div>
        </div>`;
      }).join('')}</div>`;
  }

  // One horizontal row of course cards per category
  function listHtml() {
    if (!courses || !courses.length) return '<div class="card-muted" style="margin:20px 0">Pronto habrá clases aquí.</div>';
    const cats = [...new Set(courses.map(c => c.category))];
    return continueHtml() + newHtml() + cats.map(k => `
      <div class="row-title">${esc(k)}</div>
      <div class="course-row">
        ${courses.filter(c => c.category === k).map(c => {
          const img = cover(c);
          const pct = courseProgress(c);
          const n = (lessonsBy[c.id] || []).length;
          return `<div class="course-tile" onclick="RebbeCourses.openCourse(${c.id})">
            <div class="course-cover" ${img ? `style="background-image:url('${esc(img)}')"` : ''}>${courseIsNew(c) ? NEW_BADGE : ''}${img ? '' : '<span>▶</span>'}</div>
            ${pct ? `<div class="progress-line tile-progress"><div style="width:${pct}%"></div></div>` : ''}
            <div class="tile-title">${esc(c.title)}</div>
            <div class="card-muted">${n} ${n === 1 ? 'clase' : 'clases'}${pct ? ` · ${pct}%` : ''}</div>
          </div>`;
        }).join('')}
      </div>`).join('');
  }

  // ─── course and lesson screens ─────────────────────────────────────────────

  function viewHtml() {
    if (!view) return '';
    return view.lesson ? lessonHtml(view.course, view.lesson) : courseHtml(view.course);
  }

  function courseHtml(c) {
    const ls = lessonsBy[c.id] || [];
    const done = doneSet();
    const pct = courseProgress(c);
    const img = cover(c);
    let lastModule = null;
    const rows = ls.map(l => {
      const head = l.module && l.module !== lastModule ? `<div class="card-label" style="margin:14px 0 6px">${esc(l.module)}</div>` : '';
      lastModule = l.module;
      const icon = done.has(l.id) ? '✓' : ytId(l.youtube_url) ? '▶' : (l.attachments || []).length ? '📄' : '✎';
      return `${head}<div class="lesson-row" onclick="RebbeCourses.openLesson(${l.id})">
        <span class="lesson-check ${done.has(l.id) ? 'on' : ''}">${icon}</span>
        <span class="lesson-title">${l.is_new ? NEW_BADGE + ' ' : ''}${esc(l.title)}</span>
        <span class="card-muted">›</span>
      </div>`;
    }).join('');
    return `
      <button class="ob-back" onclick="RebbeCourses.back()">‹ Clases</button>
      ${img ? `<div class="course-cover big" style="background-image:url('${esc(img)}')"></div>` : ''}
      <div class="card">
        <div class="course-cat">${esc(c.category)}</div>
        <div class="card-title">${esc(c.title)}</div>
        ${c.description ? `<div class="card-text" style="margin-top:6px">${richText(c.description)}</div>` : ''}
        <div class="card-muted" style="margin-top:10px">${ls.length} ${ls.length === 1 ? 'clase' : 'clases'} · ${pct}% completado</div>
        <div class="progress-line"><div style="width:${pct}%"></div></div>
      </div>
      <div class="card">${rows || '<div class="card-muted">Pronto habrá clases aquí.</div>'}</div>`;
  }

  function lessonHtml(c, l) {
    const ls = lessonsBy[c.id] || [];
    const i = ls.findIndex(x => x.id === l.id);
    const prev = ls[i - 1], next = ls[i + 1];
    const id = ytId(l.youtube_url);
    const isDone = doneSet().has(l.id);
    return `
      <button class="ob-back" onclick="RebbeCourses.openCourse(${c.id})">‹ ${esc(c.title)}</button>
      ${id ? `<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1" title="${esc(l.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>` : l.cover_url ? `<div class="course-cover big" style="background-image:url('${esc(l.cover_url)}')"></div>` : ''}
      <div class="card">
        ${l.module ? `<div class="course-cat">${esc(l.module)}</div>` : ''}
        ${l.is_new ? `<div style="margin-bottom:6px">${NEW_BADGE}</div>` : ''}
        <div class="card-title">${esc(l.title)}</div>
        ${l.body ? `<div class="card-text" style="margin-top:8px">${richText(l.body)}</div>` : ''}
      </div>
      ${(l.attachments || []).length ? `<div class="card">
        <div class="card-label">Materiales</div>
        ${l.attachments.map(a => `<a class="file-row" href="${esc(a.url)}" target="_blank" rel="noopener">
          <span class="file-icon">${/\.(png|jpe?g|webp|gif)(\?|$)/i.test(a.url) ? '🖼️' : '📄'}</span>
          <span class="lesson-title">${esc(a.name)}</span>
          <span class="card-muted">Abrir ↓</span>
        </a>`).join('')}
      </div>` : ''}
      <button class="start-workout-btn" style="${isDone ? 'background:var(--bg3);color:var(--accent)' : ''}" onclick="RebbeCourses.toggleDone(${l.id})">${isDone ? '✓ Completada' : 'Marcar como completada'}</button>
      <div class="lesson-nav">
        ${prev ? `<button class="btn-ghost" onclick="RebbeCourses.openLesson(${prev.id})">‹ Anterior</button>` : '<span></span>'}
        ${next ? `<button class="btn-ghost" onclick="RebbeCourses.openLesson(${next.id})">Siguiente ›</button>` : ''}
      </div>`;
  }

  function show() { renderClub(); window.scrollTo(0, 0); }

  function openCourse(id) {
    const c = (courses || []).find(x => x.id === id);
    if (!c) return;
    view = { course: c };
    show();
  }

  function openLesson(id) {
    const c = view && view.course;
    const l = c && (lessonsBy[c.id] || []).find(x => x.id === id);
    if (!l) return;
    view = { course: c, lesson: l };
    saveJSON('rebbe_last_lesson', { course: c.id, lesson: l.id });
    show();
  }

  function resume() {
    const last = loadJSON('rebbe_last_lesson', null);
    const c = last && (courses || []).find(x => x.id === last.course);
    if (!c) return;
    view = { course: c };
    openLesson(last.lesson);
  }

  function back() { view = null; show(); }

  function openNew(courseId, lessonId) {
    const c = (courses || []).find(x => x.id === courseId);
    if (!c) return;
    view = { course: c };
    openLesson(lessonId);
  }


  function toggleDone(id) {
    const done = doneSet();
    const wasDone = done.has(id);
    if (wasDone) done.delete(id); else done.add(id);
    saveJSON('rebbe_lessons_done', [...done]);
    if (!wasDone) {
      showToast('✓ Clase completada');
      const ls = lessonsBy[view.course.id] || [];
      const next = ls[ls.findIndex(x => x.id === id) + 1];
      if (next) return openLesson(next.id);
    }
    show();
  }

  window.RebbeCourses = { load, setData, listHtml, viewHtml, isOpen: () => !!view, openCourse, openLesson, openNew, resume, back, toggleDone };
})();
