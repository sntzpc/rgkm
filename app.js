/* ==========================================
   GKM Reporter – v2.x (Sync GSheet + Matrix + KPI + PWA Ready)
   Disusun ulang agar rapi & presisi.
   ========================================== */

'use strict';

/* -----------------------------
 * 1) KONSTANTA & STATE GLOBAL
 * ---------------------------*/
const KEYS = {
  reports:     'gkm_reports',
  queue:       'gkm_queue',
  prefs:       'gkm_prefs',
  mandorIndex: 'gkm_mandor_index',
  lastSync:    'gkm_last_sync',
  plans:       'gkm_plans',
  planQueue:   'gkm_plan_queue',
};

const SYNC = {
  // TODO: ganti dengan URL Web App GAS kamu
  SCRIPT_URL:  'https://script.google.com/macros/s/AKfycbzgyU_rfOrgm-zVtioeO8m71Otq_HE5Gd0AThzT-1sRejoPhAXnhPHj4Xo56wTjW3nM/exec',
  SHEET_NAME:  'LaporanGKM',
  SHEET_PLAN:  'RencanaGKM',
};

let MX_ADMIN = false; // mode admin (ambil data dari Google Sheet)

/* -----------------------------
 * 2) DOM HOOKS
 * ---------------------------*/
const DOM = {
  navLinks: document.querySelectorAll('[data-nav]'),
  views: {
    home:    document.getElementById('view-home'),
    plan:    document.getElementById('view-plan'),
    history: document.getElementById('view-history'),
    matrix:  document.getElementById('view-matrix'),
    stats:   document.getElementById('view-stats'),
    sync:    document.getElementById('view-sync'),
    settings:document.getElementById('view-settings'),
  },
  alertRegion: document.getElementById('alertRegion'),

  // Form Laporan
  form:     document.getElementById('formLaporan'),
  askep:    document.getElementById('askep'),
  divisi:   document.getElementById('divisi'),
  unit:     document.getElementById('unit'),
  region:   document.getElementById('region'),
  waktu:    document.getElementById('waktu'),
  durasi:   document.getElementById('durasi'),
  topik:    document.getElementById('topik'),
  topikList:document.getElementById('topikList'),
  penanyaWrap:    document.getElementById('penanyaTags'),
  penanyaInput:   document.getElementById('penanyaInput'),
  penanyaList:    document.getElementById('penanyaList'),
  perangkumWrap:  document.getElementById('perangkumTags'),
  perangkumInput: document.getElementById('perangkumInput'),
  perangkumList:  document.getElementById('perangkumList'),
  catatan:  document.getElementById('catatan'),
  btnSimpan:document.getElementById('btnSimpan'),
  btnClearForm: document.getElementById('btnClearForm'),
  spinSave:  document.getElementById('spinSave'),

  // Form Rencana
  formRencana:      document.getElementById('formRencana'),
  rencAskep:        document.getElementById('rencAskep'),
  rencDivisi:       document.getElementById('rencDivisi'),
  rencUnit:         document.getElementById('rencUnit'),
  rencRegion:       document.getElementById('rencRegion'),
  rencTanggal:      document.getElementById('rencTanggal'),
  rencTopik:        document.getElementById('rencTopik'),
  btnSimpanRencana: document.getElementById('btnSimpanRencana'),
  btnClearRencana:  document.getElementById('btnClearRencana'),
  spinSaveRencana:  document.getElementById('spinSaveRencana'),

  // Modal WA
  waTanggal: document.getElementById('waTanggal'),
  waPreview: document.getElementById('waPreview'),
  btnRegenWA:document.getElementById('btnRegenWA'),
  btnCopyWA: document.getElementById('btnCopyWA'),

  // History
  historyBody:  document.getElementById('historyBody'),
  historyInfo:  document.getElementById('historyInfo'),
  historyPager: document.getElementById('historyPager'),
  historySearch:document.getElementById('historySearch'),
  pageSize:     document.getElementById('pageSize'),

  // Matrik
  mxMode:      document.getElementById('mxMode'),
  mxYear:      document.getElementById('mxYear'),
  mxMonth:     document.getElementById('mxMonth'),
  btnMxRefresh:document.getElementById('btnMxRefresh'),
  btnMxXlsx:   document.getElementById('btnMxXlsx'),
  btnMxPdf:    document.getElementById('btnMxPdf'),
  btnMxAdmin:  document.getElementById('btnMxAdmin'),
  mxWrap:      document.getElementById('mxWrap'),
  mxInfo:      document.getElementById('mxInfo'),

  // KPI (Admin only)
  mxKPI:       document.getElementById('mxKPI'),
  kpiOnTime:   document.getElementById('kpiOnTime'),
  kpiMedian:   document.getElementById('kpiMedian'),
  kpiRealized: document.getElementById('kpiRealized'),

  // Stats
  statFrom:  document.getElementById('statFrom'),
  statTo:    document.getElementById('statTo'),
  statUnit:  document.getElementById('statUnit'),
  statDivisi:document.getElementById('statDivisi'),
  btnHitungStat: document.getElementById('btnHitungStat'),
  btnClearStat:  document.getElementById('btnClearStat'),
  spinStat:  document.getElementById('spinStat'),
  statJumlah:document.getElementById('statJumlah'),
  statTopik: document.getElementById('statTopik'),
  statDurasi:document.getElementById('statDurasi'),
  statPenanyaTop:  document.getElementById('statPenanyaTop'),
  statPerangkumTop:document.getElementById('statPerangkumTop'),

  // Sinkronisasi
  syncQueueCount: document.getElementById('syncQueueCount'),
  btnSyncNow:     document.getElementById('btnSyncNow'),
  spinSync:       document.getElementById('spinSync'),
  syncStatus:     document.getElementById('syncStatus'),
  lastSyncLabel:  document.getElementById('lastSyncLabel'),

  // Header
  btnExportXlsx: document.getElementById('btnExportXlsx'),
  btnResetApp:   document.getElementById('btnResetApp'),

  // Storage meter
  storageBar:   document.getElementById('storageBar'),
  storageLabel: document.getElementById('storageLabel'),
};

/* -----------------------------
 * 3) UTILITAS UMUM
 * ---------------------------*/
const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const sleep = (ms)=> new Promise(res=> setTimeout(res, ms));

