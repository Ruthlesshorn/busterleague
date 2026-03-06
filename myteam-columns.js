// myteam-columns.js — Column visibility, ordering, and picker logic for search, roster, watchlist

// ── Search column picker ────────────────────────────────────────

function saveColPrefs() {
    localStorage.setItem(colPrefsKeyH(), JSON.stringify(Array.from(hiddenHitterCols)));
    localStorage.setItem(colPrefsKeyP(), JSON.stringify(Array.from(hiddenPitcherCols)));
    var oh = colPrefsKeyH() + '_order', op = colPrefsKeyP() + '_order';
    if (searchColOrderHitter)  localStorage.setItem(oh, JSON.stringify(searchColOrderHitter));
    if (searchColOrderPitcher) localStorage.setItem(op, JSON.stringify(searchColOrderPitcher));
    var team = getMyTeam();
    if (window.firebaseInitialized && team) {
        window.firebaseSet(window.firebaseRef(window.firebaseDB, 'colprefs/' + team.toLowerCase() + '/search'), {
            hitter:       Array.from(hiddenHitterCols),
            pitcher:      Array.from(hiddenPitcherCols),
            hitterOrder:  searchColOrderHitter  || null,
            pitcherOrder: searchColOrderPitcher || null
        }).catch(function(e) { console.error('Firebase search colprefs save error:', e); });
    }
    var toast = document.getElementById('save-toast');
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

function toggleSearchColPicker(type) {
    var hPanel = document.getElementById('col-picker-search-hitter');
    var pPanel = document.getElementById('col-picker-search-pitcher');
    if (type === 'hitter') {
        var openH = hPanel.style.display === 'none';
        hPanel.style.display = openH ? '' : 'none';
        if (pPanel) pPanel.style.display = 'none';
        if (openH) buildSearchColCheckboxes('hitter');
    } else {
        var openP = pPanel.style.display === 'none';
        pPanel.style.display = openP ? '' : 'none';
        if (hPanel) hPanel.style.display = 'none';
        if (openP) buildSearchColCheckboxes('pitcher');
    }
}

function resetSearchColOrder(type) {
    if (type === 'hitter') searchColOrderHitter  = null;
    else                   searchColOrderPitcher = null;
    buildSearchColCheckboxes(type);
    renderPlayerSearch();
    saveColPrefs();
}

function toggleSearchReorder(type) {
    searchReorderMode[type] = !searchReorderMode[type];
    var btn = document.getElementById('search-reorder-btn-' + type);
    if (btn) {
        btn.style.background = searchReorderMode[type] ? 'var(--team-secondary)' : 'var(--team-secondary-subtle)';
        btn.style.color      = searchReorderMode[type] ? 'white'   : 'var(--team-secondary)';
        btn.textContent      = searchReorderMode[type] ? '\u2713 Done' : '\u2195 Reorder';
    }
    buildSearchColCheckboxes(type);
}

function getSearchOrderedCols(type, hiddenSet) {
    var allCols = type === 'hitter' ? ALL_HITTER_COLS : ALL_PITCHER_COLS;
    var order   = type === 'hitter' ? searchColOrderHitter : searchColOrderPitcher;
    var always  = ['watch','dnw','name','P','status'];
    var ordered;
    if (order && order.length) {
        var colMap = {};
        allCols.forEach(function(c) { colMap[c.key] = c; });
        var nonAlways = order.map(function(k) { return colMap[k]; })
            .filter(function(c) { return c && always.indexOf(c.key) === -1; });
        allCols.forEach(function(c) {
            if (order.indexOf(c.key) === -1 && always.indexOf(c.key) === -1) nonAlways.push(c);
        });
        var alwaysCols = allCols.filter(function(c) { return always.indexOf(c.key) !== -1; });
        ordered = alwaysCols.concat(nonAlways);
    } else { ordered = allCols.slice(); }
    return ordered.filter(function(c) { return !hiddenSet.has(c.key); });
}

function buildSearchColCheckboxes(type) {
    var cols    = type === 'hitter' ? ALL_HITTER_COLS  : ALL_PITCHER_COLS;
    var hidden  = type === 'hitter' ? hiddenHitterCols : hiddenPitcherCols;
    var order   = type === 'hitter' ? searchColOrderHitter : searchColOrderPitcher;
    var grid    = document.getElementById('col-checkboxes-search-' + type);
    if (!grid) return;
    var always  = ['watch','dnw','name','P','status'];
    var orderedCols;
    if (order && order.length) {
        var colMap = {};
        cols.forEach(function(c) { colMap[c.key] = c; });
        orderedCols = order.map(function(k) { return colMap[k]; }).filter(Boolean);
        cols.forEach(function(c) { if (order.indexOf(c.key) === -1) orderedCols.push(c); });
    } else { orderedCols = cols.slice(); }
    var showCols = orderedCols.filter(function(c) { return always.indexOf(c.key) === -1; });
    showCols.forEach(function(c) {
        if (c.rankCol !== undefined) c.label = rNames[c.rankCol] || ('Rank ' + (c.rankCol+1));
    });
    if (searchReorderMode[type]) {
        grid.className = 'col-order-grid';
        grid.innerHTML = showCols.map(function(c) {
            var isHid = hidden.has(c.key);
            return '<div class="col-order-chip' + (isHid ? ' hidden-col' : '') + '" draggable="true"'
                + ' data-key="' + c.key + '" data-type="' + type + '"'
                + ' ondragstart="searchDragStart(event)" ondragover="searchDragOver(event)"'
                + ' ondrop="searchDrop(event)" ondragleave="this.classList.remove(\'drag-over\')">'
                + '<span class="drag-handle">&#9776;</span>'
                + '<span>' + c.label + '</span>'
                + '<span class="col-eye" onclick="toggleSearchColVisibility(\'' + c.key + '\',\'' + type + '\')">'
                + (isHid ? '&#128065;&#65039;' : '&#128065;') + '</span>'
                + '</div>';
        }).join('');
    } else {
        grid.className = 'col-checkbox-grid';
        grid.innerHTML = showCols.filter(function(c) {
            return always.indexOf(c.key) === -1;
        }).map(function(c) {
            var checked = !hidden.has(c.key);
            return '<label class="' + (checked ? 'checked' : '') + '">'
                + '<input type="checkbox" ' + (checked ? 'checked' : '') + ' data-key="' + c.key + '" data-type="' + type + '" onchange="toggleSearchCol(this)">'
                + c.label + '</label>';
        }).join('');
    }
}

function toggleSearchCol(checkbox) {
    var type   = checkbox.getAttribute('data-type');
    var hidden = type === 'hitter' ? hiddenHitterCols : hiddenPitcherCols;
    var key    = checkbox.getAttribute('data-key');
    if (checkbox.checked) { hidden.delete(key); checkbox.parentElement.classList.add('checked'); }
    else                  { hidden.add(key);    checkbox.parentElement.classList.remove('checked'); }
    renderPlayerSearch();
}

function selectAllSearchCols(type) {
    var hidden = type === 'hitter' ? hiddenHitterCols : hiddenPitcherCols;
    hidden.clear();
    buildSearchColCheckboxes(type);
    renderPlayerSearch();
}

function selectNoneSearchCols(type) {
    var cols   = type === 'hitter' ? ALL_HITTER_COLS  : ALL_PITCHER_COLS;
    var hidden = type === 'hitter' ? hiddenHitterCols : hiddenPitcherCols;
    var always = ['watch','dnw','name','P','status'];
    cols.forEach(function(c) { if (always.indexOf(c.key) === -1) hidden.add(c.key); });
    buildSearchColCheckboxes(type);
    renderPlayerSearch();
}

var searchDragSrcKey = null, searchDragSrcType = null;

function searchDragStart(e) {
    searchDragSrcKey  = e.currentTarget.getAttribute('data-key');
    searchDragSrcType = e.currentTarget.getAttribute('data-type');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', searchDragSrcKey);
}

function searchDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function searchDrop(e) {
    e.preventDefault();
    var tKey  = e.currentTarget.getAttribute('data-key');
    var tType = e.currentTarget.getAttribute('data-type');
    e.currentTarget.classList.remove('drag-over');
    if (!searchDragSrcKey || searchDragSrcKey === tKey || searchDragSrcType !== tType) return;
    var allCols = tType === 'hitter' ? ALL_HITTER_COLS : ALL_PITCHER_COLS;
    var always  = ['watch','dnw','name','P','status'];
    var order   = tType === 'hitter' ? searchColOrderHitter : searchColOrderPitcher;
    if (!order) order = allCols.filter(function(c){return always.indexOf(c.key)===-1;}).map(function(c){return c.key;});
    var si = order.indexOf(searchDragSrcKey);
    if (si !== -1) order.splice(si, 1);
    var ti = order.indexOf(tKey);
    if (ti === -1) order.push(searchDragSrcKey); else order.splice(ti, 0, searchDragSrcKey);
    if (tType === 'hitter') searchColOrderHitter = order; else searchColOrderPitcher = order;
    buildSearchColCheckboxes(tType);
    renderPlayerSearch();
    saveColPrefs();
}

function toggleSearchColVisibility(key, type) {
    var hidden = type === 'hitter' ? hiddenHitterCols : hiddenPitcherCols;
    if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
    buildSearchColCheckboxes(type);
    renderPlayerSearch();
}

// ── Roster column picker ────────────────────────────────────────

function saveRosterColPrefs() {
    localStorage.setItem(rosterColPrefsKey('hitter'),  JSON.stringify(Array.from(hiddenRosterHitterCols)));
    localStorage.setItem(rosterColPrefsKey('pitcher'), JSON.stringify(Array.from(hiddenRosterPitcherCols)));
    if (rosterColOrderHitter)  localStorage.setItem(rosterColPrefsKey('hitter')  + '_order', JSON.stringify(rosterColOrderHitter));
    if (rosterColOrderPitcher) localStorage.setItem(rosterColPrefsKey('pitcher') + '_order', JSON.stringify(rosterColOrderPitcher));
    var team = getMyTeam();
    if (window.firebaseInitialized && team) {
        window.firebaseSet(window.firebaseRef(window.firebaseDB, 'colprefs/' + team.toLowerCase() + '/roster'), {
            hitter:       Array.from(hiddenRosterHitterCols),
            pitcher:      Array.from(hiddenRosterPitcherCols),
            hitterOrder:  rosterColOrderHitter  || null,
            pitcherOrder: rosterColOrderPitcher || null
        }).catch(function(e) { console.error('Firebase roster colprefs save error:', e); });
    }
    var toast = document.getElementById('save-toast');
    if (toast) { toast.classList.add('show'); setTimeout(function() { toast.classList.remove('show'); }, 2000); }
}

function toggleRosterColPicker(type) {
    var panel = document.getElementById('col-picker-roster-' + type);
    var open  = panel.style.display === 'none';
    panel.style.display = open ? '' : 'none';
    if (open) buildRosterColCheckboxes(type);
}

function resetRosterColOrder(type) {
    if (type === 'hitter') rosterColOrderHitter  = null;
    else                   rosterColOrderPitcher = null;
    buildRosterColCheckboxes(type);
    renderRoster();
    saveRosterColPrefs();
}

function toggleRosterReorder(type) {
    rosterReorderMode[type] = !rosterReorderMode[type];
    var btn = document.getElementById('roster-reorder-btn-' + type);
    if (rosterReorderMode[type]) {
        btn.textContent = '✓ Done';
        btn.style.background  = '#28a745';
        btn.style.borderColor = '#28a745';
        btn.style.color       = 'white';
    } else {
        btn.textContent = '⇅ Reorder';
        btn.style.background  = 'var(--team-secondary-subtle)';
        btn.style.borderColor = 'var(--team-secondary)';
        btn.style.color       = 'var(--team-secondary)';
    }
    buildRosterColCheckboxes(type);
}

function getRosterOrderedCols(type, hiddenSet) {
    var allCols  = type === 'hitter' ? HITTER_COLS : PITCHER_COLS;
    var order    = type === 'hitter' ? rosterColOrderHitter : rosterColOrderPitcher;
    var always   = ['name', 'P'];
    var orderable = allCols.filter(function(c) { return always.indexOf(c.key) === -1; });

    if (!order) {
        return orderable.filter(function(c) { return !hiddenSet.has(c.key); });
    }

    var ordered = [];
    order.forEach(function(key) {
        var col = orderable.find(function(c) { return c.key === key; });
        if (col && !hiddenSet.has(key)) ordered.push(col);
    });
    orderable.forEach(function(c) {
        if (order.indexOf(c.key) === -1 && !hiddenSet.has(c.key)) ordered.push(c);
    });
    return ordered;
}

var rosterDragSrcKey = null, rosterDragSrcType = null;

function rosterDragStart(e) {
    rosterDragSrcKey  = e.currentTarget.getAttribute('data-key');
    rosterDragSrcType = e.currentTarget.getAttribute('data-type');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', rosterDragSrcKey);
}

function rosterDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function rosterDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function rosterDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    var targetKey  = e.currentTarget.getAttribute('data-key');
    var targetType = e.currentTarget.getAttribute('data-type');
    if (rosterDragSrcKey === targetKey || rosterDragSrcType !== targetType) return;
    var allCols  = targetType === 'hitter' ? HITTER_COLS : PITCHER_COLS;
    var always   = ['name', 'P'];
    var orderable = allCols.filter(function(c) { return always.indexOf(c.key) === -1; });
    var order    = targetType === 'hitter' ? rosterColOrderHitter : rosterColOrderPitcher;
    if (!order) { order = orderable.map(function(c) { return c.key; }); }
    var srcIdx = order.indexOf(rosterDragSrcKey);
    var tgtIdx = order.indexOf(targetKey);
    if (srcIdx !== -1) order.splice(srcIdx, 1);
    else order = order.filter(function(k) { return k !== rosterDragSrcKey; }).concat([rosterDragSrcKey]);
    tgtIdx = order.indexOf(targetKey);
    order.splice(tgtIdx, 0, rosterDragSrcKey);
    if (targetType === 'hitter') rosterColOrderHitter = order;
    else rosterColOrderPitcher = order;
    buildRosterColCheckboxes(targetType);
    renderRoster();
    saveRosterColPrefs();
}

