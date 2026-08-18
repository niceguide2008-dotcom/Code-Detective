import { supabase } from './supabase.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const state = { challenge:null, pieces:[], canonicalPieces:[], placed:[], completed:false, preview:false, executing:false, wrongPositions:new Set() };

function escapeLine(code){ return String(code ?? '').replace(/\r/g,''); }
function shuffle(items){
  const out = [...items];
  for(let i=out.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
  if(out.length > 1 && out.every((x,i)=>x.id === items[i].id)){ [out[0],out[1]]=[out[1],out[0]]; }
  return out;
}

function setStatus(message, type=''){ const el=$('#solution-status'); if(!el)return; el.textContent=message; el.className=`solution-status ${type}`; }

function assembledCode(order = state.placed){
  return order.filter(Boolean).map(p=>escapeLine(p.code)).join('\n');
}

function isBracePiece(piece){
  return /^\s*[{}]\s*$/.test(String(piece?.code ?? ''));
}

function isSafeReorderablePiece(piece){
  const code=String(piece?.code ?? '').trim();
  // Simple local declarations may change order without changing program meaning.
  return /^(?:final\s+)?(?:byte|short|int|long|float|double|char|boolean|String)\s+[A-Za-z_$][\w$]*\s*=/.test(code)
      || /^(?:final\s+)?(?:byte|short|int|long|float|double|char|boolean|String)\s+[A-Za-z_$][\w$]*\s*;/.test(code);
}

function bracesAreBalanced(code){
  let depth=0;
  for(const ch of code){
    if(ch==='{') depth++;
    else if(ch==='}') { depth--; if(depth<0)return false; }
  }
  return depth===0;
}

function removeStringsAndComments(code){
  return code
    .replace(/\/\*[\s\S]*?\*\//g,'')
    .replace(/\/\/.*$/gm,'')
    .replace(/"(?:\\.|[^"\\])*"/g,'""')
    .replace(/'(?:\\.|[^'\\])*'/g,"''");
}

function normalizeForFlexibleCheck(order){
  const canonical=state.canonicalPieces;
  const current=order;

  // Structural signature: braces keep their exact structural role, executable
  // pieces keep their exact order, while simple declarations become DECL.
  const signature=(pieces)=>pieces.map(p=>{
    if(isBracePiece(p)) return String(p.code).trim();
    if(isSafeReorderablePiece(p)) return 'DECL';
    return `ID:${p.id}`;
  });

  const expected=signature(canonical);
  const actual=signature(current);
  if(expected.length!==actual.length)return false;
  return expected.every((token,i)=>token===actual[i]);
}

function currentLooksLikeVariable(name, pieces){
  return pieces.some(p=>new RegExp('\\b'+name+'\\b').test(String(p.code||'')))
    && pieces.some(p=>new RegExp('(?:int|long|double|float|boolean|char|String)\\s+'+name+'\\b').test(String(p.code||'')));
}

function flexibleSolutionCheck(){
  const ordered=state.placed.filter(Boolean);
  if(ordered.length!==state.pieces.length)return {correct:false,reason:'missing'};
  const code=assembledCode(ordered);
  const clean=removeStringsAndComments(code);

  if(!bracesAreBalanced(clean)) return {correct:false,reason:'braces'};
  if(!normalizeForFlexibleCheck(ordered)) return {correct:false,reason:'structure'};

  // Lightweight dependency guard for common beginner variable puzzles.
  const declared=new Set();
  const declarationRegex=/^(?:final\s+)?(?:byte|short|int|long|double|float|boolean|char|String)\s+([A-Za-z_$][\w$]*)\s*(?:=|;)/;
  for(const raw of clean.split('\n')){
    const line=raw.trim();
    const dm=line.match(declarationRegex);
    if(dm){ declared.add(dm[1]); continue; }
    const executable=line.replace(/System\.out\.println\s*\([^)]*\)\s*;?/g,'');
    for(const name of (executable.match(/\b[A-Za-z_$][\w$]*\b/g)||[])){
      if(['public','private','protected','static','void','class','new','return','if','else','for','while','true','false','System','out','println','String'].includes(name))continue;
      if(/^[a-zA-Z_$][\w$]*$/.test(name) && currentLooksLikeVariable(name,ordered) && !declared.has(name))
        return {correct:false,reason:'dependency'};
    }
  }
  return {correct:true,code};
}

