import { supabase } from './supabase.js';
import { askNotesTutor, getLearningProfile } from './ai-client.js';

const state = {
  notes: [],
  selectedNoteId: null,
  history: [],
  busy: false,
  localStorageKey: null,
  profile: null,
  lastTutorResult: null,
  reader: { noteId: null, pages: [], page: 0, zoom: 1, query: '' }
};

const $ = (id) => document.getElementById(id);
const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function noteContent() {
  return state.notes.find(n => n.id === state.selectedNoteId) || null;
}

function findRelevantNotes(question, selected) {
  const words = [...new Set(String(question || '').toLowerCase().split(/[^a-z0-9+#.]+/).filter(w => w.length >= 3))];
  if (!words.length) return selected ? [selected] : [];
  const scored = state.notes.map(note => {
    const haystack = `${note.title || ''} ${note.subject || ''} ${note.content || ''}`.toLowerCase();
    const score = words.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0) + (note.id === selected?.id ? 1.5 : 0);
    return { note, score };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0,3).map(x => x.note);
  return scored.length ? scored : (selected ? [selected] : []);
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
  const read = $('read-note-btn');
  if (read) read.disabled = !note;

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
    el.innerHTML = `<div class="tutor-welcome"><strong>🧠 Your Programming Tutor</strong><p>Ask about the selected material, explain code, debug an error, or practice a concept. I’ll teach first, then give you a small challenge when useful.</p></div>`;
    return;
  }

  el.innerHTML = state.history.map(m => `
    <div class="tutor-message ${m.role === 'user' ? 'user' : 'assistant'}">
      <div class="tutor-message-role">${m.role === 'user' ? 'You' : 'AI Tutor'}</div>
      <div>${esc(m.content).replace(/\n/g,'<br>')}</div>
    </div>`).join('');

  if (state.lastTutorResult?.practice_question) {
    const r = state.lastTutorResult;
    el.insertAdjacentHTML('beforeend', `<div class="tutor-learning-card">
      <div class="tutor-learning-head"><span>🎯 PRACTICE</span><small>${esc(r.topic || 'Concept check')}</small></div>
      <strong>${esc(r.practice_question)}</strong>
      ${r.next_step ? `<p><b>Next step:</b> ${esc(r.next_step)}</p>` : ''}
    </div>`);
  }
  el.scrollTop = el.scrollHeight;
}

async function recordLearningEvent(eventType, result, question, note) {
  try {
    await supabase.rpc('record_learning_event', {
      p_event_type: eventType,
      p_topic: result?.topic || null,
      p_note_id: note?.source === 'admin' || note?.source === 'account' ? note.id : null,
      p_note_title: note?.title || null,
      p_question: question || null,
      p_outcome: result?.teaching_mode || null,
      p_metadata: {
        note_grounded: Boolean(result?.note_grounded),
        skill_level: result?.skill_level || null,
        common_mistake: result?.common_mistake || null
      }
    });
  } catch (error) {
    console.debug('[Learning telemetry] event not recorded:', error?.message || error);
  }
}

function renderLearningProfile() {
  const el = $('tutor-learning-profile');
  if (!el) return;
  const p = state.profile || {};
  const topics = Array.isArray(p.topics) ? p.topics : [];
  if (!topics.length) {
    el.innerHTML = `<span class="profile-label">LEARNING SIGNAL</span><span>Ask a few programming questions and your focus areas will appear here.</span>`;
    return;
  }
  el.innerHTML = `<span class="profile-label">YOUR CURRENT FOCUS</span>${topics.slice(0,4).map(t => `<span class="profile-topic">${esc(t.topic)} <b>${Number(t.questions || 0)}×</b></span>`).join('')}`;
}

async function loadLearningProfile() {
  try {
    const result = await getLearningProfile();
    state.profile = result?.profile || null;
    renderLearningProfile();
  } catch (_) {
    // The tutor remains fully usable even if the optional intelligence table has not been migrated yet.
  }
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

function safeNoteFilename(note) {
  return String(note?.title || 'code-detective-note')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'code-detective-note';
}

function notePlainText(note) {
  return `${note?.title || 'Code Detective Note'}\n${'='.repeat(Math.min(80, Math.max(20, String(note?.title || '').length)))}\nSubject: ${note?.subject || 'General'}\n\n${note?.content || ''}\n`;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function openDownloadChooser() {
  const note = noteContent();
  if (!note) return alert('Select a note first.');
  const overlay = $('notes-download-overlay');
  const subtitle = $('notes-download-subtitle');
  if (subtitle) subtitle.textContent = `Export “${note.title || 'Selected note'}” in the format that fits your workflow.`;
  if (overlay) {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('notes-format-grid')?.querySelector('button')?.focus(), 60);
  }
}

function closeDownloadChooser() {
  const overlay = $('notes-download-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.notification-detail-overlay.active')) document.body.style.overflow = '';
}

async function loadExportLibrary(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) {
      if (src.includes('jspdf') && globalThis.jspdf?.jsPDF) return resolve();
      if (src.includes('docx') && globalThis.docx?.Document) return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('The document exporter could not be loaded. Please check your connection and try again.'));
    document.head.appendChild(script);
  });
}


