import { supabase } from './supabase.js';

const $ = (selector) => document.querySelector(selector);
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const fmt = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)) : '—';
const LEGACY_CASE_TOTAL = 50;
const PACK_CASE_TOTAL = 13;

const state = {
  users: [],
  selected: null,
  totalCases: LEGACY_CASE_TOTAL + PACK_CASE_TOTAL,
  assignments: [],
  broadcasts: [],
  notifications: [],
  atRisk: [],
  editingAssignmentId: null,
  themePreference: 'system'
};

function getStoredValue(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch (_) { return fallback; }
}
function setStoredValue(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalizeTheme(value) { return ['light','dark','system'].includes(value) ? value : 'system'; }
function applyAdminTheme(value = state.themePreference) {
  state.themePreference = normalizeTheme(value);
  const resolved = state.themePreference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : state.themePreference;
  document.body.setAttribute('data-theme', resolved);
  setStoredValue('codeDetectiveTheme', state.themePreference);
}
function initAdminTheme() {
  applyAdminTheme(getStoredValue('codeDetectiveTheme', 'system'));
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => state.themePreference === 'system' && applyAdminTheme('system');
  mq.addEventListener?.('change', update);
}

function injectAdminStyles() {
  document.head.insertAdjacentHTML('beforeend', `<style>
    body[data-theme="light"]{--bg:#f5f7fb;--panel:#fff;--panel2:#eef2f7;--line:#d8e2ee;--text:#142033;--muted:#64748b;--red:#ef4444;--amber:#f59e0b;--green:#10b981}
    body[data-theme="dark"]{--bg:#06070b;--panel:#121727;--panel2:#182132;--line:#28364a;--text:#f8fafc;--muted:#94a3b8;--red:#ff5d73;--amber:#f5b942;--green:#38d39f}
    #admin-extensions{margin:24px 0 28px;display:grid;gap:16px}
    #admin-extensions .admin-panel{background:linear-gradient(145deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 16px 35px rgba(0,0,0,.16)}
    .admin-tabs{display:flex;gap:8px;flex-wrap:wrap}.admin-tabs button{background:var(--panel2);color:var(--text);border:1px solid var(--line);padding:9px 13px;border-radius:999px;cursor:pointer;font-weight:700}.admin-tabs button.active{background:var(--amber);color:#0e1117;border-color:var(--amber)}
    .admin-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}.admin-panel-head h3{margin:0;font-size:18px}.admin-panel-head p{margin:5px 0 0;font-size:12px;color:var(--muted)}
    .admin-form{display:grid;gap:11px}.admin-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.admin-form input,.admin-form textarea,.admin-form select{width:100%;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:11px;padding:11px 12px;color:var(--text);font:inherit;outline:none}.admin-form textarea{min-height:96px;resize:vertical}.admin-form input:focus,.admin-form textarea:focus,.admin-form select:focus{border-color:rgba(0,243,255,.45);box-shadow:0 0 0 3px rgba(0,243,255,.05)}
    .admin-actions{display:flex;gap:9px;flex-wrap:wrap}.admin-actions button,.admin-btn{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}.admin-btn.primary{background:var(--amber);color:#0e1117;border-color:var(--amber)}.admin-btn.danger{color:#ff9aa6;border-color:rgba(255,93,115,.35)}
    .admin-list{display:grid;gap:10px;margin-top:12px}.admin-list-item{border:1px solid var(--line);border-radius:14px;padding:14px;background:rgba(255,255,255,.025)}
    .admin-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.admin-kpi{padding:16px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025)}.admin-kpi strong{font-size:28px;display:block;margin-top:5px}.admin-kpi small{color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-size:10px}
    .recipient-picker{display:grid;gap:8px;max-height:190px;overflow:auto;padding:10px;border:1px solid var(--line);border-radius:11px;background:rgba(0,0,0,.08)}.recipient-row{display:flex;gap:9px;align-items:center;font-size:12px;color:var(--text)}.recipient-row small{color:var(--muted);margin-left:auto}.streak-risk{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.streak-risk strong{display:block}.streak-risk span{font-size:11px;color:var(--muted)}
    .admin-muted{color:var(--muted);font-size:12px;line-height:1.6}.admin-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:rgba(245,185,66,.1);color:var(--amber);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
    @media(max-width:950px){.admin-grid-2{grid-template-columns:1fr}.admin-form-grid{grid-template-columns:1fr}}
    @media(max-width:650px){#admin-extensions .admin-panel{padding:15px}.admin-panel-head{flex-direction:column}.streak-risk{grid-template-columns:1fr}.admin-tabs{overflow:auto;flex-wrap:nowrap}.admin-tabs button{white-space:nowrap}}
  </style>`);
}

function ensureAdminExtensions() {
  if (document.getElementById('admin-extensions')) return;
  injectAdminStyles();
  const wrapper = document.createElement('section');
  wrapper.id = 'admin-extensions';
  wrapper.innerHTML = `
    <div class="admin-tabs">
      <button class="active" data-view="notifications">🔔 Notifications</button>
      <button data-view="assignments">📚 Assignments</button>
      <button data-view="streaks">🔥 Streak Protection</button>
      <button data-view="overview">📊 Overview</button>
    </div>

    <div class="admin-panel" data-panel="notifications">
      <div class="admin-panel-head"><div><h3>Send Notification</h3><p>Send a clear, targeted notification without cluttering the student dashboard.</p></div><span class="admin-chip">Instant delivery</span></div>
      <form id="broadcast-form" class="admin-form">
        <div class="admin-form-grid">
          <input id="broadcast-title" placeholder="Notification title" required>
          <select id="broadcast-priority"><option value="general">Normal</option><option value="important">Important</option><option value="critical">Critical</option></select>
          <select id="broadcast-target"><option value="Students">All students</option><option value="Everyone">Everyone</option><option value="Admins">Administrators</option><option value="Selected">Selected students</option></select>
          <input id="broadcast-search" placeholder="Filter selected students (optional)">
        </div>
        <div id="broadcast-recipient-picker" class="recipient-picker" hidden></div>
        <textarea id="broadcast-message" placeholder="Write the complete notification message..." required></textarea>
        <div class="admin-actions"><button class="admin-btn primary" type="submit">📢 Send notification</button><button class="admin-btn" type="button" id="clear-broadcast">Clear</button></div>
      </form>
      <div class="admin-panel-head" style="margin-top:24px"><div><h3>Notification history</h3><p>Recent notifications sent through Supabase.</p></div><button class="admin-btn" type="button" id="refresh-notifications">↻ Refresh</button></div>
      <div id="notification-history" class="admin-list"></div>
    </div>

    <div class="admin-panel" data-panel="assignments" hidden>
      <div class="admin-panel-head"><div><h3>Assignment Control Center</h3><p>Create, edit, delete and distribute assignments from one place.</p></div><span class="admin-chip">Supabase synced</span></div>
      <form id="assignment-form" class="admin-form">
        <input type="hidden" id="assignment-id">
        <div class="admin-form-grid">
          <input id="assignment-title" placeholder="Assignment title" required>
          <input id="assignment-subject" placeholder="Subject" required>
          <select id="assignment-difficulty"><option value="Easy">Easy</option><option value="Medium" selected>Medium</option><option value="Hard">Hard</option></select>
          <input id="assignment-due-date" type="date" required>
          <input id="assignment-due-time" type="time" required>
          <input id="assignment-max-marks" type="number" min="1" placeholder="Maximum marks" required>
        </div>
        <textarea id="assignment-description" placeholder="Full assignment description"></textarea>
        <textarea id="assignment-instructions" placeholder="Instructions / submission requirements"></textarea>
        <input id="assignment-attachment" placeholder="Attachment or resource reference (optional)">
        <div class="admin-form-grid">
          <select id="assignment-target"><option value="Students">All students</option><option value="Selected">Selected students</option></select>
          <div id="assignment-recipient-count" class="admin-muted" style="display:flex;align-items:center">All current students will receive this assignment.</div>
        </div>
        <div id="assignment-recipient-picker" class="recipient-picker" hidden></div>
        <div class="admin-actions"><button class="admin-btn primary" type="submit">💾 Save assignment</button><button class="admin-btn" type="button" id="cancel-assignment-edit">Cancel edit</button></div>
      </form>
      <div id="assignment-list" class="admin-list"></div>
    </div>

    <div class="admin-panel" data-panel="streaks" hidden>
      <div class="admin-panel-head"><div><h3>Streak Protection</h3><p>Students who have an active streak but have not completed a case today.</p></div><button class="admin-btn primary" id="send-streak-reminders" type="button">🔥 Remind everyone at risk</button></div>
      <div id="streak-summary" class="admin-grid-2"></div>
      <div id="streak-risk-list" class="admin-list"></div>
    </div>

    <div class="admin-panel" data-panel="overview" hidden>
      <div class="admin-panel-head"><div><h3>Learning Operations</h3><p>Live administrative overview.</p></div></div>
      <div class="admin-grid-2">
        <div class="admin-kpi"><small>Assignments</small><strong id="overview-assignment-count">0</strong><div class="admin-muted">Supabase-backed assignments</div></div>
        <div class="admin-kpi"><small>Notifications</small><strong id="overview-notification-count">0</strong><div class="admin-muted">Recent notification records</div></div>
        <div class="admin-kpi"><small>At-risk streaks</small><strong id="overview-risk-count">0</strong><div class="admin-muted">Students needing a reminder</div></div>
        <div class="admin-kpi"><small>Registered users</small><strong id="overview-user-count">0</strong><div class="admin-muted">Current detective registry</div></div>
      </div>
    </div>`;

  const shell = document.querySelector('.shell');
  const hero = shell?.querySelector('.hero');
  const stats = shell?.querySelector('.stats');
  if (stats) shell.insertBefore(wrapper, stats); else if (hero) hero.after(wrapper); else shell?.prepend(wrapper);

  wrapper.querySelectorAll('.admin-tabs button').forEach(button => button.addEventListener('click', () => switchPanel(button.dataset.view)));
  $('#broadcast-form')?.addEventListener('submit', e => { e.preventDefault(); sendBroadcast(); });
  $('#clear-broadcast')?.addEventListener('click', () => $('#broadcast-form')?.reset());
  $('#refresh-notifications')?.addEventListener('click', loadAdminNotifications);
  $('#broadcast-target')?.addEventListener('change', renderRecipientPickers);
  $('#broadcast-search')?.addEventListener('input', renderRecipientPickers);
  $('#assignment-target')?.addEventListener('change', renderRecipientPickers);
  $('#assignment-form')?.addEventListener('submit', e => { e.preventDefault(); saveAssignmentFromForm(); });
  $('#cancel-assignment-edit')?.addEventListener('click', resetAssignmentForm);
  $('#send-streak-reminders')?.addEventListener('click', sendStreakReminders);
}

function switchPanel(name) {
  document.querySelectorAll('#admin-extensions .admin-tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('#admin-extensions [data-panel]').forEach(p => p.hidden = p.dataset.panel !== name);
  if (name === 'streaks') loadStreakRisk();
  if (name === 'notifications') loadAdminNotifications();
}

function getUserName(user) { return String(user?.display_name || user?.username || user?.email?.split('@')[0] || 'Detective').trim(); }
function sortUsers(users) { return [...users].sort((a,b) => getUserName(a).localeCompare(getUserName(b), undefined, {sensitivity:'base'})); }
function isAdminUser(user) { return user?.is_admin === true || user?.isAdmin === true || String(user?.role || '').toLowerCase() === 'admin'; }
function getAdminUsers() { return state.users.filter(isAdminUser); }
function getStudentUsers() { return state.users.filter(u => !isAdminUser(u)); }

function renderRecipientPickers() {
  const broadcastTarget = $('#broadcast-target')?.value;
  const assignmentTarget = $('#assignment-target')?.value;
  const search = ($('#broadcast-search')?.value || '').toLowerCase();
  const students = getStudentUsers().filter(u => `${getUserName(u)} ${u.email || ''}`.toLowerCase().includes(search));
  const broadcastPicker = $('#broadcast-recipient-picker');
  if (broadcastPicker) {
    const show = broadcastTarget === 'Selected';
    broadcastPicker.hidden = !show;
    if (show) broadcastPicker.innerHTML = students.map(u => `<label class="recipient-row"><input type="checkbox" data-broadcast-recipient value="${esc(u.id)}"><span>${esc(getUserName(u))}</span><small>${esc(u.email || '')}</small></label>`).join('') || '<span class="admin-muted">No matching students.</span>';
  }
  const assignmentPicker = $('#assignment-recipient-picker');
  if (assignmentPicker) {
    const show = assignmentTarget === 'Selected';
    assignmentPicker.hidden = !show;
    if (show) assignmentPicker.innerHTML = students.map(u => `<label class="recipient-row"><input type="checkbox" data-assignment-recipient value="${esc(u.id)}"><span>${esc(getUserName(u))}</span><small>${esc(u.email || '')}</small></label>`).join('') || '<span class="admin-muted">No matching students.</span>';
  }
  const count = $('#assignment-recipient-count');
  if (count) count.textContent = assignmentTarget === 'Selected' ? `${document.querySelectorAll('[data-assignment-recipient]:checked').length} students selected.` : `${getStudentUsers().length} current students will receive this assignment.`;
}

async function checkAdmin() {
  const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin');
  if (!rpcError && rpcData === true) return true;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return false;
  const { data: roleRows, error } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  if (error) return false;
  return roleRows?.some(row => String(row.role).toLowerCase() === 'admin') || false;
}

async function boot() {
  const { data:{session}, error } = await supabase.auth.getSession();
  if (error || !session) return location.replace('/index.html');
  $('#adminEmail').textContent = session.user.email || 'Administrator';
  if (!(await checkAdmin())) {
    document.body.innerHTML = `<main class="denied"><div><span>⛔</span><h1>Admin access required</h1><p>This account is not authorized as a Code Detective administrator.</p><a href="/home.html">Return to dashboard</a></div></main>`;
    return;
  }
  initAdminTheme();
  ensureAdminHomeButton();
  ensureAdminExtensions();
  await loadUsers();
  await Promise.all([loadAssignments(), loadAdminNotifications(), loadStreakRisk()]);
  renderAdminModules();
}

function ensureAdminHomeButton() {
  if (document.getElementById('return-to-hq')) return;
  const button = document.createElement('button');
  button.id = 'return-to-hq';
  button.className = 'ghost return-to-hq';
  button.type = 'button';
  button.textContent = '← Home';
  button.addEventListener('click', () => location.assign(new URL('home.html', window.location.href).href));
  document.querySelector('.admin-id')?.prepend(button);
}

async function loadUsers() {
  setLoading(true);
  const { data, error } = await supabase.rpc('admin_list_users');
  setLoading(false);
  if (error) { showError(error.message); return; }

  // The user-list RPC may intentionally omit administrator accounts.
  // Notification targeting must still be able to resolve real admin recipients,
  // so merge admin profiles from the existing user_roles/profiles tables.
  state.users = Array.isArray(data) ? data : [];
  try {
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id,role');
    if (rolesError) throw rolesError;

    const roleMap = new Map((roles || []).map(row => [row.user_id, row.role]));
    const adminIds = [...roleMap.entries()]
      .filter(([, role]) => String(role || '').toLowerCase() === 'admin')
      .map(([id]) => id);

    if (adminIds.length) {
      const { data: adminProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', adminIds);
      if (profileError) throw profileError;

      const existing = new Map(state.users.map(user => [user.id, user]));
      (adminProfiles || []).forEach(profile => {
        existing.set(profile.id, {
          ...(existing.get(profile.id) || {}),
          ...profile,
          role: roleMap.get(profile.id) || profile.role || 'admin',
          is_admin: true
        });
      });
      state.users = [...existing.values()];
    }

    state.users = state.users.map(user => ({
      ...user,
      role: roleMap.get(user.id) || user.role,
      is_admin: String(roleMap.get(user.id) || user.role || '').toLowerCase() === 'admin'
    }));
  } catch (error) {
    // Keep the existing user list usable even if role/profile enrichment is unavailable.
    console.warn('[Admin Users] Could not enrich administrator recipients:', error.message);
  }

  state.users = sortUsers(state.users);
  renderStats();
  renderUsers(state.users);
  renderRecipientPickers();
}

function renderStats() {
  const solved = state.users.reduce((n,u)=>n+Number(u.cases_solved||0),0);
  const xp = state.users.reduce((n,u)=>n+Number(u.total_dxp||0),0);
  const active = state.users.filter(u=>u.last_sign_in_at && Date.now()-new Date(u.last_sign_in_at).getTime() < 7*86400000).length;
  $('#totalUsers').textContent = state.users.length; $('#activeUsers').textContent = active; $('#casesSolved').textContent = solved; $('#totalXp').textContent = xp.toLocaleString('en-IN');
  $('#overview-user-count') && ($('#overview-user-count').textContent = state.users.length);
}

function renderUsers(users) {
  const grid=$('#userGrid'); if (!grid) return;
  $('#resultCount').textContent=`${users.length} detective${users.length===1?'':'s'} · ${state.totalCases} cases in the catalog`;
  if(!users.length){ grid.innerHTML='<div class="empty">No detectives found.</div>'; return; }
  grid.innerHTML=users.map(u=>{ const solved=Number(u.cases_solved||0), pct=Math.min(100,Math.round((solved/state.totalCases)*100)); const name=getUserName(u); return `<button class="user-card" data-id="${esc(u.id)}"><div class="card-top"><div class="avatar">${esc(u.avatar||'🕵️')}</div><div class="identity"><h3>${esc(name)}</h3><p>${esc(u.email||'No email')}</p></div><span class="rank">${esc(u.rank||'Rookie')}</span></div><div class="progress-line"><span>Case progress</span><strong>${solved}/${state.totalCases}</strong></div><div class="bar"><i style="width:${pct}%"></i></div><div class="card-metrics"><span><b>${Number(u.total_dxp||0).toLocaleString('en-IN')}</b> XP</span><span><b>${Number(u.accuracy||0)}%</b> accuracy</span><span><b>${Number(u.streak||0)}</b> streak</span></div><div class="last-seen">Last sign-in · ${esc(fmt(u.last_sign_in_at))}</div></button>`; }).join('');
  grid.querySelectorAll('.user-card').forEach(b=>b.addEventListener('click',()=>openUser(b.dataset.id)));
}

async function loadAssignments() {
  const { data, error } = await supabase.from('assignments').select('id,title,subject,description,difficulty,due_date,due_time,max_marks,instructions,attachment,created_at,updated_at').order('created_at',{ascending:false});
  if (error) { console.warn('[Assignments] Could not load remote assignments:', error.message); state.assignments=[]; renderAssignmentList(); return; }
  const rows = data || [];
  const recipients = rows.length ? await supabase.from('assignment_recipients').select('assignment_id,recipient_id,submitted,submitted_at') : {data:[]};
  const recs = recipients.data || [];
  state.assignments = rows.map(a => ({ ...a, recipients: recs.filter(r=>r.assignment_id===a.id) }));
  renderAssignmentList();
}

function assignmentPayloadFromForm() {
  return {
    title: $('#assignment-title')?.value.trim(), subject: $('#assignment-subject')?.value.trim(), difficulty: $('#assignment-difficulty')?.value,
    due_date: $('#assignment-due-date')?.value, due_time: $('#assignment-due-time')?.value, max_marks: Number($('#assignment-max-marks')?.value || 0),
    description: $('#assignment-description')?.value.trim() || '', instructions: $('#assignment-instructions')?.value.trim() || '', attachment: $('#assignment-attachment')?.value.trim() || ''
  };
}
function selectedAssignmentRecipients() {
  if ($('#assignment-target')?.value !== 'Selected') return getStudentUsers().map(u=>u.id);
  return [...document.querySelectorAll('[data-assignment-recipient]:checked')].map(el=>el.value);
}

async function saveAssignmentFromForm() {
  const payload=assignmentPayloadFromForm();
  if(!payload.title||!payload.subject||!payload.due_date||!payload.due_time||payload.max_marks<=0){ alert('Please complete the required assignment fields.'); return; }
  const recipientIds=selectedAssignmentRecipients();
  if(!recipientIds.length){ alert('Select at least one student.'); return; }
  const { data: sessionData }=await supabase.auth.getSession(); const adminId=sessionData?.session?.user?.id; if(!adminId){alert('Admin session expired.');return;}
  let assignmentId=$('#assignment-id')?.value || null;
  try {
    if(assignmentId){
      const {error}=await supabase.from('assignments').update({...payload,updated_at:new Date().toISOString()}).eq('id',assignmentId); if(error) throw error;
      const {data:existingRecipients,error:existingError}=await supabase.from('assignment_recipients').select('recipient_id').eq('assignment_id',assignmentId);
      if(existingError) throw existingError;
      const existingIds=(existingRecipients||[]).map(r=>r.recipient_id);
      const nextSet=new Set(recipientIds);
      const removeIds=existingIds.filter(id=>!nextSet.has(id));
      const addIds=recipientIds.filter(id=>!existingIds.includes(id));
      if(removeIds.length) await supabase.from('assignment_recipients').delete().eq('assignment_id',assignmentId).in('recipient_id',removeIds);
      if(addIds.length){ const {error:addError}=await supabase.from('assignment_recipients').insert(addIds.map(id=>({assignment_id:assignmentId,recipient_id:id}))); if(addError) throw addError; }
    } else {
      const {data,error}=await supabase.from('assignments').insert({...payload,created_by:adminId}).select('id').single(); if(error) throw error; assignmentId=data.id;
    }
    if(!$('#assignment-id').value){
      const recipientRows=recipientIds.map(id=>({assignment_id:assignmentId,recipient_id:id}));
      const {error:recError}=await supabase.from('assignment_recipients').insert(recipientRows); if(recError) throw recError;
    }
    if(!$('#assignment-id').value){
      const message=[`Assignment: ${payload.title}`,`Subject: ${payload.subject}`,`Difficulty: ${payload.difficulty}`,`Due Date: ${payload.due_date}`,`Due Time: ${payload.due_time}`,`Maximum Marks: ${payload.max_marks}`,'',`Description:`,payload.description||'No description provided.','',`Instructions:`,payload.instructions||'No additional instructions provided.',payload.attachment?`\nAttachment: ${payload.attachment}`:''].filter(Boolean).join('\n');
      const notifications=recipientIds.map(recipient_id=>({title:'New Assignment',message,type:'assignment',sender_id:adminId,recipient_id,is_read:false,assignment_id:assignmentId}));
      const {error:nError}=await supabase.from('notifications').insert(notifications); if(nError) throw nError;
    }
    resetAssignmentForm(); await loadAssignments(); renderAdminModules(); alert(assignmentId ? 'Assignment saved successfully.' : 'Assignment created and notifications delivered.');
  } catch(error){ console.error('[Assignments] Save failed:',error); alert(`Assignment could not be saved. ${error?.message||'Please run FINAL_UPGRADE.sql in Supabase first.'}`); }
}

function resetAssignmentForm(){ state.editingAssignmentId=null; $('#assignment-form')?.reset(); $('#assignment-id').value=''; $('#assignment-target').value='Students'; renderRecipientPickers(); }
function editAssignment(id){ const a=state.assignments.find(x=>x.id===id); if(!a)return; state.editingAssignmentId=id; $('#assignment-id').value=a.id; $('#assignment-title').value=a.title||''; $('#assignment-subject').value=a.subject||''; $('#assignment-difficulty').value=a.difficulty||'Medium'; $('#assignment-due-date').value=a.due_date||''; $('#assignment-due-time').value=a.due_time||''; $('#assignment-max-marks').value=a.max_marks||''; $('#assignment-description').value=a.description||''; $('#assignment-instructions').value=a.instructions||''; $('#assignment-attachment').value=a.attachment||''; $('#assignment-target').value='Selected'; renderRecipientPickers(); setTimeout(()=>a.recipients?.forEach(r=>document.querySelector(`[data-assignment-recipient][value="${CSS.escape(r.recipient_id)}"]`)?.click()),0); switchPanel('assignments'); }
async function deleteAssignment(id){ if(!confirm('Delete this assignment for all recipients?'))return; try{const {error}=await supabase.rpc('admin_delete_assignment',{p_assignment_id:id}); if(error) throw error; await loadAssignments(); renderAdminModules();}catch(error){alert(`Assignment could not be deleted. ${error.message}`);} }

async function sendBroadcast(){
  const title=$('#broadcast-title')?.value.trim(), message=$('#broadcast-message')?.value.trim(), type=$('#broadcast-priority')?.value||'general', target=$('#broadcast-target')?.value||'Students';
  if(!title||!message){alert('Enter a title and message.');return;}

  const recipients = target === 'Selected'
    ? [...document.querySelectorAll('[data-broadcast-recipient]:checked')].map(el => el.value)
    : target === 'Students'
      ? getStudentUsers().map(u => u.id)
      : target === 'Admins'
        ? getAdminUsers().map(u => u.id)
        : state.users.map(u => u.id);

  if(!recipients.length){alert('No recipients match the selected audience.');return;}
  const {data:sessionData}=await supabase.auth.getSession(); const sender_id=sessionData?.session?.user?.id; if(!sender_id)return;
  try{
    const rows=recipients.map(recipient_id=>({title,message,type,sender_id,recipient_id,is_read:false}));
    const {error}=await supabase.from('notifications').insert(rows);
    if(error)throw error;
    state.broadcasts=[{title,message,type,target,createdAt:new Date().toISOString()},...state.broadcasts];
    setStoredValue('codeDetectiveBroadcasts',state.broadcasts);
    $('#broadcast-form').reset();
    renderRecipientPickers();
    await loadAdminNotifications();
    alert(`Notification delivered to ${recipients.length} ${target === 'Admins' ? 'admin' : 'user'}${recipients.length===1?'':'s'}.`);
  }catch(error){console.error('[Notifications] Send failed:',error);alert(`Notification could not be delivered. ${error.message}`);}
}

async function loadAdminNotifications() {
  const historyEl = $('#notification-history');
  if (historyEl) historyEl.innerHTML = '<div class="admin-list-item admin-muted">Loading notification history…</div>';

  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,message,type,sender_id,recipient_id,is_read,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (historyEl) historyEl.innerHTML = `<div class="admin-list-item admin-muted">Could not load notifications: ${esc(error.message)}</div>`;
    console.error('[Notifications] History load failed:', error);
    return;
  }

  const rows = data || [];
  const profileIds = [...new Set(rows.flatMap(row => [row.sender_id, row.recipient_id]).filter(Boolean))];
  let profileMap = new Map();

  if (profileIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id,display_name,username,email')
      .in('id', profileIds);
    if (!profileError) {
      profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));
    } else {
      console.warn('[Notifications] Could not resolve notification names:', profileError.message);
    }
  }

  state.notifications = rows.map(row => ({
    ...row,
    sender: profileMap.get(row.sender_id),
    recipient: profileMap.get(row.recipient_id)
  }));

  renderNotificationHistory();
  const count = document.getElementById('overview-notification-count');
  if (count) count.textContent = state.notifications.length;
}

