/* ================= PROGRESOR — app.js ================= */
const LS = {
  key: "progresor_apikey",
  model: "progresor_model",
  routine: "progresor_routine",
  history: "progresor_history",
  chat: "progresor_chat",
  seeded: "progresor_seeded_v1"
};
const DAYS = ["Upper A", "Lower A", "Upper B", "Lower B"];

let state = {
  apiKey: localStorage.getItem(LS.key) || "",
  model: localStorage.getItem(LS.model) || "claude-sonnet-5",
  routine: load(LS.routine, null),
  history: load(LS.history, null),
  chat: load(LS.chat, [])
};

function load(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function persist(){ save(LS.routine, state.routine); save(LS.history, state.history); save(LS.chat, state.chat); }

// first-run seed
if (!localStorage.getItem(LS.seeded)) {
  state.routine = state.routine || JSON.parse(JSON.stringify(DEFAULT_ROUTINE));
  state.history = state.history || JSON.parse(JSON.stringify(SEED_HISTORY));
  persist();
  localStorage.setItem(LS.seeded, "1");
} else {
  state.routine = state.routine || JSON.parse(JSON.stringify(DEFAULT_ROUTINE));
  state.history = state.history || [];
}

/* ---------- El SISTEMA: entrenador (encapsula el chat) ---------- */
const SYSTEM_PROMPT = `Eres el entrenador personal de hipertrofia del usuario dentro de su app "Progresor". Hablas español (registro neutro/latino), cercano, directo y motivador, sin rodeos. Usas 🔥 con moderación para celebrar récords. NO usas viñetas de más ni suenas robótico; escribes como un coach que conoce al alumno sesión a sesión.

Tu trabajo es registrar y analizar cada sesión y devolver feedback + objetivos, siguiendo EXACTAMENTE esta metodología:

COMPARACIÓN
- Compara SIEMPRE la sesión de hoy contra la MISMA sesión anterior (Upper A vs Upper A, etc.). Muestra la progresión ejercicio por ejercicio: peso y reps de hoy y, en una línea, cómo quedó respecto a la vez pasada.
- Celebra los récords (más peso o más reps con igual o mejor RIR) con 🔥. Sé concreto: "13→15 reps".

RANGO Y "PESO MADURO"
- Rango objetivo de hipertrofia: ~8-12 reps en compuestos, hasta ~15 en aislados.
- Si el usuario hace 15+ reps con RIR 2-3 (le sobra), el peso YA MADURÓ: dile que suba al siguiente escalón la próxima, aunque caiga a 8-10 reps. No tengas miedo a mandar a subir peso.
- Si un peso se desploma en reps al estrenarlo (ej. 12→6), es normal las primeras veces; se estabiliza.

GESTIÓN DEL RIR
- Ideal: primeras series a RIR 2, última al fallo.
- Si el usuario va a RIR 0 / fallo desde la serie 1, avísale: colapsa el peso en las siguientes series y baja el volumen efectivo. Recomiéndale dejar 1-2 reps en el tanque al inicio.

CAMBIOS DE EQUIPO
- Si cambió de máquina/banco/barra, NO es comparable directo con la vez pasada. Dilo y pídele anotar qué equipo usó.
- Las cifras de poleas/torres NO son kg reales (dependen del sistema): que se guíe por las reps, no por el número.

BANDERAS DE SALUD (importante)
- Si describe ruido/chasquido o molestia en un hombro (típico en bayesian u otras posiciones estiradas), toma nota: si suena pero no duele suele ser inofensivo, pero recomiéndale no forzar esa variante y preferir una posición más segura; si duele o aparece en otros ejercicios, que lo vea un fisio. No alarmes, pero no lo ignores.
- Si el fallo vino por el AGARRE/antebrazo antes que por el músculo objetivo, señálalo y sugiere agarre más relajado o correas en la última serie.
- Desequilibrios entre lados (un brazo atrás): sugiere empezar por el lado débil.

TEMPO Y VARIABLES
- Si cambió el tempo (o cualquier variable) a mitad de sesión, avisa que eso mezcla las señales y que decida la variable antes y la mantenga en todas las series.

FORMATO DE RESPUESTA (cuando registra una sesión)
1) Encabezado: "Día — <Día> ✅" con una frase corta del balance de la semana.
2) Por cada ejercicio: nombre, el registro de hoy en una línea, y debajo la comparación vs la vez pasada (con 🔥 si hubo récord).
3) 2-4 notas clave (salud, técnica, RIR, peso maduro) — solo lo relevante de ESTA sesión.
4) "Objetivos próxima <Día>:" con un objetivo concreto por ejercicio (peso/reps a batir).
Cierra breve y motivador. No inventes datos que no estén en el registro.

Recuerda: fundamentos > orden de ejercicios. Progresión (anotar y batir peso o reps), cercanía al fallo, técnica y rango completo, descanso 2-3 min en compuestos y 1-2 en aislados, dormir 7-9 h y ~1.6-2.2 g/kg de proteína.`;

/* ---------- API de Claude ---------- */
async function callClaude(messages, opts={}) {
  if (!state.apiKey) throw new Error("Falta tu API key. Ponla en Ajustes.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": state.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: state.model,
      max_tokens: opts.max_tokens || 4096,
      system: SYSTEM_PROMPT,
      messages
    })
  });
  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = j.error?.message || JSON.stringify(j); } catch(e){ detail = await res.text(); }
    if (res.status === 401) throw new Error("API key inválida (401). Revísala en Ajustes.");
    if (res.status === 429) throw new Error("Límite de la API alcanzado (429). Espera un momento.");
    throw new Error(`Error ${res.status}: ${detail}`);
  }
  const data = await res.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
}