function canonicalServerOrder(){
  // Preserve the IDs stored in Supabase when legacy rows were expanded from
  // one encoded program piece into visual line-components.
  return [...new Set(state.canonicalPieces.map(p=>p.sourceId || p.id))];
}

function showViewCode(){
  const preview=$('#code-preview');
  if(!preview || !state.completed)return;
  $('#code-preview-code').textContent=assembledCode();
  preview.classList.add('visible');
  state.preview=true;
  preview.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function renderLanding(challenges){
  const root=$('#playground-root');
  root.innerHTML=`
    <div class="playground-hero">
      <div class="playground-eyebrow">CODE DETECTIVE / PLAYGROUND</div>
      <h1 class="playground-title">Build the program. Crack the structure.</h1>
      <p class="playground-subtitle">Assemble Java programs from their components, understand the order of execution, and prove your solution like a detective.</p>
    </div>
    <div class="playground-toolbar">
      <div class="playground-toolbar-left"><span class="badge badge-cyan">🧩 ${challenges.length} Challenges</span><span class="badge badge-amber">☕ Java</span></div>
      <span class="playground-card-number">Select a challenge to begin</span>
    </div>
    <div class="playground-grid" id="challenge-grid"></div>`;
  const grid=$('#challenge-grid');
  if(!challenges.length){ grid.innerHTML='<div class="playground-empty">No active Playground challenges are available yet.</div>'; return; }
  grid.innerHTML=challenges.map((c,i)=>`<button class="playground-card" type="button" data-id="${esc(c.id)}" aria-label="Open ${esc(c.title)}">
    <div class="playground-card-top"><span class="playground-card-number">Challenge ${String(c.challenge_number ?? i+1).padStart(2,'0')}</span><span class="badge badge-${c.difficulty==='Beginner'?'green':c.difficulty==='Advanced'?'crimson':'amber'}">${esc(c.difficulty)}</span></div>
    <h2>${esc(c.title)}</h2><p>${esc(c.question)}</p>
    <div class="playground-card-meta"><span class="badge badge-purple">${esc(c.category || 'Java')}</span><span class="badge badge-cyan">+${Number(c.points||0)} XP</span></div>
  </button>`).join('');
  $$('.playground-card',root).forEach(card=>card.addEventListener('click',()=>{ window.location.href=`playground.html?id=${encodeURIComponent(card.dataset.id)}`; }));
}

function normalizeChallengePieces(rawPieces){
  const source=Array.isArray(rawPieces)?rawPieces:[];
  const expanded=[];
  for(const original of source){
    const code=String(original?.code ?? '');
    // Some of the current Playground rows contain the entire program as ONE
    // piece, with literal \\n characters between lines. Convert that legacy
    // representation into real jigsaw components automatically.
    const hasLiteralBreaks=code.includes('\\n');
    const lines=hasLiteralBreaks
      ? code.split('\\n')
      : code.replace(/\r/g,'').split('\n');
    if(lines.length>1){
      lines.forEach((line,index)=>{
        if(!line.trim()) return;
        expanded.push({
          ...original,
          id:`${original.id}__line_${index}`,
          sourceId:original.id,
          sourceLine:index,
          code:line.replace(/\\r/g,'')
        });
      });
    }else{
      expanded.push({...original,sourceId:original.id});
    }
  }
  return expanded;
}

function renderChallenge(c){
  state.challenge=c;
  const pieces=normalizeChallengePieces(c.pieces);
  state.canonicalPieces=[...pieces];
  state.pieces=shuffle(pieces);
  state.placed=new Array(pieces.length).fill(null);
  state.completed=false; state.preview=false; state.executing=false;
  const root=$('#playground-root');
  root.innerHTML=`
    <div class="playground-stack">
      <section class="playground-panel challenge-hero">
        <div class="challenge-header">
          <div>
            <div class="playground-eyebrow">PLAYGROUND · CHALLENGE ${esc(c.challenge_number || '')}</div>
            <h1>${esc(c.title)}</h1>
            <div class="challenge-question"><strong>${esc(c.question)}</strong></div>
          </div>
          <div class="challenge-meta"><span class="badge badge-cyan">☕ ${esc(c.language || 'Java')}</span><span class="badge badge-green">${esc(c.difficulty)}</span><span class="badge badge-purple">${esc(c.category || 'Basics')}</span><span class="badge badge-amber">+${Number(c.points||0)} XP</span></div>
        </div>
        <div class="challenge-mission"><strong>Your mission:</strong> Build a valid Java program. Declarations may be reordered, braces are structural, and only the final assembled program determines correctness.</div>
      </section>

      <section class="playground-panel whiteboard-panel">
        <div class="whiteboard-head"><div><div class="whiteboard-title" id="whiteboard-title">Jigsaw Whiteboard</div><div class="whiteboard-subtitle" id="whiteboard-subtitle">Rearrange components freely. The final Java program is what gets judged.</div></div><span class="badge badge-cyan" id="placed-counter">0 / ${pieces.length}</span></div>
        <div class="whiteboard" id="whiteboard" aria-label="Java program whiteboard">
          <div class="whiteboard-slots" id="board-slots"></div>
          <div class="board-piece-layer" id="board-piece-layer"></div>
          <div class="execution-view" id="execution-view" aria-live="polite"></div>
        </div>
        <div class="challenge-actions"><div id="solution-status" class="solution-status">Arrange all components, then check your solution.</div><button class="btn btn-ghost" id="reset-puzzle" type="button">↻ Reset</button><button class="btn btn-primary" id="check-solution" type="button">✓ Check Solution</button></div>
        <div class="success-panel" id="success-panel"><div class="success-actions"><span class="badge badge-green" id="xp-awarded">+${Number(c.points||0)} XP</span><button class="btn btn-primary" id="view-code" type="button">View Code</button><button class="btn btn-ghost" id="next-challenge" type="button">Next Challenge →</button></div><div class="code-preview" id="code-preview"><div class="code-preview-head">Reconstructed Java Program</div><pre id="code-preview-code"></pre></div></div>
      </section>

      <section class="playground-panel component-tray">
        <div class="tray-head"><div><div class="tray-title">Program Components</div><div class="tray-subtitle">Drag pieces onto the whiteboard. Reorder them directly on the board. Touch and hold on mobile.</div></div><span class="badge badge-purple">${pieces.length} Pieces</span></div>
        <div class="tray-pieces" id="tray-pieces"></div>
      </section>
    </div>`;
  renderBoard(); renderTray(); bindChallengeEvents();
}

function renderBoard(){
  const slots=$('#board-slots');
  if(!slots)return;

  // Render every board position as a real drop slot. The component itself lives
  // inside that slot, so it can grow naturally instead of being squeezed into
  // a fixed-height overlay. Empty slots remain visible as insertion targets.
  slots.innerHTML=state.pieces.map((_,i)=>{
    const piece=state.placed[i];
    return `<div class="board-slot ${piece?'filled':''} ${state.wrongPositions.has(i)?'wrong-target':''}" data-slot="${i}">
      ${piece
        ? pieceMarkup(piece,`data-board-index="${i}"`,state.wrongPositions.has(i)?'locked wrong-persistent':'locked')
        : `<div class="board-slot-placeholder">Drop component ${i+1}</div>`}
    </div>`;
  }).join('');

  $('#placed-counter').textContent=`${state.placed.filter(Boolean).length} / ${state.pieces.length}`;
  $$('.puzzle-piece[data-board-index]',slots).forEach(el=>{
    el.addEventListener('pointerdown',e=>{ if(!state.completed) startDrag(e,el,'board'); });
  });
}
function renderTray(){
  const tray=$('#tray-pieces'); if(!tray)return;
  tray.innerHTML=state.pieces.map(p=>state.placed.some(x=>x?.id===p.id)?'':pieceMarkup(p,`data-piece-id="${esc(p.id)}"`,'')).join('');
  $$('.puzzle-piece[data-piece-id]',tray).forEach(el=>el.addEventListener('pointerdown',e=>{ if(!state.completed) startDrag(e,el,'tray'); }));
}
function pieceMarkup(piece,attrs='',extra=''){ return `<div class="puzzle-piece ${extra}" ${attrs} data-id="${esc(piece.id)}" role="button" tabindex="0" aria-label="Code component">${esc(piece.code)}</div>`; }

function getDropIndex(board, clientX, clientY){
  const slots=$$('[data-slot]',board);
  if(!slots.length)return -1;
  let best=0;
  let bestDistance=Infinity;
  for(let i=0;i<slots.length;i++){
    const r=slots[i].getBoundingClientRect();
    const centerY=r.top+r.height/2;
    const distance=Math.abs(clientY-centerY);
    if(distance<bestDistance){bestDistance=distance;best=i;}
  }
  return best;
}

function setDropPreview(board, index){
  $$('[data-slot].drop-target',board).forEach(slot=>slot.classList.remove('drop-target'));
  if(index>=0) board.querySelector(`[data-slot="${index}"]`)?.classList.add('drop-target');
}

function startDrag(event,el,source){
  if(event.pointerType==='mouse' && event.button!==0)return;
  event.preventDefault();

  const pieceId=el.dataset.id;
  const piece=state.pieces.find(p=>p.id===pieceId);
  if(!piece)return;

  const oldBoardIndex=source==='board' ? Number(el.dataset.boardIndex) : -1;
  const board=$('#whiteboard');
  if(!board)return;

  const rect=el.getBoundingClientRect();
  const clone=el.cloneNode(true);
  clone.classList.add('dragging');
  clone.style.width=`${Math.min(rect.width, Math.max(180, window.innerWidth-24))}px`;
  clone.style.left=`${rect.left}px`;
  clone.style.top=`${rect.top}px`;
  document.body.appendChild(clone);

  if(source==='board' && Number.isInteger(oldBoardIndex)){
    state.wrongPositions.delete(oldBoardIndex);
    // Temporarily make the original slot look available while dragging.
    board.querySelector(`[data-slot="${oldBoardIndex}"]`)?.classList.remove('filled');
  }

  const offsetX=event.clientX-rect.left;
  const offsetY=event.clientY-rect.top;
  let lastTarget=-1;

  const move=e=>{
    e.preventDefault();
    clone.style.left=`${e.clientX-offsetX}px`;
    clone.style.top=`${e.clientY-offsetY}px`;
    const r=board.getBoundingClientRect();
    const inside=e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;
    board.classList.toggle('is-over',inside);
    if(inside){
      lastTarget=getDropIndex(board,e.clientX,e.clientY);
      setDropPreview(board,lastTarget);
    }else{
      lastTarget=-1;
      setDropPreview(board,-1);
    }
  };

  const finish=()=>{
    document.removeEventListener('pointermove',move);
    document.removeEventListener('pointerup',finish);
    document.removeEventListener('pointercancel',finish);
    clone.remove();
    board.classList.remove('is-over');
    setDropPreview(board,-1);

    if(lastTarget<0){
      renderBoard();
      return;
    }

    if(source==='board'){
      // Swap with the selected slot. Empty slots are preserved, so moving a
      // component to the bottom (or into a gap) really changes its position.
      if(oldBoardIndex!==lastTarget){
        const moving=state.placed[oldBoardIndex];
        state.placed[oldBoardIndex]=state.placed[lastTarget];
        state.placed[lastTarget]=moving;
      }
      state.wrongPositions.clear();
      setStatus('Board updated. Keep rearranging until the order is correct.');
    }else{
      // Insert a tray piece at the requested position and shift existing pieces
      // down. If the board is full, place only when the piece is not duplicated.
      if(state.placed.some(x=>x?.id===piece.id)){
        setStatus('That component is already on the whiteboard.','error');
        renderBoard();
        return;
      }
      const empty=state.placed.findIndex(x=>!x);
      if(empty===-1){
        setStatus('The whiteboard is full. Rearrange a component first.','error');
        renderBoard();
        return;
      }
      state.placed.splice(lastTarget,0,piece);
      state.placed=state.placed.slice(0,state.pieces.length);
      while(state.placed.length<state.pieces.length)state.placed.push(null);
      state.wrongPositions.clear();
      setStatus('Piece placed. Drag any board component to reorder it.');
    }

    board.classList.add('edit-mode');
    renderBoard();
    renderTray();
  };

  document.addEventListener('pointermove',move,{passive:false});
  document.addEventListener('pointerup',finish,{once:true});
  document.addEventListener('pointercancel',finish,{once:true});
}
function flashWrong(){ const board=$('#whiteboard'); board?.classList.add('is-over'); setTimeout(()=>board?.classList.remove('is-over'),220); setStatus('That slot is occupied. Try another position.','error'); }

async function checkSolution(){
  if(state.completed || state.executing)return;
  if(state.placed.some(x=>!x)){ setStatus('Place every component before checking the solution.','error'); return; }
  const button=$('#check-solution'); if(button){button.disabled=true;button.textContent='Analyzing…';}
  try{
    const local=flexibleSolutionCheck();
    if(!local.correct){
      const messages={
        braces:'The braces are not balanced. Check the opening and closing blocks.',
        structure:'The program structure is not valid yet. Keep executable statements in a logical order.',
        dependency:'A variable appears to be used before it is declared.',
        missing:'Place every component before checking the solution.'
      };
      state.wrongPositions.clear();
      $('#whiteboard')?.classList.add('edit-mode');
      renderBoard();
      setStatus(messages[local.reason]||'Not quite. Build a valid Java program and check again.','error');
      return;
    }

    // Keep the existing server-side XP/completion flow. The legacy RPC receives
    // the canonical equivalent after the flexible frontend validation succeeds.
    let xp=Number(state.challenge.points||0);
    try{
      const {data,error}=await supabase.rpc('complete_playground_challenge',{
        p_challenge_id:state.challenge.id,
        p_order:canonicalServerOrder()
      });
      if(!error && data) xp=Number(data.xp_awarded||xp);
    }catch(serverError){
      console.warn('[Playground] Completion RPC unavailable; continuing with local validation.',serverError);
    }

    await runExecutionAnimation(local.code,xp);
  }catch(error){
    console.error('[Playground] validation failed',error);
    setStatus(`Could not analyze the solution: ${error.message}`,'error');
  }finally{
    if(button){button.disabled=false;button.textContent='✓ Check Solution';}
  }
}

function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

function getOutputLines(code){
  const variables={};
  const outputs=[];
  for(const raw of code.split('\n')){
    const line=raw.trim();
    const decl=line.match(/^(?:final\s+)?(int|long|double|float|boolean|String|char)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+);$/);
    if(decl){ variables[decl[2]]=decl[3].trim(); continue; }
    const print=line.match(/^System\.out\.(?:println|print)\s*\((.*)\)\s*;$/);
    if(!print)continue;
    let expr=print[1].trim();
    expr=expr.replace(/\b[A-Za-z_$][\w$]*\b/g,name=>Object.prototype.hasOwnProperty.call(variables,name)?variables[name]:name);
    const parts=expr.split(/\s*\+\s*/);
    const evaluated=parts.map(part=>{
      const p=part.trim();
      if(/^"(?:\\.|[^"\\])*"$/.test(p)) return p.slice(1,-1).replace(/\\n/g,'\n');
      if(/^'(?:\\.|[^'\\])*'$/.test(p)) return p.slice(1,-1);
      return p;
    });
    if(evaluated.length>1 && evaluated.every(x=>/^-?\d+(?:\.\d+)?$/.test(x))) outputs.push(String(evaluated.map(Number).reduce((a,b)=>a+b,0)));
    else outputs.push(evaluated.join(''));
  }
  return outputs;
}