function toggleRosterColVisibility(key, type) {
    var hidden = type === 'hitter' ? hiddenRosterHitterCols : hiddenRosterPitcherCols;
    if (hidden.has(key)) hidden.delete(key);
    else hidden.add(key);
    buildRosterColCheckboxes(type);
    renderRosterTable();
}

function buildRosterColCheckboxes(type) {
    var cols         = type === 'hitter' ? HITTER_COLS : PITCHER_COLS;
    var hidden       = type === 'hitter' ? hiddenRosterHitterCols : hiddenRosterPitcherCols;
    var always       = ['name', 'P'];
    var inReorderMode = rosterReorderMode[type];

    if (inReorderMode) {
        var order    = type === 'hitter' ? rosterColOrderHitter : rosterColOrderPitcher;
        var orderable = cols.filter(function(c) { return always.indexOf(c.key) === -1; });
        if (!order) {
            order = orderable.map(function(c) { return c.key; });
            if (type === 'hitter') rosterColOrderHitter = order;
            else rosterColOrderPitcher = order;
        }
        var chips = order.map(function(key) {
            var col = orderable.find(function(c) { return c.key === key; });
            if (!col) return '';
            var isHidden = hidden.has(key);
            var eyeIcon = isHidden ? '👁️' : '👁';
            return '<div class="col-order-chip' + (isHidden ? ' hidden-col' : '') + '" draggable="true" data-key="' + key + '" data-type="' + type + '" '
                + 'ondragstart="rosterDragStart(event)" ondragover="rosterDragOver(event)" '
                + 'ondragleave="this.classList.remove(\'drag-over\')" ondrop="rosterDrop(event)">'
                + '<span class="drag-handle">&#9776;</span>'
                + '<span>' + col.label + '</span>'
                + '<span class="col-eye" onclick="toggleRosterColVisibility(\'' + key + '\', \'' + type + '\')">' + eyeIcon + '</span>'
                + '</div>';
        }).join('');
        document.getElementById('col-checkboxes-roster-' + type).innerHTML = chips;
    } else {
        document.getElementById('col-checkboxes-roster-' + type).innerHTML = cols
            .filter(function(c) { return always.indexOf(c.key) === -1; })
            .map(function(c) {
                var checked = !hidden.has(c.key);
                return '<label class="' + (checked ? 'checked' : '') + '">'
                    + '<input type="checkbox" ' + (checked ? 'checked' : '') + ' data-key="' + c.key + '" data-type="' + type + '" onchange="toggleRosterCol(this)">'
                    + c.label + '</label>';
            }).join('');
    }
}