function renderNotificationHistory(){
  const el=$('#notification-history');
  if(!el)return;
  if(!state.notifications.length){el.innerHTML='<div class="admin-list-item admin-muted">No notifications have been sent yet.</div>';return;}
  const personName = profile => String(profile?.display_name || profile?.username || profile?.email?.split('@')[0] || 'Unknown user');
  el.innerHTML=state.notifications.map(n=>`<div class="admin-list-item"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="min-width:0"><span class="admin-chip">${esc(n.type||'general')}</span><h4 style="margin:8px 0 4px">${esc(n.title)}</h4><div class="admin-muted">${esc(n.message)}</div><div class="admin-muted" style="margin-top:7px">Sent ${esc(fmt(n.created_at))} · ${n.is_read?'Read':'Unread'}</div><div class="admin-muted" style="margin-top:5px">From: ${esc(personName(n.sender))} · To: ${esc(personName(n.recipient))}</div></div><button class="admin-btn danger" data-delete-notification="${esc(n.id)}" type="button">Delete</button></div></div>`).join('');
  el.querySelectorAll('[data-delete-notification]').forEach(btn=>btn.addEventListener('click',()=>deleteNotification(btn.dataset.deleteNotification)));
}
async function deleteNotification(id){if(!confirm('Delete this notification?'))return;try{const {error}=await supabase.from('notifications').delete().eq('id',id);if(error)throw error;state.notifications=state.notifications.filter(n=>n.id!==id);renderNotificationHistory();}catch(error){alert(`Notification could not be deleted. ${error.message}`);}}

