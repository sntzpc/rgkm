/* ==========================
   GKM Reporter – v2.0 (Sync GSheet)
   ========================== */

const KEYS = {
  reports: 'gkm_reports',
  queue: 'gkm_queue',
  prefs: 'gkm_prefs',
  mandorIndex: 'gkm_mandor_index',
  lastSync: 'gkm_last_sync'
};

// === Sync config (hardcoded) ===
// TODO: isi SCRIPT_URL dengan URL Web App Apps Script Anda
const SYNC = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx_7N-S1i7VJQXik-zuUS_tkydc94FizTAQqSMs41xce4Z1RLKMEYuXCTP2u-4Gd_w/exec',
  SHEET_NAME: 'LaporanGKM'
};


const DOM = {
  navLinks: document.querySelectorAll('[data-nav]'),
  views: {
    home: document.getElementById('view-home'),
    history: document.getElementById('view-history'),
    stats: document.getElementById('view-stats'),
    sync: document.getElementById('view-sync'),
    settings: document.getElementById('view-settings')
  },
  alertRegion: document.getElementById('alertRegion'),

  // Form
  form: document.getElementById('formLaporan'),
  askep: document.getElementById('askep'),
  divisi: document.getElementById('divisi'),
  unit: document.getElementById('unit'),
  region: document.getElementById('region'),
  waktu: document.getElementById('waktu'),
  durasi: document.getElementById('durasi'),
  topik: document.getElementById('topik'),
  topikList: document.getElementById('topikList'),
  penanyaWrap: document.getElementById('penanyaTags'),
  penanyaInput: document.getElementById('penanyaInput'),
  penanyaList: document.getElementById('penanyaList'),
  perangkumWrap: document.getElementById('perangkumTags'),
  perangkumInput: document.getElementById('perangkumInput'),
  perangkumList: document.getElementById('perangkumList'),
  catatan: document.getElementById('catatan'),
  btnSimpan: document.getElementById('btnSimpan'),
  btnClearForm: document.getElementById('btnClearForm'),
  spinSave: document.getElementById('spinSave'),

  // Modal WA
  waTanggal: document.getElementById('waTanggal'),
  waPreview: document.getElementById('waPreview'),
  btnRegenWA: document.getElementById('btnRegenWA'),
  btnCopyWA: document.getElementById('btnCopyWA'),

  // History
  historyBody: document.getElementById('historyBody'),
  historyInfo: document.getElementById('historyInfo'),
  historyPager: document.getElementById('historyPager'),
  historySearch: document.getElementById('historySearch'),
  pageSize: document.getElementById('pageSize'),

  // Stats
  statFrom: document.getElementById('statFrom'),
  statTo: document.getElementById('statTo'),
  statUnit: document.getElementById('statUnit'),
  statDivisi: document.getElementById('statDivisi'),
  btnHitungStat: document.getElementById('btnHitungStat'),
  btnClearStat: document.getElementById('btnClearStat'),
  spinStat: document.getElementById('spinStat'),
  statJumlah: document.getElementById('statJumlah'),
  statTopik: document.getElementById('statTopik'),
  statDurasi: document.getElementById('statDurasi'),
  statPenanyaTop: document.getElementById('statPenanyaTop'),
  statPerangkumTop: document.getElementById('statPerangkumTop'),

  // Sync
  syncQueueCount: document.getElementById('syncQueueCount'),
  btnSyncNow: document.getElementById('btnSyncNow'),
  spinSync: document.getElementById('spinSync'),
  syncStatus: document.getElementById('syncStatus'),
  lastSyncLabel: document.getElementById('lastSyncLabel'),

  // Prefs
  prefAskep: document.getElementById('prefAskep'),
  prefDivisi: document.getElementById('prefDivisi'),
  prefUnit: document.getElementById('prefUnit'),
  prefRegion: document.getElementById('prefRegion'),
  btnSimpanPrefs: document.getElementById('btnSimpanPrefs'),

  // Header buttons
  btnExportXlsx: document.getElementById('btnExportXlsx'),
  btnResetApp: document.getElementById('btnResetApp'),

  // Storage meter
  storageBar: document.getElementById('storageBar'),
  storageLabel: document.getElementById('storageLabel'),
};

