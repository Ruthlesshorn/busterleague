// myteam-rankings.js — Rankings panel logic for myteam.html

function refreshRankingsTabs() {
    for (var i = 0; i < 6; i++) {
        var count = Object.keys(rLists[i].data).length;
        var loadedEl = document.getElementById('rlist-loaded-' + i);
        var countEl  = document.getElementById('rlist-count-' + i);
        var tabBtn   = document.querySelectorAll('.rtab')[i];
        var nameEl   = document.getElementById('rname-' + i);
        if (nameEl) nameEl.value = rNames[i];
        if (count > 0) {
            if (loadedEl) loadedEl.style.display = 'flex';
            if (countEl)  countEl.textContent = count + ' ranked';
            if (tabBtn)   tabBtn.textContent = (count > 0 ? '✔ ' : '') + rNames[i];
        } else {
            if (loadedEl) loadedEl.style.display = 'none';
            if (tabBtn)   tabBtn.textContent = rNames[i];
        }
    }
}

function saveRankingsName(i) {
    var el = document.getElementById('rname-' + i);
    if (!el) return;
    rNames[i] = el.value;
    localStorage.setItem(rNameKey(i), rNames[i]);
    saveRankingsToFirebase(i);
    refreshRankingsTabs();
}

function switchRankingsTab(idx) {
    activeRankTab = idx;
    var tabs = document.querySelectorAll('.rtab');
    tabs.forEach(function(t, i) {
        t.className = i === idx ? 'rtab rtab-active' : 'rtab';
    });
    for (var j = 0; j < 6; j++) {
        var pane = document.getElementById('rankings-tab-' + j);
        if (pane) pane.style.display = j === idx ? 'block' : 'none';
    }
}