async function loadStreakRisk(){
  const {data,error}=await supabase.rpc('admin_streak_at_risk');
  if(error){state.atRisk=[];$('#streak-risk-list')&&($('#streak-risk-list').innerHTML=`<div class="admin-list-item admin-muted">Could not calculate streak risk: ${esc(error.message)}. Run FINAL_UPGRADE.sql.</div>`);return;}
  state.atRisk=Array.isArray(data)?data:[];renderStreakRisk();
}
function renderStreakRisk(){
  $('#overview-risk-count')&&($('#overview-risk-count').textContent=state.atRisk.length);
  const summary=$('#streak-summary');if(summary)summary.innerHTML=`<div class="admin-kpi"><small>At risk</small><strong>${state.atRisk.length}</strong><div class="admin-muted">Active streaks needing action</div></div><div class="admin-kpi"><small>Automation</small><strong>Daily</strong><div class="admin-muted">Server-side reminder job at 6:00 PM IST</div></div>`;
  const list=$('#streak-risk-list');if(!list)return;if(!state.atRisk.length){list.innerHTML='<div class="admin-list-item admin-muted">✅ No students are currently at risk.</div>';return;}list.innerHTML=state.atRisk.map(u=>`<div class="admin-list-item streak-risk"><div><strong>🔥 ${esc(u.display_name||u.username||u.email||'Detective')}</strong><span>${Number(u.streak||0)} day streak · Last activity ${esc(fmt(u.last_activity))}</span></div><button class="admin-btn primary" type="button" data-remind-user="${esc(u.user_id)}">Remind</button></div>`).join('');list.querySelectorAll('[data-remind-user]').forEach(b=>b.addEventListener('click',()=>sendStreakReminders([b.dataset.remindUser])));}