// =============== Utilities ===============
const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
    const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
function fmtDateWA(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dName = dayNames[d.getDay()];
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dName}, ${dd}/${mm}/${yyyy}`;
}
function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function storageSizeLabel() {
  let total = 0;
  for (let i=0; i<localStorage.length; i++) {
    const k = localStorage.key(i);
    const v = localStorage.getItem(k);
    total += k.length + (v?.length||0);
  }
  const kb = total/1024;
  const mb = kb/1024;
  const label = kb < 1024 ? `${kb.toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  const pct = Math.min(100, (total / (5*1024*1024)) * 100);
  DOM.storageBar.style.width = `${pct.toFixed(1)}%`;
  DOM.storageLabel.textContent = `${label} / ~5 MB`;
}
function readJSON(key, defVal) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(defVal)); }
  catch { return defVal; }
}
function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); storageSizeLabel(); }
function showAlert(html, type='info', timeout=3000) {
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.innerHTML = `${html}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  DOM.alertRegion.appendChild(el);
  if (timeout) setTimeout(()=> bootstrap.Alert.getOrCreateInstance(el).close(), timeout);
}
function toggleSpinner(btnEl, spinnerEl, on=true) { btnEl.disabled = on; spinnerEl?.classList.toggle('d-none', !on); }

// =============== Data Access ===============
function getReports() { return readJSON(KEYS.reports, []); }
function setReports(arr) { writeJSON(KEYS.reports, arr); }
function getPrefs() { return readJSON(KEYS.prefs, {}); }
function setPrefs(p) { writeJSON(KEYS.prefs, p); }
function getMandorIndex() { return readJSON(KEYS.mandorIndex, {}); }
function setMandorIndex(m) { writeJSON(KEYS.mandorIndex, m); }

function getQueue() { return readJSON(KEYS.queue, []); }
function setQueue(q) { writeJSON(KEYS.queue, q); updateQueueCount(); }
function enqueue(id) {
  const q = new Set(getQueue());
  q.add(id);
  setQueue(Array.from(q));
}
function dequeueMany(ids=[]) {
  const q = new Set(getQueue());
  ids.forEach(id=> q.delete(id));
  setQueue(Array.from(q));
}
function updateQueueCount() {
  DOM.syncQueueCount.textContent = String(getQueue().length);
}

// =============== Mandor Index ===============
function comboKey(unit, divisi) { return `${(unit||'').trim().toUpperCase()}|${(divisi||'').trim().toUpperCase()}`; }
function updateMandorIndex(unit, divisi, penanyaArr, perangkumArr) {
  const idx = getMandorIndex();
  const key = comboKey(unit, divisi);
  if (!idx[key]) idx[key] = { penanya: [], perangkum: [] };
  const penSet = new Set(idx[key].penanya);
  const perSet = new Set(idx[key].perangkum);
  (penanyaArr||[]).forEach(n=> penSet.add(n));
  (perangkumArr||[]).forEach(n=> perSet.add(n));
  idx[key].penanya = Array.from(penSet).sort();
  idx[key].perangkum = Array.from(perSet).sort();
  setMandorIndex(idx);
}
function getMandorSuggestions(unit, divisi) {
  const idx = getMandorIndex();
  const key = comboKey(unit, divisi);
  return idx[key] || { penanya: [], perangkum: [] };
}

// =============== Tags Input (chips) ===============
function initTags(wrapperEl, inputEl) {
  const tags = [];
  function render() {
    wrapperEl.querySelectorAll('.tag').forEach(e=> e.remove());
    tags.forEach((t,i)=>{
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.innerHTML = `<span>${t}</span> <button type="button" data-i="${i}" aria-label="Hapus"><i class="bi bi-x"></i></button>`;
      wrapperEl.insertBefore(chip, inputEl);
    });
  }
  function addTagFromInput() {
    let val = inputEl.value.trim();
    if (!val) return;
    val.split(',').map(s=>s.trim()).filter(Boolean).forEach(v=>{
      if (!tags.includes(v)) tags.push(v);
    });
    inputEl.value = ''; render();
  }
  inputEl.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTagFromInput(); }
    else if (e.key === 'Backspace' && !inputEl.value && tags.length) { tags.pop(); render(); }
  });
  wrapperEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-i]');
    if (btn) { const i = +btn.dataset.i; tags.splice(i,1); render(); }
    else { inputEl.focus(); }
  });
  return { get: ()=> [...tags], set: (arr=[])=>{ tags.splice(0,tags.length, ...arr.filter(Boolean)); render(); }, addMany: (arr=[])=>{ arr.forEach(v=>{ if(!tags.includes(v)) tags.push(v); }); render(); }, clear: ()=> { tags.splice(0,tags.length); render(); } };
}
const penanyaTags = initTags(DOM.penanyaWrap, DOM.penanyaInput);
const perangkumTags = initTags(DOM.perangkumWrap, DOM.perangkumInput);

// =============== Auto Suggest Topik ===============
function buildTopikFrequency() {
  const freq = {};
  for (const r of getReports()) {
    const t = (r.topik||'').trim();
    if (!t) continue;
    freq[t] = (freq[t]||0)+1;
  }
  return Object.entries(freq).sort((a,b)=> b[1]-a[1]).map(([k])=>k);
}
function refreshTopikDatalist() {
  const topN = buildTopikFrequency().slice(0,20);
  DOM.topikList.innerHTML = topN.map(t=> `<option value="${escapeHtml(t)}">`).join('');
}
// Mandor suggestions
function refreshMandorDatalists() {
  const unit = DOM.unit.value;
  const div = DOM.divisi.value;
  const { penanya, perangkum } = getMandorSuggestions(unit, div);
  DOM.penanyaList.innerHTML = penanya.map(n=> `<option value="${escapeHtml(n)}">`).join('');
  DOM.perangkumList.innerHTML = perangkum.map(n=> `<option value="${escapeHtml(n)}">`).join('');
}

// =============== WA Generator ===============
function buildWaText(data, tanggalOverrideIso) {
  const penanyaLines = (data.penanya||[]).map((n,i)=> `${i+1}. ${n}`).join('\n') || '—';
  const perangkumLines = (data.perangkum||[]).map((n,i)=> `${i+1}. ${n}`).join('\n') || '—';
  const tgl = fmtDateWA(tanggalOverrideIso || data.waktu);
  const catatanBlock = data.catatan && data.catatan.trim() ? `\nCatatan:\n${data.catatan.trim()}` : '';
  return [
`*LAPORAN GUGUS KERJA MANDOR*`,
`Nama Askep: ${data.askep}`,
`Divisi: ${data.divisi}`,
`Unit: ${data.unit}`,
`Region: ${data.region}`,
'',
`Hari & Waktu: ${tgl}`,
`Durasi: ${data.durasiMenit} menit`,
`Topik/Materi: ${data.topik}`,
'',
`Nama mandor yang mengajukan pertanyaan:`,
penanyaLines,
'',
`Nama mandor yang melakukan ringkasan:`,
perangkumLines,
catatanBlock ? `\n${catatanBlock}` : '',
'',
`Demikian kami sampaikan, terima kasih.`
  ].join('\n');
}

// =============== History Rendering ===============
let historyState = { page: 1, pageSize: 20, filter: '' };
let EDIT_ID = null;
function refreshHistory() {
  const rows = getReports();
  const filter = (historyState.filter || '').toLowerCase();

  // Ambil antrean pending dari localStorage (kalau ada fungsi getQueue)
  const pendingSet = (typeof getQueue === 'function')
    ? new Set(getQueue())
    : new Set();

  const filt = !filter ? rows : rows.filter(r => {
    const hay = [r.askep, r.divisi, r.unit, r.region, r.topik, fmtDateWA(r.waktu)]
      .join(' ')
      .toLowerCase();
    return hay.includes(filter);
  });

  const total = filt.length;
  const pageSize = historyState.pageSize;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  historyState.page = Math.min(historyState.page, pages);

  const start = (historyState.page - 1) * pageSize;
  const slice = filt.slice(start, start + pageSize);

  DOM.historyBody.innerHTML = slice.map(r => {
    const penCount = r.penanya?.length || 0;
    const perCount = r.perangkum?.length || 0;

    const actions = `
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-primary" data-act="edit" data-id="${r.id}" title="Edit">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-outline-success" data-act="wa" data-id="${r.id}" title="Generate WA">
          <i class="bi bi-whatsapp"></i>
        </button>
      </div>
    `;

    // Status sync per baris
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

  if (typeof updateQueueCount === 'function') updateQueueCount();
}
function renderPager(page, pages) {
  function pageItem(p, label = p, active=false, disabled=false) {
    return `<li class="page-item ${active?'active':''} ${disabled?'disabled':''}">
      <a class="page-link" href="#" data-page="${p}">${label}</a></li>`;
  }
  if (pages <= 1) return '';
  const items = [];
  items.push(pageItem(1, '«', false, page===1));
  let start = Math.max(1, page-2);
  let end = Math.min(pages, page+2);
  if (start > 1) items.push(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
  for (let p=start; p<=end; p++) items.push(pageItem(p, p, p===page));
  if (end < pages) items.push(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
  items.push(pageItem(pages, '»', false, page===pages));
  return items.join('');
}
DOM.historyPager.addEventListener('click', (e)=>{
  const a = e.target.closest('a[data-page]');
  if (!a) return; e.preventDefault();
  historyState.page = +a.dataset.page;
  refreshHistory();
});
DOM.historySearch.addEventListener('input', ()=>{
  historyState.filter = DOM.historySearch.value.trim();
  historyState.page = 1; refreshHistory();
});
DOM.pageSize.addEventListener('change', ()=>{
  historyState.pageSize = +DOM.pageSize.value;
  historyState.page = 1; refreshHistory();
});
DOM.historyBody.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  const r = getReports().find(x=> x.id === id);
  if (!r) return;

  if (act === 'wa') {
    const wa = buildWaText(r);
    DOM.waTanggal.value = (r.waktu||'').slice(0,10);
    DOM.waPreview.value = wa;
    new bootstrap.Modal('#modalWA').show();
  } else if (act === 'edit') {
    loadReportToForm(r);
  }
});


// =============== Build & Validate Report ===============
function buildReportFromForm() {
  return {
    id: uuid(),
    tsCreated: new Date().toISOString(),
    askep: DOM.askep.value.trim(),
    divisi: DOM.divisi.value.trim(),
    unit: DOM.unit.value.trim(),
    region: DOM.region.value.trim(),
    waktu: DOM.waktu.value ? new Date(DOM.waktu.value).toISOString() : '',
    durasiMenit: Number(DOM.durasi.value||0),
    topik: DOM.topik.value.trim(),
    penanya: penanyaTags.get(),
    perangkum: perangkumTags.get(),
    catatan: DOM.catatan.value
  };
}
function loadReportToForm(r) {
  EDIT_ID = r.id; // aktifkan mode edit

  DOM.askep.value   = r.askep || '';
  DOM.divisi.value  = r.divisi || '';
  DOM.unit.value    = r.unit || '';
  DOM.region.value  = r.region || '';
  DOM.waktu.value   = r.waktu ? r.waktu.slice(0,10) : '';
  DOM.durasi.value  = r.durasiMenit || '';
  DOM.topik.value   = r.topik || '';
  penanyaTags.set(r.penanya || []);
  perangkumTags.set(r.perangkum || []);
  DOM.catatan.value = r.catatan || '';

  refreshMandorDatalists();
  showView('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showAlert('Mode edit aktif. Setelah disimpan, data akan menimpa yang lama & masuk antrean sync.', 'info', 4000);
}
function validateReport(data) {
  const required = ['askep','divisi','unit','region','waktu','durasiMenit','topik'];
  for (const k of required) if (!data[k] || (k==='durasiMenit' && data[k] <= 0)) return false;
  return true;
}

// =============== Form events ===============
DOM.btnRegenWA.addEventListener('click', ()=>{
  const data = buildReportFromForm();
  if (!validateReport(data)) return;
  const override = DOM.waTanggal.value ? new Date(DOM.waTanggal.value).toISOString() : null;
  DOM.waPreview.value = buildWaText(data, override);
});
DOM.btnCopyWA.addEventListener('click', async ()=>{
  try { await navigator.clipboard.writeText(DOM.waPreview.value || ''); showAlert('Teks WA disalin ke clipboard.', 'success'); }
  catch { showAlert('Gagal menyalin ke clipboard.', 'danger'); }
});

DOM.form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = buildReportFromForm();
  if (!validateReport(data)) return showAlert('Lengkapi field bertanda * terlebih dahulu.', 'warning');
  toggleSpinner(DOM.btnSimpan, DOM.spinSave, true);

  // Ingat default
  const prefs = getPrefs();
  prefs.askep = data.askep; prefs.divisi = data.divisi; prefs.unit = data.unit; prefs.region = data.region;
  setPrefs(prefs);

  // Update indeks mandor
  updateMandorIndex(data.unit, data.divisi, data.penanya, data.perangkum);
  refreshMandorDatalists();

  const arr = getReports();
  let msg = '';

  if (EDIT_ID) {
    // overwrite record lama dg ID yang sama
    const idx = arr.findIndex(x => x.id === EDIT_ID);
    if (idx !== -1) {
      const old = arr[idx];
      const updated = {
        ...data,
        id: old.id,                  // pertahankan ID
        tsCreated: old.tsCreated,    // pertahankan tsCreated
        waText: buildWaText(data)
      };
      arr[idx] = updated;
      setReports(arr);
      enqueue(old.id);               // masuk antrean sync
      msg = 'Laporan diperbarui & masuk antrean sync.';
    } else {
      // fallback: jika ID tak ketemu, simpan sebagai baru
      const report = { ...data, waText: buildWaText(data) };
      arr.unshift(report); setReports(arr); enqueue(report.id);
      msg = 'Laporan disimpan & masuk antrean sync.';
    }
    EDIT_ID = null; // keluar dari mode edit
  } else {
    // mode tambah baru
    const report = { ...data, waText: buildWaText(data) };
    arr.unshift(report);
    setReports(arr);
    enqueue(report.id);
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


// Prefs page
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

// Export XLSX
DOM.btnExportXlsx.addEventListener('click', ()=>{
  const rows = getReports();
  if (!rows.length) return showAlert('Belum ada data untuk diekspor.', 'warning');
  const data = rows.map(r=> ({
    id: r.id, tsCreated: r.tsCreated, Askep: r.askep, Divisi: r.divisi, Unit: r.unit, Region: r.region,
    Tanggal: fmtDateWA(r.waktu), Durasi_menit: r.durasiMenit, Topik: r.topik,
    Penanya: (r.penanya||[]).join(', '), Perangkum: (r.perangkum||[]).join(', '), Catatan: r.catatan||'', WA_Text: r.waText||''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'LaporanGKM');
  const ts = new Date(), dd = String(ts.getDate()).padStart(2,'0'), mm = String(ts.getMonth()+1).padStart(2,'0'), yyyy = ts.getFullYear();
  XLSX.writeFile(wb, `LaporanGKM_${yyyy}${mm}${dd}.xlsx`);
});

// Reset app
DOM.btnResetApp.addEventListener('click', ()=>{
  if (!confirm('Reset akan menghapus SEMUA data GKM di perangkat ini. Lanjutkan?')) return;
  if (!confirm('Yakin 100%? Data tidak bisa dikembalikan.')) return;
  const toDelete = [];
  for (let i=0; i<localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('gkm_')) toDelete.push(k); }
  toDelete.forEach(k=> localStorage.removeItem(k));
  showAlert('Aplikasi direset ke kondisi awal.', 'warning', 2000);
  setTimeout(()=> location.reload(), 300);
});

// =============== Sync Client (NO CORS) ===============
function getReportsByIds(ids) {
  const map = new Map(getReports().map(r=> [r.id, r]));
  return ids.map(id=> map.get(id)).filter(Boolean);
}
function buildPayloadArray(reports) {
  return reports.map(r=> ({
    id: r.id,
    tsCreated: r.tsCreated,
    askep: r.askep,
    divisi: r.divisi,
    unit: r.unit,
    region: r.region,
    waktu: r.waktu,
    durasiMenit: r.durasiMenit,
    topik: r.topik,
    penanya: r.penanya||[],
    perangkum: r.perangkum||[],
    catatan: r.catatan||'',
    waText: r.waText||''
  }));
}
async function syncBatch(ids, scriptUrl, sheetName) {
  const reports = getReportsByIds(ids);
  if (!reports.length) return true;
  const payload = JSON.stringify(buildPayloadArray(reports));
  // NO CORS: gunakan FormData agar tidak memicu preflight
  const fd = new FormData();
  fd.append('payload', payload);
  fd.append('sheetName', sheetName || 'LaporanGKM');

  // fetch dengan mode no-cors → tidak bisa baca body/respons, sukses jaringan = resolve
  await fetch(scriptUrl, { method: 'POST', mode: 'no-cors', body: fd });
  return true;
}
async function syncNow() {
  const scriptUrl = (SYNC.SCRIPT_URL || '').trim();
  const sheetName = (SYNC.SHEET_NAME || 'LaporanGKM').trim();

  if (!scriptUrl) {
    showAlert('SCRIPT_URL belum diatur di app.js.', 'warning');
    return;
  }
  const queue = getQueue();
  if (!queue.length) {
    showAlert('Tidak ada data di antrean.', 'info');
    return;
  }

  toggleSpinner(DOM.btnSyncNow, DOM.spinSync, true);
  DOM.syncStatus.textContent = 'Mengirim...';

  const BATCH = 50;
  let cursor = 0;
  const sentIds = [];
  try {
    while (cursor < queue.length) {
      const chunk = queue.slice(cursor, cursor + BATCH);
      await syncBatch(chunk, scriptUrl, sheetName);
      sentIds.push(...chunk);
      cursor += BATCH;
    }
    dequeueMany(sentIds);
    const ts = new Date().toISOString();
    writeJSON(KEYS.lastSync, ts);
    DOM.lastSyncLabel.textContent = new Date(ts).toLocaleString('id-ID', { hour12:false });
    DOM.syncStatus.textContent = `Sukses kirim ${sentIds.length} item.`;
    showAlert(`Sync selesai: ${sentIds.length} item terkirim.`, 'success');
  } catch (err) {
    console.error(err);
    DOM.syncStatus.textContent = 'Gagal. Periksa jaringan & URL.';
    showAlert('Sync gagal. Cek koneksi/URL lalu coba lagi.', 'danger');
  } finally {
    toggleSpinner(DOM.btnSyncNow, DOM.spinSync, false);
    updateQueueCount();
  }
}

DOM.btnSyncNow.addEventListener('click', syncNow);

// Auto-sync saat app dibuka di jam 01:00–03:00 (waktu perangkat)
function maybeAutoSyncOnStartup() {
  const h = new Date().getHours();
  if (h >= 1 && h < 3 && getQueue().length > 0 && SYNC.SCRIPT_URL) {
    setTimeout(()=> { syncNow(); }, 1000);
  }
}

// =============== Stats ===============
function refreshStatsAutosuggest() { refreshTopikDatalist(); }
function computeStats(filters = {}) {
  const rows = getReports().filter(r=>{
    let ok = true;
    if (filters.from) ok = ok && (new Date(r.waktu) >= new Date(filters.from));
    if (filters.to) ok = ok && (new Date(r.waktu) <= new Date(filters.to));
    if (filters.unit) ok = ok && (r.unit||'').toLowerCase().includes(filters.unit.toLowerCase());
    if (filters.divisi) ok = ok && (r.divisi||'').toLowerCase().includes(filters.divisi.toLowerCase());
    return ok;
  });
  const jumlah = rows.length;
  let sumDur = 0;
  const topikFreq = {}, penanyaFreq = {}, perangkumFreq = {};
  for (const r of rows) {
    sumDur += Number(r.durasiMenit||0);
    const t = (r.topik||'').trim(); if (t) topikFreq[t] = (topikFreq[t]||0)+1;
    (r.penanya||[]).forEach(n=> penanyaFreq[n] = (penanyaFreq[n]||0)+1);
    (r.perangkum||[]).forEach(n=> perangkumFreq[n] = (perangkumFreq[n]||0)+1);
  }
  const topikTop = Object.entries(topikFreq).sort((a,b)=> b[1]-a[1])[0]?.[0] || '-';
  const rata = jumlah ? Math.round(sumDur/jumlah) : 0;
  return {
    jumlah, rataDurasi: rata, topikTop,
    penanyaTop: Object.entries(penanyaFreq).sort((a,b)=> b[1]-a[1]).slice(0,10),
    perangkumTop: Object.entries(perangkumFreq).sort((a,b)=> b[1]-a[1]).slice(0,10),
  };
}
document.getElementById('btnHitungStat').addEventListener('click', ()=>{
  toggleSpinner(DOM.btnHitungStat, DOM.spinStat, true);
  setTimeout(()=>{
    const stats = computeStats({
      from: DOM.statFrom.value || null,
      to: DOM.statTo.value || null,
      unit: DOM.statUnit.value.trim() || null,
      divisi: DOM.statDivisi.value.trim() || null,
    });
    DOM.statJumlah.textContent = stats.jumlah;
    DOM.statTopik.textContent = stats.topikTop;
    DOM.statDurasi.textContent = `${stats.rataDurasi} mnt`;
    DOM.statPenanyaTop.innerHTML = stats.penanyaTop.map(([n,c])=> `<li>${escapeHtml(n)} <span class="badge bg-secondary">${c}</span></li>`).join('') || '<li>-</li>';
    DOM.statPerangkumTop.innerHTML = stats.perangkumTop.map(([n,c])=> `<li>${escapeHtml(n)} <span class="badge bg-secondary">${c}</span></li>`).join('') || '<li>-</li>';
    toggleSpinner(DOM.btnHitungStat, DOM.spinStat, false);
  }, 250);
});
document.getElementById('btnClearStat').addEventListener('click', ()=>{
  DOM.statFrom.value = DOM.statTo.value = DOM.statUnit.value = DOM.statDivisi.value = '';
  DOM.statJumlah.textContent = '0'; DOM.statTopik.textContent = '-'; DOM.statDurasi.textContent = '0 mnt';
  DOM.statPenanyaTop.innerHTML = DOM.statPerangkumTop.innerHTML = '';
});

// =============== Navigation & Prefill ===============
function prefillDefaults() {
  const p = getPrefs();
  if (p.askep)  DOM.askep.value  = p.askep;
  if (p.divisi) DOM.divisi.value = p.divisi;
  if (p.unit)   DOM.unit.value   = p.unit;
  if (p.region) DOM.region.value = p.region;

  DOM.prefAskep.value  = p.askep  || '';
  DOM.prefDivisi.value = p.divisi || '';
  DOM.prefUnit.value   = p.unit   || '';
  DOM.prefRegion.value = p.region || '';

  refreshMandorDatalists();
}
['unit','divisi'].forEach(id=> document.getElementById(id).addEventListener('input', refreshMandorDatalists));
function initToday() {
  if (!DOM.waktu.value) DOM.waktu.value = new Date().toISOString().slice(0,10);
}
function showView(name) {
  Object.entries(DOM.views).forEach(([k,el])=> el.classList.toggle('d-none', k!==name));
  DOM.navLinks.forEach(a=> a.classList.toggle('active', a.dataset.nav === name));
  const nav = document.getElementById('mainNav');
  const bsCollapse = bootstrap.Collapse.getOrCreateInstance(nav, {toggle:false});
  if (nav.classList.contains('show')) bsCollapse.hide();
  if (name === 'history') refreshHistory();
  if (name === 'stats') refreshStatsAutosuggest();
  if (name === 'sync') { updateQueueCount(); const ts = readJSON(KEYS.lastSync, null); DOM.lastSyncLabel.textContent = ts ? new Date(ts).toLocaleString('id-ID',{hour12:false}) : '-'; }
}
DOM.navLinks.forEach(a=> a.addEventListener('click', (e)=> { e.preventDefault(); showView(a.dataset.nav); }));

function init() {
  prefillDefaults();
  initToday();
  storageSizeLabel();
  refreshHistory();
  refreshStatsAutosuggest();
  showView('home');
  maybeAutoSyncOnStartup();
}
init();