// Offline DOCX/PDF exporters. These do not depend on a CDN, so exporting
// continues to work when external libraries are blocked or unavailable.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(v) {
  return new Uint8Array([v & 255, (v >>> 8) & 255]);
}
function u32(v) {
  return new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
}
function concatBytes(...arrays) {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function makeZip(files) {
  const encoder = new TextEncoder();
  const local = [];
  const central = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    const crc = crc32(data);
    const localHeader = concatBytes(
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      nameBytes
    );
    local.push(localHeader, data);

    const centralHeader = concatBytes(
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
    );
    central.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralBytes = concatBytes(...central);
  const localBytes = concatBytes(...local);
  const end = concatBytes(
    u32(0x06054b50), u16(0), u16(0), u16(Object.keys(files).length),
    u16(Object.keys(files).length), u32(centralBytes.length), u32(localBytes.length), u16(0)
  );
  return concatBytes(localBytes, centralBytes, end);
}

function xmlEscape(value) {
  return String(value ?? '').replace(/[<>&'"]/g, c => ({
    '<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;'
  }[c]));
}

function exportNoteAsDocx(note, filename) {
  const title = xmlEscape(note.title || 'Code Detective Note');
  const subject = xmlEscape(note.subject || 'General');
  const source = String(note.content || '').replace(/\r\n?/g, '\n');
  const lines = source.split('\n');

  const paragraphForLine = (line) => {
    const trimmed = line.trim();
    const isHeading = /^#{1,3}\s+/.test(trimmed);
    const isBullet = /^[-*•]\s+/.test(trimmed);
    const isNumbered = /^\d+[.)]\s+/.test(trimmed);
    const isCode = /^( {2,}|\t)/.test(line) || /```/.test(trimmed);
    const clean = xmlEscape(
      trimmed.replace(/^#{1,3}\s+/, '').replace(/^[-*•]\s+/, '• ').replace(/^(\d+)[.)]\s+/, '$1. ')
    );
    const pPr = [];
    pPr.push('<w:jc w:val="left"/>');
    pPr.push(`<w:spacing w:before="${isHeading ? 180 : 0}" w:after="${isHeading ? 100 : 70}" w:line="280" w:lineRule="auto"/>`);
    if (isBullet || isNumbered) pPr.push('<w:ind w:left="360" w:hanging="180"/>');
    const rPr = [];
    if (isHeading) rPr.push('<w:b/><w:sz w:val="26"/>');
    else if (isCode) rPr.push('<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="19"/>');
    else rPr.push('<w:sz w:val="21"/>');
    const text = clean || ' ';
    return `<w:p><w:pPr>${pPr.join('')}</w:pPr><w:r><w:rPr>${rPr.join('')}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  };

  const paragraphs = [
    `<w:p><w:pPr><w:jc w:val="left"/><w:keepNext/><w:spacing w:after="160"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="172033"/></w:rPr><w:t xml:space="preserve">${title}</w:t></w:r></w:p>`,
    `<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="220"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">Subject: ${subject}</w:t></w:r></w:p>`,
    ...lines.map(paragraphForLine)
  ];

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${paragraphs.join('')}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000"/></w:sectPr>
</w:body></w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:jc w:val="left"/><w:spacing w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
</w:styles>`;

  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    'word/document.xml': documentXml,
    'word/styles.xml': stylesXml
  };
  const zipBytes = makeZip(files);
  triggerBlobDownload(new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }), filename);
}

function pdfSafeText(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function exportNoteAsPdf(note, filename) {
  // Minimal standards-compliant PDF writer. All stream separators are real LF
  // bytes (not the literal characters "\\n"), which fixes blank PDF output.
  const pageWidth = 595.28, pageHeight = 841.89;
  const margin = 48, contentWidth = pageWidth - margin * 2;
  const encoder = new TextEncoder();
  const safe = value => String(value ?? '')
    .replace(/\r/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // Helvetica is approximately 5.2pt per character at 10.5pt. Keep a
  // conservative width so long code/text lines never run off the page.
  const wrap = (text, maxChars = 88) => {
    const result = [];
    for (const raw of String(text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
      if (!raw) { result.push(''); continue; }
      let rest = raw.replace(/\t/g, '    ');
      while (rest.length > maxChars) {
        let cut = rest.lastIndexOf(' ', maxChars);
        if (cut < Math.floor(maxChars * .55)) cut = maxChars;
        result.push(rest.slice(0, cut));
        rest = rest.slice(cut).trimStart();
      }
      result.push(rest);
    }
    return result;
  };

  const lines = [
    { text: note.title || 'Code Detective Note', size: 18, leading: 24 },
    { text: `Subject: ${note.subject || 'General'}`, size: 10, leading: 18 },
    { text: '', size: 10, leading: 10 },
    ...wrap(note.content || '').map(text => ({ text, size: 10.5, leading: 15 }))
  ];

  const pages = [];
  let page = [], y = pageHeight - margin;
  for (const line of lines) {
    if (y - line.leading < margin) { pages.push(page); page = []; y = pageHeight - margin; }
    page.push(line); y -= line.leading;
  }
  if (page.length || !pages.length) pages.push(page);

  const objects = [];
  const add = body => { objects.push(body); return objects.length; };
  const fontObj = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const pageNums = [];

  for (const pageLines of pages) {
    let stream = 'BT\n';
    let yPos = pageHeight - margin;
    for (const line of pageLines) {
      stream += `/F1 ${line.size} Tf\n1 0 0 1 ${margin.toFixed(2)} ${yPos.toFixed(2)} Tm\n(${safe(line.text)}) Tj\n`;
      yPos -= line.leading;
    }
    stream += 'ET\n';
    const streamLength = encoder.encode(stream).length;
    const contentObj = add(`<< /Length ${streamLength} >>\nstream\n${stream}endstream`);
    // Temporary parent token is replaced after the Pages object exists.
    pageNums.push(add(`<< /Type /Page /Parent PAGESREF /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /ProcSet [/PDF /Text] /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`));
  }

  const pagesObj = add(`<< /Type /Pages /Kids [${pageNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>`);
  const catalogObj = add(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
  for (let i = 0; i < objects.length; i++) objects[i] = objects[i].replaceAll('PAGESREF', `${pagesObj} 0 R`);

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets[i + 1] = encoder.encode(pdf).length;
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  triggerBlobDownload(new Blob([encoder.encode(pdf)], { type: 'application/pdf' }), filename);
}

async function exportNoteAs(format) {
  const note = noteContent();
  if (!note) return alert('Select a note first.');
  const base = safeNoteFilename(note);
  const text = notePlainText(note);
  const progress = $('notes-download-progress');
  const setProgress = message => { if (progress) progress.textContent = message || ''; };

  try {
    setProgress('Preparing your document…');
    if (format === 'txt') {
      triggerBlobDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${base}.txt`);
    } else if (format === 'md') {
      const md = `# ${note.title || 'Code Detective Note'}\n\n**Subject:** ${note.subject || 'General'}\n\n${note.content || ''}\n`;
      triggerBlobDownload(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${base}.md`);
    } else if (format === 'json') {
      triggerBlobDownload(new Blob([JSON.stringify({ title: note.title || '', subject: note.subject || 'General', content: note.content || '', exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json;charset=utf-8' }), `${base}.json`);
    } else if (format === 'html') {
      const escHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(note.title)}</title><style>body{font-family:Inter,Arial,sans-serif;max-width:850px;margin:48px auto;padding:0 24px;line-height:1.7;color:#172033}h1{margin-bottom:4px}small{color:#64748b}.content{white-space:pre-wrap;margin-top:28px}</style></head><body><h1>${escHtml(note.title || 'Code Detective Note')}</h1><small>${escHtml(note.subject || 'General')}</small><div class="content">${escHtml(note.content || '')}</div></body></html>`;
      triggerBlobDownload(new Blob([html], { type: 'text/html;charset=utf-8' }), `${base}.html`);
    } else if (format === 'pdf') {
      exportNoteAsPdf(note, `${base}.pdf`);
    } else if (format === 'docx') {
      exportNoteAsDocx(note, `${base}.docx`);
    } else {
      throw new Error('Unsupported document type.');
    }
    setProgress('Download ready ✓');
    setTimeout(() => { setProgress(''); closeDownloadChooser(); }, 650);
  } catch (error) {
    console.error('[Notes] Export failed:', error);
    setProgress('Could not export this format.');
    alert(error.message || 'The note could not be exported.');
  }
}