/* ---------- formateo de sesiones para el prompt ---------- */
function setToStr(s){
  let str = `${s.weight} × ${s.reps}`;
  if (s.rir && s.rir !== "—") str += ` (RIR ${s.rir})`;
  if (s.note) str += ` [${s.note}]`;
  return str;
}
function sessionToText(sess){
  let t = `${sess.day} — ${sess.dateISO}`;
  if (sess.sessionNote) t += `\nNota: ${sess.sessionNote}`;
  for (const ex of sess.exercises){
    t += `\n• ${ex.name}${ex.equipmentNote ? " ("+ex.equipmentNote+")" : ""}: ` + ex.sets.map(setToStr).join(" · ");
  }
  return t;
}
function priorSessions(day, excludeId){
  return state.history.filter(s => s.day === day && s.id !== excludeId)
    .sort((a,b)=> a.dateISO < b.dateISO ? 1 : -1);
}

async function getFeedback(sess){
  const priors = priorSessions(sess.day, sess.id).slice(0,2).reverse();
  let content = "";
  if (priors.length){
    content += "SESIONES ANTERIORES DE ESTE MISMO DÍA (de más antigua a más reciente):\n\n";
    content += priors.map(sessionToText).join("\n\n");
    content += "\n\n";
  } else {
    content += "No hay sesiones anteriores de este día: es calibración, da puntos de partida.\n\n";
  }
  content += "SESIÓN DE HOY (recién registrada):\n\n" + sessionToText(sess);
  content += "\n\nRegístrala: dame el feedback con comparación vs la vez pasada y los objetivos para la próxima, siguiendo tu formato.";
  return callClaude([{ role:"user", content }]);
}

/* ---------- contexto para el chat libre ---------- */
function coachContext(){
  let ctx = "CONTEXTO (rutina y últimas sesiones del alumno, para tus respuestas):\n\nRUTINA:\n";
  for (const d of DAYS){
    if (state.routine[d]) ctx += `${d} (${state.routine[d].subtitle}): ${state.routine[d].exercises.join(", ")}\n`;
  }
  ctx += "\nÚLTIMA SESIÓN DE CADA DÍA:\n";
  for (const d of DAYS){
    const last = priorSessions(d, null)[0];
    if (last) ctx += "\n" + sessionToText(last) + "\n";
  }
  return ctx;
}

/* ================= UI ================= */
let day = null;        // día en curso (log)
let draft = null;      // sesión en edición
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };

function toast(msg){
  const t = el("div","toast",msg); document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2400);
}

/* ----- navegación ----- */
function switchTab(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  $("#screen-"+name).classList.add("active");
  $("#tab-"+name).classList.add("active");
  $("#chat-bar").style.display = name==="coach" ? "flex" : "none";
  window.scrollTo(0,0);
  if(name==="home") renderHome();
  if(name==="history") renderHistory();
  if(name==="settings") renderSettings();
}

