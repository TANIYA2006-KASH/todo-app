const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let tasks = store.get('tasks', [
  { id: 1, text: 'Welcome! Tick me to mark as done', done: false, pri: 'low' },
  { id: 2, text: 'Double-click a task to edit it', done: false, pri: 'med' }
]);
let filter = 'all', lastDeleted = null, toastTimer;

$('date').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

// Theme
function setTheme(t) { document.documentElement.dataset.theme = t; $('theme').textContent = t === 'dark' ? 'Light' : 'Dark'; store.set('theme', t); }
setTheme(store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

const save = () => store.set('tasks', tasks);

function render() {
  const list = $('list');
  list.innerHTML = '';
  const shown = tasks.filter(t => filter === 'all' || (filter === 'done') === t.done);
  shown.forEach(t => list.appendChild(row(t)));
  const done = tasks.filter(t => t.done).length;
  $('bar').style.width = tasks.length ? (done / tasks.length * 100) + '%' : '0';
  $('stats').textContent = tasks.length ? `${done} of ${tasks.length} completed` : '';
  $('empty').hidden = shown.length > 0;
  $('empty').textContent = tasks.length ? 'Nothing here for this filter.' : 'No tasks yet. Add your first one above.';
}

function row(t) {
  const li = document.createElement('li');
  li.className = t.done ? 'done' : '';
  const cb = Object.assign(document.createElement('input'), { type: 'checkbox', checked: t.done });
  cb.setAttribute('aria-label', 'Mark "' + t.text + '" done');
  cb.onchange = () => { t.done = cb.checked; save(); render(); };
  const dot = document.createElement('span');
  dot.className = 'badge ' + t.pri; dot.title = t.pri + ' priority';
  const txt = document.createElement('span');
  txt.className = 't'; txt.textContent = t.text;
  txt.ondblclick = () => edit(t, li, txt);
  const del = document.createElement('button');
  del.className = 'x'; del.innerHTML = '&times;'; del.setAttribute('aria-label', 'Delete task');
  del.onclick = () => { li.classList.add('out'); setTimeout(() => remove(t), 180); };
  li.append(cb, dot, txt, del);
  return li;
}

function edit(t, li, txt) {
  const inp = document.createElement('input');
  inp.className = 'edit'; inp.value = t.text; inp.maxLength = 120;
  li.replaceChild(inp, txt); inp.focus(); inp.select();
  let finished = false;
  const done = ok => {
    if (finished) return; finished = true;
    if (ok && inp.value.trim()) { t.text = inp.value.trim(); save(); }
    render();
  };
  inp.onkeydown = e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
  inp.onblur = () => done(true);
}

function remove(t, silent) {
  const i = tasks.indexOf(t);
  if (i < 0) return;
  lastDeleted = { t, i };
  tasks.splice(i, 1); save(); render();
  if (!silent) toast('Task deleted');
}

function toast(msg) {
  $('toastMsg').textContent = msg; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 5000);
}
$('undo').onclick = () => {
  if (!lastDeleted) return;
  tasks.splice(lastDeleted.i, 0, lastDeleted.t); lastDeleted = null;
  save(); render(); $('toast').hidden = true;
};

$('form').onsubmit = e => {
  e.preventDefault();
  const text = $('text').value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now(), text, done: false, pri: $('pri').value });
  $('text').value = ''; save(); render();
};

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); filter = b.dataset.f; render();
});
$('clear').onclick = () => {
  const n = tasks.filter(t => t.done).length;
  if (!n) return;
  tasks = tasks.filter(t => !t.done); save(); render(); toast(n + ' completed task(s) cleared');
};
render();
