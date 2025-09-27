// app.js – toggle theme, sidebar, and in-page viewer
(function(){
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const root = document.documentElement;
  if(localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && prefersDark)){
    root.classList.add('dark');
  }
  const sidebar = document.getElementById('sidebar');
  const toggleMenu = document.getElementById('toggleMenu');
  const toggleTheme = document.getElementById('toggleTheme');
  const viewer = document.getElementById('viewer');
  const viewerTitle = document.getElementById('viewerTitle');
  const openNewTab = document.getElementById('openNewTab');

  // === Subcategory (mục con) helpers ===
  function normalize(str){ return (str||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu,'').replace(/\s+/g,'-'); }
  function inferSubcatFromPath(p){
    // Try folder pattern: tools/<grade>/<track>/<subcat>/...
    const m = p.match(/lop(10|11|12)\/(dai-so|hinh-hoc)\/([^\/]+)\//i);
    if (m) return normalize(m[3]);
    // Else from filename keywords
    const file = p.split('/').pop();
    const s = normalize(file);
    if (/(dao-ham)/.test(s)) return 'dao-ham';
    if (/(ham|ham-so)/.test(s)) return 'ham-so';
    if (/(tich-phan)/.test(s)) return 'tich-phan';
    if (/(phuong-trinh|pt-bac|he-pt)/.test(s)) return 'phuong-trinh';
    if (/(vecto|vector)/.test(s)) return 'vecto';
    if (/(tap-hop)/.test(s)) return 'tap-hop';
    return '';
  }
  function collectAllSubcats(groups){
    const set = new Set();
    (groups||[]).forEach(g=> (g.items||[]).forEach(it=>{
      const sc = it.subcat || inferSubcatFromPath(it.path||it.url||'');
      if (sc) set.add(sc);
    }));
    return Array.from(set).sort();
  }
  
  // === Grade & Track helpers ===
  function inferGradeFromPath(p){
    const s = (p||'').toLowerCase();
    // match lop10|lop11|lop12 or /10/ /11/ /12/
    let m = s.match(/lop(10|11|12)/);
    if (m) return m[1];
    m = s.match(/\/(10|11|12)\//);
    if (m) return m[1];
    return '';
  }
  function inferTrackFromPath(p){
    const s = (p||'').toLowerCase();
    if (s.includes('dai-so')) return 'dai-so';
    if (s.includes('hinh-hoc')) return 'hinh-hoc';
    // heuristics by keywords
    if (/(vector|vecto|goc|tam-giac|hinh|toa-do|toa-do|duong-tron|khong-gian)/.test(s)) return 'hinh-hoc';
    if (/(phuong-trinh|hpt|ham|dao-ham|tich-phan|cap-so|bat-dang|so-phuc|to-hop|xac-suat)/.test(s)) return 'dai-so';
    return '';
  }
  function buildModelByGradeTrack(groups){
    const model = { '10': { 'dai-so': [], 'hinh-hoc': [], 'khac': [] },
                    '11': { 'dai-so': [], 'hinh-hoc': [], 'khac': [] },
                    '12': { 'dai-so': [], 'hinh-hoc': [], 'khac': [] } };
    (groups||[]).forEach(g=> (g.items||[]).forEach(raw=>{
      const url = raw.path || raw.url || '';
      const title = raw.title || url;
      const subcat = raw.subcat || inferSubcatFromPath(url);
      const grade = raw.grade || inferGradeFromPath(url);
      const track = raw.track || inferTrackFromPath(url) || 'khac';
      if (grade && model[grade]) {
        model[grade][track] = model[grade][track] || [];
        model[grade][track].push({ title, url, subcat });
      }
    }));
    // sort by title
    for (const g of ['10','11','12']) {
      for (const t of ['dai-so','hinh-hoc','khac']) {
        model[g][t] = (model[g][t]||[]).sort((a,b)=> (a.title||'').localeCompare(b.title||'', 'vi'));
      }
    }
    return model;
  }

  function viTrackName(track){
    if (track==='dai-so') return 'Đại số';
    if (track==='hinh-hoc') return 'Hình học';
    if (track==='khac') return 'Khác';
    return track || 'Khác';
  }

  function renderMenuGradeTrack(groups, subcat){
    const wrap = document.getElementById('autoMenu');
    wrap.innerHTML = '';
    const model = buildModelByGradeTrack(groups);
    const grades = ['10','11','12'];
    grades.forEach((g, gi)=>{
      // Grade section
      const detG = document.createElement('details');
      detG.className = 'acc';
      detG.open = (gi===0); // mở Lớp 10 mặc định
      const sumG = document.createElement('summary');
      sumG.textContent = `Lớp ${g}`;
      detG.appendChild(sumG);

      // Tracks inside grade
      ['dai-so','hinh-hoc'].forEach(track=>{
        const items = (model[g][track]||[]).filter(it => !subcat || (it.subcat||'')===subcat);
        if (!items.length) return;
        const detT = document.createElement('details');
        detT.className = 'acc nested';
        detT.open = true;
        const sumT = document.createElement('summary');
        sumT.textContent = viTrackName(track);
        detT.appendChild(sumT);
        const ul = document.createElement('ul');
        items.forEach(it=>{
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = it.url;
          a.textContent = it.title;
          a.setAttribute('data-embed','1');
          li.appendChild(a);
          ul.appendChild(li);
        });
        detT.appendChild(ul);
        detG.appendChild(detT);
      });

      wrap.appendChild(detG);
    });

    // Rebind open-in-viewer behavior
    document.querySelectorAll('a[data-embed]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const url = a.getAttribute('href');
        viewer.setAttribute('src', url);
        viewerTitle.textContent = a.textContent.trim();
        openNewTab.setAttribute('href', url);
      });
    });
  }