function toggleRosterCol(checkbox) {
    var type   = checkbox.getAttribute('data-type');
    var hidden = type === 'hitter' ? hiddenRosterHitterCols : hiddenRosterPitcherCols;
    var key    = checkbox.getAttribute('data-key');
    if (checkbox.checked) { hidden.delete(key); checkbox.parentElement.classList.add('checked'); }
    else                  { hidden.add(key);    checkbox.parentElement.classList.remove('checked'); }
    renderRosterTable();
}

function selectAllRosterCols(type) {
    (type === 'hitter' ? hiddenRosterHitterCols : hiddenRosterPitcherCols).clear();
    buildRosterColCheckboxes(type); renderRosterTable();
}

function selectNoneRosterCols(type) {
    var cols   = type === 'hitter' ? HITTER_COLS : PITCHER_COLS;
    var hidden = type === 'hitter' ? hiddenRosterHitterCols : hiddenRosterPitcherCols;
    var always = ['name', 'P'];
    cols.forEach(function(c) { if (always.indexOf(c.key) === -1) hidden.add(c.key); });
    buildRosterColCheckboxes(type); renderRosterTable();
}

// ── Watchlist column picker ────────────────────────────────────

function saveWLColPrefs() {
    localStorage.setItem(wlColPrefsKey('hitter'),  JSON.stringify(Array.from(hiddenWLHitterCols)));
    localStorage.setItem(wlColPrefsKey('pitcher'), JSON.stringify(Array.from(hiddenWLPitcherCols)));
    if (wlColOrderHitter)  localStorage.setItem(wlColOrderKey('hitter'),  JSON.stringify(wlColOrderHitter));
    if (wlColOrderPitcher) localStorage.setItem(wlColOrderKey('pitcher'), JSON.stringify(wlColOrderPitcher));
    var team = getMyTeam();
    if (window.firebaseInitialized && team) {
        window.firebaseSet(window.firebaseRef(window.firebaseDB, 'colprefs/' + team.toLowerCase() + '/wl'), {
            hitter:       Array.from(hiddenWLHitterCols),
            pitcher:      Array.from(hiddenWLPitcherCols),
            hitterOrder:  wlColOrderHitter  || null,
            pitcherOrder: wlColOrderPitcher || null
        }).catch(function(e) { console.error('Firebase colprefs save error:', e); });
    }
    var toast = document.getElementById('save-toast');
    if (toast) { toast.classList.add('show'); setTimeout(function() { toast.classList.remove('show'); }, 2000); }
}

