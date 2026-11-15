// ─── Rebbe Club · Desafío ────────────────────────────────────────────────────
// Todo el contenido del desafío está en CHALLENGE, aquí abajo. Para el próximo
// desafío basta con cambiar estos datos: la pantalla se queda igual.
//   · active: false  → esconde el desafío de la app.
//   · rules: []      → mientras esté vacío, sale "las indicaciones llegan pronto".
//   · training: null → mientras sea null, el entreno sale como "llega pronto 🔒".
// Las comidas que marca cada clienta se guardan en su móvil ('rebbe_chal_meals').

const CHALLENGE = {
  active: true,
  id: 'nov-2026',
  title: 'Desafío Rebbe Club',
  month: 'Noviembre',
  start: '16 de noviembre',
  startDate: '2026-11-16',   // día 1 del desafío (AAAA-MM-DD)
  length: 15,                // nº de días del desafío. null = sin total, solo "Día X"

  // Tareas obligatorias de cada día. Las que llevan "auto" se marcan solas:
  //   water  → con los vasos de agua de Inicio (8 vasos = 2 L)
  //   cardio → si ese día hay un HIIT u otra actividad de 20 min o más guardada
  //   meals  → con las comidas marcadas en Dieta · move → cualquier entreno/HIIT/actividad · sleep → sueño de Inicio (7 h+)
  // Las demás las marca ella tocando la tarea.
  daily: [
    { id: 'water', emoji: '💧', label: 'Beber mínimo 2 L de agua', auto: 'water' },
    { id: 'cardio', emoji: '🏃‍♀️', label: 'Cardio mínimo 20 min (u otra actividad)', auto: 'cardio' },
    { id: 'steps', emoji: '👟', label: 'Caminar mínimo 10.000 pasos' },
  ],

  // Meta semanal (no cuenta para completar el día): entrenos del gym por semana
  weeklyWorkouts: 5,

  // Aviso fijo arriba de la dieta
  dietWarning: '⚖️ <b>Pesa toda la comida ya cocinada.</b> Todas las cantidades de la dieta son en cocido, salvo donde ponga expresamente "en crudo".',

  // Indicaciones del desafío (una frase por punto). Rebe las añade aquí.
  rules: [],

  training: `
    <div class="card">
      <div class="card-label">Tu entreno del desafío</div>
      <div class="card-title">Fuerza + cardio 💪</div>
      <div class="club-body"><ul class="chal-rules">
        <li><b>Fuerza:</b> sigue tu plan en la pestaña <b>Entreno</b>. Elige 3 o 5 días (o principiante, 2 o 4 días) tocando la etiqueta de arriba. Siempre intercalando inferiores y superiores.</li>
        <li><b>¿Entrenas en casa sin material?</b> Tienes el <b>Exprés en casa</b> de 30 min en Entreno › HIIT. Cuenta como entreno de la semana.</li>
        <li><b>Cardio de 20 min:</b> en Entreno › HIIT tienes cinta, bike y escalera en nivel principiante e intermedio. Al terminarlo, el cardio del día se marca solo.</li>
      </ul></div>
      <button class="start-workout-btn" style="margin:14px 0 8px" onclick="showSection('train')">Ir a mi entreno</button>
      <button class="btn-ghost" style="width:100%" onclick="goHiit()">Ver HIIT y exprés en casa</button>
    </div>`,

  diet: {
    title: 'Plan de alimentación del desafío',
    author: 'Nutri Luana Santana',
    howTo: [
      'Haz las 4 comidas del día: desayuno, comida, merienda y cena.',
      'En cada comida elige <b>una</b> de las opciones. Puedes repetir la que más te guste.',
      'Si un alimento lleva <b>↔</b>, puedes cambiarlo por cualquiera de los que salen debajo.',
      'Las <b>verduras y hortalizas</b> son libres: cuantas más, mejor.',
      'Donde pone <b>1 ración de fruta</b>, pulsa para ver qué cantidad de cada fruta equivale a una ración.',
      'Marca cada comida con ✓ cuando la hagas y ve sumando días.',
    ],
    meals: [
      {
        name: 'Desayuno',
        options: [
          {
            title: 'Avena con leche y crema de cacahuete',
            items: [
              { t: 'Leche semidesnatada', q: '1 vaso pequeño (165 ml)' },
              { t: 'Copos de avena', q: '3 cucharadas (30 g)' },
              { t: 'Crema de cacahuete 100 %', q: '1 cucharada de postre (15 g)', alts: [{ t: 'Anacardos tostados', q: '15 g' }] },
              { group: 'fruit', t: 'Fruta', q: '1 ración' },
            ],
            note: 'Los anacardos se pueden cambiar por otros frutos secos.',
            macros: { c: 50.7, p: 15.4, f: 12.7 }, kcal: 367,
          },
          {
            title: 'Tostada con huevos',
            items: [
              { t: 'Pan integral', q: '1 rebanada gruesa (35 g)' },
              { t: 'Huevos', q: '2 unidades (100 g)', alts: [{ t: 'Queso fresco de Burgos', q: '2 lonchas gruesas (80 g)' }] },
              { t: 'Leche semidesnatada', q: '1 vaso pequeño (165 ml)' },
              { t: 'Café sin azúcar', q: 'libre' },
              { group: 'fruit', t: 'Fruta', q: '1 ración' },
            ],
            macros: { c: 46.2, p: 19.4, f: 13.0 }, kcal: 365,
          },
          {
            title: 'Bizcocho de cacao al micro',
            recipe: true,
            items: [
              { t: 'Huevo', q: '1 unidad (50 g)' },
              { t: 'Clara de huevo', q: '30 g' },
              { t: 'Harina de avena', q: '2 cucharadas colmadas (30 g)' },
              { t: 'Cacao puro en polvo', q: '1 cucharada de postre rasa (7 g)' },
              { t: 'Queso fresco batido 0 %', q: '4 cucharadas (40 g)' },
              { t: 'Miel', q: '1 cucharada (20 g)', alts: [{ t: 'Dulce de leche', q: '1 cucharada de postre (20 g)' }] },
              { group: 'fruit', t: 'Fruta', q: '1 ración' },
            ],
            note: 'Mezcla todos los ingredientes y, al final, añade una pizca de levadura química. Al microondas 2 minutos. Puedes endulzarlo con la miel, o usar edulcorante (sucralosa o stevia) y rellenarlo con el dulce de leche.',
            macros: { c: 60.5, p: 17.8, f: 8.1 }, kcal: 364,
          },
        ],
      },
      {
        name: 'Comida',
        options: [
          {
            title: 'Pollo con patata y verduras',
            items: [
              { t: 'Pechuga de pollo a la plancha', q: '1 filete mediano (100 g)', alts: [{ t: 'Ternera magra', q: '1 filete mediano (80 g)' }, { t: 'Filete de pescado', q: '1 filete mediano (140 g)' }] },
              { t: 'Patata cocida', q: '3 trozos medianos (150 g)', alts: [{ t: 'Arroz blanco cocido', q: '5 cucharadas colmadas (100 g)' }, { t: 'Pasta cocida', q: '100 g' }] },
              { t: 'Verduras y hortalizas', q: 'mínimo 3 cucharadas (90 g)' },
            ],
            macros: { c: 33.6, p: 34.6, f: 7.1 }, kcal: 334,
          },
        ],
      },
      {
        name: 'Merienda',
        options: [
          {
            title: 'Bocadillo de queso fresco y jamón',
            items: [
              { t: 'Pan integral', q: '2 rebanadas gruesas (70 g)' },
              { t: 'Queso fresco de Burgos', q: '1 loncha gruesa (40 g)' },
              { t: 'Jamón magro', q: '2 lonchas finas (14 g)' },
              { t: 'Tomate', q: 'libre' },
              { group: 'fruit', t: 'Fruta', q: '1 ración' },
            ],
            macros: { c: 50.6, p: 18.5, f: 8.0 }, kcal: 332,
          },
          {
            title: 'Tortitas de avena y plátano',
            recipe: true,
            items: [
              { t: 'Huevos', q: '2 unidades (100 g)' },
              { t: 'Harina de avena', q: '2 cucharadas colmadas (30 g)' },
              { t: 'Plátano', q: '80 g' },
              { t: 'Canela', q: 'libre' },
            ],
            note: 'Variante: hazlas con 1 solo huevo y añade 1 taza (150 ml) de leche semidesnatada. Café y cacao al gusto.',
            macros: { c: 43.8, p: 14.4, f: 11.1 }, kcal: 318,
          },
          {
            title: 'Sándwich de pollo',
            items: [
              { t: 'Pan integral', q: '2 rebanadas gruesas (70 g)' },
              { t: 'Pechuga de pollo desmenuzada', q: '3 cucharadas (60 g)', alts: [{ t: 'Atún al natural', q: '3 cucharadas (90 g)' }] },
              { t: 'Queso crema light', q: '1 cucharada colmada (30 g)' },
            ],
            note: 'Añade toda la lechuga, tomate, zanahoria rallada y verdura que quieras.',
            macros: { c: 33.4, p: 28.6, f: 8.8 }, kcal: 324,
          },
        ],
      },
      {
        name: 'Cena',
        options: [
          {
            title: 'Crema de calabaza con ternera',
            recipe: true,
            items: [
              { t: 'Calabaza cocida, sin piel', q: '1 bol grande (250 g)' },
              { t: 'Ternera magra', q: '1 filete mediano o 4 cucharadas (80 g)', group2: 'protein' },
              { t: 'Aceite de oliva virgen extra', q: '1 cucharadita (4 g)' },
              { t: 'Verduras y hortalizas', q: 'libre' },
            ],
            note: 'Haz una crema con la calabaza, añade la carne troceadita y termina con un hilo de aceite.',
            macros: { c: 28.0, p: 30.6, f: 11.8 }, kcal: 326,
          },
          {
            title: 'Merluza al horno con patatas',
            items: [
              { t: 'Merluza a la plancha', q: '1 filete grande (140 g)', group2: 'protein' },
              { t: 'Patata cocida', q: '3 trozos medianos (150 g)', alts: [{ t: 'Boniato cocido', q: '4 trozos medianos (160 g)' }] },
              { t: 'Aceite de oliva virgen extra', q: '1 cucharadita (4 g)' },
              { t: 'Verduras y hortalizas', q: 'libre' },
            ],
            note: 'Pescado al horno con patatas y verduras.',
            macros: { c: 30.0, p: 39.7, f: 5.4 }, kcal: 324,
          },
          {
            title: 'Hamburguesa casera',
            items: [
              { t: 'Pan de hamburguesa', q: '1 unidad (50 g)', alts: [{ t: 'Wrap / tortilla integral', q: '1 unidad (40 g)' }] },
              { t: 'Carne picada magra (en crudo)', q: '100 g' },
              { t: 'Queso fresco de Burgos', q: '1 loncha fina (20 g)', alts: [{ t: 'Queso crema light', q: '1 cucharada de postre (20 g)' }] },
              { t: 'Ensalada y verduras', q: 'libre' },
            ],
            macros: { c: 25.6, p: 26.2, f: 12.0 }, kcal: 317,
          },
          {
            title: 'Avena con leche y proteína',
            items: [
              { t: 'Copos de avena', q: '3 cucharadas (30 g)' },
              { t: 'Leche semidesnatada', q: '1 vaso (200 ml)' },
              { t: 'Proteína whey', q: '1 cucharada (10 g)' },
              { group: 'fruit', t: 'Fruta', q: '1 ración' },
            ],
            macros: { c: 50.8, p: 20.6, f: 6.8 }, kcal: 336,
          },
        ],
      },
    ],
    groups: {
      fruit: {
        title: '1 ración de fruta es…',
        items: [
          { t: 'Manzana', q: '1 unidad (130 g)' },
          { t: 'Plátano', q: '1 mediano (70 g)' },
          { t: 'Pera', q: '1 mediana (130 g)' },
          { t: 'Naranja', q: '1 grande (150 g)' },
          { t: 'Mandarina', q: '1 grande (180 g)' },
          { t: 'Kiwi', q: '1 grande (130 g)' },
          { t: 'Fresas', q: '2 tazas (240 g)' },
          { t: 'Frambuesas', q: '1 taza (150 g)' },
          { t: 'Moras', q: '1 taza (170 g)' },
          { t: 'Uvas', q: '1 taza (140 g)' },
          { t: 'Piña', q: '2 rodajas medianas (140 g)' },
          { t: 'Melón', q: '3 rodajas finas (240 g)' },
          { t: 'Sandía', q: '2 rodajas gruesas (200 g)' },
          { t: 'Mango', q: '3 lonchas finas (120 g)' },
          { t: 'Papaya', q: '½ unidad (170 g)' },
          { t: 'Melocotón', q: '2 pequeños (180 g)' },
          { t: 'Nectarina', q: '1 grande (160 g)' },
          { t: 'Ciruela', q: '1 grande (130 g)' },
          { t: 'Caqui', q: '1 unidad (110 g)' },
          { t: 'Maracuyá', q: '1 taza (100 g)' },
          { t: 'Guayaba', q: '1 mediana (130 g)' },
          { t: 'Aguacate', q: '2 cucharadas (60 g)' },
        ],
      },
      protein: {
        title: 'Puedes cambiar la proteína por…',
        items: [
          { t: 'Pechuga de pollo a la plancha', q: '1 filete mediano (100 g)' },
          { t: 'Contramuslo de pollo sin piel, al horno', q: '1 unidad sin hueso (80 g)' },
          { t: 'Ternera magra a la plancha', q: '1 filete pequeño (80 g)' },
          { t: 'Carne picada de ternera, cocinada', q: '4 cucharadas (80 g)' },
          { t: 'Salmón a la plancha', q: '1 filete pequeño (80 g)' },
          { t: 'Merluza cocida', q: '1 filete grande (150 g)' },
          { t: 'Tilapia a la plancha', q: '1 filete grande (150 g)' },
          { t: 'Pescadilla a la plancha', q: '1 filete mediano (120 g)' },
          { t: 'Atún al natural', q: '5 cucharadas (150 g)' },
          { t: 'Sardinas en tomate (lata)', q: '3 cucharadas (105 g)' },
          { t: 'Sardinas cocinadas', q: '4 cucharadas (140 g)' },
          { t: 'Hígado de ternera a la plancha', q: '1 filete mediano (90 g)' },
          { t: 'Ternera magra, en crudo', q: '130 g' },
          { t: 'Pechuga de pollo, en crudo', q: '160 g' },
        ],
      },
    },
    shopping: [
      { title: 'Proteínas', items: ['Pechuga de pollo', 'Ternera magra', 'Carne picada magra', 'Merluza', 'Atún al natural', 'Jamón magro', 'Huevos'] },
      { title: 'Lácteos', items: ['Leche semidesnatada', 'Queso fresco de Burgos', 'Queso fresco batido 0 %', 'Queso crema light'] },
      { title: 'Hidratos', items: ['Pan integral', 'Pan de hamburguesa', 'Copos de avena', 'Harina de avena', 'Patatas', 'Boniato', 'Arroz', 'Pasta'] },
      { title: 'Fruta y verdura', items: ['Fruta de temporada', 'Plátanos', 'Calabaza', 'Tomates', 'Lechuga', 'Zanahoria', 'Verduras variadas'] },
      { title: 'Despensa', items: ['Aceite de oliva virgen extra', 'Crema de cacahuete 100 %', 'Cacao puro en polvo', 'Miel', 'Canela', 'Levadura química', 'Proteína whey', 'Café'] },
    ],
  },
};