function uuid(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
    const r = Math.random()*16|0, v = c==='x'? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
function fmtDateWA(iso){
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dayNames[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
}
function escapeHtml(s=''){
  return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function storageSizeLabel(){
  let total = 0;
  for (let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    const v = localStorage.getItem(k);
    total += (k?.length||0) + (v?.length||0);
  }
  const kb = total/1024, mb = kb/1024;
  const label = kb < 1024 ? `${kb.toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  const pct = Math.min(100, (total / (5*1024*1024))*100);
  DOM.storageBar.style.width = `${pct.toFixed(1)}%`;
  DOM.storageLabel.textContent = `${label} / ~5 MB`;
}
function readJSON(key, defVal){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(defVal)); }
  catch { return defVal; }
}
function writeJSON(key, val){
  localStorage.setItem(key, JSON.stringify(val));
  storageSizeLabel();
}
function showAlert(html, type='info', timeout=3000){
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.innerHTML = `${html}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  DOM.alertRegion.appendChild(el);
  if (timeout) setTimeout(()=> bootstrap.Alert.getOrCreateInstance(el).close(), timeout);
}
function toggleSpinner(btnEl, spinnerEl, on=true){
  btnEl.disabled = on;
  spinnerEl?.classList.toggle('d-none', !on);
}

/* -----------------------------
 * 4) DATA ACCESS (LOCAL)
 * ---------------------------*/
// Laporan
function getReports(){ return readJSON(KEYS.reports, []); }
function setReports(arr){ writeJSON(KEYS.reports, arr); }
// Rencana
function getPlans(){ return readJSON(KEYS.plans, []); }
function setPlans(arr){ writeJSON(KEYS.plans, arr); }
// Prefs
function getPrefs(){ return readJSON(KEYS.prefs, {}); }
function setPrefs(p){ writeJSON(KEYS.prefs, p); }
// Mandor index
function getMandorIndex(){ return readJSON(KEYS.mandorIndex, {}); }
function setMandorIndex(m){ writeJSON(KEYS.mandorIndex, m); }
// Antrean sync laporan
function getQueue(){ return readJSON(KEYS.queue, []); }
function setQueue(q){ writeJSON(KEYS.queue, q); updateQueueCount(); }
function enqueue(id){ const q = new Set(getQueue()); q.add(id); setQueue([...q]); }
function dequeueMany(ids=[]){ const q = new Set(getQueue()); ids.forEach(id=> q.delete(id)); setQueue([...q]); }
// Antrean sync rencana
function getPlanQueue(){ return readJSON(KEYS.planQueue, []); }
function setPlanQueue(q){ writeJSON(KEYS.planQueue, q); updateQueueCount(); }
function enqueuePlan(id){ const q = new Set(getPlanQueue()); q.add(id); setPlanQueue([...q]); }
function dequeuePlansMany(ids=[]){ const q = new Set(getPlanQueue()); ids.forEach(id=> q.delete(id)); setPlanQueue([...q]); }
// Queue meter
function updateQueueCount(){
  const c1 = getQueue().length;
  const c2 = getPlanQueue().length;
  DOM.syncQueueCount.textContent = String(c1 + c2);
}

/* -----------------------------
 * 5) MANDOR INDEX + TAGS INPUT
 * ---------------------------*/
function comboKey(unit, divisi){ return `${(unit||'').trim().toUpperCase()}|${(divisi||'').trim().toUpperCase()}`; }
function updateMandorIndex(unit, divisi, penanyaArr, perangkumArr){
  const idx = getMandorIndex();
  const key = comboKey(unit, divisi);
  if (!idx[key]) idx[key] = { penanya: [], perangkum: [] };
  const penSet = new Set(idx[key].penanya);
  const perSet = new Set(idx[key].perangkum);
  (penanyaArr||[]).forEach(n=> penSet.add(n));
  (perangkumArr||[]).forEach(n=> perSet.add(n));
  idx[key].penanya   = [...penSet].sort();
  idx[key].perangkum = [...perSet].sort();
  setMandorIndex(idx);
}
function getMandorSuggestions(unit, divisi){
  const idx = getMandorIndex();
  const key = comboKey(unit, divisi);
  return idx[key] || { penanya: [], perangkum: [] };
}
function initTags(wrapperEl, inputEl){
  const tags = [];
  function render(){
    wrapperEl.querySelectorAll('.tag').forEach(e=> e.remove());
    tags.forEach((t,i)=>{
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.innerHTML = `<span>${t}</span> <button type="button" data-i="${i}" aria-label="Hapus"><i class="bi bi-x"></i></button>`;
      wrapperEl.insertBefore(chip, inputEl);
    });
  }
  function addTagFromInput(){
    let val = inputEl.value.trim();
    if (!val) return;
    val.split(',').map(s=> s.trim()).filter(Boolean).forEach(v=>{
      if (!tags.includes(v)) tags.push(v);
    });
    inputEl.value = ''; render();
  }
  inputEl.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ','){ e.preventDefault(); addTagFromInput(); }
    else if (e.key === 'Backspace' && !inputEl.value && tags.length){ tags.pop(); render(); }
  });
  wrapperEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-i]');
    if (btn){ const i = +btn.dataset.i; tags.splice(i,1); render(); }
    else { inputEl.focus(); }
  });
  return {
    get: ()=> [...tags],
    set: (arr=[])=>{ tags.splice(0, tags.length, ...arr.filter(Boolean)); render(); },
    addMany: (arr=[])=>{ arr.forEach(v=>{ if(!tags.includes(v)) tags.push(v); }); render(); },
    clear: ()=> { tags.splice(0, tags.length); render(); }
  };
}
const penanyaTags   = initTags(DOM.penanyaWrap,   DOM.penanyaInput);
const perangkumTags = initTags(DOM.perangkumWrap, DOM.perangkumInput);

// Commit pending teks → tags (mobile-safe)
function commitInputToTags(ctrl, inputEl){
  const raw = (inputEl.value || '').trim();
  if(!raw) return;
  const parts = raw.split(/[,\n;]/).map(s=> s.trim()).filter(Boolean);
  if(parts.length) ctrl.addMany(parts);
  inputEl.value = '';
}
function commitMandorPending(){
  commitInputToTags(penanyaTags,   DOM.penanyaInput);
  commitInputToTags(perangkumTags, DOM.perangkumInput);
}
// Auto-commit saat blur/change/datalist & saat ketik koma
['change','blur'].forEach(evt=>{
  DOM.penanyaInput.addEventListener(evt, ()=> commitInputToTags(penanyaTags, DOM.penanyaInput));
  DOM.perangkumInput.addEventListener(evt, ()=> commitInputToTags(perangkumTags, DOM.perangkumInput));
});
DOM.penanyaInput.addEventListener('input', ()=>{
  if (DOM.penanyaInput.value.includes(',')) commitInputToTags(penanyaTags, DOM.penanyaInput);
});
DOM.perangkumInput.addEventListener('input', ()=>{
  if (DOM.perangkumInput.value.includes(',')) commitInputToTags(perangkumTags, DOM.perangkumInput);
});

/* -----------------------------
 * 6) AUTOSUGGEST TOPIK & MANDOR
 * ---------------------------*/
function buildTopikFrequency(){
  const freq = {};
  for (const r of getReports()){
    const t = (r.topik||'').trim();
    if (!t) continue;
    freq[t] = (freq[t]||0) + 1;
  }
  return Object.entries(freq).sort((a,b)=> b[1]-a[1]).map(([k])=> k);
}
function refreshTopikDatalist(){
  const topN = buildTopikFrequency().slice(0,20);
  DOM.topikList.innerHTML = topN.map(t=> `<option value="${escapeHtml(t)}">`).join('');
}
function refreshMandorDatalists(){
  const unit = DOM.unit.value;
  const div  = DOM.divisi.value;
  const { penanya, perangkum } = getMandorSuggestions(unit, div);
  DOM.penanyaList.innerHTML   = penanya.map(n=> `<option value="${escapeHtml(n)}">`).join('');
  DOM.perangkumList.innerHTML = perangkum.map(n=> `<option value="${escapeHtml(n)}">`).join('');
}

/* -----------------------------
 * 7) WA GENERATOR
 * ---------------------------*/
function buildWaText(data, tanggalOverrideIso){
  const penanyaLines   = (data.penanya||[]).map((n,i)=> `${i+1}. ${n}`).join('\n') || '—';
  const perangkumLines = (data.perangkum||[]).map((n,i)=> `${i+1}. ${n}`).join('\n') || '—';
  const tgl = fmtDateWA(tanggalOverrideIso || data.waktu);
  const catatanBlock = data.catatan && data.catatan.trim() ? `\nCatatan:\n${data.catatan.trim()}` : '';
  return [
    `*LAPORAN GUGUS KERJA MANDOR*`,
    `Nama Askep: ${data.askep}`,
    `Divisi: ${data.divisi}`,
    `Unit: ${data.unit}`,
    `Region: ${data.region}`,
    ``,
    `Hari & Waktu: ${tgl}`,
    `Durasi: ${data.durasiMenit} menit`,
    `Topik/Materi: ${data.topik}`,
    ``,
    `Nama mandor yang mengajukan pertanyaan:`,
    penanyaLines,
    ``,
    `Nama mandor yang melakukan ringkasan:`,
    perangkumLines,
    catatanBlock ? `\n${catatanBlock}` : '',
    ``,
    `Demikian kami sampaikan, terima kasih.`
  ].join('\n');
}