function toggleWatchlistColPicker(type) {
    var hPanel = document.getElementById('col-picker-wl-hitter');
    var pPanel = document.getElementById('col-picker-wl-pitcher');
    var target = type === 'hitter' ? hPanel : pPanel;
    var other  = type === 'hitter' ? pPanel : hPanel;
    var isOpen = target && target.style.display !== 'none';
    if (other)  other.style.display  = 'none';
    if (target) target.style.display = isOpen ? 'none' : '';
    if (!isOpen) buildWLColCheckboxes(type);
}

function resetWLColOrder(type) {
    if (type === 'hitter') wlColOrderHitter  = null;
    else                   wlColOrderPitcher = null;
    buildWLColCheckboxes(type);
    renderWatchlist();
    saveWLColPrefs();
}

function toggleWLReorder(type) {
    wlReorderMode[type] = !wlReorderMode[type];
    var btn = document.getElementById('wl-reorder-btn-' + type);
    if (btn) {
        btn.style.background = wlReorderMode[type] ? 'var(--team-secondary)' : 'var(--team-secondary-subtle)';
        btn.style.color      = wlReorderMode[type] ? 'white'   : 'var(--team-secondary)';
        btn.textContent      = wlReorderMode[type] ? '\u2713 Done' : '\u2195 Reorder';
    }
    buildWLColCheckboxes(type);
}