(function () {
  let tab = 'today';           // 'today' | 'diet' | 'rules' | 'train'
  const optIdx = {};           // meal index -> chosen option
  const MEALS_KEY = 'rebbe_chal_meals';
  const TASKS_KEY = 'rebbe_chal_tasks';
  const SHOP_KEY = 'rebbe_chal_shop';
  const fmt = n => String(n).replace('.', ',');
  const d = CHALLENGE.diet;

  // { 'YYYY-MM-DD': [0,2,3] } — meals she ticked each day
  const doneLog = () => loadJSON(MEALS_KEY, {});
  const mealsOn = date => doneLog()[date] || [];
  const doneToday = () => mealsOn(today());
  const daysComplete = () => Object.values(doneLog()).filter(a => a.length >= d.meals.length).length;

  // ─── day counter ───────────────────────────────────────────────────────────

  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
  // Day of the challenge for a date (1 = startDate); 0 if outside the challenge
  function dayNumber(date = today()) {
    if (!CHALLENGE.active) return 0;
    const n = daysBetween(CHALLENGE.startDate, date) + 1;
    if (n < 1 || (CHALLENGE.length && n > CHALLENGE.length)) return 0;
    return n;
  }

  // ─── daily tasks ───────────────────────────────────────────────────────────

  const manualLog = () => loadJSON(TASKS_KEY, {});
  // A HIIT or another activity of 20 min or more saved that day
  // (el exprés en casa no cuenta como cardio: es su entreno de fuerza del día)
  const cardioEntry = date => activeHistory().find(h => h.date === date && !h.express && (h.type === 'hiit' || h.type === 'activity') && (h.duration || 0) >= 20);
  const cardioOn = date => !!cardioEntry(date);
  // Workouts of her plan (and the exprés en casa) done in the week (Mon–Sun) of a date
  const weekWorkouts = (date = today()) => activeHistory().filter(h => (!h.type || h.express) && weekStart(h.date) === weekStart(date)).length;
  function taskDone(t, date) {
    const daily = getDaily(date);
    if (t.auto === 'water' && (daily.water || 0) >= WATER_GOAL) return true;
    if (t.auto === 'meals') return mealsOn(date).length >= d.meals.length;
    if (t.auto === 'move' && activeHistory().some(h => h.date === date)) return true;
    if (t.auto === 'cardio' && cardioOn(date)) return true;
    if (t.auto === 'sleep' && (daily.sleep || 0) >= 7) return true;
    return !!(manualLog()[date] || {})[t.id];
  }
  const tasksDoneOn = date => CHALLENGE.daily.filter(t => taskDone(t, date)).length;

  function taskRow(t, i) {
    const done = taskDone(t, today());
    let sub = '';
    let action = `RebbeChallenge.toggleTask(${i})`;
    if (t.auto === 'water') {
      const w = getDaily().water || 0;
      sub = `${w} de ${WATER_GOAL} vasos de 250 ml · toca para sumar`;
      action = 'RebbeChallenge.addWater()';
    } else if (t.auto === 'cardio') {
      const c = cardioEntry(today());
      sub = c ? `${c.type === 'hiit' ? '⚡ ' + c.name : (c.emoji || '') + ' ' + c.name} · ${c.duration} min` : 'Se marca solo con un HIIT o una actividad de 20 min o más. Si haces cinta, bici… tócalo.';
    } else if (t.auto === 'meals') {
      sub = `${doneToday().length} de ${d.meals.length} · márcalas en Dieta`;
      action = "RebbeChallenge.tab('diet')";
    } else if (t.auto === 'move' && done && activeHistory().some(h => h.date === today())) {
      sub = 'Ya tienes actividad guardada hoy';
    } else if (t.auto === 'sleep' && done && (getDaily().sleep || 0) >= 7) {
      sub = 'Lo marcaste en Inicio';
    }
    return `<div class="chal-task ${done ? 'on' : ''}" onclick="${action}">
      <div class="chal-task-check">${done ? '✓' : t.auto === 'water' ? '＋' : ''}</div>
      <div style="flex:1;min-width:0">
        <div class="chal-task-label">${t.emoji} ${esc(t.label)}</div>
        ${sub ? `<div class="chal-task-sub">${esc(sub)}</div>` : ''}
      </div>
    </div>`;
  }

  function stripHtml(dayNow) {
    const total = CHALLENGE.length || dayNow;
    const all = CHALLENGE.daily.length;
    let full = 0;
    const cells = Array.from({ length: total }, (_, i) => {
      const date = shiftDate(CHALLENGE.startDate, i);
      const future = i + 1 > dayNow;
      const n = future ? 0 : tasksDoneOn(date);
      if (n >= all) full++;
      const cls = future ? 'future' : n >= all ? 'full' : n > 0 ? 'part' : 'miss';
      return `<div class="chal-cell ${cls} ${i + 1 === dayNow ? 'now' : ''}">${n >= all && !future ? '✓' : i + 1}</div>`;
    }).join('');
    return `<div class="card">
      <div class="diet-meal-head"><div class="card-label" style="margin:0">Tu desafío</div><div class="card-muted"><b style="color:var(--accent)">${full}</b> ${full === 1 ? 'día cumplido' : 'días cumplidos'}</div></div>
      <div class="chal-strip">${cells}</div>
      <div class="chal-legend"><span class="chal-dot full"></span>todo hecho <span class="chal-dot part"></span>a medias</div>
    </div>`;
  }

  function weeklyRow() {
    const goal = CHALLENGE.weeklyWorkouts;
    if (!goal) return '';
    const n = weekWorkouts();
    const done = n >= goal;
    return `<div class="chal-task ${done ? 'on' : ''}" onclick="showSection('train')">
      <div class="chal-task-check">${done ? '✓' : n}</div>
      <div style="flex:1;min-width:0">
        <div class="chal-task-label">🏋️‍♀️ Entrenar ${goal} veces por semana</div>
        <div class="chal-task-sub">${n} de ${goal} esta semana${done ? ' · ¡meta cumplida!' : ' · toca para ir a tu entreno'}</div>
      </div>
    </div>`;
  }

  function todayHtml() {
    const n = dayNumber();
    if (!n) {
      const left = daysBetween(today(), CHALLENGE.startDate);
      if (left <= 0) {
        return `<div class="card chal-soon"><div class="chal-soon-emoji">🏆</div>
          <div class="card-title">¡Desafío terminado!</div>
          <div class="card-muted">Gracias por darlo todo 💗</div></div>`;
      }
      return `<div class="card chal-soon"><div class="chal-soon-emoji">⏳</div>
        <div class="card-title">${left === 1 ? '¡Empieza mañana!' : `Empieza en ${left} días`}</div>
        <div class="card-muted">El día 1 es el ${esc(CHALLENGE.start)}${CHALLENGE.length ? ` y dura ${CHALLENGE.length} días` : ''}. Ve preparando la compra 🛒</div></div>
      <div class="card">
        <div class="card-label">Estas serán tus tareas de cada día</div>
        ${CHALLENGE.daily.map(t => `<div class="chal-task" style="cursor:default"><div class="chal-task-check"></div><div class="chal-task-label">${t.emoji} ${esc(t.label)}</div></div>`).join('')}
        ${CHALLENGE.weeklyWorkouts ? `<div class="chal-task" style="cursor:default"><div class="chal-task-check"></div><div class="chal-task-label">🏋️‍♀️ Y entrenar ${CHALLENGE.weeklyWorkouts} veces por semana</div></div>` : ''}
      </div>`;
    }
    const done = tasksDoneOn(today()), all = CHALLENGE.daily.length;
    return `
      <div class="card chal-daycard">
        <div>
          <div class="card-label" style="margin-bottom:2px">Hoy es el</div>
          <div class="chal-daynum">Día ${n}${CHALLENGE.length ? `<span> de ${CHALLENGE.length}</span>` : ''}</div>
        </div>
        <div class="chal-today-days"><b>${done}/${all}</b><span>tareas hechas</span></div>
      </div>
      <div class="card">
        <div class="card-label">Tus tareas de hoy</div>
        ${CHALLENGE.daily.map(taskRow).join('')}
        ${done >= all ? '<div class="diet-note" style="text-align:center">🎉 ¡Día cumplido! Mañana más.</div>' : ''}
      </div>
      ${CHALLENGE.weeklyWorkouts ? `<div class="card"><div class="card-label">Meta de la semana</div>${weeklyRow()}</div>` : ''}
      ${stripHtml(n)}`;
  }

  function toggleTask(i) {
    const t = CHALLENGE.daily[i];
    if (t.auto && taskDone(t, today()) && !(manualLog()[today()] || {})[t.id]) return; // done automatically
    const log = manualLog();
    const day = log[today()] || {};
    if (day[t.id]) delete day[t.id]; else day[t.id] = true;
    log[today()] = day;
    saveJSON(TASKS_KEY, log);
    afterTask();
  }

  function addWater() {
    const w = getDaily().water || 0;
    if (w >= WATER_GOAL) return;
    setDaily({ water: w + 1 });
    if (w + 1 === WATER_GOAL) showToast('💧 ¡Meta de agua cumplida!');
    checkAwards();
    afterTask();
  }

  function afterTask() {
    const before = render.lastDone || 0;
    render();
    const now = tasksDoneOn(today());
    if (now >= CHALLENGE.daily.length && before < now) { celebrate(); showToast(`🎉 ¡Día ${dayNumber()} cumplido!`); }
  }

  function groupHtml(key) {
    const g = d.groups[key];
    return `<details class="chal-group"><summary>Ver equivalencias</summary>
      <div class="chal-group-title">${esc(g.title)}</div>
      <div class="diet-alts">${g.items.map(x => `<div>${esc(x.t)} · ${esc(x.q)}</div>`).join('')}</div>
    </details>`;
  }

  function itemHtml(it) {
    if (it.group) {
      return `<div class="diet-item"><div><b>${esc(it.t)}</b> · ${esc(it.q)}</div>${groupHtml(it.group)}</div>`;
    }
    const swap = (it.alts && it.alts.length) || it.group2;
    return `<div class="diet-item">
      <div>${swap ? '<span class="chal-swap">↔</span>' : ''}<b>${esc(it.t)}</b> · ${esc(it.q)}</div>
      ${(it.alts || []).map(a => `<div class="diet-alt">o ${esc(a.t)} · ${esc(a.q)}</div>`).join('')}
      ${it.group2 ? groupHtml(it.group2) : ''}
    </div>`;
  }

  function mealHtml(m, i, done) {
    const n = m.options.length;
    const k = Math.min(optIdx[i] || 0, n - 1);
    const o = m.options[k];
    const isDone = done.includes(i);
    return `<div class="card diet-meal ${isDone ? 'chal-done' : ''}">
      <div class="diet-meal-head">
        <div class="card-title">${esc(m.name)}</div>
        <button class="chal-check ${isDone ? 'on' : ''}" onclick="RebbeChallenge.toggleMeal(${i})">${isDone ? '✓ Hecha' : 'Marcar'}</button>
      </div>
      ${n > 1 ? `<div class="diet-opts">${m.options.map((x, j) => `<button class="diet-opt ${j === k ? 'on' : ''}" onclick="RebbeChallenge.option(${i}, ${j})">Opción ${j + 1}</button>`).join('')}</div>` : ''}
      <div class="chal-dish">${o.recipe ? '👩‍🍳 ' : ''}${esc(o.title)}</div>
      ${o.items.map(itemHtml).join('')}
      ${o.note ? `<div class="diet-note">💡 ${esc(o.note)}</div>` : ''}
      <div class="diet-macros">${o.kcal} kcal · Hidratos ${fmt(o.macros.c)} g · Proteína ${fmt(o.macros.p)} g · Grasa ${fmt(o.macros.f)} g</div>
    </div>`;
  }

  function shoppingHtml() {
    const done = new Set(loadJSON(SHOP_KEY, []));
    return `<details class="card"><summary>🛒 Lista de la compra</summary>
      <div class="club-body">${d.shopping.map(sec => `
        <div class="chal-shop-title">${esc(sec.title)}</div>
        ${sec.items.map(n => `<label class="diet-shop"><input type="checkbox" ${done.has(n) ? 'checked' : ''} onchange="RebbeChallenge.shop(this, '${esc(n.replace(/'/g, "\\'"))}')"> ${esc(n)}</label>`).join('')}`).join('')}
      </div>
    </details>`;
  }

  function dietHtml() {
    const done = doneToday();
    const total = d.meals.length;
    return `
      ${CHALLENGE.dietWarning ? `<div class="diet-rule">${CHALLENGE.dietWarning}</div>` : ''}
      <div class="card chal-today">
        <div>
          <div class="card-label" style="margin-bottom:4px">Hoy</div>
          <div class="chal-today-num">${done.length}<span>/${total} comidas</span></div>
        </div>
        <div class="chal-today-days"><b>${daysComplete()}</b><span>días completos</span></div>
      </div>
      <details class="card"><summary>📖 Cómo funciona la dieta</summary>
        <div class="club-body"><ul>${d.howTo.map(h => `<li>${h}</li>`).join('')}</ul></div>
      </details>
      ${d.meals.map((m, i) => mealHtml(m, i, done)).join('')}
      ${shoppingHtml()}
      <div class="card-muted" style="text-align:center;margin:16px 0">Plan elaborado por ${esc(d.author)}</div>`;
  }

  function rulesHtml() {
    if (!CHALLENGE.rules.length) {
      return `<div class="card chal-soon"><div class="chal-soon-emoji">📋</div>
        <div class="card-title">Las indicaciones llegan muy pronto</div>
        <div class="card-muted">Aquí tendrás todo lo que necesitas saber para hacer el desafío. Mientras tanto, ya puedes empezar con la dieta 💗</div></div>`;
    }
    return `<div class="card"><div class="club-body"><ol class="chal-rules">${CHALLENGE.rules.map(r => `<li>${r}</li>`).join('')}</ol></div></div>`;
  }

  function trainHtml() {
    if (!CHALLENGE.training) {
      return `<div class="card chal-soon"><div class="chal-soon-emoji">🔒</div>
        <div class="card-title">El entreno llega pronto</div>
        <div class="card-muted">Te avisaremos en cuanto esté listo. Mientras tanto, sigue con tu entreno de siempre en la pestaña Entreno.</div>
        <button class="btn-ghost" style="width:100%;margin-top:14px" onclick="showSection('train')">Ir a mi entreno</button></div>`;
    }
    return CHALLENGE.training;
  }

  function render() {
    const el = document.getElementById('sec-challenge');
    if (!el) return;
    const tabs = [['today', 'Hoy'], ['diet', 'Dieta'], ['rules', 'Indicaciones'], ['train', 'Entreno']];
    el.innerHTML = `
      <button class="ob-back chal-back" onclick="showSection('home')">‹ Inicio</button>
      <div class="card diet-hero chal-hero">
        <div class="card-label" style="color:var(--bg2);opacity:.8">${esc(CHALLENGE.month)} · ${today() < CHALLENGE.startDate ? 'empieza' : 'empezó'} el ${esc(CHALLENGE.start)}${CHALLENGE.length ? ` · ${CHALLENGE.length} días` : ''}</div>
        <div class="card-title" style="color:var(--bg2);font-size:28px">${esc(CHALLENGE.title)} 🔥</div>
      </div>
      <div class="diet-opts chal-tabs">${tabs.map(([k, l]) => `<button class="diet-opt ${tab === k ? 'on' : ''}" onclick="RebbeChallenge.tab('${k}')">${l}</button>`).join('')}</div>
      ${tab === 'today' ? todayHtml() : tab === 'rules' ? rulesHtml() : tab === 'train' ? trainHtml() : dietHtml()}`;
    render.lastDone = tasksDoneOn(today());
  }

  // Banner for Inicio
  function homeCard() {
    if (!CHALLENGE.active) return '';
    const n = dayNumber();
    const line = n
      ? `Día ${n}${CHALLENGE.length ? ` de ${CHALLENGE.length}` : ''} · ${tasksDoneOn(today())}/${CHALLENGE.daily.length} tareas de hoy ›`
      : today() < CHALLENGE.startDate
        ? `Empieza el ${CHALLENGE.start} · ya puedes ver la dieta ›`
        : 'Dieta, tareas e indicaciones ›';
    return `<div class="card diet-hero chal-banner" onclick="RebbeChallenge.tab('today'); showSection('challenge')">
      <div class="card-label" style="color:var(--bg2);opacity:.8">${esc(CHALLENGE.month)}</div>
      <div class="card-title" style="color:var(--bg2)">${esc(CHALLENGE.title)} 🔥</div>
      <div style="color:var(--bg2);opacity:.9;font-size:13px;margin-top:2px">${line}</div>
    </div>`;
  }

  function toggleMeal(i) {
    const log = doneLog();
    const day = new Set(log[today()] || []);
    if (day.has(i)) day.delete(i); else day.add(i);
    log[today()] = [...day].sort();
    saveJSON(MEALS_KEY, log);
    if (day.size === d.meals.length && tasksDoneOn(today()) < CHALLENGE.daily.length) showToast('🥗 ¡Las 4 comidas hechas!');
    afterTask();
  }

  function shop(box, name) {
    const done = new Set(loadJSON(SHOP_KEY, []));
    if (box.checked) done.add(name); else done.delete(name);
    saveJSON(SHOP_KEY, [...done]);
  }

  function option(i, j) { optIdx[i] = j; render(); }
  function setTab(t) { tab = t; render(); window.scrollTo(0, 0); }

  window.RebbeChallenge = { render, homeCard, toggleMeal, toggleTask, addWater, shop, option, tab: setTab, dayNumber };
})();
