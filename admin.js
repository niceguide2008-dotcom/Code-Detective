import { supabase } from './supabase.js';

const $ = (s) => document.querySelector(s);
const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (v) => v ? new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)) : '—';
const LEGACY_CASE_TOTAL = 50;
const PACK_CASE_TOTAL = Array.isArray(window.JAVA_OOP_UNIT1_CASES) ? window.JAVA_OOP_UNIT1_CASES.length : 13;
const state = { users: [], selected: null, totalCases: LEGACY_CASE_TOTAL + PACK_CASE_TOTAL, assignments: [], broadcasts: [], editingAssignmentId: null, themePreference: 'system' };

function getStoredValue(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function setStoredValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeTheme(value) {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function applyAdminTheme(themeValue = state.themePreference) {
  const normalized = normalizeTheme(themeValue);
  state.themePreference = normalized;
  const resolvedTheme = normalized === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : normalized;
  document.body.setAttribute('data-theme', resolvedTheme);
  setStoredValue('codeDetectiveTheme', normalized);
}

function initAdminTheme() {
  applyAdminTheme(getStoredValue('codeDetectiveTheme', 'system'));
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => {
    if (state.themePreference === 'system') applyAdminTheme('system');
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', update);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(update);
  }
}

function ensureAdminExtensions() {
  if (document.getElementById('admin-extensions')) return;

  document.head.insertAdjacentHTML('beforeend', `<style>
    body[data-theme="light"]{--bg:#f5f7fb;--panel:#ffffff;--panel2:#eef2f7;--line:#d8e2ee;--text:#142033;--muted:#64748b;--red:#ef4444;--amber:#f59e0b;--green:#10b981}
    body[data-theme="dark"]{--bg:#06070b;--panel:#121727;--panel2:#182132;--line:#243244;--text:#f8fafc;--muted:#94a3b8;--red:#ff5d73;--amber:#f5b942;--green:#38d39f}
    #admin-extensions{margin-top:24px;display:grid;gap:16px}
    #admin-extensions .admin-panel[data-panel=\"broadcast\"]{scroll-margin-top:20px}
    .admin-panel{background:linear-gradient(145deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:0 16px 35px rgba(0,0,0,.16)}
    .admin-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.admin-panel-head h3{margin:0;font-size:18px}.admin-panel-head p{margin:4px 0 0;font-size:12px;color:var(--muted)}
    .admin-form{display:grid;gap:10px}.admin-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.admin-form input,.admin-form textarea,.admin-form select{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:10px;padding:10px 12px;color:var(--text);font:inherit}.admin-form textarea{min-height:90px;resize:vertical}.admin-actions{display:flex;gap:10px;flex-wrap:wrap}.admin-list{display:grid;gap:10px;margin-top:12px}.admin-list-item{border:1px solid var(--line);border-radius:14px;padding:12px;background:rgba(255,255,255,.03)}
    .admin-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.admin-tabs button{background:var(--panel2);color:var(--text);border:1px solid var(--line);padding:8px 10px;border-radius:999px;cursor:pointer}.admin-tabs button.active{background:var(--amber);color:#0e1117;border-color:var(--amber)}
    .mini-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:rgba(245,185,66,.12);color:var(--amber);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
    @media (max-width:700px){.admin-form-grid{grid-template-columns:1fr}}
  </style>`);

  const wrapper = document.createElement('section');
  wrapper.id = 'admin-extensions';
  wrapper.innerHTML = `
    <div class="admin-tabs">
      <button type="button" data-view="broadcast" class="active">🔔 Send Notification</button>
      <button type="button" data-view="overview">Overview</button>
      <button type="button" data-view="assignments">Assignments</button>
    </div>
    <div class="admin-panel" data-panel="overview">
      <div class="admin-panel-head">
        <div>
          <h3>Learning operations</h3>
          <p>Manage assignments and campus-wide announcements in one place.</p>
        </div>
        <div class="mini-pill">Admin control</div>
      </div>
      <div class="admin-form-grid">
        <div class="admin-panel" style="padding:14px">
          <div class="admin-panel-head" style="margin-bottom:8px"><div><h3>Assignments</h3><p>${state.assignments.length} active items</p></div></div>
          <div id="assignments-summary"></div>
        </div>
        <div class="admin-panel" style="padding:14px">
          <div class="admin-panel-head" style="margin-bottom:8px"><div><h3>Broadcasts</h3><p>${state.broadcasts.length} scheduled messages</p></div></div>
          <div id="broadcast-summary"></div>
        </div>
      </div>
    </div>
    <div class="admin-panel" data-panel="assignments" hidden>
      <div class="admin-panel-head">
        <div>
          <h3>Assignment management</h3>
          <p>Create, edit, and remove learning assignments for students.</p>
        </div>
        <div class="mini-pill">Create / edit</div>
      </div>
      <form id="assignment-form" class="admin-form">
        <input type="hidden" id="assignment-id" />
        <div class="admin-form-grid">
          <input id="assignment-title" placeholder="Assignment title" required />
          <input id="assignment-subject" placeholder="Subject" required />
          <input id="assignment-difficulty" placeholder="Difficulty" required />
          <input id="assignment-due-date" type="date" required />
          <input id="assignment-due-time" type="time" required />
          <input id="assignment-max-marks" type="number" placeholder="Maximum marks" required />
        </div>
        <textarea id="assignment-description" placeholder="Description"></textarea>
        <textarea id="assignment-instructions" placeholder="Instructions"></textarea>
        <input id="assignment-attachment" placeholder="Attachment (optional)" />
        <div class="admin-actions">
          <button class="ghost" type="submit">Save assignment</button>
          <button class="ghost" type="button" id="cancel-assignment-edit">Cancel</button>
        </div>
      </form>
      <div id="assignment-list" class="admin-list"></div>
    </div>
    <div class="admin-panel" data-panel="broadcast">
      <div class="admin-panel-head">
        <div>
          <h3>Broadcast notifications</h3>
          <p>Send critical updates, reminders, and platform announcements.</p>
        </div>
        <div class="mini-pill">Instant delivery</div>
      </div>
      <form id="broadcast-form" class="admin-form">
        <div class="admin-form-grid">
          <input id="broadcast-title" placeholder="Title" required />
          <select id="broadcast-priority">
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="Critical">Critical</option>
          </select>
          <select id="broadcast-target">
            <option value="Everyone">Everyone</option>
            <option value="Students">Students</option>
            <option value="Admins">Admins</option>
          </select>
          <input id="broadcast-schedule" placeholder="Schedule (optional)" />
        </div>
        <textarea id="broadcast-message" placeholder="Message"></textarea>
        <div class="admin-actions">
          <button class="ghost" type="submit">Send broadcast</button>
        </div>
      </form>
      <div id="broadcast-list" class="admin-list"></div>
    </div>
  `;

  const shell = document.querySelector('.shell');
  const hero = shell?.querySelector('.hero');
  const stats = shell?.querySelector('.stats');
  if (shell) {
    // Keep the notification composer near the top of the admin console.
    // Insert the extension block after the hero and before the statistics/registry.
    if (stats) shell.insertBefore(wrapper, stats);
    else if (hero) hero.insertAdjacentElement('afterend', wrapper);
    else shell.prepend(wrapper);
  }

  wrapper.querySelectorAll('.admin-tabs button').forEach(button => {
    button.addEventListener('click', () => {
      wrapper.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      wrapper.querySelectorAll('.admin-panel[data-panel]').forEach(panel => {
        const isMatch = panel.dataset.panel === button.dataset.view;
        panel.hidden = !isMatch;
      });
    });
  });

  const assignmentForm = document.getElementById('assignment-form');
  assignmentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    saveAssignmentFromForm();
  });

  document.getElementById('cancel-assignment-edit')?.addEventListener('click', resetAssignmentForm);
  document.getElementById('broadcast-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendBroadcast();
  });
}