function buildWLColCheckboxes(type) {
    var allCols = type === 'hitter' ? ALL_HITTER_COLS  : ALL_PITCHER_COLS;
    var hidden  = type === 'hitter' ? hiddenWLHitterCols : hiddenWLPitcherCols;
    var order   = type === 'hitter' ? wlColOrderHitter : wlColOrderPitcher;
    var grid    = document.getElementById('col-checkboxes-wl-' + type);
    if (!grid) return;
    var always  = ['watch','name','P','status'];
    var orderedCols;
    if (order && order.length) {
        var colMap = {};
        allCols.forEach(function(c) { colMap[c.key] = c; });
        orderedCols = order.map(function(k) { return colMap[k]; }).filter(Boolean);
        allCols.forEach(function(c) { if (order.indexOf(c.key) === -1) orderedCols.push(c); });
    } else { orderedCols = allCols.slice(); }
    var showCols = orderedCols.filter(function(c) { return always.indexOf(c.key) === -1; });
    showCols.forEach(function(c) {
        if (c.rankCol !== undefined) c.label = rNames[c.rankCol] || ('Rank ' + (c.rankCol+1));
    });
    if (wlReorderMode[type]) {
        grid.className = 'col-order-grid';
        grid.innerHTML = showCols.map(function(c) {
            var isHid = hidden.has(c.key);
            return '<div class="col-order-chip' + (isHid ? ' hidden-col' : '') + '" draggable="true"'
                + ' data-key="' + c.key + '" data-type="' + type + '"'
                + ' ondragstart="wlDragStart(event)" ondragover="wlDragOver(event)"'
                + ' ondrop="wlDrop(event)" ondragleave="this.classList.remove(\'drag-over\')">  '
                + '<span class="drag-handle">&#9776;</span>'
                + '<span>' + c.label + '</span>'
                + '<span class="col-eye" onclick="toggleWLColVisibility(\'' + c.key + '\',\'' + type + '\')">'
                + (isHid ? '&#128065;&#65039;' : '&#128065;') + '</span>'
                + '</div>';
        }).join('');
    } else {
        grid.className = 'col-checkbox-grid';
        grid.innerHTML = showCols.map(function(c) {
            var checked = !hidden.has(c.key);
            return '<label class="' + (checked ? 'checked' : '') + '">'
                + '<input type="checkbox" ' + (checked ? 'checked' : '') + ' data-key="' + c.key + '" data-type="' + type + '" onchange="toggleWLCol(this)">'
                + c.label + '</label>';
        }).join('');
    }
}