/* -----------------------------
 * 8) LAPORAN: BUILD/VALIDATE/EVENTS + HISTORY
 * ---------------------------*/
let historyState = { page:1, pageSize:20, filter:'' };
let EDIT_ID = null;

function buildReportFromForm(){
  return {
    id: uuid(),
    tsCreated: new Date().toISOString(),
    askep:  DOM.askep.value.trim(),
    divisi: DOM.divisi.value.trim(),
    unit:   DOM.unit.value.trim(),
    region: DOM.region.value.trim(),
    waktu:  DOM.waktu.value ? new Date(DOM.waktu.value).toISOString() : '',
    durasiMenit: Number(DOM.durasi.value||0),
    topik:  DOM.topik.value.trim(),
    penanya:   penanyaTags.get(),
    perangkum: perangkumTags.get(),
    catatan: DOM.catatan.value
  };
}
function validateReport(data){
  const required = ['askep','divisi','unit','region','waktu','durasiMenit','topik'];
  for (const k of required) if (!data[k] || (k==='durasiMenit' && data[k] <= 0)) return false;
  return true;
}
function loadReportToForm(r){
  EDIT_ID = r.id;
  DOM.askep.value   = r.askep || '';
  DOM.divisi.value  = r.divisi || '';
  DOM.unit.value    = r.unit || '';
  DOM.region.value  = r.region || '';
  DOM.waktu.value   = r.waktu ? r.waktu.slice(0,10) : '';
  DOM.durasi.value  = r.durasiMenit || '';
  DOM.topik.value   = r.topik || '';
  penanyaTags.set(r.penanya || []);
  perangkumTags.set(r.perangkum || []);
  DOM.penanyaInput.value = '';
  DOM.perangkumInput.value = '';
  DOM.catatan.value = r.catatan || '';

  refreshMandorDatalists();
  showView('home');
  window.scrollTo({ top:0, behavior:'smooth' });
  showAlert('Mode edit aktif. Setelah disimpan, data akan menimpa yang lama & masuk antrean sync.', 'info', 4000);
}

function refreshHistory(){
  const rows = getReports();
  const filter = (historyState.filter||'').toLowerCase();
  const pendingSet = new Set(getQueue());

  const filt = !filter ? rows : rows.filter(r=>{
    const hay = [r.askep, r.divisi, r.unit, r.region, r.topik, fmtDateWA(r.waktu)].join(' ').toLowerCase();
    return hay.includes(filter);
  });

  const total = filt.length;
  const pages = Math.max(1, Math.ceil(total / historyState.pageSize));
  historyState.page = Math.min(historyState.page, pages);

  const start = (historyState.page - 1) * historyState.pageSize;
  const slice = filt.slice(start, start + historyState.pageSize);

  DOM.historyBody.innerHTML = slice.map(r=>{
    const penCount = r.penanya?.length || 0;
    const perCount = r.perangkum?.length || 0;
    const actions = `
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-primary" data-act="edit" data-id="${r.id}" title="Edit"><i class="bi bi-pencil-square"></i></button>
        <button class="btn btn-outline-success" data-act="wa"   data-id="${r.id}" title="Generate WA"><i class="bi bi-whatsapp"></i></button>
      </div>`;
    const isPending = pendingSet.has(r.id);
    const syncIcon = isPending
      ? `<i class="bi bi-circle-fill text-secondary" title="Belum tersinkron"></i>`
      : `<i class="bi bi-check-circle-fill text-success" title="Sudah tersinkron"></i>`;
    return `<tr>
      <td>${escapeHtml(fmtDateWA(r.waktu))}</td>
      <td>${escapeHtml(r.askep)}</td>
      <td>${escapeHtml(r.divisi)}</td>
      <td>${escapeHtml(r.unit)}</td>
      <td>${escapeHtml(r.region)}</td>
      <td>${escapeHtml(r.topik)}</td>
      <td>${r.durasiMenit}</td>
      <td>${penCount}</td>
      <td>${perCount}</td>
      <td>${actions}</td>
      <td class="text-center" style="width:48px;">${syncIcon}</td>
    </tr>`;
  }).join('');

  DOM.historyInfo.textContent = `${total} data, halaman ${historyState.page}/${pages}`;
  DOM.historyPager.innerHTML = renderPager(historyState.page, pages);
  updateQueueCount();
}
function renderPager(page, pages){
  function pageItem(p, label=p, active=false, disabled=false){
    return `<li class="page-item ${active?'active':''} ${disabled?'disabled':''}">
      <a class="page-link" href="#" data-page="${p}">${label}</a></li>`;
  }
  if (pages <= 1) return '';
  const items = [];
  items.push(pageItem(1,'«',false,page===1));
  let start = Math.max(1, page-2), end = Math.min(pages, page+2);
  if (start > 1) items.push(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
  for (let p=start; p<=end; p++) items.push(pageItem(p,p,p===page));
  if (end < pages) items.push(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
  items.push(pageItem(pages,'»',false,page===pages));
  return items.join('');
}
DOM.historyPager.addEventListener('click', (e)=>{
  const a = e.target.closest('a[data-page]'); if (!a) return; e.preventDefault();
  historyState.page = +a.dataset.page; refreshHistory();
});
DOM.historySearch.addEventListener('input', ()=>{
  historyState.filter = DOM.historySearch.value.trim(); historyState.page = 1; refreshHistory();
});
DOM.pageSize.addEventListener('change', ()=>{
  historyState.pageSize = +DOM.pageSize.value; historyState.page = 1; refreshHistory();
});
DOM.historyBody.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const id = btn.dataset.id; const act = btn.dataset.act;
  const r = getReports().find(x=> x.id === id); if (!r) return;
  if (act === 'wa'){
    DOM.waTanggal.value = (r.waktu||'').slice(0,10);
    DOM.waPreview.value = buildWaText(r);
    new bootstrap.Modal('#modalWA').show();
  } else if (act === 'edit'){
    loadReportToForm(r);
  }
});

/* -----------------------------
 * 9) FORM LAPORAN EVENTS
 * ---------------------------*/
DOM.btnRegenWA.addEventListener('click', ()=>{
  commitMandorPending();
  const data = buildReportFromForm();
  if (!validateReport(data)) return;
  const override = DOM.waTanggal.value ? new Date(DOM.waTanggal.value).toISOString() : null;
  DOM.waPreview.value = buildWaText(data, override);
});
DOM.btnCopyWA.addEventListener('click', async ()=>{
  try { await navigator.clipboard.writeText(DOM.waPreview.value || ''); showAlert('Teks WA disalin ke clipboard.', 'success'); }
  catch { showAlert('Gagal menyalin ke clipboard.', 'danger'); }
});
DOM.btnClearForm.addEventListener('click', ()=>{
  DOM.form.reset();
  penanyaTags.clear();
  perangkumTags.clear();
  initToday();      // isi ulang tanggal hari ini
  prefillDefaults();// isi default askep/divisi/unit/region bila ada
});
DOM.form.addEventListener('submit', (e)=>{
  e.preventDefault();
  commitMandorPending();
  const data = buildReportFromForm();
  if (!validateReport(data)) return showAlert('Lengkapi field bertanda * terlebih dahulu.', 'warning');
  toggleSpinner(DOM.btnSimpan, DOM.spinSave, true);

  // simpan prefs
  const prefs = getPrefs();
  prefs.askep = data.askep; prefs.divisi = data.divisi; prefs.unit = data.unit; prefs.region = data.region;
  setPrefs(prefs);

  // update index mandor
  updateMandorIndex(data.unit, data.divisi, data.penanya, data.perangkum);
  refreshMandorDatalists();

  const arr = getReports();
  let msg = '';
  if (EDIT_ID){
    const idx = arr.findIndex(x=> x.id === EDIT_ID);
    if (idx !== -1){
      const old = arr[idx];
      arr[idx] = { ...data, id: old.id, tsCreated: old.tsCreated, waText: buildWaText(data) };
      setReports(arr);
      enqueue(old.id);
      msg = 'Laporan diperbarui & masuk antrean sync.';
    } else {
      const report = { ...data, waText: buildWaText(data) };
      arr.unshift(report); setReports(arr); enqueue(report.id);
      msg = 'Laporan disimpan & masuk antrean sync.';
    }
    EDIT_ID = null;
  } else {
    const report = { ...data, waText: buildWaText(data) };
    arr.unshift(report); setReports(arr); enqueue(report.id);
    msg = 'Laporan disimpan & masuk antrean sync.';
  }

  toggleSpinner(DOM.btnSimpan, DOM.spinSave, false);
  showAlert(msg, 'success');
  storageSizeLabel();
  DOM.form.reset();
  penanyaTags.clear(); perangkumTags.clear();
  prefillDefaults();
  refreshTopikDatalist();
  refreshHistory();
});