async function runExecutionAnimation(code,xp){
  state.executing=true;
  const board=$('#whiteboard');
  const execution=$('#execution-view');
  if(!board || !execution)return;
  board.classList.remove('edit-mode');
  board.classList.add('executing');
  $('#whiteboard-title').textContent='Program Execution';
  $('#whiteboard-subtitle').textContent='Code accepted · compiling and running your Java program…';
  $$('.challenge-actions .btn').forEach(btn=>btn.disabled=true);
  const status=$('#solution-status');
  if(status){status.textContent='Preparing execution…';status.className='solution-status executing';}
  const output=getOutputLines(code);
  execution.innerHTML=`
    <div class="execution-shell">
      <div class="execution-topbar"><div class="execution-brand"><span class="execution-dot"></span><span>JAVA RUNTIME</span></div><span class="execution-state" id="execution-state">INITIALIZING</span></div>
      <div class="execution-body"><div class="execution-code" id="execution-code"></div><div class="execution-console"><div class="console-head"><span>OUTPUT</span><span id="console-status">waiting…</span></div><pre id="execution-output"></pre></div></div>
      <div class="execution-footer" id="execution-footer">Loading runtime…</div>
    </div>`;
  const codeEl=$('#execution-code'), stateEl=$('#execution-state'), consoleStatus=$('#console-status'), footer=$('#execution-footer'), outputEl=$('#execution-output');
  const codeLines=code.split('\n');
  for(let i=0;i<codeLines.length;i++){
    const row=document.createElement('div');
    row.className='exec-line';
    row.innerHTML=`<span class="exec-ln">${String(i+1).padStart(2,'0')}</span><span>${esc(codeLines[i])}</span>`;
    codeEl.appendChild(row); row.classList.add('active'); await sleep(70); row.classList.remove('active'); row.classList.add('executed');
  }
  stateEl.textContent='RUNNING'; stateEl.classList.add('running'); consoleStatus.textContent='executing…'; footer.textContent='System.out → console';
  await sleep(450);
  for(const line of output){ const lineEl=document.createElement('div'); lineEl.className='output-line'; lineEl.textContent=line; outputEl.appendChild(lineEl); await sleep(180); }
  await sleep(300);
  stateEl.textContent='SUCCESS'; stateEl.classList.remove('running'); stateEl.classList.add('success'); consoleStatus.textContent='complete'; footer.textContent='Execution completed successfully';
  if(status){status.textContent='✓ Program executed successfully.';status.className='solution-status success';}
  state.completed=true; state.executing=false; $('#xp-awarded').textContent=`+${xp} XP`; $('#success-panel')?.classList.add('visible'); $$('.challenge-actions .btn').forEach(btn=>btn.disabled=false); board.classList.add('execution-complete');
}

