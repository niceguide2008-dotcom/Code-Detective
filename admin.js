import { supabase } from './supabase.js';

const $ = (s) => document.querySelector(s);
const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (v) => v ? new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)) : '—';
const LEGACY_CASE_TOTAL = 50;
const PACK_CASE_TOTAL = Array.isArray(window.JAVA_OOP_UNIT1_CASES) ? window.JAVA_OOP_UNIT1_CASES.length : 13;
const state = { users: [], selected: null, totalCases: LEGACY_CASE_TOTAL + PACK_CASE_TOTAL };

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
  await loadUsers();
}

async function loadUsers(){
  setLoading(true);
  const { data, error } = await supabase.rpc('admin_list_users');
  setLoading(false);
  if(error){ showError(error.message); return; }
  state.users = Array.isArray(data) ? data : [];
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

$('#search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();renderUsers(state.users.filter(u=>[u.display_name,u.username,u.email,u.current_case_id,u.rank].some(v=>String(v||'').toLowerCase().includes(q))))});
$('#refresh').addEventListener('click',loadUsers); $('#closeDrawer').addEventListener('click',closeDrawer); $('#overlay').addEventListener('click',closeDrawer);
$('#logout').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/index.html')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
boot();