function seedAdminData() {
  if (!Array.isArray(getStoredValue('codeDetectiveAssignments', [])) || getStoredValue('codeDetectiveAssignments', []).length === 0) {
    const starterAssignments = [
      { id: 'admin-a1', title: 'Binary Trees Lab', subject: 'Programming', description: 'Build a tree traversal demo in Java.', difficulty: 'Medium', dueDate: '2026-08-25', dueTime: '23:59', maxMarks: 30, instructions: 'Upload the completed source file and screenshots.', attachment: 'tree-lab.zip', submitted: false },
      { id: 'admin-a2', title: 'Operating Systems Quiz', subject: 'Operating Systems', description: 'Review scheduling and deadlock concepts.', difficulty: 'Easy', dueDate: '2026-08-20', dueTime: '18:00', maxMarks: 20, instructions: 'Complete the quiz before the deadline.', attachment: '', submitted: false }
    ];
    setStoredValue('codeDetectiveAssignments', starterAssignments);
  }
  if (!Array.isArray(getStoredValue('codeDetectiveBroadcasts', [])) || getStoredValue('codeDetectiveBroadcasts', []).length === 0) {
    const starterBroadcasts = [
      { id: 'b1', title: 'Platform update', message: 'The new multi-subject dashboard is now live.', priority: 'Important', target: 'Everyone', createdAt: new Date().toISOString() }
    ];
    setStoredValue('codeDetectiveBroadcasts', starterBroadcasts);
  }
  state.assignments = getStoredValue('codeDetectiveAssignments', []);
  state.broadcasts = getStoredValue('codeDetectiveBroadcasts', []);
}

