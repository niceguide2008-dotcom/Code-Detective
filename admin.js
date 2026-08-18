import { supabase } from './supabase.js';
import { isCurrentUserAdmin } from './auth-utils.js';
import { generateHomework, generateAssignment, askAdminLearningInsights } from './ai-client.js';

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
  themePreference: 'system',
  analytics: null,
  activeSection: 'dashboard'
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
    .ai-generator{display:grid;gap:14px}.ai-generator-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ai-generator input,.ai-generator textarea,.ai-generator select{width:100%;box-sizing:border-box;background:rgba(255,255,255,.035);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:11px;font:inherit}.ai-generator textarea{min-height:120px;resize:vertical}.ai-result{white-space:pre-wrap;background:rgba(0,0,0,.12);border:1px solid var(--line);border-radius:12px;padding:13px;line-height:1.55}.ai-q{padding:10px 0;border-bottom:1px solid var(--line)}.ai-q:last-child{border-bottom:0}@media(max-width:760px){.ai-generator-grid{grid-template-columns:1fr}}
    .admin-list{display:grid;gap:10px;margin-top:12px}.admin-list-item{border:1px solid var(--line);border-radius:14px;padding:14px;background:rgba(255,255,255,.025)}
    .admin-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.admin-kpi{padding:16px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025)}.admin-kpi strong{font-size:28px;display:block;margin-top:5px}.admin-kpi small{color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-size:10px}
    .recipient-picker{display:grid;gap:5px;max-height:230px;overflow:auto;padding:7px;border:1px solid var(--line);border-radius:14px;background:rgba(0,0,0,.08);scroll-behavior:smooth)}
    .recipient-row{display:grid;grid-template-columns:20px minmax(0,1fr) minmax(0,.9fr);gap:9px;align-items:center;min-height:42px;padding:7px 9px;border:1px solid transparent;border-radius:10px;font-size:12px;color:var(--text);cursor:pointer;transition:transform 150ms ease,background 150ms ease,border-color 150ms ease}
    .recipient-row:hover{transform:translateX(2px);background:rgba(255,255,255,.04);border-color:var(--line)}
    .recipient-row:has(input:checked){background:rgba(245,185,66,.08);border-color:rgba(245,185,66,.3)}
    .recipient-row input{width:16px;height:16px;margin:0;accent-color:var(--amber)}
    .recipient-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.recipient-row small{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
    .admin-actions button,.admin-btn{transition:transform 180ms ease,box-shadow 180ms ease,border-color 180ms ease,background 180ms ease,opacity 180ms ease}.admin-actions button:hover:not(:disabled),.admin-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.12)}.admin-actions button:active:not(:disabled),.admin-btn:active:not(:disabled){transform:scale(.97)}.admin-actions button:disabled,.admin-btn:disabled{opacity:.55;cursor:not-allowed}
    .admin-ai-question{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:stretch}.admin-ai-question textarea{min-height:50px;resize:none;background:rgba(255,255,255,.035);color:var(--text);border:1px solid var(--line);border-radius:13px;padding:12px;font:inherit;outline:none;transition:border-color 180ms ease,box-shadow 180ms ease}.admin-ai-question textarea:focus{border-color:rgba(0,243,255,.5);box-shadow:0 0 0 4px rgba(0,243,255,.06)}.admin-ai-question .admin-btn{min-width:105px}.admin-ai-answer{margin-top:14px;padding:16px;border:1px solid rgba(79,169,255,.25);border-radius:14px;background:rgba(79,169,255,.045);white-space:pre-wrap;line-height:1.65;animation:admin-answer-in 260ms ease both}.admin-actions .admin-btn{will-change:auto}@keyframes admin-answer-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.streak-risk{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.streak-risk strong{display:block}.streak-risk span{font-size:11px;color:var(--muted)}
    .admin-muted{color:var(--muted);font-size:12px;line-height:1.6}.admin-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:rgba(245,185,66,.1);color:var(--amber);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
    .notes-admin-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:16px}.notes-admin-card{border:1px solid var(--line);border-radius:14px;padding:16px;background:rgba(255,255,255,.025)}.notes-admin-card h4{margin:0 0 5px;font-size:14px}.notes-admin-card p{margin:0 0 13px;color:var(--muted);font-size:11px;line-height:1.5}.notes-drop{border:1px dashed rgba(245,185,66,.42);border-radius:13px;padding:18px;background:rgba(245,185,66,.035);text-align:center}.notes-drop strong{display:block;font-size:13px}.notes-drop span{display:block;color:var(--muted);font-size:10px;margin-top:5px}.notes-file{width:100%;padding:12px;border:1px dashed var(--line);border-radius:10px;background:rgba(0,0,0,.08);color:var(--text);margin-top:10px}.notes-file::file-selector-button{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:7px 10px;margin-right:9px;cursor:pointer}.notes-admin-list{display:grid;gap:8px;max-height:430px;overflow:auto}.notes-admin-item{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid var(--line);border-radius:11px;padding:11px;background:rgba(255,255,255,.02)}.notes-admin-item strong{display:block;font-size:12px}.notes-admin-item span{display:block;color:var(--muted);font-size:10px;margin-top:3px}.notes-admin-item button{flex:0 0 auto}.notes-admin-status{min-height:18px;color:var(--muted);font-size:11px}.notes-admin-status.success{color:var(--green)}.notes-admin-status.error{color:#ff9aa6}@media(max-width:950px){.notes-admin-grid{grid-template-columns:1fr}}    @media(max-width:950px){.admin-grid-2{grid-template-columns:1fr}.admin-form-grid{grid-template-columns:1fr}}
    @media(max-width:650px){#admin-extensions .admin-panel{padding:15px}.admin-panel-head{flex-direction:column}.streak-risk{grid-template-columns:1fr}.admin-tabs{overflow:auto;flex-wrap:nowrap}.admin-tabs button{white-space:nowrap}} #admin-extensions.catalog-view .admin-tabs{display:none}
  </style>`);
}

function ensureAdminExtensions() {
  if (document.getElementById('admin-extensions')) return;
  injectAdminStyles();
  const wrapper = document.createElement('section');
  wrapper.id = 'admin-extensions';
  wrapper.innerHTML = `
    <div class="admin-tabs">
      <button class="active" data-view="overview">📊 Overview</button>
      <button data-view="notifications">🔔 Notifications</button>
      <button data-view="assignments">📝 Assignments</button>
      <button data-view="streaks">🔥 Streak Protection</button>
      <button data-view="ai-insights">🧠 AI Insights</button>
      <button data-view="ai-homework">🤖 AI Homework</button>
      <button data-view="ai-assignment">📝 AI Assignment</button>
    </div>

    <div class="admin-panel" data-panel="overview">
      <div class="admin-panel-head"><div><h3>Learning Operations</h3><p>Live administrative overview from Supabase.</p></div><span class="admin-chip">Live data</span></div>
      <div class="admin-grid-2">
        <div class="admin-kpi"><small>Assignments</small><strong id="overview-assignment-count">—</strong><div class="admin-muted">Existing assignment records</div></div>
        <div class="admin-kpi"><small>Notifications</small><strong id="overview-notification-count">—</strong><div class="admin-muted">Notification records visible to administrators</div></div>
        <div class="admin-kpi"><small>At-risk streaks</small><strong id="overview-risk-count">—</strong><div class="admin-muted">Students currently needing attention</div></div>
        <div class="admin-kpi"><small>Completed cases</small><strong id="overview-case-count">—</strong><div class="admin-muted">All completed case-progress records</div></div>
      </div>
    </div>

    <div class="admin-panel" data-panel="notes" hidden>
      <div class="admin-panel-head"><div><h3>📚 Notes Library</h3><p>Publish study notes once from the admin console and make them available to every signed-in student.</p></div><span class="admin-chip">Shared with students</span></div>
      <div class="notes-admin-grid">
        <div class="notes-admin-card">
          <h4>Add a study note</h4>
          <p>Upload PDF or DOCX and Code Detective will extract the text automatically. TXT/MD and other text files are also supported. Legacy DOC is accepted by the picker but must be converted to DOCX/PDF for browser extraction.</p>
          <form id="admin-note-form" class="admin-form">
            <div class="admin-form-grid">
              <input id="admin-note-title" placeholder="Note title (e.g. Java Inheritance)" required>
              <input id="admin-note-subject" placeholder="Subject (e.g. Java Programming)" value="General">
            </div>
            <div class="notes-drop">
              <strong>📄 Choose a note file</strong>
              <span>PDF · DOCX · DOC · TXT · MD · code/text files</span>
              <input id="admin-note-file" class="notes-file" type="file" accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.json,.html,.css,.js,.ts,.tsx,.jsx,.java,.py,.c,.cpp,.h,.hpp,.sql,.xml,.yaml,.yml,.log,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword">
            </div>
            <textarea id="admin-note-content" placeholder="Or paste the note content here…"></textarea>
            <div class="admin-actions"><button class="admin-btn primary" id="admin-note-save" type="submit">＋ Publish Note</button><button class="admin-btn" id="admin-note-clear" type="button">Clear</button></div>
            <div id="admin-note-status" class="notes-admin-status" aria-live="polite"></div>
          </form>
        </div>
        <div class="notes-admin-card">
          <h4>Published notes</h4>
          <p>These notes appear inside the student's <strong>Available Notes</strong> dropdown.</p>
          <div id="admin-notes-list" class="notes-admin-list"><div class="admin-muted">Loading notes…</div></div>
        </div>
      </div>
    </div>

    <div class="admin-panel" data-panel="ai-insights" hidden>
      <div class="admin-panel-head"><div><h3>🧠 AI Academic Intelligence</h3><p>Ask questions about real Code Detective learning activity. The AI is grounded in live application analytics and will say when the data is insufficient.</p></div><span class="admin-chip">Data grounded</span></div>
      <div class="admin-ai-insights">
        <div class="admin-ai-question"><textarea id="admin-ai-question" placeholder="e.g. Which programming topic appears to be causing the most difficulty?"></textarea><button class="admin-btn primary" id="admin-ai-ask" type="button">Ask AI</button></div>
        <div class="admin-actions"><button class="admin-btn" type="button" data-admin-ai-prompt="What programming topic appears to be causing the most difficulty?">Difficult topics</button><button class="admin-btn" type="button" data-admin-ai-prompt="What are students asking the AI Tutor about most frequently?">Tutor demand</button><button class="admin-btn" type="button" data-admin-ai-prompt="Which notes are being used the most?">Note usage</button><button class="admin-btn" type="button" data-admin-ai-prompt="Which topics should receive additional learning material?">Content gaps</button></div>
        <div id="admin-ai-status" class="admin-muted"></div>
        <div id="admin-ai-result" class="admin-ai-answer" hidden></div>
      </div>
    </div>

    <div class="admin-panel" data-panel="ai-homework" hidden>
      <div class="admin-panel-head"><div><h3>🤖 AI Homework Generator</h3><p>Give the AI a topic, choose difficulty, generate questions + answers, then use the result in the homework form.</p></div><span class="admin-chip">AI powered</span></div>
      <div class="ai-generator">
        <div class="ai-generator-grid">
          <input id="ai-homework-topic" placeholder="Topic (e.g. Java inheritance)" />
          <input id="ai-homework-subject" value="Java Programming" placeholder="Subject" />
          <select id="ai-homework-difficulty"><option>Easy</option><option selected>Medium</option><option>Hard</option></select>
          <input id="ai-homework-count" type="number" min="1" max="20" value="5" />
          <input id="ai-homework-due-date" type="date" />
          <input id="ai-homework-due-time" type="time" value="23:59" />
        </div>
        <div class="admin-actions"><button class="admin-btn primary" id="ai-generate-homework" type="button">✨ Generate Homework</button><button class="admin-btn" id="ai-use-homework" type="button" disabled>Use in Assignment Form</button><button class="admin-btn primary" id="ai-send-homework" type="button" disabled>📤 Create & Send to Students</button></div>
        <div id="ai-homework-result" class="ai-result admin-muted">No generated homework yet.</div>
      </div>
    </div>

    <div class="admin-panel" data-panel="ai-assignment" hidden>
      <div class="admin-panel-head"><div><h3>📝 AI Assignment Generator</h3><p>Generate assignment questions only. Answers are intentionally excluded from the student-facing content.</p></div><span class="admin-chip">AI powered</span></div>
      <div class="ai-generator">
        <div class="ai-generator-grid">
          <input id="ai-assignment-topic" placeholder="Topic (e.g. OOP concepts)" />
          <input id="ai-assignment-subject" value="Java Programming" placeholder="Subject" />
          <select id="ai-assignment-difficulty"><option>Easy</option><option selected>Medium</option><option>Hard</option></select>
          <input id="ai-assignment-count" type="number" min="1" max="20" value="5" />
        </div>
        <div class="admin-actions"><button class="admin-btn primary" id="ai-generate-assignment" type="button">✨ Generate Assignment Questions</button><button class="admin-btn" id="ai-use-assignment" type="button" disabled>Use in Assignment Form</button></div>
        <div id="ai-assignment-result" class="ai-result admin-muted">No generated assignment yet.</div>
      </div>
    </div>

    <div class="admin-panel" data-panel="notifications" hidden>
      <div class="admin-panel-head"><div><h3>Notification Control</h3><p>Send and review real notifications without introducing local-only history.</p></div><span class="admin-chip">Supabase synced</span></div>
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
      <div class="admin-panel-head" style="margin-top:24px"><div><h3>Notification history</h3><p>Recent notification records.</p></div><button class="admin-btn" type="button" id="refresh-notifications">↻ Refresh</button></div>
      <div id="notification-history" class="admin-list"></div>
    </div>

    <div class="admin-panel" data-panel="assignments" hidden>
      <div class="admin-panel-head"><div><h3>Assignment Control Center</h3><p>Create, edit, delete and distribute assignments using the existing Supabase schema.</p></div><span class="admin-chip">Supabase synced</span></div>
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
        <div class="admin-actions"><button class="admin-btn primary" id="assignment-save-btn" type="submit">💾 Save assignment</button><button class="admin-btn" type="button" id="cancel-assignment-edit">Cancel edit</button></div>
      </form>
      <div id="assignment-list" class="admin-list"></div>
    </div>

    <div class="admin-panel" data-panel="streaks" hidden>
      <div class="admin-panel-head"><div><h3>Streak Protection</h3><p>Students who have an active streak but have not completed a case today.</p></div><button class="admin-btn primary" id="send-streak-reminders" type="button">🔥 Remind everyone at risk</button></div>
      <div id="streak-summary" class="admin-grid-2"></div>
      <div id="streak-risk-list" class="admin-list"></div>
    </div>

    <div class="admin-panel" data-panel="questions" hidden>
      <div class="admin-panel-head"><div><h3>Question Bank</h3><p>Reusable academic question data currently shipped with Code Detective.</p></div><span class="admin-chip" id="question-bank-version">Schema —</span></div>
      <div id="question-bank-admin-content" class="admin-page-panel"><div class="admin-muted">Loading question bank…</div></div>
    </div>

    <div class="admin-panel" data-panel="playground" hidden>
      <div class="admin-panel-head"><div><h3>🧪 Playground Challenges</h3><p>Manage Java jigsaw challenges. The correct solution is stored separately and is never exposed to normal users.</p></div><span class="admin-chip">Secure validator</span></div>
      <div class="admin-grid-2">
        <div class="notes-admin-card">
          <h4 id="playground-form-title">Add Playground Challenge</h4>
          <p>Enter the Java components in their <strong>correct order</strong>, one component per line. The student experience will randomize them automatically.</p>
          <form id="playground-admin-form" class="admin-form">
            <input type="hidden" id="playground-id">
            <div class="admin-form-grid">
              <input id="playground-title" placeholder="Challenge title" required>
              <input id="playground-number" type="number" min="1" placeholder="Challenge number" required>
            </div>
            <textarea id="playground-question" placeholder="Complete Java programming question" required></textarea>
            <div class="admin-form-grid">
              <select id="playground-difficulty"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
              <input id="playground-category" value="Basics" placeholder="Category">
            </div>
            <div class="admin-form-grid">
              <input id="playground-language" value="Java" placeholder="Language">
              <input id="playground-points" type="number" min="0" max="10000" value="50" placeholder="XP reward">
            </div>
            <textarea id="playground-components" style="min-height:260px" placeholder="public class Main
{
public static void main(String[] args)
{
System.out.println("Hello");
}
}"></textarea>
            <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text)"><input id="playground-active" type="checkbox" checked> Active challenge</label>
            <div class="admin-actions"><button class="admin-btn primary" type="submit" id="playground-save">💾 Save Challenge</button><button class="admin-btn" type="button" id="playground-cancel">Clear</button></div>
            <div id="playground-form-status" class="notes-admin-status"></div>
          </form>
        </div>
        <div class="notes-admin-card">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><h4>Published challenges</h4><p>Activate, edit, deactivate, or permanently delete Playground challenges.</p></div><button class="admin-btn" type="button" id="playground-refresh">↻ Refresh</button></div>
          <div id="playground-admin-list" class="admin-list"><div class="admin-muted">Loading Playground challenges…</div></div>
        </div>
      </div>
    </div>

    <div class="admin-panel" data-panel="units" hidden>
      <div class="admin-panel-head"><div><h3>Units & Academic Content</h3><p>Inspect the current reusable unit structure without altering the student-facing catalog.</p></div><span class="admin-chip">Catalog view</span></div>
      <div id="unit-admin-content" class="admin-page-panel"><div class="admin-muted">Loading academic units…</div></div>
    </div>

    <div class="admin-panel" data-panel="analytics" hidden>
      <div class="admin-panel-head"><div><h3>Analytics & Statistics</h3><p>Aggregated learning activity calculated from live case-progress and profile records.</p></div><button class="admin-btn" type="button" id="refresh-analytics">↻ Refresh</button></div>
      <div id="analytics-admin-content" class="admin-page-panel"><div class="admin-muted">Loading analytics…</div></div>
    </div>

    <div class="admin-panel" data-panel="settings" hidden>
      <div class="admin-panel-head"><div><h3>Admin Settings</h3><p>Workspace controls that do not alter student permissions or authentication rules.</p></div></div>
      <div id="settings-admin-content" class="admin-page-panel"></div>
    </div>`;

  const shell = document.querySelector('.shell');
  shell?.appendChild(wrapper);

  wrapper.querySelectorAll('.admin-tabs button').forEach(button =>
    button.addEventListener('click', () => switchPanel(button.dataset.view))
  );
  $('#broadcast-form')?.addEventListener('submit', e => { e.preventDefault(); sendBroadcast(); });
  $('#clear-broadcast')?.addEventListener('click', () => $('#broadcast-form')?.reset());
  $('#refresh-notifications')?.addEventListener('click', loadAdminNotifications);
  $('#broadcast-target')?.addEventListener('change', renderRecipientPickers);
  $('#broadcast-search')?.addEventListener('input', renderRecipientPickers);
  $('#assignment-target')?.addEventListener('change', renderRecipientPickers);
  $('#assignment-form')?.addEventListener('submit', e => { e.preventDefault(); saveAssignmentFromForm(); });
  $('#cancel-assignment-edit')?.addEventListener('click', resetAssignmentForm);
  $('#send-streak-reminders')?.addEventListener('click', sendStreakReminders);
  $('#admin-ai-ask')?.addEventListener('click', askAdminAI);
  document.querySelectorAll('[data-admin-ai-prompt]').forEach(button => button.addEventListener('click', () => { const input=$('#admin-ai-question'); if(input){ input.value=button.dataset.adminAiPrompt || ''; input.focus(); } }));
  $('#admin-ai-question')?.addEventListener('keydown', e => { if((e.ctrlKey || e.metaKey) && e.key === 'Enter') askAdminAI(); });
  $('#ai-generate-homework')?.addEventListener('click', generateHomeworkForAdmin);
  $('#ai-generate-assignment')?.addEventListener('click', generateAssignmentForAdmin);
  $('#ai-use-homework')?.addEventListener('click', useGeneratedHomework);
  $('#ai-send-homework')?.addEventListener('click', sendGeneratedHomework);
  $('#ai-use-assignment')?.addEventListener('click', useGeneratedAssignment);
  $('#refresh-analytics')?.addEventListener('click', loadAdminAnalytics);
  $('#playground-admin-form')?.addEventListener('submit', e => { e.preventDefault(); savePlaygroundChallenge(); });
  $('#playground-cancel')?.addEventListener('click', resetPlaygroundForm);
  $('#playground-refresh')?.addEventListener('click', loadPlaygroundChallenges);

  renderQuestionBank();
  loadPlaygroundChallenges();
  renderUnitCatalog();
  renderSettings();
}

async function askAdminAI() {
  const input = $('#admin-ai-question');
  const resultEl = $('#admin-ai-result');
  const status = $('#admin-ai-status');
  const question = input?.value.trim();
  if (!question) return;
  const button = $('#admin-ai-ask');
  if (button) { button.disabled = true; button.textContent = '⟳ Analyzing…'; }
  if (status) status.textContent = 'Analyzing live learning data…';
  if (resultEl) { resultEl.hidden = false; resultEl.innerHTML = 'AI is checking the available evidence…'; }
  try {
    const result = await askAdminLearningInsights({ question });
    const recommendations = Array.isArray(result?.recommendations) ? result.recommendations : [];
    const evidence = Array.isArray(result?.evidence_used) ? result.evidence_used : [];
    if (resultEl) resultEl.innerHTML = `<h4>AI assessment</h4><div>${esc(result?.answer || 'No assessment returned.').replace(/\n/g,'<br>')}</div>${recommendations.length ? `<div style="margin-top:12px"><strong style="font-size:11px">Recommended actions</strong><ul class="admin-ai-rec">${recommendations.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}${evidence.length ? `<div class="admin-ai-evidence" style="margin-top:12px">${evidence.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}`;
    if (status) status.textContent = `Grounded in live data · confidence: ${result?.confidence || 'data-dependent'}`;
  } catch (error) {
    if (resultEl) resultEl.innerHTML = `<h4>AI unavailable</h4><div>${esc(error.message || 'Could not analyze the data.')}</div>`;
    if (status) status.textContent = '';
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Ask AI'; }
  }
}


async function loadPlaygroundChallenges() {
  const el = $('#playground-admin-list');
  if (!el) return;
  el.innerHTML = '<div class="admin-muted">Loading Playground challenges…</div>';
  const { data, error } = await supabase.rpc('admin_playground_challenges');
  if (error) { el.innerHTML = `<div class="admin-list-item admin-muted">Could not load Playground challenges: ${esc(error.message)}</div>`; return; }
  const rows = data || [];
  if (!rows.length) { el.innerHTML = '<div class="admin-list-item admin-muted">No Playground challenges yet.</div>'; return; }
  el.innerHTML = rows.map(row => `
    <div class="admin-list-item">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <div><strong>#${Number(row.challenge_number)} · ${esc(row.title)}</strong><span>${esc(row.category)} · ${esc(row.difficulty)} · +${Number(row.points)} XP · ${row.is_active ? 'Active' : 'Inactive'}</span></div>
        <span class="admin-chip">${(row.pieces || []).length} pieces</span>
      </div>
      <div class="admin-actions" style="margin-top:10px">
        <button class="admin-btn" data-playground-edit="${esc(row.id)}">Edit</button>
        <button class="admin-btn" data-playground-toggle="${esc(row.id)}" data-active="${row.is_active}">${row.is_active ? 'Deactivate' : 'Activate'}</button>
        <button class="admin-btn danger" data-playground-delete="${esc(row.id)}">Delete</button>
      </div>
    </div>`).join('');
  el.querySelectorAll('[data-playground-edit]').forEach(b => b.addEventListener('click', () => editPlaygroundChallenge(rows.find(r => r.id === b.dataset.playgroundEdit))));
  el.querySelectorAll('[data-playground-toggle]').forEach(b => b.addEventListener('click', () => togglePlaygroundChallenge(b.dataset.playgroundToggle, b.dataset.active === 'true')));
  el.querySelectorAll('[data-playground-delete]').forEach(b => b.addEventListener('click', () => deletePlaygroundChallenge(b.dataset.playgroundDelete)));
}

function setPlaygroundFormStatus(message, type='') {
  const el = $('#playground-form-status'); if (!el) return;
  el.textContent = message; el.className = `notes-admin-status ${type}`;
}

function resetPlaygroundForm() {
  $('#playground-admin-form')?.reset();
  $('#playground-id').value = '';
  $('#playground-number').value = '';
  $('#playground-language').value = 'Java';
  $('#playground-category').value = 'Basics';
  $('#playground-points').value = '50';
  $('#playground-active').checked = true;
  $('#playground-form-title').textContent = 'Add Playground Challenge';
  $('#playground-save').textContent = '💾 Save Challenge';
  setPlaygroundFormStatus('');
}

function editPlaygroundChallenge(row) {
  if (!row) return;
  const orderedPieces = Array.isArray(row.correct_order) && row.correct_order.length
    ? row.correct_order.map(id => (row.pieces || []).find(piece => piece.id === id)).filter(Boolean)
    : (row.pieces || []);
  $('#playground-id').value = row.id;
  $('#playground-title').value = row.title || '';
  $('#playground-number').value = row.challenge_number || '';
  $('#playground-question').value = row.question || '';
  $('#playground-difficulty').value = row.difficulty || 'Beginner';
  $('#playground-category').value = row.category || 'Basics';
  $('#playground-language').value = row.language || 'Java';
  $('#playground-points').value = Number(row.points || 50);
  $('#playground-components').value = orderedPieces.map(p => p.code || '').join('\n');
  $('#playground-active').checked = row.is_active !== false;
  $('#playground-form-title').textContent = `Edit Challenge #${row.challenge_number}`;
  $('#playground-save').textContent = '💾 Update Challenge';
  setPlaygroundFormStatus('Editing selected challenge.');
  document.getElementById('playground-admin-form')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function playgroundPayloadFromForm() {
  const lines = String($('#playground-components')?.value || '').split(/\r?\n/).map(x => x.trimEnd()).filter(x => x.trim());
  const pieces = lines.map((code, index) => ({ id: `p${index + 1}`, code }));
  return {
    title: $('#playground-title')?.value.trim(), challenge_number: Number($('#playground-number')?.value || 0),
    question: $('#playground-question')?.value.trim(), difficulty: $('#playground-difficulty')?.value || 'Beginner',
    category: $('#playground-category')?.value.trim() || 'Basics', language: $('#playground-language')?.value.trim() || 'Java',
    points: Math.max(0, Number($('#playground-points')?.value || 0)), is_active: Boolean($('#playground-active')?.checked), pieces
  };
}

async function savePlaygroundChallenge() {
  const payload = playgroundPayloadFromForm();
  if (!payload.title || !payload.question || !payload.challenge_number || payload.pieces.length < 2) {
    setPlaygroundFormStatus('Add a title, question, challenge number, and at least two components.', 'error'); return;
  }
  const id = $('#playground-id')?.value || null;
  const button = $('#playground-save'); if (button) { button.disabled = true; button.textContent = '⟳ Saving…'; }
  try {
    let challengeId = id;
    if (id) {
      const { error } = await supabase.from('playground_challenges').update({...payload, updated_at:new Date().toISOString()}).eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('playground_challenges').insert(payload).select('id').single();
      if (error) throw error; challengeId = data.id;
    }
    const { error: solutionError } = await supabase.from('playground_solutions').upsert({challenge_id:challengeId, correct_order:payload.pieces.map(p => p.id), updated_at:new Date().toISOString()});
    if (solutionError) throw solutionError;
    const successMessage = id ? 'Challenge updated successfully.' : 'Challenge created successfully.';
    resetPlaygroundForm();
    setPlaygroundFormStatus(successMessage, 'success');
    await loadPlaygroundChallenges();
  } catch (error) {
    console.error('[Playground Admin] save failed', error);
    setPlaygroundFormStatus(error.message || 'Could not save challenge.', 'error');
  } finally { if (button) { button.disabled=false; button.textContent=id?'💾 Update Challenge':'💾 Save Challenge'; } }
}

async function togglePlaygroundChallenge(id, active) {
  const { error } = await supabase.from('playground_challenges').update({is_active:!active,updated_at:new Date().toISOString()}).eq('id',id);
  if (error) { alert(`Could not update challenge: ${error.message}`); return; }
  await loadPlaygroundChallenges();
}

async function deletePlaygroundChallenge(id) {
  if (!confirm('Permanently delete this Playground challenge and its progress?')) return;
  const { error } = await supabase.from('playground_challenges').delete().eq('id',id);
  if (error) { alert(`Could not delete challenge: ${error.message}`); return; }
  await loadPlaygroundChallenges();
}

function switchPanel(name) {
  document.querySelectorAll('#admin-extensions .admin-tabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.view === name)
  );
  document.querySelectorAll('#admin-extensions [data-panel]').forEach(p =>
    p.hidden = p.dataset.panel !== name
  );
  if (name === 'streaks') loadStreakRisk();
  if (name === 'notifications') loadAdminNotifications();
  if (name === 'analytics') loadAdminAnalytics();
  if (name === 'playground') loadPlaygroundChallenges();
}

function setAdminSection(name, { updateHash = true } = {}) {
  const valid = ['dashboard','users','questions','playground','units','notes','assignments','ai-insights','ai-homework','ai-assignment','analytics','settings'];
  const section = valid.includes(name) ? name : 'dashboard';
  state.activeSection = section;

  if (updateHash) {
    history.replaceState(null, '', `#${section}`);
  }

  document.querySelectorAll('[data-admin-route]').forEach(button =>
    button.classList.toggle('active', button.dataset.adminRoute === section)
  );

  const hero = $('#admin-hero');
  const stats = $('#admin-stats');
  const registry = $('#user-registry-section');
  const extensions = $('#admin-extensions');

  if (!extensions) return;

  extensions.hidden = section === 'users';

  const catalogView = !['dashboard','assignments','ai-insights','ai-homework','ai-assignment','playground'].includes(section);
  extensions.classList.toggle('catalog-view', catalogView);

  if (section === 'users') {
    hero.hidden = false;
    stats.hidden = false;
    registry.hidden = false;
    switchPanel('overview');
    return;
  }

  registry.hidden = true;

  if (section === 'dashboard') {
    hero.hidden = false;
    stats.hidden = false;
    switchPanel('overview');
    return;
  }

  hero.hidden = true;
  stats.hidden = true;
  switchPanel(section);
}

function initAdminNavigation() {
  document.querySelectorAll('[data-admin-route]').forEach(button => {
    button.addEventListener('click', () => setAdminSection(button.dataset.adminRoute));
  });
  const initial = (window.location.hash || '#dashboard').slice(1).toLowerCase();
  setAdminSection(initial, { updateHash: false });
  window.addEventListener('hashchange', () => {
    setAdminSection((window.location.hash || '#dashboard').slice(1).toLowerCase(), { updateHash: false });
  });
}


function renderQuestionBank() {
  const el = $('#question-bank-admin-content');
  const bank = window.CODE_DETECTIVE_QUESTION_BANK;
  const version = bank?.schemaVersion ?? '—';
  $('#question-bank-version') && ($('#question-bank-version').textContent = `Schema v${version}`);
  if (!el) return;

  const units = Object.values(bank?.units || {});
  if (!units.length) {
    el.innerHTML = '<div class="empty">No question-bank units are currently available.</div>';
    return;
  }

  const rows = units.flatMap(unit => (unit.questions || []).map(q => ({ ...q, unitTitle: unit.title })));
  if (!rows.length) {
    el.innerHTML = '<div class="empty">No questions are currently available.</div>';
    return;
  }

  el.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Unit</th><th>Question</th><th>Marks</th><th>Difficulty</th><th>Topics</th></tr></thead>
        <tbody>${rows.map(q => `
          <tr>
            <td>${esc(q.unitTitle || q.unitId)}</td>
            <td><strong>${esc(q.question)}</strong><div class="admin-muted" style="margin-top:6px">${esc(q.id)}</div></td>
            <td>${Number(q.marks || 0)}</td>
            <td><span class="admin-pill">${esc(q.difficulty || '—')}</span></td>
            <td>${esc((q.topics || []).join(', ') || '—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderUnitCatalog() {
  const el = $('#unit-admin-content');
  const bank = window.CODE_DETECTIVE_QUESTION_BANK;
  if (!el) return;

  const units = Object.values(bank?.units || {});
  if (!units.length) {
    el.innerHTML = '<div class="empty">No academic unit metadata is currently available.</div>';
    return;
  }

  el.innerHTML = `
    <div class="admin-catalog-grid">
      ${units.map(unit => `
        <article class="admin-catalog-card">
          <h3>${esc(unit.title || unit.id)}</h3>
          <p><strong>${esc(unit.id)}</strong> · ${(unit.questions || []).length} structured questions.</p>
          <p style="margin-top:8px">Question schema v${esc(bank?.schemaVersion ?? '—')} · Ready for future unit extensions.</p>
        </article>`).join('')}
    </div>
    <div class="admin-list" style="margin-top:16px">
      <div class="admin-list-item admin-muted">
        The existing case catalog remains owned by the student application. This admin view intentionally does not duplicate or rewrite it.
      </div>
    </div>`;
}

async function loadAdminAnalytics() {
  const el = $('#analytics-admin-content');
  if (el) el.innerHTML = '<div class="admin-muted">Loading live analytics…</div>';

  const { data, error } = await supabase.rpc('admin_analytics');
  if (error) {
    state.analytics = null;
    if (el) el.innerHTML = `<div class="admin-list-item admin-muted">Could not load analytics: ${esc(error.message)}</div>`;
    return;
  }

  state.analytics = data || {};
  renderAdminAnalytics();
}

function renderAdminAnalytics() {
  const el = $('#analytics-admin-content');
  const a = state.analytics || {};
  if (!el) return;

  const daily = Array.isArray(a.completions_by_day) ? a.completions_by_day : [];
  const max = Math.max(1, ...daily.map(row => Number(row.count || 0)));

  el.innerHTML = `
    <div class="admin-grid-2">
      <div class="admin-kpi"><small>Registered users</small><strong>${Number(a.total_users || 0).toLocaleString('en-IN')}</strong><div class="admin-muted">Profiles currently in the database</div></div>
      <div class="admin-kpi"><small>Completed cases</small><strong>${Number(a.completed_cases || 0).toLocaleString('en-IN')}</strong><div class="admin-muted">Completed case-progress records</div></div>
      <div class="admin-kpi"><small>Active · 7 days</small><strong>${Number(a.active_users_7d || 0).toLocaleString('en-IN')}</strong><div class="admin-muted">Users with a completed case in the last seven days</div></div>
      <div class="admin-kpi"><small>Total DXP</small><strong>${Number(a.total_dxp || 0).toLocaleString('en-IN')}</strong><div class="admin-muted">Sum of stored profile DXP values</div></div>
    </div>
    <div class="admin-panel" style="margin-top:16px">
      <div class="admin-panel-head"><div><h3>Case completions · last 14 days</h3><p>Aggregated from case_progress.completed_at.</p></div></div>
      <div class="analytics-chart">
        ${daily.length ? daily.map(row => {
          const count = Number(row.count || 0);
          const width = Math.round((count / max) * 100);
          return `<div class="analytics-row"><span>${esc(row.day)}</span><div class="track"><i style="width:${width}%"></i></div><strong>${count}</strong></div>`;
        }).join('') : '<div class="admin-muted">No completed cases are recorded for this period.</div>'}
      </div>
    </div>`;
  $('#overview-case-count') && ($('#overview-case-count').textContent = Number(a.completed_cases || 0).toLocaleString('en-IN'));
}

function renderSettings() {
  const el = $('#settings-admin-content');
  if (!el) return;
  el.innerHTML = `
    <div class="settings-list">
      <div class="settings-item"><div><strong>Workspace theme</strong><span>Uses the existing Code Detective admin theme preference.</span></div>
        <div class="admin-actions">
          <button type="button" data-admin-theme="system">System</button>
          <button type="button" data-admin-theme="dark">Dark</button>
          <button type="button" data-admin-theme="light">Light</button>
        </div>
      </div>
      <div class="settings-item"><div><strong>Authorization</strong><span>Administrator access is resolved by the secure Supabase is_admin() function.</span></div><span class="admin-chip">Protected</span></div>
      <div class="settings-item"><div><strong>Question bank schema</strong><span>Reusable schema is loaded from the project question-bank module.</span></div><span class="admin-chip">v${esc(window.CODE_DETECTIVE_QUESTION_BANK?.schemaVersion ?? '—')}</span></div>
    </div>`;
  el.querySelectorAll('[data-admin-theme]').forEach(button =>
    button.addEventListener('click', () => applyAdminTheme(button.dataset.adminTheme))
  );
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
    if (show) broadcastPicker.innerHTML = students.map(u => `<label class="recipient-row"><input type="checkbox" data-broadcast-recipient value="${esc(u.id)}"><strong>${esc(getUserName(u))}</strong><small>${esc(u.email || '')}</small></label>`).join('') || '<span class="admin-muted">No matching students.</span>';
  }
  const assignmentPicker = $('#assignment-recipient-picker');
  if (assignmentPicker) {
    const show = assignmentTarget === 'Selected';
    assignmentPicker.hidden = !show;
    if (show) assignmentPicker.innerHTML = students.map(u => `<label class="recipient-row"><input type="checkbox" data-assignment-recipient value="${esc(u.id)}"><strong>${esc(getUserName(u))}</strong><small>${esc(u.email || '')}</small></label>`).join('') || '<span class="admin-muted">No matching students.</span>';
    assignmentPicker.querySelectorAll('[data-assignment-recipient]').forEach(input => input.addEventListener('change', () => {
      const count = $('#assignment-recipient-count');
      if (count) count.textContent = `${document.querySelectorAll('[data-assignment-recipient]:checked').length} students selected.`;
    }));
  }
  const count = $('#assignment-recipient-count');
  if (count) count.textContent = assignmentTarget === 'Selected' ? `${document.querySelectorAll('[data-assignment-recipient]:checked').length} students selected.` : `${getStudentUsers().length} current students will receive this assignment.`;
}

async function checkAdmin() {
  return isCurrentUserAdmin(supabase);
}

async function boot() {
  const { data:{session}, error } = await supabase.auth.getSession();
  if (error || !session) return location.replace('/index.html');
  $('#adminEmail').textContent = session.user.email || 'Administrator';
  if (!(await checkAdmin())) {
    window.location.replace(new URL('home.html', window.location.href).href);
    return;
  }
  initAdminTheme();
  ensureAdminHomeButton();
  ensureAdminExtensions();
  initAdminNotes();
  initAdminNavigation();
  await loadUsers();
  await Promise.all([loadAssignments(), loadAdminNotifications(), loadStreakRisk(), loadAdminAnalytics(), loadAdminNotes()]);
  renderAdminModules();
  setAdminSection((window.location.hash || '#dashboard').slice(1).toLowerCase(), { updateHash: false });
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


let lastGeneratedHomework = null;
let lastGeneratedAssignment = null;

function renderAIGeneratedResult(containerId, result, includeAnswers) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const questions = Array.isArray(result?.questions) ? result.questions : [];
  if (!questions.length) { el.textContent = 'The AI returned no questions. Try a more specific topic.'; return; }
  el.innerHTML = questions.map((q, i) => `
    <div class="ai-q">
      <strong>${i + 1}. ${esc(q.question || '')}</strong>
      ${q.marks ? `<div class="admin-muted">${Number(q.marks)} marks · ${esc(q.difficulty || '')}</div>` : ''}
      ${includeAnswers && q.answer ? `<div style="margin-top:7px"><strong>Answer:</strong> ${esc(q.answer)}</div>` : ''}
      ${q.explanation ? `<div class="admin-muted" style="margin-top:6px">${esc(q.explanation)}</div>` : ''}
    </div>`).join('');
}

async function generateHomeworkForAdmin() {
  const topic=$('#ai-homework-topic')?.value.trim(), subject=$('#ai-homework-subject')?.value.trim() || 'Java Programming';
  const difficulty=$('#ai-homework-difficulty')?.value || 'Medium', count=Math.min(20,Math.max(1,Number($('#ai-homework-count')?.value||5)));
  if(!topic) return alert('Enter a topic first.');
  const btn=$('#ai-generate-homework'); btn.disabled=true; btn.textContent='Generating…';
  try { lastGeneratedHomework=await generateHomework({topic,difficulty,count,subject}); renderAIGeneratedResult('ai-homework-result',lastGeneratedHomework,true); $('#ai-use-homework').disabled=false; $('#ai-send-homework').disabled=false; }
  catch(e) { $('#ai-homework-result').textContent=e.message; }
  finally { btn.disabled=false; btn.textContent='✨ Generate Homework'; }
}

async function generateAssignmentForAdmin() {
  const topic=$('#ai-assignment-topic')?.value.trim(), subject=$('#ai-assignment-subject')?.value.trim() || 'Java Programming';
  const difficulty=$('#ai-assignment-difficulty')?.value || 'Medium', count=Math.min(20,Math.max(1,Number($('#ai-assignment-count')?.value||5)));
  if(!topic) return alert('Enter a topic first.');
  const btn=$('#ai-generate-assignment'); btn.disabled=true; btn.textContent='Generating…';
  try { lastGeneratedAssignment=await generateAssignment({topic,difficulty,count,subject}); renderAIGeneratedResult('ai-assignment-result',lastGeneratedAssignment,false); $('#ai-use-assignment').disabled=false; }
  catch(e) { $('#ai-assignment-result').textContent=e.message; }
  finally { btn.disabled=false; btn.textContent='✨ Generate Assignment Questions'; }
}

function questionsToText(result, includeAnswers) {
  return (result?.questions || []).map((q,i) => {
    const answer = includeAnswers && q.answer ? `\nAnswer: ${q.answer}` : '';
    return `${i+1}. ${q.question}${q.marks ? ` (${q.marks} marks)` : ''}${answer}`;
  }).join('\n\n');
}
async function sendGeneratedHomework() {
  if(!lastGeneratedHomework) return;
  const dueDate=$('#ai-homework-due-date')?.value;
  const dueTime=$('#ai-homework-due-time')?.value || '23:59';
  if(!dueDate) return alert('Choose a homework due date first.');
  $('#assignment-id').value='';
  $('#assignment-title').value = `${lastGeneratedHomework.topic || 'AI Generated'} Homework`;
  $('#assignment-subject').value = lastGeneratedHomework.subject || $('#ai-homework-subject').value || 'Java Programming';
  $('#assignment-difficulty').value = lastGeneratedHomework.difficulty || $('#ai-homework-difficulty').value;
  $('#assignment-due-date').value = dueDate;
  $('#assignment-due-time').value = dueTime;
  $('#assignment-max-marks').value = Math.max(1,(lastGeneratedHomework.questions||[]).reduce((n,q)=>n+Number(q.marks||1),0));
  $('#assignment-description').value = `AI-generated homework on ${lastGeneratedHomework.topic || 'the selected topic'}.`;
  $('#assignment-instructions').value = questionsToText(lastGeneratedHomework,true);
  $('#assignment-target').value = 'Students';
  renderRecipientPickers();
  await saveAssignmentFromForm();
}

function useGeneratedHomework() {
  if(!lastGeneratedHomework) return;
  $('#assignment-title').value = `${lastGeneratedHomework.topic || 'AI Generated'} Homework`;
  $('#assignment-subject').value = lastGeneratedHomework.subject || $('#ai-homework-subject').value || 'Java Programming';
  $('#assignment-difficulty').value = lastGeneratedHomework.difficulty || $('#ai-homework-difficulty').value;
  $('#assignment-description').value = `AI-generated homework on ${lastGeneratedHomework.topic || 'the selected topic'}.`;
  $('#assignment-instructions').value = questionsToText(lastGeneratedHomework,true);
  switchPanel('assignments');
}
function useGeneratedAssignment() {
  if(!lastGeneratedAssignment) return;
  $('#assignment-title').value = `${lastGeneratedAssignment.topic || 'AI Generated'} Assignment`;
  $('#assignment-subject').value = lastGeneratedAssignment.subject || $('#ai-assignment-subject').value || 'Java Programming';
  $('#assignment-difficulty').value = lastGeneratedAssignment.difficulty || $('#ai-assignment-difficulty').value;
  $('#assignment-description').value = `AI-generated assignment on ${lastGeneratedAssignment.topic || 'the selected topic'}.`;
  $('#assignment-instructions').value = questionsToText(lastGeneratedAssignment,false);
  switchPanel('assignments');
}

async function saveAssignmentFromForm() {
  const saveButton = $('#assignment-save-btn');
  const originalLabel = saveButton?.textContent || '💾 Save assignment';
  const payload=assignmentPayloadFromForm();
  if(!payload.title||!payload.subject||!payload.due_date||!payload.due_time||payload.max_marks<=0){ alert('Please complete the required assignment fields.'); return; }
  const recipientIds=selectedAssignmentRecipients();
  if(!recipientIds.length){ alert('Select at least one student.'); return; }
  const { data: sessionData }=await supabase.auth.getSession(); const adminId=sessionData?.session?.user?.id; if(!adminId){alert('Admin session expired.');return;}
  let assignmentId=$('#assignment-id')?.value || null;
  if(saveButton){saveButton.disabled=true;saveButton.textContent='⟳ Saving…';}
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
    resetAssignmentForm(); await loadAssignments(); renderAdminModules();
    if(saveButton){saveButton.textContent='✓ Assignment saved';}
    setTimeout(()=>{if(saveButton){saveButton.disabled=false;saveButton.textContent=originalLabel;}},900);
  } catch(error){ console.error('[Assignments] Save failed:',error); if(saveButton){saveButton.disabled=false;saveButton.textContent=originalLabel;} alert(`Assignment could not be saved. ${error?.message||'Please run FINAL_UPGRADE.sql in Supabase first.'}`); }
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
    try {
      const { data: session } = await supabase.auth.getSession();
      await fetch(
  'https://mbtwdhadyonlirainmxm.supabase.co/functions/v1/send-push', {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.session?.access_token || ''}`},
        body:JSON.stringify({title,message,type,recipientIds:recipients})
      });
    } catch(pushError) {
      console.warn('[Notifications] Native push delivery unavailable; in-app notification was still saved.', pushError);
    }
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
  const profileIds = [...new Set(
    rows.flatMap(row => [row.sender_id, row.recipient_id]).filter(Boolean)
  )];

  // Prefer the already-loaded admin user registry for notification identity.
  // admin_list_users + role/profile enrichment runs before this function and
  // already contains the display name, username and email needed here. This
  // avoids failing the entire name lookup when the profiles table is protected
  // by RLS for the current admin session.
  const profileMap = new Map();
  (state.users || []).forEach(user => {
    if (user?.id) profileMap.set(user.id, user);
  });

  // Fill any identities that are not present in the registry. Keep this query
  // best-effort: notification history must still render even when a profile
  // cannot be read because of an RLS/schema restriction.
  const missingProfileIds = profileIds.filter(id => !profileMap.has(id));
  if (missingProfileIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id,display_name,username,email')
      .in('id', missingProfileIds);

    if (!profileError) {
      (profiles || []).forEach(profile => profileMap.set(profile.id, profile));
    } else {
      console.warn(
        '[Notifications] Profile enrichment unavailable; using registry/session fallback:',
        profileError.message
      );
    }
  }

  // Final fallback for the currently authenticated administrator. This makes
  // sure the sender is never shown as "Unknown user" merely because their
  // profile row is hidden by RLS.
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    if (currentUser?.id && !profileMap.has(currentUser.id)) {
      const registryUser = (state.users || []).find(user => user.id === currentUser.id);
      profileMap.set(currentUser.id, {
        id: currentUser.id,
        email: currentUser.email || registryUser?.email || '',
        ...(registryUser || {})
      });
    }
  } catch (sessionError) {
    console.warn('[Notifications] Could not resolve current admin session:', sessionError?.message || sessionError);
  }

  state.notifications = rows.map(row => ({
    ...row,
    sender: profileMap.get(row.sender_id) || null,
    recipient: profileMap.get(row.recipient_id) || null
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
async function loadAdminNotes() {
  const el = $('#admin-notes-list');
  if (!el) return;
  el.innerHTML = '<div class="admin-muted">Loading notes…</div>';
  const { data, error } = await supabase.from('global_notes').select('id,title,subject,file_name,created_at,updated_at').order('updated_at', { ascending: false });
  if (error) {
    el.innerHTML = `<div class="admin-muted">Could not load notes: ${esc(error.message)}</div>`;
    return;
  }
  const rows = data || [];
  if (!rows.length) {
    el.innerHTML = '<div class="admin-muted">No shared notes published yet.</div>';
    return;
  }
  el.innerHTML = rows.map(n => `<div class="notes-admin-item"><div><strong>${esc(n.title)}</strong><span>${esc(n.subject || 'General')}${n.file_name ? ` · ${esc(n.file_name)}` : ''}</span></div><button type="button" class="admin-btn danger" data-delete-global-note="${esc(n.id)}">Delete</button></div>`).join('');
  el.querySelectorAll('[data-delete-global-note]').forEach(btn => btn.addEventListener('click', () => deleteAdminNote(btn.dataset.deleteGlobalNote)));
}

async function loadNoteFileText(file) {
  if (!file) return '';
  const name = file.name.toLowerCase();
  if (/\.(txt|md|markdown|csv|json|html?|css|js|ts|tsx|jsx|java|py|c|cpp|h|hpp|sql|xml|yaml|yml|log)$/i.test(name) || file.type.startsWith('text/')) {
    return file.text();
  }
  if (name.endsWith('.pdf')) {
    await loadAdminExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    const pdfjsLib = globalThis.pdfjsLib;
    if (!pdfjsLib) throw new Error('PDF parser could not be initialized.');
    if (pdfjsLib.GlobalWorkerOptions) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let i=1; i<=pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str || '').join(' '));
    }
    return pages.join('\n\n');
  }
  if (name.endsWith('.docx')) {
    await loadAdminExternalScript('https://unpkg.com/mammoth@1.9.0/mammoth.browser.min.js');
    if (!globalThis.mammoth) throw new Error('DOCX parser could not be initialized.');
    const result = await globalThis.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value || '';
  }
  if (name.endsWith('.doc')) throw new Error('Legacy .DOC files cannot be reliably extracted in the browser. Please convert it to DOCX or PDF first.');
  throw new Error('Unsupported file type.');
}