function renderMenuWithSubcat(groups, subcat){
    const wrap = document.getElementById('autoMenu');
    wrap.innerHTML = '';
    (groups||[]).forEach((g, gi)=>{
      const items = (g.items||[]).filter(it=>{
        const sc = it.subcat || inferSubcatFromPath(it.path||it.url||'');
        if (!subcat) return true;
        return sc === subcat;
      });
      if (!items.length) return;
      const det = document.createElement('details');
      det.className = 'acc';
      if (gi===0) det.open = true;
      const sum = document.createElement('summary');
      sum.textContent = g.group || 'Nhóm';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      items.forEach(item=>{
        const url = item.path || item.url;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = url; a.textContent = item.title || url;
        a.setAttribute('data-embed','1');
        li.appendChild(a);
        ul.appendChild(li);
      });
      det.appendChild(ul);
      wrap.appendChild(det);
    });
    // rebind in-page viewer events after rerender
    document.querySelectorAll('a[data-embed]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const url = a.getAttribute('href');
        viewer.setAttribute('src', url);
        viewerTitle.textContent = a.textContent.trim();
        openNewTab.setAttribute('href', url);
      });
    });
  }


  toggleMenu.addEventListener('click', ()=> sidebar.classList.toggle('open'));
  toggleTheme.addEventListener('click', ()=>{
    root.classList.toggle('dark');
    localStorage.setItem('theme', root.classList.contains('dark') ? 'dark':'light');
  });

  document.querySelectorAll('a[data-embed]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const url = a.getAttribute('href');
      viewer.setAttribute('src', url);
      viewerTitle.textContent = a.textContent.trim();
      openNewTab.setAttribute('href', url);
      // Auto close menu on mobile
      sidebar.classList.remove('open');
    });
  });

  // Accordion: chỉ mở 1 nhóm, lưu trạng thái
  const accs = document.querySelectorAll('details.acc');
  accs.forEach((d,i)=>{
    d.addEventListener('toggle', ()=>{
      if(d.open){
        accs.forEach((x)=>{ if(x!==d) x.open=false; });
        localStorage.setItem('acc_open', i);
      }else{
        const anyOpen = Array.from(accs).some(x=>x.open);
        if(!anyOpen) localStorage.removeItem('acc_open');
      }
    });
  });
  const saved = localStorage.getItem('acc_open');
  if(saved!==null){
    const idx = parseInt(saved,10);
    if(accs[idx]) accs[idx].open = true;
  }

})();
// Auto load tool from query string (?tool=...)
(function(){
  const params = new URLSearchParams(window.location.search);
  const tool = params.get("tool");
  if(tool){
    const viewer = document.getElementById('viewer');
    const viewerTitle = document.getElementById('viewerTitle');
    const openNewTab = document.getElementById('openNewTab');

  // === Subcategory (mục con) helpers ===
  function normalize(str){ return (str||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu,'').replace(/\s+/g,'-'); }
  function inferSubcatFromPath(p){
    // Try folder pattern: tools/<grade>/<track>/<subcat>/...
    const m = p.match(/lop(10|11|12)\/(dai-so|hinh-hoc)\/([^\/]+)\//i);
    if (m) return normalize(m[3]);
    // Else from filename keywords
    const file = p.split('/').pop();
    const s = normalize(file);
    if (/(dao-ham)/.test(s)) return 'dao-ham';
    if (/(ham|ham-so)/.test(s)) return 'ham-so';
    if (/(tich-phan)/.test(s)) return 'tich-phan';
    if (/(phuong-trinh|pt-bac|he-pt)/.test(s)) return 'phuong-trinh';
    if (/(vecto|vector)/.test(s)) return 'vecto';
    if (/(tap-hop)/.test(s)) return 'tap-hop';
    return '';
  }
  function collectAllSubcats(groups){
    const set = new Set();
    (groups||[]).forEach(g=> (g.items||[]).forEach(it=>{
      const sc = it.subcat || inferSubcatFromPath(it.path||it.url||'');
      if (sc) set.add(sc);
    }));
    return Array.from(set).sort();
  }
  
  // === Grade & Track helpers ===
  function inferGradeFromPath(p){
    const s = (p||'').toLowerCase();
    // match lop10|lop11|lop12 or /10/ /11/ /12/
    let m = s.match(/lop(10|11|12)/);
    if (m) return m[1];
    m = s.match(/\/(10|11|12)\//);
    if (m) return m[1];
    return '';
  }
  function inferTrackFromPath(p){
    const s = (p||'').toLowerCase();
    if (s.includes('dai-so')) return 'dai-so';
    if (s.includes('hinh-hoc')) return 'hinh-hoc';
    // heuristics by keywords
    if (/(vector|vecto|goc|tam-giac|hinh|toa-do|toa-do|duong-tron|khong-gian)/.test(s)) return 'hinh-hoc';
    if (/(phuong-trinh|hpt|ham|dao-ham|tich-phan|cap-so|bat-dang|so-phuc|to-hop|xac-suat)/.test(s)) return 'dai-so';
    return '';
  }
  function buildModelByGradeTrack(groups){
    const model = { '10': { 'dai-so': [], 'hinh-hoc': [], 'khac': [] },
                    '11': { 'dai-so': [], 'hinh-hoc': [], 'khac': [] },
                    '12': { 'dai-so': [], 'hinh-hoc': [], 'khac': [] } };
    (groups||[]).forEach(g=> (g.items||[]).forEach(raw=>{
      const url = raw.path || raw.url || '';
      const title = raw.title || url;
      const subcat = raw.subcat || inferSubcatFromPath(url);
      const grade = raw.grade || inferGradeFromPath(url);
      const track = raw.track || inferTrackFromPath(url) || 'khac';
      if (grade && model[grade]) {
        model[grade][track] = model[grade][track] || [];
        model[grade][track].push({ title, url, subcat });
      }
    }));
    // sort by title
    for (const g of ['10','11','12']) {
      for (const t of ['dai-so','hinh-hoc','khac']) {
        model[g][t] = (model[g][t]||[]).sort((a,b)=> (a.title||'').localeCompare(b.title||'', 'vi'));
      }
    }
    return model;
  }

  function viTrackName(track){
    if (track==='dai-so') return 'Đại số';
    if (track==='hinh-hoc') return 'Hình học';
    if (track==='khac') return 'Khác';
    return track || 'Khác';
  }

  function renderMenuGradeTrack(groups, subcat){
    const wrap = document.getElementById('autoMenu');
    wrap.innerHTML = '';
    const model = buildModelByGradeTrack(groups);
    const grades = ['10','11','12'];
    grades.forEach((g, gi)=>{
      // Grade section
      const detG = document.createElement('details');
      detG.className = 'acc';
      detG.open = (gi===0); // mở Lớp 10 mặc định
      const sumG = document.createElement('summary');
      sumG.textContent = `Lớp ${g}`;
      detG.appendChild(sumG);

      // Tracks inside grade
      ['dai-so','hinh-hoc'].forEach(track=>{
        const items = (model[g][track]||[]).filter(it => !subcat || (it.subcat||'')===subcat);
        if (!items.length) return;
        const detT = document.createElement('details');
        detT.className = 'acc nested';
        detT.open = true;
        const sumT = document.createElement('summary');
        sumT.textContent = viTrackName(track);
        detT.appendChild(sumT);
        const ul = document.createElement('ul');
        items.forEach(it=>{
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = it.url;
          a.textContent = it.title;
          a.setAttribute('data-embed','1');
          li.appendChild(a);
          ul.appendChild(li);
        });
        detT.appendChild(ul);
        detG.appendChild(detT);
      });

      wrap.appendChild(detG);
    });

    // Rebind open-in-viewer behavior
    document.querySelectorAll('a[data-embed]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const url = a.getAttribute('href');
        viewer.setAttribute('src', url);
        viewerTitle.textContent = a.textContent.trim();
        openNewTab.setAttribute('href', url);
      });
    });
  }


function renderMenuWithSubcat(groups, subcat){
    const wrap = document.getElementById('autoMenu');
    wrap.innerHTML = '';
    (groups||[]).forEach((g, gi)=>{
      const items = (g.items||[]).filter(it=>{
        const sc = it.subcat || inferSubcatFromPath(it.path||it.url||'');
        if (!subcat) return true;
        return sc === subcat;
      });
      if (!items.length) return;
      const det = document.createElement('details');
      det.className = 'acc';
      if (gi===0) det.open = true;
      const sum = document.createElement('summary');
      sum.textContent = g.group || 'Nhóm';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      items.forEach(item=>{
        const url = item.path || item.url;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = url; a.textContent = item.title || url;
        a.setAttribute('data-embed','1');
        li.appendChild(a);
        ul.appendChild(li);
      });
      det.appendChild(ul);
      wrap.appendChild(det);
    });
    // rebind in-page viewer events after rerender
    document.querySelectorAll('a[data-embed]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const url = a.getAttribute('href');
        viewer.setAttribute('src', url);
        viewerTitle.textContent = a.textContent.trim();
        openNewTab.setAttribute('href', url);
      });
    });
  }

    viewer.setAttribute('src', tool);
    viewerTitle.textContent = "Xem: " + decodeURIComponent(tool.split('/').pop());
    openNewTab.setAttribute('href', tool);
  }
})();
(async function buildMenu(){
  const wrap = document.getElementById('autoMenu');
  try{
    const res = await fetch('tools/index.json', {cache:'no-store'});
    const groups = await res.json();
    wrap.innerHTML = ''; // clear

    // Populate subcat dropdown
    const sel = document.getElementById('subcatFilter');
    const subcats = collectAllSubcats(groups);
    if (sel) {
      sel.innerHTML = '<option value="">— Tất cả —</option>' + subcats.map(s=>`<option value="${s}">${s}</option>`).join('');
      sel.addEventListener('change', ()=> renderMenuGradeTrack(groups, sel.value || ''));
    }

    // Initial render (grade → track → items)
    renderMenuGradeTrack(groups, sel ? (sel.value || '') : '');

    // legacy: keep code for building items (no-op because renderMenuWithSubcat now handles)
    /*
      groups.forEach((g, gi)=>{
      const det = document.createElement('details');
      det.className = 'acc';
      if(gi===0) det.open = true;
      const sum = document.createElement('summary');
      sum.textContent = g.group || 'Nhóm';
      det.appendChild(sum);

      const ul = document.createElement('ul');
      (g.items||[]).forEach(item=>{
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.textContent = item.title || item.path;
        a.href = 'tools/' + item.path.replace(/^tools\//,'');
        a.setAttribute('data-embed','');
        a.addEventListener('click', e=>{
          e.preventDefault();
          const url = a.getAttribute('href');
          const iframe = document.getElementById('viewer');
          const title  = document.getElementById('viewerTitle');
          const open   = document.getElementById('openNewTab');
          iframe.src = url;
          title.textContent = item.title || url;
          open.href = url;
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      det.appendChild(ul);
      wrap.appendChild(det);
    });
    */
  }catch(err){
    wrap.textContent = 'Không tải được menu (tools/index.json).';
  }
})();