function buildColMap(listIdx, cols) {
    var defs = [
        {id:'rmap-first-'+listIdx, hints:['first','firstname','fname','given']},
        {id:'rmap-last-'+listIdx,  hints:['last','lastname','lname','surname','family']},
        {id:'rmap-rank-'+listIdx,  hints:['rank','ranking','score','value','rating','#','no','num','priority']}
    ];
    defs.forEach(function(def) {
        var sel = document.getElementById(def.id);
        if (!sel) return;
        sel.innerHTML = '<option value="">— select —</option>' +
            cols.map(function(c){return '<option value="'+c.replace(/"/g,'&quot;')+'">'+c+'</option>';}).join('');
        var lower = cols.map(function(c){return c.toLowerCase();});
        def.hints.forEach(function(h){
            if (sel.value) return;
            for(var k=0;k<lower.length;k++){
                if(lower[k]===h||lower[k].indexOf(h)!==-1){sel.value=cols[k];break;}
            }
        });
    });
}

function applyRankingsList(listIdx) {
    var rows  = pendingRows[listIdx];
    if (!rows) return;
    var fCol  = document.getElementById('rmap-first-'+listIdx).value;
    var lCol  = document.getElementById('rmap-last-'+listIdx).value;
    var rCol  = document.getElementById('rmap-rank-'+listIdx).value;
    var order = document.getElementById('rmap-order-'+listIdx).value;
    if (!fCol||!lCol||!rCol) { setRStatus(listIdx,'Select all three columns.','error'); return; }
    var data={}, imported=0, skipped=0;
    rows.forEach(function(row){
        var fn=String(row[fCol]||'').trim(), ln=String(row[lCol]||'').trim();
        var rv=parseFloat(String(row[rCol]||'').replace(/,/g,''));
        if(!fn||!ln||isNaN(rv)){skipped++;return;}
        data[mkPlayerKey(fn, ln)]=rv;
        imported++;
    });
    rLists[listIdx].data  = data;
    rLists[listIdx].order = order;
    localStorage.setItem(rKey(listIdx), JSON.stringify({data: data, order: order}));
    saveRankingsToFirebase(listIdx);
    setRStatus(listIdx, '✔ '+imported+' players imported'+(skipped?' ('+skipped+' skipped).':'.'), 'ok');
    pendingRows[listIdx] = null;
    resetRankingsFile(listIdx);
    refreshRankingsTabs();
    renderPlayerSearch();
}

function confirmRankingsImport(listIdx) { applyRankingsList(listIdx); }
function cancelRankingsImport(listIdx)  { resetRankingsFile(listIdx); setRStatus(listIdx,'',''); }

function saveRankingsToFirebase(listIdx) {
    var team = getMyTeam();
    if (!window.firebaseInitialized || !team) return;
    var payload = {
        data:  rLists[listIdx].data,
        order: rLists[listIdx].order || 'asc',
        name:  rNames[listIdx] || ''
    };
    window.firebaseSet(
        window.firebaseRef(window.firebaseDB, 'rankings/' + team.toLowerCase() + '/' + listIdx),
        payload
    ).catch(function(e) { console.error('Firebase rankings save error:', e); });
}

function resetRankingsFile(listIdx) {
    var dz  = document.getElementById('rlist-dz-'  + listIdx);
    var map = document.getElementById('rlist-map-' + listIdx);
    var fi  = document.getElementById('rlist-file-'+ listIdx);
    if (dz)  dz.style.display  = 'block';
    if (map) map.style.display = 'none';
    if (fi)  fi.value = '';
}

function clearRankingsList(listIdx) {
    rLists[listIdx].data = {};
    localStorage.removeItem(rKey(listIdx));
    saveRankingsToFirebase(listIdx);
    setRStatus(listIdx,'','');
    refreshRankingsTabs();
    if (searchSortCol === '_rank'+listIdx) { searchSortCol = null; }
    renderPlayerSearch();
}

function setRStatus(listIdx, msg, type) {
    var el = document.getElementById('rlist-status-'+listIdx);
    if (!el) return;
    el.textContent = msg;
    el.className = 'rankings-status'+(type?' '+type:'');
}

function getPlayerRank(p, listIdx) {
    var key = mkPlayerKey(p.First, p.Last);
    var v = rLists[listIdx].data[key];
    return v !== undefined ? v : null;
}

function rankBadge(rank, listIdx) {
    if (rank === null) return '<td style="color:#ccc;text-align:center;">—</td>';
    var n = parseFloat(rank);
    var ord = rLists[listIdx] ? rLists[listIdx].order : 'asc';
    var isGood = ord === 'asc' ? (!isNaN(n) && n <= 10) : (!isNaN(n) && n >= 90);
    var isMid  = ord === 'asc' ? (!isNaN(n) && n <= 25) : (!isNaN(n) && n >= 75);
    var cls = isGood ? 'rank-top10' : isMid ? 'rank-top25' : 'rank-normal';
    return '<td style="text-align:center;"><span class="rank-badge '+cls+'">'+(Number.isInteger(n)?n:rank)+'</span></td>';
}

function setSearchSort(col, listIdx) {
    var li = listIdx !== undefined ? listIdx : -1;
    if (searchSortCol === col && searchSortList === li) {
        searchSortDir = searchSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        searchSortCol  = col;
        searchSortList = li;
        searchSortDir  = col.startsWith('_rank') ? 'asc' : 'desc';
    }
    renderPlayerSearch();
}

function toggleRankingsPanel() {
    var panel = document.getElementById('rankings-panel');
    if (!panel) return;
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
    if (panel.style.display === 'block') {
        refreshRankingsTabs();
        switchRankingsTab(activeRankTab);
    }
}

function handleRankingsDrop(e, listIdx) {
    e.currentTarget.classList.remove('drag-over');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleRankingsFile(file, listIdx);
}

function handleRankingsFile(file, listIdx) {
    if (!file) return;
    setRStatus(listIdx, 'Reading file\u2026', 'info');
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var rows = file.name.toLowerCase().endsWith('.csv')
                ? parseCSVRankings(e.target.result)
                : parseXLSXRankings(e.target.result);
            if (!rows || !rows.length) { setRStatus(listIdx, 'No rows found.', 'error'); return; }
            pendingRows[listIdx] = rows;
            buildColMap(listIdx, Object.keys(rows[0]));
            document.getElementById('rlist-dz-'  + listIdx).style.display = 'none';
            document.getElementById('rlist-map-' + listIdx).style.display = 'block';
            setRStatus(listIdx, 'File read \u2014 map columns then click Import.', 'info');
        } catch(err) { setRStatus(listIdx, 'Error: ' + err.message, 'error'); }
    };
    if (file.name.toLowerCase().endsWith('.csv')) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
}

function parseXLSXRankings(buf) {
    if (typeof XLSX === 'undefined') throw new Error('Use a .csv file (SheetJS unavailable).');
    var wb = XLSX.read(new Uint8Array(buf), {type:'array'});
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:''});
}

function parseCSVRankings(text) {
    var lines = text.split(/\r?\n/).filter(function(l){return l.trim();});
    if (!lines.length) return [];
    var headers = splitCSVLine(lines[0]);
    return lines.slice(1).map(function(line) {
        var vals = splitCSVLine(line), obj = {};
        headers.forEach(function(h,i){obj[h.trim()]=(vals[i]||'').trim();});
        return obj;
    });
}

function splitCSVLine(line) {
    var out=[],cur='',inQ=false;
    for(var i=0;i<line.length;i++){
        var c=line[i];
        if(c==='"'){inQ=!inQ;}
        else if(c===','&&!inQ){out.push(cur);cur='';}
        else{cur+=c;}
    }
    out.push(cur); return out;
}