/* ----- HOME (elegir día) ----- */
function renderHome(){
  const s = $("#screen-home");
  s.innerHTML = "";
  s.appendChild(el("div","eyebrow","Registrar sesión"));
  const grid = el("div","day-grid");
  // día más reciente para marcar "última"
  let lastDay=null,lastDate="";
  state.history.forEach(h=>{ if(h.dateISO>lastDate){lastDate=h.dateISO;lastDay=h.day;} });
  for (const d of DAYS){
    const r = state.routine[d];
    const prev = priorSessions(d,null)[0];
    const c = el("button","day-card"+(d===lastDay?" last":""));
    c.innerHTML = `<div class="emoji">${r.icon}</div>
      <div class="k">${d}</div>
      <div class="sub">${r.subtitle}</div>
      <div class="meta">${prev ? "últ: "+prev.dateISO : "sin registro aún"}</div>`;
    c.onclick = ()=>openLog(d);
    grid.appendChild(c);
  }
  s.appendChild(grid);

  s.appendChild(el("div","eyebrow","Atajos"));
  const q = el("div","card tight");
  const b1 = el("button","btn ghost","¿Qué toca hoy y con qué pesos?");
  b1.onclick = ()=>{ switchTab("coach"); askCoach("¿Qué toca hoy y qué pesos/reps debería buscar según mi progreso?"); };
  q.appendChild(b1);
  s.appendChild(q);
}

/* ----- LOG (registrar) ----- */
function openLog(d){
  day = d;
  const prev = priorSessions(d,null)[0];
  draft = {
    id: "s-"+Date.now(),
    day: d,
    dateISO: new Date().toISOString().slice(0,10),
    sessionNote: "",
    exercises: state.routine[d].exercises.map((name, i)=>{
      const pe = prev ? prev.exercises[i] : null;
      return {
        name,
        equipmentNote: "",
        _prev: pe || null,
        sets: [ {weight:"", reps:"", rir:"", note:""} ]
      };
    }),
    feedback: ""
  };
  renderLog();
  switchTab("log");
}

function renderLog(){
  const s = $("#screen-log");
  s.innerHTML = "";
  const head = el("div");
  head.style.cssText="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px";
  head.innerHTML = `<div><div class="display" style="font-weight:800;font-size:22px">${draft.day}</div>
    <div class="head-note">${draft.dateISO}</div></div>`;
  const back = el("button","btn ghost sm","← días");
  back.onclick = ()=>switchTab("home");
  head.appendChild(back);
  s.appendChild(head);

  draft.exercises.forEach((ex, ei)=>{
    const wrap = el("div","ex");
    const prevStr = ex._prev
      ? ex._prev.sets.map(x=>`${x.weight}×${x.reps}${x.rir&&x.rir!=="—"?"("+x.rir+")":""}`).join(" · ")
      : null;
    const h = el("div","ex-head");
    h.innerHTML = `<div style="flex:1">
        <div class="ex-name">${ex.name}</div>
        ${prevStr ? `<div class="ex-prev">últ: <b>${prevStr}</b></div>` : `<div class="ex-prev">— primera vez —</div>`}
      </div>`;
    wrap.appendChild(h);

    const body = el("div","ex-body");
    const eqn = el("div","ex-note-in");
    eqn.innerHTML = `<input placeholder="máquina/peso de referencia (ej: 27.5/lado)" value="${ex.equipmentNote||""}">`;
    eqn.querySelector("input").oninput = e=> ex.equipmentNote = e.target.value;
    body.appendChild(eqn);

    const sh = el("div","set-head","<span></span><span>Peso</span><span>Reps</span><span>RIR</span><span></span>");
    body.appendChild(sh);

    const setsBox = el("div");
    function drawSets(){
      setsBox.innerHTML="";
      ex.sets.forEach((st, si)=>{
        const row = el("div","set-row");
        row.innerHTML = `<div class="idx">${si+1}</div>
          <input class="num" inputmode="decimal" placeholder="—" value="${st.weight}">
          <input class="num" inputmode="decimal" placeholder="—" value="${st.reps}">
          <input class="num" placeholder="—" value="${st.rir}">
          <button class="x">×</button>`;
        const [w,r,rir] = row.querySelectorAll("input");
        w.oninput=e=>st.weight=e.target.value;
        r.oninput=e=>st.reps=e.target.value;
        rir.oninput=e=>st.rir=e.target.value;
        row.querySelector(".x").onclick=()=>{ if(ex.sets.length>1){ex.sets.splice(si,1);drawSets();} };
        setsBox.appendChild(row);
      });
    }
    drawSets();
    body.appendChild(setsBox);

    const add = el("button","add-set","+ agregar serie");
    add.onclick=()=>{
      const last = ex.sets[ex.sets.length-1];
      ex.sets.push({weight:last?.weight||"", reps:"", rir:"", note:""});
      drawSets();
    };
    body.appendChild(add);

    const note = el("div","ex-note-in");
    note.innerHTML = `<input placeholder="nota (opcional): sensación, técnica, molestia…" value="${ex.sets._note||""}">`;
    note.querySelector("input").oninput = e=>{ ex.sets[ex.sets.length-1].note = e.target.value; };
    body.appendChild(note);

    wrap.appendChild(body);
    s.appendChild(wrap);
  });

  const sn = el("div","card tight");
  sn.innerHTML = `<label class="fld">Nota de la sesión</label>
    <textarea placeholder="cambios de máquina, cómo te sentiste, algo que quieras que el coach sepa…"></textarea>`;
  sn.querySelector("textarea").oninput = e=> draft.sessionNote = e.target.value;
  s.appendChild(sn);

  const submit = el("button","btn primary","Registrar y pedir feedback");
  submit.onclick = submitSession;
  s.appendChild(submit);
  s.appendChild(el("div","hint","El coach comparará con tu última "+draft.day+" y te dará objetivos para la próxima."));
}

