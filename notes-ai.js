import { supabase } from './supabase.js';
import { askNotesTutor } from './ai-client.js';

const state = {
  notes: [],
  selectedNoteId: null,
  history: [],
  busy: false,
  localStorageKey: null
};

const $ = (id) => document.getElementById(id);
const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function noteContent() {
  return state.notes.find(n => n.id === state.selectedNoteId) || null;
}

function getLocalNotes() {
  if (!state.localStorageKey) return [];
  try {
    const raw = localStorage.getItem(state.localStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalNotes(notes) {
  if (!state.localStorageKey) return;
  localStorage.setItem(state.localStorageKey, JSON.stringify(notes));
}

function makeLocalNote({ title, subject, content, fileName = '' }) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    subject: subject || 'General',
    content,
    file_name: fileName,
    source: 'local',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function renderNotesList() {
  const el = $('notes-list');
  if (!el) return;

  if (!state.notes.length) {
    el.innerHTML = `<div class="notes-empty">No notes available yet. Add a note or import a local file.</div>`;
  } else {
    el.innerHTML = state.notes.map(n => `
      <button class="note-list-item ${n.id === state.selectedNoteId ? 'active' : ''}" data-note-id="${esc(n.id)}">
        <strong>${esc(n.title)}</strong>
        <span>${esc(n.subject || 'General')}${n.source === 'admin' ? ' • Code Detective Library' : n.source === 'local' ? ' • Local' : ' • My Note'}</span>
      </button>`).join('');

    el.querySelectorAll('[data-note-id]').forEach(btn => {
      btn.addEventListener('click', () => selectNote(btn.dataset.noteId));
    });
  }

  renderNotesSelect();
}

function renderNotesSelect() {
  const select = $('notes-select');
  if (!select) return;

  if (!state.notes.length) {
    select.innerHTML = `<option value="">No notes available</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `
    <option value="">Select a note…</option>
    ${state.notes.map(n => `
      <option value="${esc(n.id)}" ${n.id === state.selectedNoteId ? 'selected' : ''}>
        ${esc(n.title)}
      </option>`).join('')}
  `;
}

function renderSelectedNote() {
  const note = noteContent();
  $('selected-note-title').textContent = note?.title || 'Select a note';
  $('selected-note-subject').textContent = note
    ? `${note.subject || 'General'}${note.file_name ? ` • ${note.file_name}` : ''}`
    : '';
  $('selected-note-content').textContent = note?.content || 'Choose a note to preview its content and start tutoring.';

  const download = $('download-note-btn');
  if (download) download.disabled = !note;

  const context = $('tutor-note-context');
  if (context) {
    context.innerHTML = note
      ? `<span>LEARNING FROM</span><strong>${esc(note.title)}</strong><small>${esc(note.subject || 'General')}</small>`
      : '<span>NOTE</span><strong>Select a note above to begin</strong>';
  }
}

function renderChat() {
  const el = $('tutor-chat');
  if (!el) return;

  if (!state.history.length) {
    el.innerHTML = `<div class="tutor-welcome"><strong>🧠 Your AI Tutor</strong><p>Select a note, then ask me to explain a concept, simplify a paragraph, make examples, quiz you, or clear a doubt from that note.</p></div>`;
    return;
  }

  el.innerHTML = state.history.map(m => `
    <div class="tutor-message ${m.role === 'user' ? 'user' : 'assistant'}">
      <div class="tutor-message-role">${m.role === 'user' ? 'You' : 'AI Tutor'}</div>
      <div>${esc(m.content).replace(/\n/g,'<br>')}</div>
    </div>`).join('');

  el.scrollTop = el.scrollHeight;
}

async function loadNotes() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  state.localStorageKey = `code-detective-local-notes:${session.user.id}`;
  const localNotes = getLocalNotes();

  const [{ data: globalData, error: globalError }, { data: ownData, error: ownError }] = await Promise.all([
    supabase.from('global_notes').select('id,title,content,subject,file_name,created_at,updated_at').order('updated_at', { ascending: false }),
    supabase.from('student_notes').select('id,title,content,subject,created_at,updated_at').eq('user_id', session.user.id).order('updated_at', { ascending: false })
  ]);

  const globalNotes = (globalError ? [] : (globalData || [])).map(n => ({ ...n, source: 'admin' }));
  const ownNotes = (ownError ? [] : (ownData || [])).map(n => ({ ...n, source: 'account' }));
  const fallbackNotes = localNotes.map(n => ({ ...n, source: 'local' }));

  state.notes = [...globalNotes, ...ownNotes, ...fallbackNotes]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

  if (!state.selectedNoteId && state.notes[0]) state.selectedNoteId = state.notes[0].id;
  if (state.selectedNoteId && !state.notes.some(n => n.id === state.selectedNoteId)) {
    state.selectedNoteId = state.notes[0]?.id || null;
  }

  renderNotesList();
  renderSelectedNote();

  const status = $('notes-status');
  if (status) {
    if (globalError) {
      status.textContent = 'Shared notes are not configured yet. Run AI_NOTES_SETUP.sql to enable the admin Notes Library.';
      status.className = 'notes-status warning';
    } else if (ownError) {
      status.textContent = 'Showing shared study notes. Personal notes are currently unavailable.';
      status.className = 'notes-status warning';
    } else {
      status.textContent = '';
      status.className = 'notes-status';
    }
  }
}

function resetNoteEditor() {
  $('note-title-input').value = '';
  $('note-subject-input').value = '';
  $('note-content-input').value = '';
}

async function saveNote() {
  const title = $('note-title-input').value.trim();
  const subject = $('note-subject-input').value.trim() || 'General';
  const content = $('note-content-input').value.trim();

  if (!title || !content) {
    return alert('Enter a note title and note content.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return alert('Please sign in first.');

  const { data, error } = await supabase.from('student_notes').insert({
    user_id: session.user.id, title, subject, content
  }).select().single();

  if (error) {
    // Graceful local fallback so users can still use Notes while the remote
    // schema is being configured.
    const localNote = makeLocalNote({ title, subject, content });
    const localNotes = getLocalNotes();
    localNotes.unshift(localNote);
    setLocalNotes(localNotes);
    state.notes.unshift(localNote);
    state.selectedNoteId = localNote.id;
  } else {
    state.notes.unshift(data);
    state.selectedNoteId = data.id;
  }

  resetNoteEditor();
  state.history = [];
  renderNotesList();
  renderSelectedNote();
  renderChat();
}


async function loadExternalScript(src) {
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

async function extractPdfText(file) {
  await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  const pdfjsLib = globalThis.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF parser could not be initialized.');
  }
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  }
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str || '').join(' '));
  }
  return pages.join('\\n\\n');
}

async function extractDocxText(file) {
  await loadExternalScript('https://unpkg.com/mammoth@1.9.0/mammoth.browser.min.js');
  if (!globalThis.mammoth) {
    throw new Error('DOCX parser could not be initialized.');
  }
  const result = await globalThis.mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer()
  });
  return result.value || '';
}

async function extractDocText(file) {
  // Legacy .doc is a binary Word format. Browsers do not have a reliable
  // built-in parser for it. We accept it in the picker, but ask the user to
  // convert it to DOCX/PDF for text extraction.
  throw new Error(
    'Legacy .DOC files are accepted, but this browser cannot reliably extract their text. Please save the document as .DOCX or PDF and import that version.'
  );
}

async function extractImportedFileText(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) return extractPdfText(file);
  if (name.endsWith('.docx')) return extractDocxText(file);
  if (name.endsWith('.doc')) return extractDocText(file);

  return file.text();
}

async function importLocalFile(file) {
  if (!file) return;

  const supported = /\.(txt|md|markdown|csv|json|html?|css|js|ts|tsx|jsx|java|py|c|cpp|h|hpp|sql|xml|yaml|yml|log|pdf|docx|doc)$/i.test(file.name)
    || (file.type && (
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ));

  if (!supported) {
    return alert('Unsupported file. Choose TXT, MD, CSV, JSON, HTML, CSS, JS, Java, Python, SQL, XML, YAML, PDF, DOCX, or DOC.');
  }

  try {
    const content = await extractImportedFileText(file);
    if (!content.trim()) return alert('The selected file is empty.');

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    $('note-title-input').value = baseName;
    $('note-subject-input').value = 'Imported Note';
    $('note-content-input').value = content;

    // Import immediately into the Notes list so the user can select it
    // without having to copy/paste anything.
    await saveNote();
  } catch (error) {
    alert(`Could not read the selected file: ${error.message || error}`);
  } finally {
    const input = $('note-file-input');
    if (input) input.value = '';
  }
}

function downloadSelectedNote() {
  const note = noteContent();
  if (!note) return alert('Select a note first.');

  const safeTitle = String(note.title || 'code-detective-note')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'code-detective-note';

  const text = `${note.title || 'Code Detective Note'}\n${'='.repeat(Math.min(80, Math.max(20, (note.title || '').length)))}\nSubject: ${note.subject || 'General'}\n\n${note.content || ''}\n`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function askTutor() {
  const note = noteContent();
  const question = $('tutor-question').value.trim();

  if (!note) return alert('Select a note first.');
  if (!question || state.busy) return;

  state.busy = true;
  $('tutor-send').disabled = true;
  const status = $('tutor-status');
  if (status) status.innerHTML = '<span></span> Thinking…';
  state.history.push({ role:'user', content:question });
  renderChat();
  $('tutor-question').value = '';

  try {
    const result = await askNotesTutor({
      noteTitle: note.title,
      noteContent: note.content,
      question,
      history: state.history.slice(-8)
    });
    state.history.push({ role:'assistant', content: result.answer || 'I could not generate an answer.' });
    renderChat();
  } catch (error) {
    state.history.pop();
    renderChat();
    alert(error.message);
  } finally {
    state.busy = false;
    $('tutor-send').disabled = false;
    if (status) status.innerHTML = '<span></span> Ready';
    $('tutor-question').focus();
  }
}

function selectNote(id) {
  if (!id) return;
  state.selectedNoteId = id;
  state.history = [];
  renderNotesList();
  renderSelectedNote();
  renderChat();
}

function injectStyles() {
  if ($('notes-ai-styles')) return;

  const s = document.createElement('style');
  s.id = 'notes-ai-styles';
  s.textContent = `
    #screen-notes .notes-workspace{display:grid;gap:18px;max-width:1180px;margin:0 auto}
    #screen-notes .notes-panel{background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border:1px solid var(--border);border-radius:20px;padding:20px;box-shadow:0 14px 40px rgba(0,0,0,.16)}
    #screen-notes .notes-selector-card{padding:20px 22px}
    #screen-notes .notes-selector-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:4px}
    #screen-notes .notes-selector-heading h2{font-size:18px;font-weight:900;letter-spacing:-.3px}
    #screen-notes .notes-eyebrow{font-size:10px;line-height:1.2;text-transform:uppercase;letter-spacing:.13em;color:var(--cyan);font-weight:900;margin-bottom:5px}
    #screen-notes .notes-selector-icon{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--border);border-radius:12px;background:var(--surface-subtle);color:var(--cyan);font-size:20px;font-weight:900}
    #screen-notes .notes-select-wrap{display:grid;gap:7px;margin:12px 0 0}
    #screen-notes .notes-select-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);font-weight:800}
    #screen-notes .notes-select{appearance:none;width:100%;box-sizing:border-box;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border);border-radius:13px;padding:13px 44px 13px 14px;font:600 14px var(--font-ui);cursor:pointer;outline:none;background-image:linear-gradient(45deg,transparent 50%,var(--text-muted) 50%),linear-gradient(135deg,var(--text-muted) 50%,transparent 50%);background-position:calc(100% - 20px) 54%,calc(100% - 14px) 54%;background-size:6px 6px,6px 6px;background-repeat:no-repeat;transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease}
    #screen-notes .notes-select:hover{border-color:rgba(245,185,66,.45)}
    #screen-notes .notes-select:focus{border-color:rgba(245,185,66,.75);box-shadow:0 0 0 4px rgba(245,185,66,.09)}
    #screen-notes .notes-select:disabled{opacity:.65;cursor:not-allowed}
    #screen-notes .selected-note-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px}
    #screen-notes .notes-download-btn{white-space:nowrap;padding:9px 12px;min-height:38px;font-size:11px}
    #screen-notes .selected-note-meta{min-width:0}
    #screen-notes .selected-note-preview{margin-top:16px;padding:16px;border:1px solid var(--border);border-radius:15px;background:rgba(0,0,0,.08)}
    #screen-notes .selected-note-meta{display:flex;align-items:center;gap:11px}
    #screen-notes .selected-note-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(245,185,66,.12);border:1px solid rgba(245,185,66,.25);color:var(--cyan);font-weight:900}
    #screen-notes .panel-card-title{font-size:15px;font-weight:850;color:var(--text-primary)}
    #screen-notes .selected-note-subject{font-size:11px;color:var(--text-muted);margin-top:2px}
    #screen-notes .selected-note{white-space:pre-wrap;line-height:1.65;max-height:210px;overflow:auto;margin-top:14px;padding-top:13px;border-top:1px solid var(--border);color:var(--text-secondary);font-size:13px}
    #screen-notes .tutor-panel{padding:22px}
    #screen-notes .tutor-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}
    #screen-notes .tutor-title-wrap{display:flex;align-items:center;gap:12px;min-width:0}
    #screen-notes .tutor-avatar{display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,rgba(245,185,66,.2),rgba(79,169,255,.12));border:1px solid rgba(245,185,66,.3);color:var(--cyan);font-size:20px;box-shadow:0 8px 24px rgba(245,185,66,.08)}
    #screen-notes .tutor-title{font-size:18px;font-weight:900;letter-spacing:-.3px}
    #screen-notes .tutor-subtitle{font-size:11px;color:var(--text-muted);margin-top:2px}
    #screen-notes .tutor-status{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid var(--border);border-radius:999px;color:var(--text-muted);font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
    #screen-notes .tutor-status span{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 9px rgba(56,211,159,.5)}
    #screen-notes .tutor-note-context{display:flex;align-items:center;gap:8px;min-height:38px;padding:9px 12px;margin-bottom:12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-subtle)}
    #screen-notes .tutor-note-context span{font-size:9px;letter-spacing:.1em;font-weight:900;color:var(--cyan)}
    #screen-notes .tutor-note-context strong{font-size:12px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #screen-notes .tutor-note-context small{font-size:10px;color:var(--text-muted);margin-left:auto;white-space:nowrap}
    #screen-notes .tutor-chat{height:360px;min-height:260px;overflow:auto;display:grid;align-content:start;gap:10px;padding:5px 4px 12px;scroll-behavior:smooth}
    #screen-notes .tutor-message{max-width:min(82%,760px);padding:12px 14px;border-radius:15px;line-height:1.6;font-size:13px;animation:fade-in-up .2s ease}
    #screen-notes .tutor-message.user{justify-self:end;background:rgba(245,185,66,.11);border:1px solid rgba(245,185,66,.25);border-bottom-right-radius:5px}
    #screen-notes .tutor-message.assistant{justify-self:start;background:var(--surface-subtle);border:1px solid var(--border);border-bottom-left-radius:5px}
    #screen-notes .tutor-message-role{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:5px;font-weight:900}
    #screen-notes .tutor-welcome{padding:28px 20px;text-align:center;color:var(--text-muted);border:1px dashed var(--border);border-radius:15px;background:rgba(255,255,255,.015);align-self:center}
    #screen-notes .tutor-welcome strong{display:block;color:var(--text-primary);font-size:14px;margin-bottom:5px}
    #screen-notes .tutor-welcome p{max-width:620px;margin:0 auto;font-size:12px;line-height:1.6}
    #screen-notes .tutor-suggestions{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 11px}
    #screen-notes .tutor-chip{border:1px solid var(--border);background:var(--surface-subtle);color:var(--text-secondary);border-radius:999px;padding:7px 11px;font:600 11px var(--font-ui);cursor:pointer;transition:transform .15s ease,border-color .15s ease,background .15s ease,color .15s ease}
    #screen-notes .tutor-chip:hover{transform:translateY(-1px);border-color:rgba(245,185,66,.5);background:rgba(245,185,66,.08);color:var(--text-primary)}
    #screen-notes .tutor-compose{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}
    #screen-notes .tutor-input-wrap{position:relative}
    #screen-notes .tutor-input{width:100%;min-height:54px;max-height:150px;box-sizing:border-box;resize:vertical;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border);border-radius:13px;padding:12px 13px 27px;font:500 13px/1.5 var(--font-ui);outline:none;transition:border-color .2s ease,box-shadow .2s ease}
    #screen-notes .tutor-input:focus{border-color:rgba(245,185,66,.7);box-shadow:0 0 0 4px rgba(245,185,66,.08)}
    #screen-notes .tutor-input::placeholder{color:var(--text-muted)}
    #screen-notes .tutor-hint{position:absolute;right:11px;bottom:7px;font-size:9px;color:var(--text-muted);pointer-events:none}
    #screen-notes .notes-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:54px;border:1px solid rgba(245,185,66,.45);background:linear-gradient(135deg,rgba(245,185,66,.18),rgba(245,185,66,.08));color:var(--text-primary);border-radius:13px;padding:0 17px;font:800 12px var(--font-ui);cursor:pointer;transition:transform .15s ease,border-color .2s ease,box-shadow .2s ease,opacity .2s ease}
    #screen-notes .notes-btn:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(245,185,66,.8);box-shadow:0 9px 24px rgba(245,185,66,.1)}
    #screen-notes .notes-btn:active:not(:disabled){transform:translateY(0)}
    #screen-notes .notes-btn:disabled{opacity:.5;cursor:not-allowed}
    #screen-notes .notes-status{font-size:12px;padding:9px 10px;border-radius:10px;border:1px solid var(--border);color:var(--text-muted);margin-bottom:12px}
    @media(max-width:700px){
      #screen-notes .notes-panel{padding:16px}
      #screen-notes .tutor-header{align-items:flex-start}
      #screen-notes .tutor-status{display:none}
      #screen-notes .tutor-chat{height:320px}
      #screen-notes .tutor-compose{grid-template-columns:1fr}
      #screen-notes .tutor-send{width:100%}
      #screen-notes .tutor-hint{display:none}
      #screen-notes .tutor-note-context small{display:none}
    }
  `
  document.head.appendChild(s);
}

function initNotesTutor() {
  injectStyles();

  $('save-note-btn')?.addEventListener('click', saveNote);
  $('note-file-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    const nameEl = $('selected-file-name');
    if (nameEl) nameEl.textContent = file ? `Selected: ${file.name}` : 'Import TXT, MD, PDF, DOCX or DOC notes from your device.';
    if (file) importLocalFile(file);
  });
  $('notes-select')?.addEventListener('change', e => selectNote(e.target.value));
  $('tutor-send')?.addEventListener('click', askTutor);
  $('download-note-btn')?.addEventListener('click', downloadSelectedNote);
  $('tutor-question')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askTutor();
    }
  });
  document.querySelectorAll('[data-tutor-prompt]').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = $('tutor-question');
      if (!input) return;
      input.value = chip.dataset.tutorPrompt || '';
      input.focus();
    });
  });

  loadNotes();
}

window.CodeDetectiveNotes = { initNotesTutor, loadNotes };