async function sendStreakReminders(userIds=state.atRisk.map(u=>u.user_id)){
  if(!userIds.length){alert('No students are currently at risk.');return;}
  const {data:sessionData}=await supabase.auth.getSession();const sender_id=sessionData?.session?.user?.id;if(!sender_id)return;
  try{const rows=userIds.map(id=>{const r=state.atRisk.find(x=>x.user_id===id);const days=Number(r?.streak||0);return{title:'🔥 Your streak is at risk',message:`Your ${days}-day streak is at risk. Complete at least one Code Detective case today to keep it alive.`,type:'streak',sender_id,recipient_id:id,is_read:false};});const {error}=await supabase.from('notifications').insert(rows);if(error)throw error;alert(`Streak reminder${rows.length===1?'':'s'} sent.`);}catch(error){alert(`Streak reminders failed: ${error.message}`);}}

function renderAssignmentList(){const el=$('#assignment-list');if(!el)return;if(!state.assignments.length){el.innerHTML='<div class="admin-list-item admin-muted">No assignments yet. Create your first assignment above.</div>';return;}el.innerHTML=state.assignments.map(a=>`<div class="admin-list-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><span class="admin-chip">${esc(a.subject)}</span><h4 style="margin:8px 0 4px">${esc(a.title)}</h4><div class="admin-muted">${esc(a.difficulty)} · Due ${esc(a.due_date)} ${esc(a.due_time)} · ${Number(a.max_marks||0)} marks</div></div><div class="admin-actions"><button class="admin-btn" data-edit-assignment="${esc(a.id)}">Edit</button><button class="admin-btn danger" data-delete-assignment="${esc(a.id)}">Delete</button></div></div><div class="admin-muted" style="margin-top:9px">${esc(a.description||'No description')}<br><br>${esc(a.instructions||'No additional instructions')}</div><div class="admin-muted" style="margin-top:9px">Recipients: ${a.recipients?.length||0} · Submitted: ${a.recipients?.filter(r=>r.submitted).length||0}</div></div>`).join('');el.querySelectorAll('[data-edit-assignment]').forEach(b=>b.addEventListener('click',()=>editAssignment(b.dataset.editAssignment)));el.querySelectorAll('[data-delete-assignment]').forEach(b=>b.addEventListener('click',()=>deleteAssignment(b.dataset.deleteAssignment)));}
function renderAdminModules(){renderAssignmentList();renderNotificationHistory();renderStreakRisk();$('#overview-assignment-count')&&($('#overview-assignment-count').textContent=state.assignments.length);$('#overview-notification-count')&&($('#overview-notification-count').textContent=state.notifications.length);$('#overview-risk-count')&&($('#overview-risk-count').textContent=state.atRisk.length);}