var wlDragSrcKey = null, wlDragSrcType = null;

function wlDragStart(e) {
    wlDragSrcKey  = e.currentTarget.getAttribute('data-key');
    wlDragSrcType = e.currentTarget.getAttribute('data-type');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', wlDragSrcKey);
}

function wlDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function wlDrop(e) {
    e.preventDefault();
    var tKey  = e.currentTarget.getAttribute('data-key');
    var tType = e.currentTarget.getAttribute('data-type');
    e.currentTarget.classList.remove('drag-over');
    if (!wlDragSrcKey || wlDragSrcKey === tKey || wlDragSrcType !== tType) return;
    var allCols = tType === 'hitter' ? ALL_HITTER_COLS : ALL_PITCHER_COLS;
    var always  = ['watch','name','P','status'];
    var order   = tType === 'hitter' ? wlColOrderHitter : wlColOrderPitcher;
    if (!order) order = allCols.filter(function(c){return always.indexOf(c.key)===-1;}).map(function(c){return c.key;});
    var si = order.indexOf(wlDragSrcKey);
    if (si !== -1) order.splice(si, 1);
    var ti = order.indexOf(tKey);
    if (ti === -1) order.push(wlDragSrcKey); else order.splice(ti, 0, wlDragSrcKey);
    if (tType === 'hitter') wlColOrderHitter = order; else wlColOrderPitcher = order;
    buildWLColCheckboxes(tType);
    renderWatchlist();
    saveWLColPrefs();
}

function toggleWLColVisibility(key, type) {
    var hidden = type === 'hitter' ? hiddenWLHitterCols : hiddenWLPitcherCols;
    if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
    buildWLColCheckboxes(type);
    renderWatchlist();
}

function toggleWLCol(cb) {
    var key = cb.getAttribute('data-key'), type = cb.getAttribute('data-type');
    var hidden = type === 'hitter' ? hiddenWLHitterCols : hiddenWLPitcherCols;
    if (cb.checked) hidden.delete(key); else hidden.add(key);
    cb.parentElement.className = cb.checked ? 'checked' : '';
    renderWatchlist();
}

function selectAllWLCols(type) {
    var hidden = type === 'hitter' ? hiddenWLHitterCols : hiddenWLPitcherCols;
    hidden.clear(); buildWLColCheckboxes(type); renderWatchlist();
}

function selectNoneWLCols(type) {
    var cols   = type === 'hitter' ? ALL_HITTER_COLS : ALL_PITCHER_COLS;
    var hidden = type === 'hitter' ? hiddenWLHitterCols : hiddenWLPitcherCols;
    var always = ['watch','name','P','status'];
    cols.forEach(function(c){ if (always.indexOf(c.key) === -1) hidden.add(c.key); });
    buildWLColCheckboxes(type); renderWatchlist();
}