async function loadAdminExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load document parser: ${src}`));
    document.head.appendChild(script);
  });
}

async function publishAdminNote(event) {
  event.preventDefault();
  const status = $('#admin-note-status');
  const button = $('#admin-note-save');
  const titleEl = $('#admin-note-title');
  const subjectEl = $('#admin-note-subject');
  const contentEl = $('#admin-note-content');
  const fileEl = $('#admin-note-file');
  const title = titleEl.value.trim();
  const subject = subjectEl.value.trim() || 'General';
  const file = fileEl.files?.[0];
  let content = contentEl.value.trim();

  if (!title && file) titleEl.value = file.name.replace(/\.[^/.]+$/, '');
  const finalTitle = title || titleEl.value.trim();
  if (!finalTitle) { status.textContent = 'Enter a note title or choose a file.'; status.className = 'notes-admin-status error'; return; }
  if (file) {
    try { content = (await loadNoteFileText(file)).trim(); }
    catch (error) { status.textContent = error.message || String(error); status.className = 'notes-admin-status error'; return; }
  }
  if (!content) { status.textContent = 'Add a file or paste note content before publishing.'; status.className = 'notes-admin-status error'; return; }

  button.disabled = true;
  button.textContent = 'Publishing…';
  status.textContent = 'Saving to the shared Notes Library…';
  status.className = 'notes-admin-status';
  try {
    const { error } = await supabase.from('global_notes').insert({ title: finalTitle, subject, content, file_name: file?.name || null });
    if (error) throw error;
    status.textContent = '✓ Published. Students will see this note in Available Notes.';
    status.className = 'notes-admin-status success';
    titleEl.value = ''; subjectEl.value = 'General'; contentEl.value = ''; fileEl.value = '';
    await loadAdminNotes();
  } catch (error) {
    status.textContent = `Could not publish note: ${error.message}`;
    status.className = 'notes-admin-status error';
  } finally {
    button.disabled = false;
    button.textContent = '＋ Publish Note';
  }
}

async function deleteAdminNote(id) {
  if (!confirm('Delete this shared note for all students?')) return;
  const { error } = await supabase.from('global_notes').delete().eq('id', id);
  if (error) return alert(`Note could not be deleted: ${error.message}`);
  await loadAdminNotes();
}

function initAdminNotes() {
  $('#admin-note-form')?.addEventListener('submit', publishAdminNote);
  $('#admin-note-clear')?.addEventListener('click', () => {
    $('#admin-note-title').value = '';
    $('#admin-note-subject').value = 'General';
    $('#admin-note-content').value = '';
    $('#admin-note-file').value = '';
    $('#admin-note-status').textContent = '';
    $('#admin-note-status').className = 'notes-admin-status';
  });
  $('#admin-note-file')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file && !$('#admin-note-title').value.trim()) $('#admin-note-title').value = file.name.replace(/\.[^/.]+$/, '');
  });
}

function renderAdminModules(){renderAssignmentList();renderNotificationHistory();renderStreakRisk();$('#overview-assignment-count')&&($('#overview-assignment-count').textContent=state.assignments.length);$('#overview-notification-count')&&($('#overview-notification-count').textContent=state.notifications.length);$('#overview-risk-count')&&($('#overview-risk-count').textContent=state.atRisk.length);if(state.analytics)renderAdminAnalytics();}

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