function resetPuzzle(){
  state.placed=new Array(state.pieces.length).fill(null); state.completed=false; state.preview=false; state.executing=false; state.wrongPositions.clear();
  const board=$('#whiteboard'); board?.classList.remove('edit-mode','executing','execution-complete');
  $('#execution-view')?.replaceChildren();
  if($('#whiteboard-title')) $('#whiteboard-title').textContent='Jigsaw Whiteboard';
  if($('#whiteboard-subtitle')) $('#whiteboard-subtitle').textContent='Rearrange components freely. The final Java program is what gets judged.';
  $('#success-panel')?.classList.remove('visible'); $('#code-preview')?.classList.remove('visible');
  setStatus('Arrange all components, then check your solution.'); renderBoard(); renderTray();
}

async function loadChallenge(id){
  const root=$('#playground-root'); root.innerHTML='<div class="playground-loading">Loading challenge…</div>';
  const {data,error}=await supabase.from('playground_public_challenges').select('id,title,question,difficulty,category,language,pieces,points,challenge_number').eq('id',id).maybeSingle();
  if(error||!data){ root.innerHTML=`<div class="playground-panel challenge-error"><h1>Challenge unavailable</h1><p>${esc(error?.message||'This challenge does not exist or is no longer active.')}</p><div style="margin-top:16px"><a class="btn btn-ghost" href="playground.html">← Back to Playground</a></div></div>`; return; }
  renderChallenge(data);
}
async function loadLanding(){
  const root=$('#playground-root'); root.innerHTML='<div class="playground-loading">Loading Playground challenges…</div>';
  const {data,error}=await supabase.from('playground_public_challenges').select('id,title,question,difficulty,category,language,points,challenge_number').eq('is_active',true).order('challenge_number',{ascending:true});
  if(error){ root.innerHTML=`<div class="playground-empty">Unable to load Playground challenges. ${esc(error.message)}</div>`; return; }
  renderLanding(data||[]);
}
function bindChallengeEvents(){
  $('#check-solution')?.addEventListener('click',checkSolution);
  $('#reset-puzzle')?.addEventListener('click',resetPuzzle);
  $('#view-code')?.addEventListener('click',showViewCode);
  $('#next-challenge')?.addEventListener('click',async()=>{ const {data}=await supabase.from('playground_public_challenges').select('id').eq('is_active',true).order('challenge_number',{ascending:true}); const ids=(data||[]).map(x=>x.id), idx=ids.indexOf(state.challenge.id); const next=ids[idx+1]||ids[0]; if(next) location.href=`playground.html?id=${encodeURIComponent(next)}`; });
}

async function boot(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.user){ location.replace(new URL('index.html',location.href).href); return; }
  const id=new URLSearchParams(location.search).get('id');
  if(id) await loadChallenge(id); else await loadLanding();
}

document.addEventListener('DOMContentLoaded',boot,{once:true});