function resetAssignmentForm() {
  state.editingAssignmentId = null;
  const form = document.getElementById('assignment-form');
  if (form) form.reset();
}

async function saveAssignmentFromForm() {
  const payload = {
    id: state.editingAssignmentId || `assignment-${Date.now()}`,
    title: document.getElementById('assignment-title').value.trim(),
    subject: document.getElementById('assignment-subject').value.trim(),
    description: document.getElementById('assignment-description').value.trim(),
    difficulty: document.getElementById('assignment-difficulty').value.trim(),
    dueDate: document.getElementById('assignment-due-date').value,
    dueTime: document.getElementById('assignment-due-time').value,
    maxMarks: Number(document.getElementById('assignment-max-marks').value || 0),
    instructions: document.getElementById('assignment-instructions').value.trim(),
    attachment: document.getElementById('assignment-attachment').value.trim(),
    submitted: false
  };

  if (!payload.title || !payload.subject || !payload.difficulty || !payload.dueDate || !payload.dueTime) {
    alert('Please complete the required assignment fields.');
    return;
  }

  const isEditing = Boolean(state.editingAssignmentId);
  if (isEditing) {
    state.assignments = state.assignments.map(item => item.id === state.editingAssignmentId ? { ...item, ...payload } : item);
  } else {
    state.assignments = [payload, ...state.assignments];
  }
  setStoredValue('codeDetectiveAssignments', state.assignments);

  // A newly created assignment must create real Supabase notifications.
  // localStorage alone cannot deliver an assignment to another device/user.
  if (!isEditing) {
    const createdAt = new Date().toISOString();
    const queuedNotification = {
      id: `notif-${Date.now()}`,
      type: 'assignment',
      title: 'New Assignment',
      message: `${payload.title} is now available for ${payload.subject}.`,
      icon: '📚',
      meta: `Due ${payload.dueDate}`,
      read: false,
      createdAt
    };
    setStoredValue('codeDetectiveNotifications', [
      queuedNotification,
      ...(getStoredValue('codeDetectiveNotifications', []) || [])
    ]);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const senderId = sessionData?.session?.user?.id;
      if (sessionError || !senderId) throw sessionError || new Error('Admin session not found.');

      const recipients = getNotificationRecipients('Students');
      if (!recipients.length) throw new Error('No student recipients were found.');

      const notifications = recipients.map(user => ({
        title: 'New Assignment',
        message: `${payload.title} is now available for ${payload.subject}. Due ${payload.dueDate} ${payload.dueTime}.`,
        type: 'assignment',
        sender_id: senderId,
        recipient_id: user.id,
        is_read: false
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to deliver assignment notification:', error);
      resetAssignmentForm();
      renderAdminModules();
      alert(`Assignment saved, but the user notification could not be delivered. ${error?.message || ''}`.trim());
      return;
    }
  }

  resetAssignmentForm();
  renderAdminModules();
  alert(isEditing ? 'Assignment updated successfully.' : 'Assignment saved and student notification delivered.');
}

function editAssignment(id) {
  const assignment = state.assignments.find(item => item.id === id);
  if (!assignment) return;
  state.editingAssignmentId = id;
  document.getElementById('assignment-id').value = assignment.id;
  document.getElementById('assignment-title').value = assignment.title || '';
  document.getElementById('assignment-subject').value = assignment.subject || '';
  document.getElementById('assignment-description').value = assignment.description || '';
  document.getElementById('assignment-difficulty').value = assignment.difficulty || '';
  document.getElementById('assignment-due-date').value = assignment.dueDate || '';
  document.getElementById('assignment-due-time').value = assignment.dueTime || '';
  document.getElementById('assignment-max-marks').value = assignment.maxMarks || '';
  document.getElementById('assignment-instructions').value = assignment.instructions || '';
  document.getElementById('assignment-attachment').value = assignment.attachment || '';
  document.querySelector('[data-view="assignments"]').click();
}

function deleteAssignment(id) {
  state.assignments = state.assignments.filter(item => item.id !== id);
  setStoredValue('codeDetectiveAssignments', state.assignments);
  renderAdminModules();
}

function getNotificationRecipients(target) {
  const users = Array.isArray(state.users) ? state.users.filter(user => user?.id) : [];
  if (target === 'Everyone') return users;

  const isAdminUser = user => Boolean(
    user?.is_admin === true ||
    user?.isAdmin === true ||
    String(user?.role || '').toLowerCase() === 'admin'
  );

  if (target === 'Admins') {
    const admins = users.filter(isAdminUser);
    return admins.length ? admins : [];
  }

  // The admin_list_users RPC may not expose role metadata in older databases.
  // In that case treat the returned registry as the student audience.
  return users.filter(user => !isAdminUser(user));
}

async function sendBroadcast() {
  const payload = {
    id: `broadcast-${Date.now()}`,
    title: document.getElementById('broadcast-title').value.trim(),
    message: document.getElementById('broadcast-message').value.trim(),
    priority: document.getElementById('broadcast-priority').value,
    target: document.getElementById('broadcast-target').value,
    schedule: document.getElementById('broadcast-schedule').value.trim(),
    createdAt: new Date().toISOString()
  };
  if (!payload.title || !payload.message) {
    alert('Please enter a title and message for the broadcast.');
    return;
  }
  
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const senderId = sessionData?.session?.user?.id;
    if (sessionError || !senderId) throw sessionError || new Error('Admin session not found.');

    const recipients = getNotificationRecipients(payload.target);
    if (!recipients.length) {
      alert(`No users were found for the selected audience: ${payload.target}.`);
      return;
    }

    const notifications = recipients.map(user => ({
      title: payload.title,
      message: payload.message,
      type: payload.priority.toLowerCase(),
      sender_id: senderId,
      recipient_id: user.id,
      is_read: false
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) throw error;

    // Only record successful deliveries in the admin history.
    state.broadcasts = [payload, ...state.broadcasts];
    setStoredValue('codeDetectiveBroadcasts', state.broadcasts);
    document.getElementById('broadcast-form').reset();
    renderAdminModules();
    alert(`Notification delivered to ${recipients.length} user${recipients.length === 1 ? '' : 's'}.`);
  } catch (error) {
    console.error('Failed to send broadcast to Supabase:', error);
    alert(`Notification could not be delivered. ${error?.message || 'Please try again.'}`);
  }
}

function renderAdminModules() {
  const assignmentsSummary = document.getElementById('assignments-summary');
  const broadcastSummary = document.getElementById('broadcast-summary');
  const assignmentList = document.getElementById('assignment-list');
  const broadcastList = document.getElementById('broadcast-list');

  if (assignmentsSummary) {
    assignmentsSummary.innerHTML = `<div class="admin-list-item"><strong>${state.assignments.length}</strong> assignments live. Students can review due dates and status from the new learning hub.</div>`;
  }
  if (broadcastSummary) {
    broadcastSummary.innerHTML = `<div class="admin-list-item"><strong>${state.broadcasts.length}</strong> broadcast messages saved. Each message is surfaced in the notification center.</div>`;
  }
  if (assignmentList) {
    assignmentList.innerHTML = state.assignments.length ? state.assignments.map(item => `
      <div class="admin-list-item">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
          <div>
            <strong>${item.title}</strong>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">${item.subject} • ${item.difficulty} • ${item.dueDate} ${item.dueTime}</div>
          </div>
          <div class="admin-actions">
            <button class="ghost" type="button" onclick="editAssignment('${item.id}')">Edit</button>
            <button class="ghost" type="button" onclick="deleteAssignment('${item.id}')">Delete</button>
          </div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:8px;">${item.description || item.instructions || 'No details yet.'}</div>
      </div>
    `).join('') : '<div class="admin-list-item">No assignments yet.</div>';
  }
  if (broadcastList) {
    broadcastList.innerHTML = state.broadcasts.length ? state.broadcasts.map(item => `
      <div class="admin-list-item">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
          <div>
            <strong>${item.title}</strong>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">${item.priority} • ${item.target}</div>
          </div>
          <div style="font-size:11px;color:var(--amber);">${new Date(item.createdAt).toLocaleString()}</div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:8px;">${item.message}</div>
      </div>
    `).join('') : '<div class="admin-list-item">No broadcasts yet.</div>';
  }
}

function getUserName(user){
  return String(user?.display_name || user?.username || user?.email?.split('@')[0] || '').trim().toLowerCase();
}

function sortUsers(users){
  return [...users].sort((a,b)=>getUserName(a).localeCompare(getUserName(b), undefined, { sensitivity: 'base' }));
}

// Keep per-detective case progress visually distinct from the admin console's red accents.
document.head.insertAdjacentHTML('beforeend', `<style>
  :root{--bg:#0E1117;--panel:#1B2230;--panel2:#222B3A;--line:#303B4D;--text:#FFFFFF;--muted:#7B8798;--red:#FF5D73;--amber:#F5B942;--green:#38D39F}
  body{background:radial-gradient(circle at 75% 0,rgba(245,185,66,.10),transparent 28%),var(--bg)}
  .brand-mark{border-color:#C9921C;background:#222B3A}.brand h1,.eyebrow,.detail-section h4{color:#F5B942}
  .admin-id button,.ghost{background:#1B2230;color:#FFFFFF;border-color:#303B4D;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.01em}.return-to-hq{display:flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(27,34,48,.45);color:#B6BECF;border:1px solid rgba(48,59,77,.8);border-radius:10px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;font-weight:500;letter-spacing:0;white-space:nowrap;transition:all .25s ease}.return-to-hq:hover{color:#FFFFFF;background:rgba(245,185,66,.08);border-color:#F5B942}.stat,.user-card{background:linear-gradient(145deg,#1B2230,#0E1117);border-color:#303B4D}
  .user-card:hover{border-color:#F5B942;box-shadow:0 14px 35px rgba(0,0,0,.45)}.avatar{background:#222B3A;border-color:#303B4D}.rank{color:#FFD166;border-color:#C9921C;background:rgba(245,185,66,.10)}
  .bar{background:#303B4D}.bar i{background:linear-gradient(90deg,#38D39F,#79f2b4)!important}.search{background:#222B3A;border-color:#303B4D}.card-metrics{border-color:#303B4D}
  .drawer,.drawer-head{background:#1B2230;border-color:#303B4D}.detail-row{border-color:#303B4D}.case-row{border-color:#303B4D;background:#222B3A}.case-icon{background:rgba(56,211,159,.14)}
  .denied a{background:#F5B942;color:#0E1117}
</style>`);

const returnToHQ = document.createElement('button');
returnToHQ.className = 'ghost return-to-hq';
returnToHQ.type = 'button';
returnToHQ.textContent = 'Return to HQ';
returnToHQ.addEventListener('click', () => location.assign('/home.html'));
document.querySelector('.admin-id')?.prepend(returnToHQ);

async function boot(){
  const { data:{session}, error } = await supabase.auth.getSession();
  if(error || !session) return location.replace('/index.html');
  $('#adminEmail').textContent = session.user.email || 'Administrator';
  const { data:isAdmin, error:roleError } = await supabase.rpc('is_admin');
  if(roleError || !isAdmin){
    document.body.innerHTML = `<main class="denied"><div><span>⛔</span><h1>Admin access required</h1><p>This account is signed in, but it is not authorized as a Code Detective administrator.</p><a href="/home.html">Return to dashboard</a></div></main>`;
    return;
  }
  initAdminTheme();
  ensureAdminExtensions();
  seedAdminData();
  renderAdminModules();
  await loadUsers();
}

async function loadUsers(){
  setLoading(true);
  const { data, error } = await supabase.rpc('admin_list_users');
  setLoading(false);
  if(error){ showError(error.message); return; }
  state.users = sortUsers(Array.isArray(data) ? data : []);
  renderStats(); renderUsers(state.users);
}

function renderStats(){
  const users = state.users;
  const solved = users.reduce((n,u)=>n+Number(u.cases_solved||0),0);
  const xp = users.reduce((n,u)=>n+Number(u.total_dxp||0),0);
  const active = users.filter(u=>u.last_sign_in_at && Date.now()-new Date(u.last_sign_in_at).getTime() < 7*86400000).length;
  $('#totalUsers').textContent = users.length;
  $('#activeUsers').textContent = active;
  $('#casesSolved').textContent = solved;
  $('#totalXp').textContent = xp.toLocaleString('en-IN');
}

function renderUsers(users){
  const grid=$('#userGrid');
  $('#resultCount').textContent=`${users.length} detective${users.length===1?'':'s'} · ${state.totalCases} cases in the catalog`;
  if(!users.length){ grid.innerHTML='<div class="empty">No detectives found.</div>'; return; }
  grid.innerHTML=users.map(u=>{
    const solved=Number(u.cases_solved||0), pct=Math.min(100,Math.round((solved/state.totalCases)*100));
    const name=u.display_name||u.username||u.email?.split('@')[0]||'Detective';
    return `<button class="user-card" data-id="${esc(u.id)}">
      <div class="card-top"><div class="avatar">${esc(u.avatar||'🕵️')}</div><div class="identity"><h3>${esc(name)}</h3><p>${esc(u.email||'No email')}</p></div><span class="rank">${esc(u.rank||'Rookie')}</span></div>
      <div class="progress-line"><span>Case progress</span><strong>${solved}/${state.totalCases}</strong></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="card-metrics"><span><b>${Number(u.total_dxp||0).toLocaleString('en-IN')}</b> XP</span><span><b>${Number(u.accuracy||0)}%</b> accuracy</span><span><b>${Number(u.streak||0)}</b> streak</span></div>
      <div class="last-seen">Last sign-in · ${esc(fmt(u.last_sign_in_at))}</div>
    </button>`;
  }).join('');
  grid.querySelectorAll('.user-card').forEach(b=>b.addEventListener('click',()=>openUser(b.dataset.id)));
}

async function openUser(id){
  const user=state.users.find(u=>u.id===id); if(!user) return;
  state.selected=user;
  $('#drawer').classList.add('open'); $('#overlay').classList.add('show'); document.body.classList.add('locked');
  const name=user.display_name||user.username||user.email?.split('@')[0]||'Detective';
  $('#detailName').textContent=name; $('#detailEmail').textContent=user.email||'—'; $('#detailAvatar').textContent=user.avatar||'🕵️';
  $('#accountDetails').innerHTML=detailRows([
    ['User ID',user.id],['Username',user.username||'—'],['Joined',fmt(user.created_at)],['Last sign-in',fmt(user.last_sign_in_at)],['Last profile update',fmt(user.updated_at)]
  ]);
  $('#performanceDetails').innerHTML=detailRows([
    ['XP / total_dxp',Number(user.total_dxp||0).toLocaleString('en-IN')],['Cases solved',`${Number(user.cases_solved||0)} / ${state.totalCases}`],['Current case',user.current_case_id||'—'],['Accuracy',`${Number(user.accuracy||0)}%`],['Streak',Number(user.streak||0)],['Rank',user.rank||'Rookie']
  ]);
  $('#caseList').innerHTML='<div class="case-loading">Loading case history…</div>';
  const {data,error}=await supabase.rpc('admin_user_progress',{target_user_id:id});
  if(error){ $('#caseList').innerHTML=`<div class="case-error">${esc(error.message)}</div>`; return; }
  const rows=Array.isArray(data)?data:[];
  $('#caseList').innerHTML=rows.length?rows.map(r=>`<div class="case-row"><div><span class="case-icon">${r.completed?'✓':'○'}</span><div><strong>${esc(r.case_id)}</strong><small>${r.completed?'Completed':'In progress'} · ${esc(fmt(r.completed_at||r.updated_at))}</small></div></div><b>+${Number(r.xp_earned||0)} XP</b></div>`).join(''):'<div class="empty small">No case progress recorded yet.</div>';
}
function detailRows(rows){return rows.map(([a,b])=>`<div class="detail-row"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('')}
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#overlay').classList.remove('show'); document.body.classList.remove('locked'); }
function setLoading(v){$('#loading').hidden=!v; $('#userGrid').hidden=v;}
function showError(m){$('#userGrid').innerHTML=`<div class="empty error">Could not load admin data: ${esc(m)}</div>`;}

$('#search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const filtered=state.users.filter(u=>[u.display_name,u.username,u.email,u.current_case_id,u.rank].some(v=>String(v||'').toLowerCase().includes(q)));renderUsers(sortUsers(filtered));});
$('#refresh').addEventListener('click',loadUsers); $('#closeDrawer').addEventListener('click',closeDrawer); $('#overlay').addEventListener('click',closeDrawer);
$('#logout').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/index.html')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
boot();