async function askTutor(mode = 'teach', presetQuestion = null) {
  const note = noteContent();
  const input = $('tutor-question');
  const question = String(presetQuestion ?? input?.value ?? '').trim();

  if (!note) return alert('Select a note first.');
  if (!question || state.busy) return;

  state.busy = true;
  state.lastTutorResult = null;
  $('tutor-send').disabled = true;
  const status = $('tutor-status');
  if (status) status.innerHTML = '<span></span> Teaching…';
  state.history.push({ role:'user', content:question });
  renderChat();
  if (input) input.value = '';

  try {
    const result = await askNotesTutor({
      noteId: note.source === 'admin' || note.source === 'account' ? note.id : null,
      noteTitle: note.title,
      noteContent: note.content,
      question,
      history: state.history.slice(-8),
      mode,
      contextNotes: findRelevantNotes(question, note).map(n => ({ id:n.id, title:n.title, subject:n.subject, content:String(n.content || '').slice(0,12000) }))
    });
    state.lastTutorResult = result || {};
    let answer = result?.answer || 'I could not generate an answer.';
    if (result?.note_grounded === false) answer = `General programming knowledge — not stated in your selected note.\n\n${answer}`;
    if (result?.common_mistake) answer += `\n\nCommon mistake: ${result.common_mistake}`;
    state.history.push({ role:'assistant', content:answer });
    renderChat();
    await recordLearningEvent('tutor_question', result, question, note);
    await loadLearningProfile();
  } catch (error) {
    state.history.pop();
    renderChat();
    alert(error.message);
  } finally {
    state.busy = false;
    $('tutor-send').disabled = false;
    if (status) status.innerHTML = '<span></span> Ready';
    input?.focus();
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
    #screen-notes .tutor-learning-profile{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px 11px;margin-bottom:10px;border:1px solid var(--border);border-radius:12px;background:rgba(79,169,255,.045);color:var(--text-muted);font-size:10px;line-height:1.4}
    #screen-notes .profile-label{font-size:9px;font-weight:900;letter-spacing:.1em;color:var(--cyan);margin-right:3px}
    #screen-notes .profile-topic{padding:4px 7px;border-radius:999px;background:var(--surface-subtle);border:1px solid var(--border);color:var(--text-secondary)}
    #screen-notes .profile-topic b{color:var(--cyan);margin-left:3px}
    #screen-notes .tutor-learning-card{margin:2px 4px 10px;padding:13px 14px;border:1px solid rgba(79,169,255,.28);border-radius:14px;background:rgba(79,169,255,.055);line-height:1.55}
    #screen-notes .tutor-learning-head{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px;font-size:9px;letter-spacing:.08em;font-weight:900;color:var(--purple)}
    #screen-notes .tutor-learning-head small{font-size:9px;letter-spacing:0;color:var(--text-muted);font-weight:700}
    #screen-notes .tutor-learning-card strong{font-size:12px;color:var(--text-primary)}
    #screen-notes .tutor-learning-card p{font-size:11px;color:var(--text-muted);margin:8px 0 0}
    #screen-notes .tutor-action-row{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 10px}
    #screen-notes .tutor-action{border:1px solid var(--border);background:var(--surface-subtle);color:var(--text-secondary);border-radius:999px;padding:7px 10px;font:700 10px var(--font-ui);cursor:pointer}
    #screen-notes .tutor-action:hover{border-color:rgba(245,185,66,.5);color:var(--text-primary);background:rgba(245,185,66,.07)}
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

function splitReaderPages(text, charsPerPage = 3000) {
  const normalized = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return ['This document has no readable text.'];
  const lines = normalized.split('\n');
  const pages = []; let current = '';
  for (const line of lines) {
    const addition = current ? `${current}\n${line}` : line;
    if (addition.length > charsPerPage && current) { pages.push(current.trim()); current = line; }
    else current = addition;
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length ? pages : [normalized];
}

function highlightReaderText(text, query) {
  const safe = esc(text);
  if (!query) return safe;
  const q = String(query).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!q) return safe;
  try { return safe.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>'); } catch { return safe; }
}

function renderReaderContent(text, query) {
  const lines = String(text || '').split(/\n/);
  const chunks = [];
  let paragraph = [];
  const flush = () => {
    if (!paragraph.length) return;
    const joined = paragraph.join('\n').trim();
    if (joined) chunks.push(`<p>${highlightReaderText(joined, query)}</p>`);
    paragraph = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) { flush(); continue; }
    const isHeading = /^(UNIT\s+[IVX]+|CHAPTER\s+\d+|\d+(?:\.\d+)*\s*[:.-]\s*[^.]+)$/i.test(trimmed)
      || (/^[A-Z][A-Z0-9 &,:()\-]{7,}$/.test(trimmed) && trimmed.length < 100);
    const isSubheading = /^(Definition|Example|Syntax|Output|Note|Important|Advantages|Disadvantages|Conclusion|Why|Explanation)\s*:/i.test(trimmed);
    const looksLikeCode = /^(public |private |protected |class |interface |import |package |System\.|[{}]$|try \{|catch \(|for \(|while \(|if \(|[A-Za-z_$][\w$]*\s*=)/.test(trimmed);
    if (isHeading) {
      flush();
      chunks.push(`<h3 class="reader-heading">${highlightReaderText(trimmed, query)}</h3>`);
    } else if (isSubheading) {
      flush();
      chunks.push(`<h4 class="reader-subheading">${highlightReaderText(trimmed, query)}</h4>`);
    } else if (looksLikeCode && (trimmed.includes('{') || trimmed.includes(';') || trimmed.includes('System.'))) {
      flush();
      chunks.push(`<div class="reader-code">${highlightReaderText(line, query)}</div>`);
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return chunks.join('') || '<p>This document has no readable text.</p>';
}

function renderReaderPage() {
  const r = state.reader, note = noteContent();
  const page = $('reader-page-content');
  const sheet = $('notes-reader-page');
  const stage = document.querySelector('.notes-reader-stage');
  const label = $('reader-page-label');
  const zoomLabel = $('reader-zoom-label');
  const prev = $('reader-prev'), next = $('reader-next');
  if (!page || !sheet || !note) return;
  const total = Math.max(1, r.pages.length);
  r.page = Math.min(Math.max(r.page, 0), total - 1);
  page.classList.remove('reader-content-refresh');
  void page.offsetWidth;
  page.innerHTML = renderReaderContent(r.pages[r.page] || '', r.query);
  page.classList.add('reader-content-refresh');
  sheet.style.transform = `scale(${r.zoom})`;
  if (label) label.textContent = `Page ${r.page + 1} of ${total}`;
  if (zoomLabel) zoomLabel.textContent = `${Math.round(r.zoom * 100)}%`;
  if (prev) prev.disabled = r.page <= 0;
  if (next) next.disabled = r.page >= total - 1;
  const meta = $('notes-reader-meta'); if (meta) meta.textContent = `${note.subject || 'General'}${note.file_name ? ` • ${note.file_name}` : ''}`;
  const title = $('notes-reader-title'); if (title) title.textContent = note.title || 'Reading';
  const format = $('reader-format-label'); if (format) format.textContent = (note.file_name?.split('.').pop() || 'TEXT').toUpperCase() + ' DOCUMENT';
  if (stage) stage.scrollTo({ top: 0, behavior: 'smooth' });
}

function openReader() {
  const note = noteContent(); if (!note) return alert('Select a note first.');
  state.reader = { noteId: note.id, pages: splitReaderPages(note.content, 3600), page: 0, zoom: 1, query: '' };
  const overlay = $('notes-reader-overlay'); if (!overlay) return;
  const search = $('notes-reader-search');
  if (search) { search.hidden = true; const input = $('reader-search-input'); if (input) input.value = ''; }
  renderReaderPage();
  overlay.classList.add('active'); overlay.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => setTimeout(() => $('notes-reader-page')?.focus(), 80));
}

function closeReader() {
  const overlay = $('notes-reader-overlay'); if (!overlay) return;
  overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true');
  if (document.fullscreenElement === $('notes-reader')) document.exitFullscreen?.().catch?.(() => {});
  if (!document.querySelector('.notification-detail-overlay.active') && !document.querySelector('.notes-download-overlay.active')) document.body.style.overflow = '';
}

function toggleReaderSearch() {
  const box = $('notes-reader-search'); if (!box) return;
  box.hidden = !box.hidden;
  if (!box.hidden) $('reader-search-input')?.focus();
}

function updateReaderSearch(value) {
  state.reader.query = String(value || '').trim();
  const count = $('reader-search-count');
  if (!state.reader.query) { if (count) count.textContent = '0 matches'; renderReaderPage(); return; }
  const source = state.reader.pages.join('\n');
  const matches = source.toLowerCase().split(state.reader.query.toLowerCase()).length - 1;
  if (count) count.textContent = `${matches} match${matches === 1 ? '' : 'es'}`;
  renderReaderPage();
}

function adjustReaderZoom(delta) { state.reader.zoom = Math.min(1.5, Math.max(.75, +(state.reader.zoom + delta).toFixed(2))); renderReaderPage(); }

async function readerFullscreen() {
  const reader = $('notes-reader'); if (!reader) return;
  try { if (!document.fullscreenElement) await reader.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch (_) { /* graceful fallback */ }
}

function initNotesTutor() {
  injectStyles();
  const tutorPanel = document.querySelector('#screen-notes .tutor-panel');
  if (tutorPanel && !document.getElementById('tutor-learning-profile')) {
    const context = document.getElementById('tutor-note-context');
    context?.insertAdjacentHTML('afterend', `<div id="tutor-learning-profile" class="tutor-learning-profile"><span class="profile-label">LEARNING SIGNAL</span><span>Loading your learning focus…</span></div><div class="tutor-action-row"><button type="button" class="tutor-action" data-tutor-action="teach" data-tutor-question="Explain this concept simply with a programming example.">🧠 Explain</button><button type="button" class="tutor-action" data-tutor-action="explain-code" data-tutor-question="Explain the code in this note line by line and tell me why each important line exists.">💻 Explain code</button><button type="button" class="tutor-action" data-tutor-action="debug" data-tutor-question="Help me debug the most likely mistake in this topic. Explain the cause before the fix.">🐞 Debug</button><button type="button" class="tutor-action" data-tutor-action="practice" data-tutor-question="Give me a small practice problem on this concept, then guide me instead of revealing the answer immediately.">🎯 Practice</button></div>`);
  }

  $('save-note-btn')?.addEventListener('click', saveNote);
  $('note-file-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    const nameEl = $('selected-file-name');
    if (nameEl) nameEl.textContent = file ? `Selected: ${file.name}` : 'Import TXT, MD, PDF, DOCX or DOC notes from your device.';
    if (file) importLocalFile(file);
  });
  $('notes-select')?.addEventListener('change', e => selectNote(e.target.value));
  $('tutor-send')?.addEventListener('click', askTutor);
  $('download-note-btn')?.addEventListener('click', openDownloadChooser);
  $('read-note-btn')?.addEventListener('click', openReader);
  $('notes-reader-close')?.addEventListener('click', closeReader);
  $('notes-reader-overlay')?.addEventListener('click', e => { if (e.target.id === 'notes-reader-overlay') closeReader(); });
  $('reader-prev')?.addEventListener('click', () => { state.reader.page--; renderReaderPage(); });
  $('reader-next')?.addEventListener('click', () => { state.reader.page++; renderReaderPage(); });
  $('reader-zoom-out')?.addEventListener('click', () => adjustReaderZoom(-.1));
  $('reader-zoom-in')?.addEventListener('click', () => adjustReaderZoom(.1));
  $('reader-search-toggle')?.addEventListener('click', toggleReaderSearch);
  $('reader-search-input')?.addEventListener('input', e => updateReaderSearch(e.target.value));
  $('reader-fullscreen')?.addEventListener('click', readerFullscreen);
  $('notes-download-close')?.addEventListener('click', closeDownloadChooser);
  $('notes-download-overlay')?.addEventListener('click', e => { if (e.target.id === 'notes-download-overlay') closeDownloadChooser(); });
  document.querySelectorAll('[data-download-format]').forEach(button => {
    button.addEventListener('click', () => exportNoteAs(button.dataset.downloadFormat));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('notes-reader-overlay')?.classList.contains('active')) { closeReader(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && $('notes-reader-overlay')?.classList.contains('active')) { e.preventDefault(); const box=$('notes-reader-search'); if(box?.hidden) toggleReaderSearch(); $('reader-search-input')?.focus(); return; }
    if ($('notes-reader-overlay')?.classList.contains('active')) {
      if (e.key === 'ArrowLeft' && state.reader.page > 0) { state.reader.page--; renderReaderPage(); }
      if (e.key === 'ArrowRight' && state.reader.page < state.reader.pages.length - 1) { state.reader.page++; renderReaderPage(); }
    }
    if (e.key === 'Escape' && $('notes-download-overlay')?.classList.contains('active')) closeDownloadChooser();
  });
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
  document.querySelectorAll('[data-tutor-action]').forEach(button => {
    button.addEventListener('click', () => askTutor(button.dataset.tutorAction, button.dataset.tutorQuestion || button.textContent.trim()));
  });

  loadNotes();
  loadLearningProfile();
}

window.CodeDetectiveNotes = { initNotesTutor, loadNotes };