/* -----------------------------
 * 10) RENCANA (PLAN): MODEL & EVENTS
 * ---------------------------*/
function buildPlanFromForm(){
  return {
    id: uuid(),
    tsCreated: new Date().toISOString(),
    askep:  DOM.rencAskep.value.trim(),
    divisi: DOM.rencDivisi.value.trim(),
    unit:   DOM.rencUnit.value.trim(),
    region: DOM.rencRegion.value.trim(),
    waktu:  DOM.rencTanggal.value ? new Date(DOM.rencTanggal.value).toISOString() : '',
    topik:  DOM.rencTopik.value.trim(),
  };
}
function validatePlan(p){
  const required = ['askep','divisi','unit','region','waktu','topik'];
  for (const k of required) if (!p[k]) return false;
  return true;
}
function getPlansByIds(ids){
  const map = new Map(getPlans().map(r=> [r.id, r]));
  return ids.map(id=> map.get(id)).filter(Boolean);
}
function buildPlanPayloadArray(plans){
  return plans.map(p=> ({
    id: p.id, tsCreated: p.tsCreated, askep: p.askep, divisi: p.divisi, unit: p.unit, region: p.region,
    waktu: p.waktu, topik: p.topik
  }));
}
async function syncPlansBatch(ids, scriptUrl, sheetName){
  const plans = getPlansByIds(ids);
  if (!plans.length) return true;
  const payload = JSON.stringify(buildPlanPayloadArray(plans));
  const fd = new FormData();
  fd.append('payload', payload);
  fd.append('sheetName', sheetName || SYNC.SHEET_PLAN);
  await fetch(scriptUrl, { method:'POST', mode:'no-cors', body: fd });
  return true;
}

// Submit & Clear Rencana
DOM.formRencana?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const plan = buildPlanFromForm();
  if (!validatePlan(plan)) return showAlert('Lengkapi field bertanda * pada Rencana.', 'warning');

  // simpan prefs
  const prefs = getPrefs();
  prefs.askep = plan.askep; prefs.divisi = plan.divisi; prefs.unit = plan.unit; prefs.region = plan.region;
  setPrefs(prefs);

  // simpan lokal + antrean
  const arr = getPlans();
  arr.unshift(plan); setPlans(arr); enqueuePlan(plan.id);

  // push ke kalender (tanpa await agar tidak kena popup-blocked)
  try { autoPushPlanToCalendar(plan); } catch(_) {}

  // UI feedback
  toggleSpinner(DOM.btnSimpanRencana, DOM.spinSaveRencana, true);
  setTimeout(()=>{
    toggleSpinner(DOM.btnSimpanRencana, DOM.spinSaveRencana, false);
    showAlert('Rencana disimpan, antrean sync dibuat, dan kalender dibuka untuk penjadwalan 04:00.', 'success');
    DOM.rencTanggal.value = '';
    DOM.rencTopik.value = '';
    storageSizeLabel();
  }, 250);
});
DOM.btnClearRencana?.addEventListener('click', ()=>{
  DOM.rencTanggal.value = '';
  DOM.rencTopik.value   = '';
});

/* -----------------------------
 * 11) MATRIK (KALENDER) + KPI + EXPORT
 * ---------------------------*/