async function submitSession(){
  // limpiar series vacías
  draft.exercises.forEach(ex=>{
    ex.sets = ex.sets.filter(st => (st.weight||"").trim() || (st.reps||"").trim());
    delete ex._prev;
  });
  const hasData = draft.exercises.some(ex=>ex.sets.length);
  if(!hasData){ toast("Anota al menos una serie 💪"); return; }

  const btn = $("#screen-log .btn.primary");
  btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Analizando…`;
  try{
    const fb = await getFeedback(draft);
    draft.feedback = fb;
    state.history.push(draft);
    persist();
    showFeedback(draft);
  }catch(err){
    btn.disabled=false; btn.innerHTML="Registrar y pedir feedback";
    toast(err.message);
    // guardar igual sin feedback, para no perder los datos
    if(!state.history.find(h=>h.id===draft.id)){ state.history.push({...draft}); persist(); }
  }
}

function showFeedback(sess){
  const s = $("#screen-log");
  s.innerHTML="";
  const head = el("div");
  head.style.cssText="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px";
  head.innerHTML=`<div class="display" style="font-weight:800;font-size:22px">${sess.day} ✅</div>`;
  const done = el("button","btn ghost sm","listo");
  done.onclick=()=>switchTab("home");
  head.appendChild(done);
  s.appendChild(head);

  const card = el("div","card");
  card.appendChild(el("div","feedback", colorize(escapeHtml(sess.feedback))));
  s.appendChild(card);

  const ask = el("button","btn ghost","Preguntar algo al coach");
  ask.onclick=()=>switchTab("coach");
  s.appendChild(ask);
}

function colorize(t){
  return t
    .replace(/🔥/g,'<span class="pr">🔥</span>')
    .replace(/(\d+\s*→\s*\d+)/g,'<span class="delta-up">$1</span>');
}
function escapeHtml(s){ return s.replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

/* ----- HISTORY ----- */
function renderHistory(){
  const s = $("#screen-history");
  s.innerHTML="";
  s.appendChild(el("div","eyebrow","Historial"));
  if(!state.history.length){
    s.appendChild(el("div","empty",`<div class="big">📈</div>Aún no hay sesiones.<br>Registra tu primer día para ver el progreso.`));
    return;
  }
  const sorted = [...state.history].sort((a,b)=> a.dateISO<b.dateISO?1:-1);
  sorted.forEach(h=>{
    const it = el("div","hist-item");
    const r = state.routine[h.day];
    const exLine = h.exercises.map(e=>{
      const top = e.sets[0];
      return top ? `${e.name.split(" ")[0]} ${top.weight}×${top.reps}` : e.name;
    }).slice(0,4).join("  ·  ");
    it.innerHTML = `<div class="hist-top">
        <div class="hist-day"><span class="em">${r?r.icon:""}</span>${h.day}</div>
        <div class="hist-date">${h.dateISO}</div>
      </div>
      <div class="hist-ex">${exLine}${h.exercises.length>4?" · …":""}</div>
      ${h.feedback?'<div style="margin-top:8px"><span class="pill ember">con feedback</span></div>':''}`;
    it.onclick=()=>openHistDetail(h);
    s.appendChild(it);
  });
}

function openHistDetail(h){
  const s = $("#screen-history");
  s.innerHTML="";
  const head=el("div");
  head.style.cssText="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px";
  head.innerHTML=`<div><div class="display" style="font-weight:800;font-size:20px">${h.day}</div><div class="head-note">${h.dateISO}</div></div>`;
  const back=el("button","btn ghost sm","← historial");
  back.onclick=renderHistory;
  head.appendChild(back);
  s.appendChild(head);

  const card=el("div","card");
  h.exercises.forEach(e=>{
    const line = e.sets.map(setToStr).join(" · ");
    card.appendChild(el("div",null,`<div style="font-family:Archivo;font-weight:700;margin-top:10px">${e.name}${e.equipmentNote?` <span class="pill">${e.equipmentNote}</span>`:""}</div>
      <div class="mono" style="font-size:12.5px;color:var(--muted);margin-top:3px">${line}</div>`));
  });
  if(h.sessionNote) card.appendChild(el("div","hint","📝 "+h.sessionNote));
  s.appendChild(card);

  if(h.feedback){
    s.appendChild(el("div","eyebrow","Feedback del coach"));
    const fb=el("div","card");
    fb.appendChild(el("div","feedback",colorize(escapeHtml(h.feedback))));
    s.appendChild(fb);
  } else {
    const gen=el("button","btn ghost","Generar feedback ahora");
    gen.onclick=async()=>{
      gen.disabled=true;gen.innerHTML=`<span class="spinner"></span> Analizando…`;
      try{ day=h.day; const fb=await getFeedback(h); h.feedback=fb; persist(); openHistDetail(h); }
      catch(err){ gen.disabled=false;gen.innerHTML="Generar feedback ahora"; toast(err.message); }
    };
    s.appendChild(gen);
  }
  const del=el("button","btn danger","Eliminar esta sesión");
  del.style.marginTop="12px";
  del.onclick=()=>{ if(confirm("¿Eliminar esta sesión?")){ state.history=state.history.filter(x=>x.id!==h.id); persist(); renderHistory(); toast("Sesión eliminada"); } };
  s.appendChild(del);
}

/* ----- COACH (chat libre) ----- */
function renderChat(){
  const wrap = $("#chat-wrap");
  wrap.innerHTML="";
  if(!state.chat.length){
    const q=el("div","quick-row");
    ["¿Qué toca hoy?","¿Cuánto peso debería usar?","¿Cómo voy progresando?","Dame consejos para mejorar"].forEach(txt=>{
      const c=el("button","chip",txt); c.onclick=()=>askCoach(txt); q.appendChild(c);
    });
    wrap.appendChild(el("div","empty",`<div class="big">🏋️</div>Pregúntame lo que quieras sobre tu rutina y progreso.`));
    wrap.appendChild(q);
    return;
  }
  state.chat.forEach(m=>{
    wrap.appendChild(el("div","msg "+m.role, m.role==="bot"?colorize(escapeHtml(m.content)):escapeHtml(m.content)));
  });
  wrap.scrollTop = wrap.scrollHeight;
  window.scrollTo(0,document.body.scrollHeight);
}

async function askCoach(text){
  if(!text || !text.trim()) return;
  state.chat.push({role:"user",content:text});
  save(LS.chat,state.chat);
  renderChat();
  const thinking = {role:"bot",content:"…"};
  state.chat.push(thinking); renderChat();
  try{
    // construir mensajes: contexto + historial de chat
    const msgs = [];
    const priorChat = state.chat.filter(m=>m!==thinking && m.content!=="…");
    // primer turno lleva el contexto
    msgs.push({role:"user", content: coachContext() + "\n\nEl alumno pregunta: " + priorChat[0].content});
    for(let i=1;i<priorChat.length;i++){
      msgs.push({ role: priorChat[i].role==="bot"?"assistant":"user", content: priorChat[i].content });
    }
    const reply = await callClaude(msgs);
    thinking.content = reply;
  }catch(err){
    thinking.content = "⚠️ "+err.message;
  }
  save(LS.chat,state.chat);
  renderChat();
}

/* ----- SETTINGS ----- */
function renderSettings(){
  const s=$("#screen-settings");
  s.innerHTML="";
  s.appendChild(el("div","eyebrow","Conexión con Claude"));

  const warn=el("div","warn-box",`<b>Tu API key vive solo en este teléfono.</b> Se guarda en el almacenamiento local del navegador y se envía únicamente a la API de Anthropic. Nunca la subas al repositorio de GitHub ni la compartas.`);
  s.appendChild(warn);

  const k=el("div","card");
  k.innerHTML=`<label class="fld">API key de Anthropic</label>
    <input id="in-key" type="password" placeholder="sk-ant-…" value="${state.apiKey}">
    <label class="fld" style="margin-top:14px">Modelo</label>
    <select id="in-model">
      <option value="claude-sonnet-5">Claude Sonnet 5 (recomendado)</option>
      <option value="claude-opus-4-8">Claude Opus 4.8 (más potente)</option>
      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rápido/barato)</option>
    </select>`;
  s.appendChild(k);
  k.querySelector("#in-model").value = state.model;
  const savebtn=el("button","btn primary","Guardar conexión");
  savebtn.onclick=()=>{
    state.apiKey=$("#in-key").value.trim();
    state.model=$("#in-model").value;
    localStorage.setItem(LS.key,state.apiKey);
    localStorage.setItem(LS.model,state.model);
    toast("Guardado ✓");
  };
  s.appendChild(savebtn);
  const test=el("button","btn ghost","Probar conexión");
  test.style.marginTop="8px";
  test.onclick=async()=>{
    state.apiKey=$("#in-key").value.trim(); localStorage.setItem(LS.key,state.apiKey);
    test.disabled=true;test.innerHTML=`<span class="spinner"></span> probando…`;
    try{ await callClaude([{role:"user",content:"Responde solo: OK"}],{max_tokens:20}); toast("Conexión OK ✓"); }
    catch(err){ toast(err.message); }
    test.disabled=false;test.innerHTML="Probar conexión";
  };
  s.appendChild(test);

  s.appendChild(el("div","eyebrow","Tus datos"));
  const d=el("div","card tight");
  const exp=el("button","btn ghost","Exportar datos (backup .json)");
  exp.onclick=exportData; d.appendChild(exp);
  const imp=el("button","btn ghost","Importar backup");
  imp.style.marginTop="8px";
  imp.onclick=()=>$("#file-import").click();
  d.appendChild(imp);
  s.appendChild(d);

  const reset=el("button","btn danger","Borrar todo y reiniciar");
  reset.onclick=()=>{ if(confirm("Esto borra tu historial y ajustes en este dispositivo. ¿Seguro?")){ localStorage.clear(); location.reload(); } };
  s.appendChild(reset);

  s.appendChild(el("div","hint",`Progresor · PWA local. ${state.history.length} sesiones guardadas.`));
}

function exportData(){
  const blob=new Blob([JSON.stringify({routine:state.routine,history:state.history},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="progresor-backup-"+new Date().toISOString().slice(0,10)+".json";
  a.click();
}
function importData(file){
  const r=new FileReader();
  r.onload=()=>{ try{
    const d=JSON.parse(r.result);
    if(d.history) state.history=d.history;
    if(d.routine) state.routine=d.routine;
    persist(); toast("Backup importado ✓"); renderSettings();
  }catch(e){ toast("Archivo inválido"); } };
  r.readAsText(file);
}

/* ----- init ----- */
function init(){
  document.querySelector("#chat-send").onclick=()=>{
    const inp=$("#chat-text"); const v=inp.value; inp.value=""; askCoach(v);
  };
  $("#chat-text").addEventListener("keydown",e=>{ if(e.key==="Enter"){ const v=e.target.value; e.target.value=""; askCoach(v);} });
  $("#file-import").addEventListener("change",e=>{ if(e.target.files[0]) importData(e.target.files[0]); });
  // observar cambios de chat para re-render
  const chatScreen=$("#screen-coach");
  new MutationObserver(()=>{}).observe(chatScreen,{childList:true});
  switchTab(state.apiKey ? "home" : "settings");
  renderChat();
  if(!state.apiKey) toast("Pon tu API key para empezar →");

  if("serviceWorker" in navigator){ navigator.serviceWorker.register("./sw.js").catch(()=>{}); }
}
window.addEventListener("DOMContentLoaded",init);
// re-render chat cuando se entra a la pestaña
const _switch = switchTab;
switchTab = function(n){ _switch(n); if(n==="coach") renderChat(); };