async function openUser(id){const user=state.users.find(u=>u.id===id);if(!user)return;state.selected=user;$('#drawer').classList.add('open');$('#overlay').classList.add('show');document.body.classList.add('locked');const name=getUserName(user);$('#detailName').textContent=name;$('#detailEmail').textContent=user.email||'—';$('#detailAvatar').textContent=user.avatar||'🕵️';$('#accountDetails').innerHTML=detailRows([['User ID',user.id],['Username',user.username||'—'],['Joined',fmt(user.created_at)],['Last sign-in',fmt(user.last_sign_in_at)],['Last profile update',fmt(user.updated_at)]]);$('#performanceDetails').innerHTML=detailRows([['XP / total_dxp',Number(user.total_dxp||0).toLocaleString('en-IN')],['Cases solved',`${Number(user.cases_solved||0)} / ${state.totalCases}`],['Current case',user.current_case_id||'—'],['Accuracy',`${Number(user.accuracy||0)}%`],['Streak',Number(user.streak||0)],['Rank',user.rank||'Rookie']]);$('#caseList').innerHTML='<div class="case-loading">Loading case history…</div>';const {data,error}=await supabase.rpc('admin_user_progress',{target_user_id:id});if(error){$('#caseList').innerHTML=`<div class="case-error">${esc(error.message)}</div>`;return;}const rows=Array.isArray(data)?data:[];$('#caseList').innerHTML=rows.length?rows.map(r=>`<div class="case-row"><div><span class="case-icon">${r.completed?'✓':'○'}</span><div><strong>${esc(r.case_id)}</strong><small>${r.completed?'Completed':'In progress'} · ${esc(fmt(r.completed_at||r.updated_at))}</small></div></div><b>+${Number(r.xp_earned||0)} XP</b></div>`).join(''):'<div class="empty small">No case progress recorded yet.</div>';}
function detailRows(rows){return rows.map(([a,b])=>`<div class="detail-row"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('')}
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#overlay').classList.remove('show'); document.body.classList.remove('locked'); }
function setLoading(v){$('#loading').hidden=!v;$('#userGrid').hidden=v;}
function showError(m){$('#userGrid').innerHTML=`<div class="empty error">Could not load admin data: ${esc(m)}</div>`;}

$('#search')?.addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const filtered=state.users.filter(u=>[u.display_name,u.username,u.email,u.current_case_id,u.rank].some(v=>String(v||'').toLowerCase().includes(q)));renderUsers(sortUsers(filtered));});
$('#refresh')?.addEventListener('click',loadUsers);
$('#closeDrawer')?.addEventListener('click',closeDrawer);
$('#overlay')?.addEventListener('click',closeDrawer);
$('#logout')?.addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/index.html')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
boot();