function initialsFromName(fullname){
  const persons = String(fullname||'').split(/[,;&]/).map(s=> s.trim()).filter(Boolean);
  return persons.map(p=> p.split(/\s+/).filter(Boolean).map(w=> w[0]?.toUpperCase()||'').join('')).join(' & ');
}
function topikTwoWords(s){ return String(s||'').trim().split(/\s+/).slice(0,2).join(' '); }
function dateKey(iso){
  if(!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear(), m = d.getMonth()+1, dd = d.getDate();
  return `${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
}
function buildDateMap(plans, reports){
  const map = {};
  plans.forEach(p=> { const k = dateKey(p.waktu); if(!k) return; (map[k] ||= {plan:[], actual:[]}).plan.push(p); });
  reports.forEach(r=> { const k = dateKey(r.waktu); if(!k) return; (map[k] ||= {plan:[], actual:[]}).actual.push(r); });
  return map;
}
// grid Minggu–Sabtu
function buildMonthWeeks(year, month){
  const firstDow = new Date(year, month, 1).getDay(); // 0=Minggu
  const daysIn  = new Date(year, month+1, 0).getDate();
  const weeks = []; let d = 1;
  for (let w=0; w<6; w++){
    const row = [];
    for (let dow=0; dow<7; dow++){
      if (w===0 && dow<firstDow) row.push(null);
      else if (d > daysIn) row.push(null);
      else {
        const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        row.push({ d, key }); d++;
      }
    }
    weeks.push(row);
    if (d > daysIn) break;
  }
  return weeks;
}
function renderMatrixGrid(year, monthOrNull, plans, reports){
  const dateMap = buildDateMap(plans, reports);
  function badgesHTML(k){
    const entry = dateMap[k]; if(!entry) return '';
    const toLine = (obj, typ)=>{
      const tag   = typ==='plan' ? 'Renc' : 'Aktual';
      const ini   = initialsFromName(obj.askep);
      const div   = obj.divisi;
      const unit  = obj.unit;
      const reg   = obj.region;
      const topik = topikTwoWords(obj.topik);
      return `${tag}: ${ini}; ${div}; ${unit}; ${reg}; ${topik}`;
    };
    if (entry.plan.length && entry.actual.length){
      const r1 = entry.plan.map(p=> toLine(p,'plan')).join('\n');
      const r2 = entry.actual.map(a=> toLine(a,'actual')).join('\n');
      return `<span class="mx-badge mx-both" data-date="${k}">${escapeHtml(r1)}</span>
              <div class="mx-sep">====</div>
              <span class="mx-badge mx-both" data-date="${k}">${escapeHtml(r2)}</span>`;
    }
    const out = [];
    entry.plan.forEach(p=> out.push(`<span class="mx-badge mx-rencana" data-date="${k}">${escapeHtml(toLine(p,'plan'))}</span>`));
    entry.actual.forEach(a=> out.push(`<span class="mx-badge mx-aktual"  data-date="${k}">${escapeHtml(toLine(a,'actual'))}</span>`));
    return out.join('');
  }

  const months = (monthOrNull==null) ? [...Array(12).keys()] : [monthOrNull];
  let html = '';
  months.forEach(m=>{
    const weeks = buildMonthWeeks(year, m);
    const monthName = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m];
    html += `<div class="mx-month">
      <h6 class="mb-2">${monthName} ${year}</h6>
      <div class="table-responsive nowrap-scroll">
        <table class="table table-sm mx-cal">
          <thead><tr>${dayNames.map(n=>`<th>${n}</th>`).join('')}</tr></thead>
          <tbody>
            ${weeks.map(week=> `<tr>${
              week.map(cell=>{
                if(!cell) return `<td class="mx-cell mx-empty"></td>`;
                const k = cell.key;
                return `<td class="mx-cell">
                  <div class="mx-daynum">${cell.d}</div>
                  ${badgesHTML(k)}
                </td>`;
              }).join('')
            }</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  });
  DOM.mxWrap.innerHTML = html;

  // klik detail
  DOM.mxWrap.querySelectorAll('.mx-badge').forEach(el=>{
    el.addEventListener('click', ()=>{
      const k = el.getAttribute('data-date');
      const entry = buildDateMap(plans, reports)[k]; if(!entry) return;
      const lines = [];
      entry.plan.forEach(p=> lines.push(`Renc: ${p.askep}; ${p.divisi}; ${p.unit}; ${p.region}; ${p.topik}`));
      if(entry.plan.length && entry.actual.length) lines.push('====');
      entry.actual.forEach(a=> lines.push(`Aktual: ${a.askep}; ${a.divisi}; ${a.unit}; ${a.region}; ${a.topik}`));
      alert(`${k}\n\n${lines.join('\n')}`);
    });
  });
}

async function refreshMatrix() {
  const mode  = DOM.mxMode?.value || 'year';
  const now   = new Date();
  const year  = Number(DOM.mxYear?.value || now.getFullYear());
  const month = (mode === 'month')
    ? Number(DOM.mxMonth?.value ?? now.getMonth())
    : null;

  // Info mode
  DOM.mxInfo.textContent = MX_ADMIN ? 'Mode admin (server: Google Sheet).' : 'Mode lokal.';

  // --- Ambil data sekali saja ---
  let plans = [];
  let reports = [];
  try {
    const data = await loadMatrixData();
    plans   = Array.isArray(data?.plans)   ? data.plans   : [];
    reports = Array.isArray(data?.reports) ? data.reports : [];

    // Render kalender matrik
    renderMatrixGrid(year, month, plans, reports);
  } catch (e) {
    console.error('[matrix] load/render error:', e);
    showAlert('Gagal memuat data matrik.', 'danger');
    DOM.mxKPI?.classList.add('d-none');
    return; // hentikan di sini supaya tidak lanjut hitung KPI
  }

  // --- KPI hanya saat Admin; jangan ganggu matrik jika KPI error ---
  if (MX_ADMIN) {
    try {
      renderKPIAdmin(plans, reports, year, month);
      DOM.mxKPI?.classList.remove('d-none');
    } catch (eKpi) {
      console.warn('[matrix] KPI render skipped:', eKpi);
      DOM.mxKPI?.classList.add('d-none');
    }
  } else {
    DOM.mxKPI?.classList.add('d-none');
  }
}


// Matching plan→actual untuk KPI
function matchPlans(plans, reports, windowDays = 14){
  const norm = (s)=> String(s||'').trim().toUpperCase();
  const keyOf = (o)=> [norm(o.unit), norm(o.divisi), norm(o.region), norm(topikTwoWords(o.topik))].join('|');

  const byKey = new Map();

  // --- FIX di sini: jangan pakai (get() || set()).push()
  (Array.isArray(reports) ? reports : []).forEach(r=>{
    const k = keyOf(r);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  });

  // sort setiap bucket (jaga-jaga hanya jika array)
  for (const arr of byKey.values()) {
    if (Array.isArray(arr)) {
      arr.sort((a,b)=> (new Date(a.waktu)) - (new Date(b.waktu)));
    }
  }

  const pairs = [];
  let realized = 0, ontime = 0;
  const delays = [];

  (Array.isArray(plans) ? plans : []).forEach(p=>{
    const k = keyOf(p);
    const arr = byKey.get(k) || [];
    const pDate = new Date(p.waktu);

    let best = null, bestDelta = Infinity, bestIdx = -1;
    arr.forEach((a, idx)=>{
      const d = new Date(a.waktu);
      const delta = Math.round((d - pDate)/(1000*60*60*24));
      if (delta >= 0 && delta <= windowDays && delta < bestDelta){
        best = a; bestDelta = delta; bestIdx = idx;
      }
    });

    if (best){
      realized++;
      delays.push(bestDelta);
      if (bestDelta === 0) ontime++;
      arr.splice(bestIdx,1);   // agar tidak dipakai ganda
    }
    pairs.push({ plan:p, actual:best, delayDays: best? bestDelta : null });
  });

  // median delay
  let median = 0;
  if (delays.length){
    delays.sort((a,b)=>a-b);
    const mid = Math.floor(delays.length/2);
    median = delays.length%2 ? delays[mid] : Math.round((delays[mid-1]+delays[mid])/2);
  }

  return {
    pairs,
    realizedCount: realized,
    ontimeCount: ontime,
    totalPlans: (Array.isArray(plans)? plans.length : 0),
    medianDelay: median
  };
}


function renderKPIAdmin(plans, reports, year, monthOrNull){
  const inPeriod = (iso)=>{
    const d = new Date(iso);
    if (d.getFullYear() !== year) return false;
    if (monthOrNull!=null && d.getMonth() !== monthOrNull) return false;
    return true;
  };
  const P = plans.filter(p=> p.waktu && inPeriod(p.waktu));
  const R = reports.filter(r=> r.waktu && inPeriod(r.waktu));
  const k = matchPlans(P, R, 14);
  const ontimePct   = k.totalPlans ? Math.round((k.ontimeCount   / k.totalPlans)*100) : 0;
  const realizedPct = k.totalPlans ? Math.round((k.realizedCount / k.totalPlans)*100) : 0;
  DOM.kpiOnTime.textContent   = `${ontimePct}%`;
  DOM.kpiMedian.textContent   = `${k.medianDelay} hari`;
  DOM.kpiRealized.textContent = `${realizedPct}%`;
}

/* -----------------------------
 * 12) SYNC (KIRIM & VERIFIKASI)
 * ---------------------------*/
function getReportsByIds(ids){
  const map = new Map(getReports().map(r=> [r.id, r]));
  return ids.map(id=> map.get(id)).filter(Boolean);
}
function buildPayloadArray(reports){
  return reports.map(r=> ({
    id: r.id, tsCreated: r.tsCreated,
    askep: r.askep, divisi: r.divisi, unit: r.unit, region: r.region,
    waktu: r.waktu, durasiMenit: r.durasiMenit,
    topik: r.topik, penanya: r.penanya||[], perangkum: r.perangkum||[],
    catatan: r.catatan||'', waText: r.waText||''
  }));
}
async function syncBatch(ids, scriptUrl, sheetName){
  const reports = getReportsByIds(ids);
  if (!reports.length) return true;
  const fd = new FormData();
  fd.append('payload', JSON.stringify(buildPayloadArray(reports)));
  fd.append('sheetName', sheetName || SYNC.SHEET_NAME);
  await fetch(scriptUrl, { method:'POST', mode:'no-cors', body: fd });
  return true;
}

// JSONP helper (hindari CORS) – sequential (hindari race)
async function fetchSheetJS(sheetName){
  return new Promise((resolve, reject)=>{
    const cbId = 'gkmPayload';
    delete window[cbId];
    const s = document.createElement('script');
    s.src = `${SYNC.SCRIPT_URL}?action=list&sheetName=${encodeURIComponent(sheetName)}&fmt=js&_=${Date.now()}`;
    s.onload = ()=>{
      const data = window[cbId];
      if (!data || !Array.isArray(data.rows)) { reject(new Error('No data')); }
      else resolve(data.rows);
      setTimeout(()=> s.remove(), 0);
    };
    s.onerror = ()=> reject(new Error('Network error'));
    document.head.appendChild(s);
  });
}
// Verifikasi ID yang sudah tertulis di sheet
async function hasIdsJS(sheetName, ids){
  return new Promise((resolve, reject)=>{
    const cbId = 'gkmPayload';
    delete window[cbId];
    const s = document.createElement('script');
    s.src = `${SYNC.SCRIPT_URL}?action=has&sheetName=${encodeURIComponent(sheetName)}&ids=${encodeURIComponent(ids.join(','))}&fmt=js&_=${Date.now()}`;
    s.onload = ()=>{
      const data = window[cbId];
      if (!data) reject(new Error('No data')); else resolve(data);
      setTimeout(()=> s.remove(), 0);
    };
    s.onerror = ()=> reject(new Error('Network'));
    document.head.appendChild(s);
  });
}
// Ambil data matrik (lokal / server – SEKUENSIAL saat admin)
async function loadMatrixData(){
  if (!MX_ADMIN){
    return { reports:getReports(), plans:getPlans(), source:'lokal' };
  }
  const plans   = await fetchSheetJS(SYNC.SHEET_PLAN);
  const reports = await fetchSheetJS(SYNC.SHEET_NAME);
  return { reports, plans, source:'server' };
}

async function syncNow(){
  const scriptUrl = (SYNC.SCRIPT_URL || '').trim();
  if (!scriptUrl){ showAlert('SCRIPT_URL belum diatur di app.js.', 'warning'); return; }

  const qReports = getQueue();
  const qPlans   = getPlanQueue();
  if (!qReports.length && !qPlans.length){ showAlert('Tidak ada data di antrean.', 'info'); return; }

  toggleSpinner(DOM.btnSyncNow, DOM.spinSync, true);
  DOM.syncStatus.textContent = 'Mengirim...';

  const BATCH = 50;
  let okRep=0, missRep=0, okPlan=0, missPlan=0;

  try {
    // 1) Laporan
    for (let i=0;i<qReports.length;i+=BATCH){
      const chunk = qReports.slice(i, i+BATCH);
      await syncBatch(chunk, scriptUrl, SYNC.SHEET_NAME);
      await sleep(400);
      let present = [];
      for (let t=0;t<3;t++){
        const res = await hasIdsJS(SYNC.SHEET_NAME, chunk);
        present = res.present||[];
        if (present.length === chunk.length) break;
        await sleep(400);
      }
      if (present.length){ dequeueMany(present); okRep += present.length; }
      missRep += (chunk.length - present.length);
    }
    // 2) Rencana
    for (let i=0;i<qPlans.length;i+=BATCH){
      const chunk = qPlans.slice(i, i+BATCH);
      await syncPlansBatch(chunk, scriptUrl, SYNC.SHEET_PLAN);
      await sleep(400);
      let present = [];
      for (let t=0;t<3;t++){
        const res = await hasIdsJS(SYNC.SHEET_PLAN, chunk);
        present = res.present||[];
        if (present.length === chunk.length) break;
        await sleep(400);
      }
      if (present.length){ dequeuePlansMany(present); okPlan += present.length; }
      missPlan += (chunk.length - present.length);
    }

    const ts = new Date().toISOString();
    writeJSON(KEYS.lastSync, ts);
    DOM.lastSyncLabel.textContent = new Date(ts).toLocaleString('id-ID', {hour12:false});
    DOM.syncStatus.textContent = `Sukses: Laporan ${okRep}, Rencana ${okPlan}. Pending: Laporan ${missRep}, Rencana ${missPlan}.`;
    showAlert(`Sync selesai. OK Laporan: ${okRep}, OK Rencana: ${okPlan}. Pending total: ${missRep+missPlan}.`, 'success');
  } catch (err){
    console.error(err);
    DOM.syncStatus.textContent = 'Gagal. Periksa jaringan & URL.';
    showAlert('Sync gagal. Cek koneksi/URL lalu coba lagi.', 'danger');
  } finally {
    toggleSpinner(DOM.btnSyncNow, DOM.spinSync, false);
    updateQueueCount();
  }
}
DOM.btnSyncNow.addEventListener('click', syncNow);

/* -----------------------------
 * 13) STATISTIK
 * ---------------------------*/
function refreshStatsAutosuggest(){ refreshTopikDatalist(); }
function computeStats(filters={}){
  const rows = getReports().filter(r=>{
    let ok = true;
    if (filters.from)   ok = ok && (new Date(r.waktu) >= new Date(filters.from));
    if (filters.to)     ok = ok && (new Date(r.waktu) <= new Date(filters.to));
    if (filters.unit)   ok = ok && (r.unit||'').toLowerCase().includes(filters.unit.toLowerCase());
    if (filters.divisi) ok = ok && (r.divisi||'').toLowerCase().includes(filters.divisi.toLowerCase());
    return ok;
  });
  const jumlah = rows.length;
  let sumDur = 0;
  const topikFreq={}, penanyaFreq={}, perangkumFreq={};
  rows.forEach(r=>{
    sumDur += Number(r.durasiMenit||0);
    const t = (r.topik||'').trim(); if (t) topikFreq[t] = (topikFreq[t]||0)+1;
    (r.penanya||[]).forEach(n=> penanyaFreq[n] = (penanyaFreq[n]||0)+1);
    (r.perangkum||[]).forEach(n=> perangkumFreq[n] = (perangkumFreq[n]||0)+1);
  });
  const topikTop = Object.entries(topikFreq).sort((a,b)=> b[1]-a[1])[0]?.[0] || '-';
  const rata = jumlah ? Math.round(sumDur/jumlah) : 0;
  return {
    jumlah,
    rataDurasi: rata,
    topikTop,
    penanyaTop:   Object.entries(penanyaFreq).sort((a,b)=> b[1]-a[1]).slice(0,10),
    perangkumTop: Object.entries(perangkumFreq).sort((a,b)=> b[1]-a[1]).slice(0,10),
  };
}
DOM.btnHitungStat.addEventListener('click', ()=>{
  toggleSpinner(DOM.btnHitungStat, DOM.spinStat, true);
  setTimeout(()=>{
    const stats = computeStats({
      from:  DOM.statFrom.value || null,
      to:    DOM.statTo.value   || null,
      unit:  DOM.statUnit.value.trim()   || null,
      divisi:DOM.statDivisi.value.trim() || null,
    });
    DOM.statJumlah.textContent = stats.jumlah;
    DOM.statTopik.textContent  = stats.topikTop;
    DOM.statDurasi.textContent = `${stats.rataDurasi} mnt`;
    DOM.statPenanyaTop.innerHTML  = stats.penanyaTop.map(([n,c])=> `<li>${escapeHtml(n)} <span class="badge bg-secondary">${c}</span></li>`).join('') || '<li>-</li>';
    DOM.statPerangkumTop.innerHTML= stats.perangkumTop.map(([n,c])=> `<li>${escapeHtml(n)} <span class="badge bg-secondary">${c}</span></li>`).join('') || '<li>-</li>';
    toggleSpinner(DOM.btnHitungStat, DOM.spinStat, false);
  }, 250);
});
DOM.btnClearStat.addEventListener('click', ()=>{
  DOM.statFrom.value = DOM.statTo.value = DOM.statUnit.value = DOM.statDivisi.value = '';
  DOM.statJumlah.textContent = '0'; DOM.statTopik.textContent='-'; DOM.statDurasi.textContent='0 mnt';
  DOM.statPenanyaTop.innerHTML = DOM.statPerangkumTop.innerHTML = '';
});

/* -----------------------------
 * 14) NAVIGASI & PREFILL
 * ---------------------------*/
function prefillDefaults() {
  const p = getPrefs();

  // Form Aktual
  if (DOM.askep && p.askep)    DOM.askep.value  = p.askep;
  if (DOM.divisi && p.divisi)  DOM.divisi.value = p.divisi;
  if (DOM.unit && p.unit)      DOM.unit.value   = p.unit;
  if (DOM.region && p.region)  DOM.region.value = p.region;

  // Form Rencana
  if (DOM.rencAskep && p.askep && !DOM.rencAskep.value)    DOM.rencAskep.value  = p.askep;
  if (DOM.rencDivisi && p.divisi && !DOM.rencDivisi.value) DOM.rencDivisi.value = p.divisi;
  if (DOM.rencUnit && p.unit && !DOM.rencUnit.value)       DOM.rencUnit.value   = p.unit;
  if (DOM.rencRegion && p.region && !DOM.rencRegion.value) DOM.rencRegion.value = p.region;

  // Tab Pengaturan
  if (DOM.prefAskep)  DOM.prefAskep.value  = p.askep  || '';
  if (DOM.prefDivisi) DOM.prefDivisi.value = p.divisi || '';
  if (DOM.prefUnit)   DOM.prefUnit.value   = p.unit   || '';
  if (DOM.prefRegion) DOM.prefRegion.value = p.region || '';

  // Saran mandor
  refreshMandorDatalists && refreshMandorDatalists();
}
['unit','divisi'].forEach(id=> document.getElementById(id).addEventListener('input', refreshMandorDatalists));

function initToday(){
  if (!DOM.waktu.value) DOM.waktu.value = new Date().toISOString().slice(0,10);
}
function showView(name){
  Object.entries(DOM.views).forEach(([k,el])=> el?.classList.toggle('d-none', k!==name));
  DOM.navLinks.forEach(a=> a.classList.toggle('active', a.dataset.nav === name));
  const nav = document.getElementById('mainNav');
  const bsCollapse = bootstrap.Collapse.getOrCreateInstance(nav, {toggle:false});
  if (nav.classList.contains('show')) bsCollapse.hide();

  if (name === 'history') refreshHistory();
  if (name === 'stats')   refreshStatsAutosuggest();
  if (name === 'sync'){
    updateQueueCount();
    const ts = readJSON(KEYS.lastSync, null);
    DOM.lastSyncLabel.textContent = ts ? new Date(ts).toLocaleString('id-ID', {hour12:false}) : '-';
  }
  if (name === 'matrix'){
    setAdminUI();
    refreshMatrix();
  }
  if (name === 'plan'){
    const p = getPrefs();
    if (!DOM.rencTanggal.value) DOM.rencTanggal.value = ''; // rencana: tanggal selalu kosong default
    if (p.askep   && !DOM.rencAskep.value)   DOM.rencAskep.value   = p.askep;
    if (p.divisi  && !DOM.rencDivisi.value)  DOM.rencDivisi.value  = p.divisi;
    if (p.unit    && !DOM.rencUnit.value)    DOM.rencUnit.value    = p.unit;
    if (p.region  && !DOM.rencRegion.value)  DOM.rencRegion.value  = p.region;
  }
}
DOM.navLinks.forEach(a=> a.addEventListener('click', (e)=> { e.preventDefault(); showView(a.dataset.nav); }));

/* -----------------------------
 * 15) EXPORTS (XLSX/PDF)
 * ---------------------------*/
DOM.btnExportXlsx.addEventListener('click', ()=>{
  const rows = getReports();
  if (!rows.length) return showAlert('Belum ada data untuk diekspor.', 'warning');
  const data = rows.map(r=> ({
    id: r.id, tsCreated: r.tsCreated, Askep: r.askep, Divisi: r.divisi, Unit: r.unit, Region: r.region,
    Tanggal: fmtDateWA(r.waktu), Durasi_menit: r.durasiMenit, Topik: r.topik,
    Penanya: (r.penanya||[]).join(', '), Perangkum: (r.perangkum||[]).join(', '),
    Catatan: r.catatan||'', WA_Text: r.waText||''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'LaporanGKM');
  const ts = new Date(), dd = String(ts.getDate()).padStart(2,'0'), mm = String(ts.getMonth()+1).padStart(2,'0'), yyyy = ts.getFullYear();
  XLSX.writeFile(wb, `LaporanGKM_${yyyy}${mm}${dd}.xlsx`);
});

// Matrik → XLSX snapshot (AoA dari data, bukan DOM)
DOM.btnMxXlsx.addEventListener('click', async ()=>{
  const mode  = DOM.mxMode.value;
  const year  = Number(DOM.mxYear.value||new Date().getFullYear());
  const mSel  = mode==='month' ? Number(DOM.mxMonth.value||new Date().getMonth()) : null;

  let data; try { data = await loadMatrixData(); }
  catch { return showAlert('Gagal memuat data.', 'danger'); }

  const dateMap = buildDateMap(data.plans||[], data.reports||[]);
  const wb = XLSX.utils.book_new();
  const months = (mSel==null) ? [...Array(12).keys()] : [mSel];

  months.forEach(m=>{
    const weeks = buildMonthWeeks(year, m);
    const aoa = [];
    aoa.push(dayNames);
    weeks.forEach(week=>{
      aoa.push(week.map(cell=>{
        if(!cell) return '';
        const k = cell.key, entry = dateMap[k];
        if(!entry) return String(cell.d);
        const lines = [];
        if(entry.plan.length){
          lines.push('Renc: ' + entry.plan.map(p=> `${initialsFromName(p.askep)}; ${p.divisi}; ${p.unit}; ${p.region}; ${topikTwoWords(p.topik)}`).join(' / '));
        }
        if(entry.plan.length && entry.actual.length) lines.push('====');
        if(entry.actual.length){
          lines.push('Aktual: ' + entry.actual.map(a=> `${initialsFromName(a.askep)}; ${a.divisi}; ${a.unit}; ${a.region}; ${topikTwoWords(a.topik)}`).join(' / '));
        }
        return `${cell.d}\n${lines.join('\n')}`;
      }));
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const name = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m];
    XLSX.utils.book_append_sheet(wb, ws, `${name}-${year}`);
  });

  XLSX.writeFile(wb, `MatrikGKM_${year}${mSel==null?'_12bln':('_'+String(mSel+1).padStart(2,'0'))}.xlsx`);
});

// Matrik → PDF rapi (jsPDF AutoTable)
DOM.btnMxPdf.addEventListener('click', async ()=>{
  const { jsPDF } = window.jspdf;
  const mode  = DOM.mxMode.value;
  const year  = Number(DOM.mxYear.value||new Date().getFullYear());
  const mSel  = mode==='month' ? Number(DOM.mxMonth.value||new Date().getMonth()) : null;

  let data; try { data = await loadMatrixData(); }
  catch { return showAlert('Gagal memuat data.', 'danger'); }

  const dateMap = buildDateMap(data.plans||[], data.reports||[]);
  const months = (mSel==null) ? [...Array(12).keys()] : [mSel];
  const doc = new jsPDF({orientation:'l', unit:'pt', format:'a4'});

  months.forEach((m, idx)=>{
    if (idx>0) doc.addPage();
    const title = `${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m]} ${year}`;
    doc.setFontSize(14); doc.text(title, 40, 34);

    const weeks = buildMonthWeeks(year, m);
    const body = weeks.map(week=>{
      return week.map(cell=>{
        if (!cell) return '';
        const k = cell.key, entry = dateMap[k];
        if (!entry) return String(cell.d);
        const lines = [];
        entry.plan.forEach(p=>{
          lines.push(`Renc: ${initialsFromName(p.askep)}; ${p.divisi}; ${p.unit}; ${p.region}; ${topikTwoWords(p.topik)}`);
        });
        if (entry.plan.length && entry.actual.length) lines.push('====');
        entry.actual.forEach(a=>{
          lines.push(`Aktual: ${initialsFromName(a.askep)}; ${a.divisi}; ${a.unit}; ${a.region}; ${topikTwoWords(a.topik)}`);
        });
        return `${cell.d}\n${lines.join('\n')}`;
      });
    });

    doc.autoTable({
      head: [dayNames],
      body,
      startY: 46,
      styles: { fontSize: 7, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: [245,245,245], textColor: 20, halign:'center' },
      margin: { left: 26, right: 26 }
    });
  });

  const name = `MatrikGKM_${year}${mSel==null?'_12bln':('_'+String(mSel+1).padStart(2,'0'))}.pdf`;
  doc.save(name);
});

/* -----------------------------
 * 16) ADMIN TOGGLE
 * ---------------------------*/
function setAdminUI(){
  if (MX_ADMIN){
    DOM.btnMxAdmin.classList.remove('btn-outline-secondary');
    DOM.btnMxAdmin.classList.add('btn-danger');
    DOM.btnMxAdmin.innerHTML = '<i class="bi bi-box-arrow-right"></i> Keluar Admin';
    DOM.mxInfo.textContent = 'Mode admin (server: Google Sheet).';
  } else {
    DOM.btnMxAdmin.classList.remove('btn-danger');
    DOM.btnMxAdmin.classList.add('btn-outline-secondary');
    DOM.btnMxAdmin.innerHTML = '<i class="bi bi-gear"></i>';
    DOM.mxInfo.textContent = 'Mode lokal.';
  }
}
DOM.btnMxAdmin.addEventListener('click', ()=>{
  if (!MX_ADMIN){
    const pass = prompt('Masukkan password admin:');
    if (pass === 'admin123'){
      MX_ADMIN = true;
      setAdminUI();
      showAlert('Mode Admin aktif. Data matrik ditarik langsung dari Google Sheet.', 'success');
      refreshMatrix();
    } else if (pass != null){
      showAlert('Password salah.', 'warning');
    }
  } else {
    if (confirm('Keluar dari Mode Admin dan kembali ke mode lokal?')){
      MX_ADMIN = false;
      setAdminUI();
      showAlert('Mode Admin dimatikan. Kembali ke mode lokal.', 'info');
      refreshMatrix();
    }
  }
});

/* -----------------------------
 * 17) ICS HELPERS & PUSH KALENDER (04:00)
 * ---------------------------*/
function icsEscape(s=''){ return String(s).replace(/([,;])/g,'\\$1').replace(/\n/g,'\\n'); }
function ymdLocal(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return { y, m, d };
}
function icsEventForPlan(p){
  const dt = new Date(p.waktu);
  const { y, m, d } = ymdLocal(dt);
  const uid = p.id || uuid();
  const summary = `Rencana GKM: ${topikTwoWords(p.topik)} (${p.unit}/${p.divisi}/${p.region})`;
  const desc = [
    `Askep: ${p.askep}`,
    `Divisi: ${p.divisi}`,
    `Unit: ${p.unit}`,
    `Region: ${p.region}`,
    `Topik: ${p.topik}`
  ].join('\\n');
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@gkm-reporter`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,
    `DTSTART;TZID=Asia/Jakarta:${y}${m}${d}T040000`,
    `DTEND;TZID=Asia/Jakarta:${y}${m}${d}T041500`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `LOCATION:${icsEscape(p.region||'')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Rencana GKM 04:00',
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n');
}
function buildICSString(events){
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GKM Reporter//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events.join('\r\n'),
    'END:VCALENDAR'
  ].join('\r\n');
}
function buildGCalUrlForPlan(p){
  const dt = new Date(p.waktu);
  const { y, m, d } = ymdLocal(dt);
  const start = `${y}${m}${d}T040000`;
  const end   = `${y}${m}${d}T041500`;
  const text  = `Rencana GKM: ${topikTwoWords(p.topik)} (${p.unit}/${p.divisi}/${p.region})`;
  const details = [
    `Askep: ${p.askep}`,
    `Divisi: ${p.divisi}`,
    `Unit: ${p.unit}`,
    `Region: ${p.region}`,
    `Topik: ${p.topik}`
  ].join('\n');
  const loc = p.region || '';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}&ctz=Asia/Jakarta`;
}
async function autoPushPlanToCalendar(plan){
  try{
    const icsStr = buildICSString([icsEventForPlan(plan)]);
    const blob   = new Blob([icsStr], { type:'text/calendar;charset=utf-8' });
    const fname  = `RencanaGKM_${(plan.waktu||'').slice(0,10)}_04-00.ics`;
    if (navigator.canShare){
      const file = new File([blob], fname, { type:'text/calendar' });
      if (navigator.canShare({ files:[file] })){
        await navigator.share({ files:[file], title:'Rencana GKM (04:00)', text:'Tambah ke kalender' });
        return;
      }
    }
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
    const gcal = buildGCalUrlForPlan(plan);
    setTimeout(()=> window.open(gcal, '_blank'), 500);
  } catch (e){
    const gcal = buildGCalUrlForPlan(plan);
    window.open(gcal, '_blank');
  }
}

/* -----------------------------
 * 18) INISIALISASI
 * ---------------------------*/
(function initMatrixDefaults(){
  const now = new Date();
  if (DOM.mxYear)  DOM.mxYear.value  = now.getFullYear();
  if (DOM.mxMonth) DOM.mxMonth.value = now.getMonth();
})();
DOM.mxMode.addEventListener('change', ()=>{
  const m = DOM.mxMode.value;
  DOM.mxMonth.classList.toggle('d-none', m!=='month');
  refreshMatrix();
});
DOM.mxYear.addEventListener('input', refreshMatrix);
DOM.mxMonth.addEventListener('change', refreshMatrix);
DOM.btnMxRefresh.addEventListener('click', refreshMatrix);

// Prefs page
if (DOM.btnSimpanPrefs) {
  DOM.btnSimpanPrefs.addEventListener('click', ()=>{
    const p = getPrefs();
    p.askep  = DOM.prefAskep.value.trim();
    p.divisi = DOM.prefDivisi.value.trim();
    p.unit   = DOM.prefUnit.value.trim();
    p.region = DOM.prefRegion.value.trim();
    setPrefs(p);
    showAlert('Pengaturan tersimpan.', 'success');
    prefillDefaults();
  });
} else {
  console.warn('#btnSimpanPrefs tidak ditemukan di DOM');
}

// --- Tambahkan juga handler Reset Form (Aktual) biar nggak error saat null) ---
DOM.btnClearForm?.addEventListener('click', ()=>{
  DOM.form.reset();
  penanyaTags.clear();
  perangkumTags.clear();
  initToday();
  prefillDefaults();
});

// Export laporan XLSX tombol header → sudah di atas

// Reset app
DOM.btnResetApp.addEventListener('click', ()=>{
  if (!confirm('Reset akan menghapus SEMUA data GKM di perangkat ini. Lanjutkan?')) return;
  if (!confirm('Yakin 100%? Data tidak bisa dikembalikan.')) return;
  const toDelete = [];
  for (let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if (k && k.startsWith('gkm_')) toDelete.push(k);
  }
  toDelete.forEach(k=> localStorage.removeItem(k));
  showAlert('Aplikasi direset ke kondisi awal.', 'warning', 2000);
  setTimeout(()=> location.reload(), 300);
});

// Auto-sync di jam 01–03 jika ada antrean
function maybeAutoSyncOnStartup(){
  const h = new Date().getHours();
  if (h >= 1 && h < 3 && (getQueue().length > 0 || getPlanQueue().length > 0) && SYNC.SCRIPT_URL){
    setTimeout(()=> { syncNow(); }, 1000);
  }
}

function ensurePrefEls() {
  if (!DOM.prefAskep)  DOM.prefAskep  = document.getElementById('prefAskep');
  if (!DOM.prefDivisi) DOM.prefDivisi = document.getElementById('prefDivisi');
  if (!DOM.prefUnit)   DOM.prefUnit   = document.getElementById('prefUnit');
  if (!DOM.prefRegion) DOM.prefRegion = document.getElementById('prefRegion');
}

// Init
function init(){
  ensurePrefEls();
  prefillDefaults();
  initToday();
  storageSizeLabel();
  refreshHistory();
  refreshStatsAutosuggest();
  showView('home');
  maybeAutoSyncOnStartup();
}
document.addEventListener('DOMContentLoaded', init);
