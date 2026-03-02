// myteam-render.js — All rendering and DOM-interaction functions for myteam.html

// ── Watchlist management ──────────────────────────────────────────────────────

function getWatchlist() {
    try { return JSON.parse(localStorage.getItem('watchlist_' + getMyTeam()) || '[]'); }
    catch(e) { return []; }
}

function isWatched(p) { return getWatchlist().indexOf(watchKey(p)) !== -1; }

function toggleWatch(key) {
    var wl = getWatchlist();
    var idx = wl.indexOf(key);
    if (idx !== -1) { wl.splice(idx, 1); } else { wl.push(key); }

    // Save to localStorage as backup
    localStorage.setItem('watchlist_' + getMyTeam(), JSON.stringify(wl));

    // Save to Firebase for real-time sync (path uses lowercase to match security rules)
    const team = getMyTeam();
    if (window.firebaseInitialized && team) {
        window.firebaseSet(window.firebaseRef(window.firebaseDB, 'watchlists/' + team.toLowerCase()), wl).catch(error => {
            console.error('Firebase save error:', error);
        });
    }

    renderAll();
}

function watchBtn(p) {
    var watched = isWatched(p);
    var key = watchKey(p);
    var cls = 'watch-btn' + (watched ? ' watching' : '');
    var label = watched ? '⭐ Watching' : '+ Watch';
    return '<button class="' + cls + '" data-key="' + key + '">' + label + '</button>';
}

// ── Do Not Want ───────────────────────────────────────────────────────────────

function getDNWList() {
    try { return JSON.parse(localStorage.getItem('dnw_' + getMyTeam()) || '[]'); }
    catch(e) { return []; }
}
function isDNW(p) { return getDNWList().indexOf(watchKey(p)) !== -1; }
function toggleDNW(key) {
    var team = getMyTeam();
    var dnw = getDNWList();
    var idx = dnw.indexOf(key);
    if (idx !== -1) {
        dnw.splice(idx, 1);
    } else {
        dnw.push(key);
        // mutually exclusive: remove from watchlist if present
        var wl  = getWatchlist();
        var wi  = wl.indexOf(key);
        if (wi !== -1) {
            wl.splice(wi, 1);
            localStorage.setItem('watchlist_' + team, JSON.stringify(wl));
            if (window.firebaseInitialized && team) {
                window.firebaseSet(window.firebaseRef(window.firebaseDB, 'watchlists/' + team.toLowerCase()), wl)
                    .catch(function(e) { console.error('Firebase watchlist sync error:', e); });
            }
        }
    }
    localStorage.setItem('dnw_' + team, JSON.stringify(dnw));
    if (window.firebaseInitialized && team) {
        window.firebaseSet(window.firebaseRef(window.firebaseDB, 'dnw/' + team.toLowerCase()), dnw)
            .catch(function(e) { console.error('Firebase DNW save error:', e); });
    }
    renderAll();
}
function dnwBtn(p) {
    var active = isDNW(p);
    var key    = watchKey(p);
    var cls    = 'dnw-btn' + (active ? ' dnw-active' : '');
    var label  = active ? '🚫 Skip' : '🚫';
    return '<button class="' + cls + '" data-dnw-key="' + key + '" title="Mark as Do Not Want">' + label + '</button>';
}
function dnwBadge() {
    return '<span class="dnw-badge">✕ Skip</span>';
}

// ── Header ────────────────────────────────────────────────────────────────────

function renderHeader() {
    var team = getMyTeam();
    document.getElementById('team-heading').textContent = '⚾ ' + team + ' Dashboard';
}

// ── Roster ────────────────────────────────────────────────────────────────────

function renderStatTable(theadId, tbodyId, rows, cols, emptyLabel) {
    var thead = document.getElementById(theadId);
    var tbody = document.getElementById(tbodyId);
    if (!thead || !tbody) return;

    var type    = theadId.indexOf('hitter') !== -1 ? 'hitter' : 'pitcher';
    var hidden  = type === 'hitter' ? hiddenRosterHitterCols : hiddenRosterPitcherCols;
    var visCols = getRosterOrderedCols(type, hidden);
    // Prepend always-visible columns
    var always = cols.filter(function(c) { return c.key === 'name' || c.key === 'P'; });
    visCols = always.concat(visCols);

    thead.innerHTML = '<tr>' + visCols.map(function(c) {
        return '<th>' + c.label + '</th>';
    }).join('') + '</tr>';

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="' + visCols.length + '" style="text-align:center;color:#6c757d;padding:20px;">No ' + emptyLabel + ' on roster yet</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(function(r) {
        var p = r.player;
        var cells = visCols.map(function(c) {
            if (c.key === 'name') {
                var badge = r.type === 'keeper'
                    ? ' <span class="k-badge">K</span>'
                    : ' <span class="d-badge">D</span>';
                return '<td style="font-weight:600">' + escapeHtml(p.First) + ' ' + escapeHtml(p.Last) + badge + '</td>';
            }
            if (c.key === 'P') return '<td><span class="pos-badge">' + getPosDisplay(p) + '</span></td>';
            if (c.key === 'Age')    return '<td>' + (p.Age || '—') + '</td>';
            if (c.key === 'T')      return '<td>' + (p.T || '—') + '</td>';
            if (c.key === 'B')      return '<td>' + (p.B || '—') + '</td>';
            if (c.key === 'Injury') return '<td>' + (p.Injury || '—') + '</td>';
            if (c.key === 'SDur')   return '<td>' + (p.SDur || '—') + '</td>';
            if (c.key === 'RDur')   return '<td>' + (p.RDur || '—') + '</td>';
            if (c.frating) {
                var rv = p[c.key];
                if (!rv) return '<td style="color:#ccc">—</td>';
                return '<td style="background:' + gradeBg(rv) + ';color:' + gradeColor(rv) + ';font-weight:600;white-space:nowrap;font-size:0.82em">' + fmtGrade(rv) + '</td>';
            }
            var val = fmt(p[c.key], c.dec);
            return '<td style="color:' + (val === '—' ? '#ccc' : '#333') + '">' + val + '</td>';
        }).join('');
        return '<tr>' + cells + '</tr>';
    }).join('');
}

function renderRosterTable() { renderRoster(); }

function toggleRosterPosHitter(pos) {
    if (rosterActivePosFiltersHitter.has(pos)) rosterActivePosFiltersHitter.delete(pos);
    else rosterActivePosFiltersHitter.add(pos);
    updateRosterPosChipsHitter();
    renderRoster();
}

function toggleRosterPosPitcher(pos) {
    if (rosterActivePosFiltersPitcher.has(pos)) rosterActivePosFiltersPitcher.delete(pos);
    else rosterActivePosFiltersPitcher.add(pos);
    updateRosterPosChipsPitcher();
    renderRoster();
}

function updateRosterPosChipsHitter() {
    var chips = ['All','C','1B','2B','3B','SS','LF','CF','RF','DH'];
    var html = '<span class="wl-filter-info" id="roster-filter-info-hitter"></span>';
    chips.forEach(function(pos) {
        var active = rosterActivePosFiltersHitter.has(pos);
        html += '<button class="pos-chip' + (active ? ' active' : '') + '" onclick="toggleRosterPosHitter(\'' + pos + '\')">' + pos + '</button>';
    });
    document.getElementById('roster-pos-filter-hitter').innerHTML = html;

    if (rosterActivePosFiltersHitter.size) {
        document.getElementById('roster-filter-info-hitter').textContent = 'Showing: ' + Array.from(rosterActivePosFiltersHitter).join(', ');
    }
}

function updateRosterPosChipsPitcher() {
    var chips = ['All','SP','RP'];
    var html = '<span class="wl-filter-info" id="roster-filter-info-pitcher"></span>';
    chips.forEach(function(pos) {
        var active = rosterActivePosFiltersPitcher.has(pos);
        html += '<button class="pos-chip' + (active ? ' active' : '') + '" onclick="toggleRosterPosPitcher(\'' + pos + '\')">' + pos + '</button>';
    });
    document.getElementById('roster-pos-filter-pitcher').innerHTML = html;

    if (rosterActivePosFiltersPitcher.size) {
        document.getElementById('roster-filter-info-pitcher').textContent = 'Showing: ' + Array.from(rosterActivePosFiltersPitcher).join(', ');
    }
}

function rosterPlayerMatchesFilterHitter(p) {
    if (!rosterActivePosFiltersHitter.size) return true;
    if (rosterActivePosFiltersHitter.has('All')) return true;

    var eligible = getEligiblePositions(p);
    return eligible.some(function(pos) {
        return rosterActivePosFiltersHitter.has(pos.toUpperCase());
    });
}

function rosterPlayerMatchesFilterPitcher(p) {
    if (!rosterActivePosFiltersPitcher.size) return true;
    if (rosterActivePosFiltersPitcher.has('All')) return true;

    var pos = (p.P || '').toUpperCase();
    return rosterActivePosFiltersPitcher.has(pos);
}

function renderRoster() {
    var rows = getRosterRows();

    var isP = function(r) {
        var pos = (getPlayerPosition(r.player) || '').toUpperCase();
        return pos === 'SP' || pos === 'RP';
    };
    var allHitters  = rows.filter(function(r) { return !isP(r); });
    var allPitchers = rows.filter(isP);

    // Apply position filters
    var hitters = allHitters.filter(function(r) { return rosterPlayerMatchesFilterHitter(r.player); });
    var pitchers = allPitchers.filter(function(r) { return rosterPlayerMatchesFilterPitcher(r.player); });

    // Update filter chips
    updateRosterPosChipsHitter();
    updateRosterPosChipsPitcher();

    document.getElementById('roster-count-label') &&
        (document.getElementById('roster-count-label').textContent = rows.length + ' players');
    var hitterLabel = hitters.length === allHitters.length ? hitters.length + ' players' : hitters.length + ' / ' + allHitters.length + ' players';
    var pitcherLabel = pitchers.length === allPitchers.length ? pitchers.length + ' players' : pitchers.length + ' / ' + allPitchers.length + ' players';
    document.getElementById('hitter-count-label').textContent = hitterLabel;
    document.getElementById('pitcher-count-label').textContent = pitcherLabel;

    renderStatTable('hitter-roster-thead',  'hitter-roster-tbody',  hitters,  HITTER_COLS,  'hitters');
    renderStatTable('pitcher-roster-thead', 'pitcher-roster-tbody', pitchers, PITCHER_COLS, 'pitchers');

    // Position needs
    var posCounts = {};
    ALL_POS.forEach(function(p) { posCounts[p.toUpperCase()] = 0; });
    rows.forEach(function(r) {
        getEligiblePositions(r.player).forEach(function(ep) {
            var key = ep.toUpperCase();
            if (posCounts[key] !== undefined) posCounts[key]++;
        });
    });
    document.getElementById('needs-grid').innerHTML = Object.keys(REQUIREMENTS).map(function(pos) {
        var req = REQUIREMENTS[pos];
        var have = posCounts[pos] || 0;
        var rem = req - have;
        var cls = rem <= 0 ? 'complete' : rem === 1 ? 'close' : 'needed';
        var label = POS_LABELS[pos] || pos;
        return '<div class="need-item ' + cls + '">'
            + '<div>'
            + '<div class="need-pos">' + label + '</div>'
            + '<div class="need-remaining">' + (rem <= 0 ? '✔ Filled' : 'Need ' + rem + ' more') + '</div>'
            + '</div>'
            + '<div class="need-count ' + cls + '">' + have + '/' + req + '</div>'
            + '</div>';
    }).join('');

    var breakdown = document.getElementById('pos-breakdown');
    if (breakdown) {
        breakdown.innerHTML = ALL_POS.map(function(pos) {
            var key = pos.toUpperCase();
            var count = posCounts[key] || 0;
            var style = count < 2 ? ' style="color:#dc3545;font-weight:700;"' : '';
            return '<div class="pos-box">'
                + '<div class="pos-box-label">' + (POS_LABELS[pos] || pos) + '</div>'
                + '<div class="pos-box-count"' + style + '>' + count + '</div>'
                + '</div>';
        }).join('');
    }
}

// ── My Picks ──────────────────────────────────────────────────────────────────

function renderMyPicks() {
    var team = getMyTeam();
    var n = TEAMS.length;
    var slots = [];
    for (var round = 1; round <= NUM_ROUNDS; round++) {
        for (var i = 0; i < n; i++) {
            var t = round % 2 === 1 ? TEAMS[i] : TEAMS[n-1-i];
            if (t === team) slots.push({ round: round, overall: (round-1)*n + i + 1 });
        }
    }
    var byPick = {};
    draftedPlayers.filter(function(d) { return d.team === team; })
        .forEach(function(d) { byPick[d.pickNumber] = d; });

    document.getElementById('picks-label').textContent =
        Object.keys(byPick).length + ' / ' + slots.length;

    document.getElementById('my-picks-tbody').innerHTML = slots.map(function(slot) {
        var d = byPick[slot.overall];
        if (d) {
            var pos = getPlayerPosition(d.player);
            return '<tr><td>Rd ' + slot.round + '</td><td>#' + slot.overall + '</td>'
                + '<td style="font-weight:600">' + escapeHtml(d.player.First) + ' ' + escapeHtml(d.player.Last) + '</td>'
                + '<td><span class="pos-badge">' + pos.toUpperCase() + '</span></td></tr>';
        }
        return '<tr style="opacity:0.4"><td>Rd ' + slot.round + '</td><td>#' + slot.overall + '</td>'
            + '<td style="color:#adb5bd;">— Empty —</td><td></td></tr>';
    }).join('');
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

function setWLSort(col, listIdx) {
    var li = (listIdx === undefined || listIdx === null) ? -1 : listIdx;
    if (wlSortCol === col && wlSortList === li) {
        wlSortDir = wlSortDir === 'asc' ? 'desc' : 'asc';
    } else { wlSortCol = col; wlSortDir = 'asc'; wlSortList = li; }
    renderWatchlist();
}

function renderWatchlist() {
    var wl = getWatchlist();
    var totalCount = wl.length;
    var watched = players.filter(function(p) { return wl.indexOf(watchKey(p)) !== -1; });
    var availEl = document.getElementById('wl-avail-filter');
    var availFilter = availEl ? availEl.value : 'all';
    var filtered = watched.filter(wlPlayerMatchesFilter).filter(function(p) {
        if (availFilter === 'available') return getAvailability(p) === 'available' && !isDNW(p);
        if (availFilter === 'drafted')   return getAvailability(p) !== 'available';
        return true;
    });
    var hitters  = filtered.filter(function(p) { return !isPitcher(p); });
    var pitchers = filtered.filter(function(p) { return  isPitcher(p); });
    function sortRows(rows) {
        if (!wlSortCol) return rows;
        return rows.slice().sort(function(a, b) {
            if (wlSortCol.startsWith('_rank')) {
                var li = wlSortList;
                var ar = getPlayerRank(a, li), br = getPlayerRank(b, li);
                if (ar === null && br === null) return 0;
                if (ar === null) return 1; if (br === null) return -1;
                var cmp = rLists[li].order === 'asc' ? ar - br : br - ar;
                return wlSortDir === 'asc' ? cmp : -cmp;
            }
            var av = parseFloat(a[wlSortCol]), bv = parseFloat(b[wlSortCol]);
            var an = isNaN(av) ? (wlSortDir==='asc'?Infinity:-Infinity) : av;
            var bn = isNaN(bv) ? (wlSortDir==='asc'?Infinity:-Infinity) : bv;
            return wlSortDir === 'asc' ? an - bn : bn - an;
        });
    }
    hitters  = sortRows(hitters);
    pitchers = sortRows(pitchers);
    var hCountEl = document.getElementById('wl-hitter-count');
    var pCountEl = document.getElementById('wl-pitcher-count');
    var countEl  = document.getElementById('watchlist-count');
    if (hCountEl) hCountEl.textContent = '(' + hitters.length + ')';
    if (pCountEl) pCountEl.textContent = '(' + pitchers.length + ')';
    if (countEl) {
        var shown = hitters.length + pitchers.length;
        countEl.textContent = (wlActivePosFilters.size > 0 || availFilter !== 'all')
            ? shown + ' of ' + totalCount + ' players'
            : totalCount + ' players';
    }
    function renderWLTable(theadId, tbodyId, rows, type, emptyMsg) {
        var thead = document.getElementById(theadId);
        var tbody = document.getElementById(tbodyId);
        if (!thead || !tbody) return;
        var hiddenSet = type === 'hitter' ? hiddenWLHitterCols : hiddenWLPitcherCols;
        var visCols   = getWLOrderedCols(type, hiddenSet);
        visCols.forEach(function(c) {
            if (c.rankCol !== undefined) c.label = rNames[c.rankCol] || ('Rank ' + (c.rankCol+1));
        });
        thead.innerHTML = '<tr>' + visCols.map(function(c) {
            var li = c.rankCol;
            var hasData = li !== undefined && Object.keys(rLists[li].data).length > 0;
            var sortable = hasData || c.dec !== undefined || c.key === 'Age';
            var cls = sortable ? 'sortable' : '';
            var isActive = wlSortCol === c.key && wlSortList === (li !== undefined ? li : -1);
            if (isActive) cls += (wlSortDir === 'asc' ? ' sort-asc' : ' sort-desc');
            var onclick = sortable
                ? ' onclick="setWLSort(\'' + c.key + '\',' + (li !== undefined ? li : 'undefined') + ')"\''
                : '';
            return '<th class="' + cls + '"' + onclick + '>' + c.label + '</th>';
        }).join('') + '</tr>';
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="' + visCols.length + '" class="watchlist-empty">' + emptyMsg + '</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function(p) {
            var av = getAvailability(p);
            var isDnw = isDNW(p);
            var avLabel = isDnw ? dnwBadge()
                : av === 'available' ? '<span style="color:#28a745;font-weight:700;">Available</span>'
                : av === 'keeper'    ? '<span style="color:#0c5460;">Keeper</span>'
                :                     '<span style="color:#6c757d;">Drafted</span>';
            var cells = visCols.map(function(c) {
                if (c.key === 'watch')  return '<td>' + watchBtn(p) + '</td>';
                if (c.key === 'dnw')    return '<td>' + dnwBtn(p) + '</td>';
                if (c.key === 'name')   return '<td style="font-weight:600;white-space:nowrap">' + escapeHtml(p.First) + ' ' + escapeHtml(p.Last) + '</td>';
                if (c.key === 'P')      return '<td><span class="pos-badge">' + getPosDisplay(p) + '</span></td>';
                if (c.key === 'status') return '<td>' + avLabel + '</td>';
                if (c.key === 'Age')    return '<td>' + (p.Age || '—') + '</td>';
                if (c.key === 'T')      return '<td>' + (p.T || '—') + '</td>';
                if (c.key === 'B')      return '<td>' + (p.B || '—') + '</td>';
                if (c.key === 'Injury') return '<td>' + (p.Injury || '—') + '</td>';
                if (c.key === 'SDur')   return '<td>' + (p.SDur || '—') + '</td>';
                if (c.key === 'RDur')   return '<td>' + (p.RDur || '—') + '</td>';
                if (c.rankCol !== undefined) return rankBadge(getPlayerRank(p, c.rankCol), c.rankCol);
                if (c.frating) {
                    var rv = p[c.key];
                    if (!rv) return '<td style="color:#ccc">—</td>';
                    return '<td style="background:' + gradeBg(rv) + ';color:' + gradeColor(rv) + ';font-weight:600;white-space:nowrap;font-size:0.82em">' + fmtGrade(rv) + '</td>';
                }
                var val = fmt(p[c.key], c.dec);
                return '<td style="color:' + (val === '—' ? '#ccc' : '#333') + '">' + val + '</td>';
            }).join('');
            return '<tr class="watched">' + cells + '</tr>';
        }).join('');
    }
    renderWLTable('watchlist-hitter-thead',  'watchlist-hitter-tbody',  hitters,  'hitter',  'No hitters on watchlist');
    renderWLTable('watchlist-pitcher-thead', 'watchlist-pitcher-tbody', pitchers, 'pitcher', 'No pitchers on watchlist');
}

// ── Watchlist position filter ─────────────────────────────────────────────────

function toggleWLPos(pos) {
    if (pos === 'all') {
        wlActivePosFilters.clear();
    } else {
        if (wlActivePosFilters.has(pos)) {
            wlActivePosFilters.delete(pos);
        } else {
            wlActivePosFilters.add(pos);
        }
    }
    updateWLPosChips();
    renderWatchlist();
}

function updateWLPosChips() {
    var chips = document.querySelectorAll('.pos-chip');
    var allActive = wlActivePosFilters.size === 0;
    chips.forEach(function(chip) {
        var onclick = chip.getAttribute('onclick') || '';
        var posMatch = onclick.match(/toggleWLPos\('([^']+)'\)/);
        if (!posMatch) return;
        var pos = posMatch[1];
        if (pos === 'all') {
            chip.className = 'pos-chip chip-all' + (allActive ? ' active' : '');
        } else {
            var isActive = wlActivePosFilters.has(pos);
            var extraCls = pos === 'SP' ? ' chip-sp' : pos === 'RP' ? ' chip-rp' : '';
            chip.className = 'pos-chip' + extraCls + (isActive ? ' active' : '');
        }
    });
    var infoEl = document.getElementById('wl-filter-info');
    if (infoEl) {
        if (allActive) {
            infoEl.textContent = '';
        } else {
            var list = Array.from(wlActivePosFilters).join(', ');
            infoEl.textContent = 'Showing: ' + list;
        }
    }
}

function wlPlayerMatchesFilter(p) {
    if (wlActivePosFilters.size === 0) return true;
    var pos = (getPlayerPosition(p) || '').toUpperCase();
    var isPit = pos === 'SP' || pos === 'RP';
    var isOF = pos === 'LF' || pos === 'CF' || pos === 'RF';
    // Check group filters first
    if (wlActivePosFilters.has('PITCHERS') && isPit) return true;
    if (wlActivePosFilters.has('HITTERS')  && !isPit) return true;
    if (wlActivePosFilters.has('OF')        && isOF) return true;
    // Check individual position filters
    var eligible = getEligiblePositions(p).map(function(e) { return e.toUpperCase(); });
    if (!eligible.length) eligible = [pos];
    for (var i = 0; i < eligible.length; i++) {
        if (wlActivePosFilters.has(eligible[i])) return true;
    }
    return false;
}

// ── Search position filter ────────────────────────────────────────────────────

function toggleSearchPosHitter(pos) {
    if (pos === 'all') { searchActivePosFiltersHitter.clear(); }
    else {
        if (searchActivePosFiltersHitter.has(pos)) searchActivePosFiltersHitter.delete(pos);
        else searchActivePosFiltersHitter.add(pos);
    }
    updateSearchPosChipsHitter();
    renderPlayerSearch();
}

function toggleSearchPosPitcher(pos) {
    if (pos === 'all') { searchActivePosFiltersPitcher.clear(); }
    else {
        if (searchActivePosFiltersPitcher.has(pos)) searchActivePosFiltersPitcher.delete(pos);
        else searchActivePosFiltersPitcher.add(pos);
    }
    updateSearchPosChipsPitcher();
    renderPlayerSearch();
}

function updateSearchPosChipsHitter() {
    var strip = document.getElementById('search-pos-filter-hitter');
    if (!strip) return;
    var allActive = searchActivePosFiltersHitter.size === 0;
    strip.querySelectorAll('.pos-chip').forEach(function(chip) {
        var m = (chip.getAttribute('onclick') || '').match(/toggleSearchPosHitter\('([^']+)'\)/);
        if (!m) return;
        var pos = m[1];
        if (pos === 'all') {
            chip.className = 'pos-chip chip-all' + (allActive ? ' active' : '');
        } else {
            chip.className = 'pos-chip' + (searchActivePosFiltersHitter.has(pos) ? ' active' : '');
        }
    });
    var infoEl = document.getElementById('search-filter-info-hitter');
    if (infoEl) infoEl.textContent = allActive ? '' : Array.from(searchActivePosFiltersHitter).join(', ');
}

function updateSearchPosChipsPitcher() {
    var strip = document.getElementById('search-pos-filter-pitcher');
    if (!strip) return;
    var allActive = searchActivePosFiltersPitcher.size === 0;
    strip.querySelectorAll('.pos-chip').forEach(function(chip) {
        var m = (chip.getAttribute('onclick') || '').match(/toggleSearchPosPitcher\('([^']+)'\)/);
        if (!m) return;
        var pos = m[1];
        if (pos === 'all') {
            chip.className = 'pos-chip chip-all' + (allActive ? ' active' : '');
        } else {
            var extraCls = pos === 'SP' ? ' chip-sp' : pos === 'RP' ? ' chip-rp' : '';
            chip.className = 'pos-chip' + extraCls + (searchActivePosFiltersPitcher.has(pos) ? ' active' : '');
        }
    });
    var infoEl = document.getElementById('search-filter-info-pitcher');
    if (infoEl) infoEl.textContent = allActive ? '' : Array.from(searchActivePosFiltersPitcher).join(', ');
}

function searchHitterMatchesFilter(p) {
    if (searchActivePosFiltersHitter.size === 0) return true;
    var pos = (getPlayerPosition(p) || '').toUpperCase();
    var isOF = pos === 'LF' || pos === 'CF' || pos === 'RF';
    if (searchActivePosFiltersHitter.has('OF') && isOF) return true;
    var eligible = getEligiblePositions(p).map(function(e) { return e.toUpperCase(); });
    if (!eligible.length) eligible = [pos];
    for (var i = 0; i < eligible.length; i++) {
        if (searchActivePosFiltersHitter.has(eligible[i])) return true;
    }
    return false;
}

function searchPitcherMatchesFilter(p) {
    if (searchActivePosFiltersPitcher.size === 0) return true;
    var pos = (getPlayerPosition(p) || '').toUpperCase();
    return searchActivePosFiltersPitcher.has(pos);
}

// ── Player Search ─────────────────────────────────────────────────────────────

function getFilteredPlayers() {
    var search      = (document.getElementById('search').value || '').toLowerCase();
    var availFilter = (document.getElementById('avail-filter') || {value:'available'}).value || 'available';
    return players.filter(function(p) {
        if (search && (p.First + ' ' + p.Last).toLowerCase().indexOf(search) === -1) return false;
        if (availFilter === 'available' && getAvailability(p) !== 'available') return false;
        if (availFilter === 'available' && isDNW(p)) return false;
        if (availFilter === 'dnw' && !isDNW(p)) return false;
        return true;
    });
}

function sortFiltered(filtered) {
    if (searchSortCol && searchSortCol.startsWith('_rank')) {
        var li = searchSortList;
        return filtered.slice().sort(function(a, b) {
            var ar = getPlayerRank(a, li), br = getPlayerRank(b, li);
            if (ar === null && br === null) return 0;
            if (ar === null) return 1;
            if (br === null) return -1;
            var ord = rLists[li].order;
            var cmp = ord === 'asc' ? ar - br : br - ar;
            return searchSortDir === 'asc' ? cmp : -cmp;
        });
    } else if (searchSortCol) {
        return filtered.slice().sort(function(a, b) {
            var av = parseFloat(a[searchSortCol]), bv = parseFloat(b[searchSortCol]);
            var an = isNaN(av) ? (searchSortDir==='asc'?Infinity:-Infinity) : av;
            var bn = isNaN(bv) ? (searchSortDir==='asc'?Infinity:-Infinity) : bv;
            return searchSortDir === 'asc' ? an - bn : bn - an;
        });
    }
    return filtered;
}

function renderSearchTable(theadId, tbodyId, rows, allCols, hiddenSet, emptyMsg) {
    var thead = document.getElementById(theadId);
    var tbody = document.getElementById(tbodyId);
    if (!thead || !tbody) return;

    var type = allCols === ALL_HITTER_COLS ? 'hitter' : 'pitcher';
    var visCols = getSearchOrderedCols(type, hiddenSet);
    visCols.forEach(function(c) {
        if (c.rankCol !== undefined) c.label = rNames[c.rankCol] || ('Rank ' + (c.rankCol+1));
    });

    thead.innerHTML = '<tr>' + visCols.map(function(c) {
        var li = c.rankCol;
        var hasData = li !== undefined && Object.keys(rLists[li].data).length > 0;
        var sortable = hasData || c.dec !== undefined || c.key === 'Age';
        var cls = sortable ? 'sortable' : '';
        var isActive = searchSortCol === c.key && searchSortList === (li !== undefined ? li : -1);
        if (isActive) cls += (searchSortDir === 'asc' ? ' sort-asc' : ' sort-desc');
        var onclick = sortable
            ? ' onclick="setSearchSort(\'' + c.key + '\',' + (li !== undefined ? li : 'undefined') + ')"'
            : '';
        return '<th class="' + cls + '"' + onclick + '>' + c.label + '</th>';
    }).join('') + '</tr>';

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="' + visCols.length + '" style="text-align:center;padding:30px;color:#6c757d;">' + emptyMsg + '</td></tr>';
        return;
    }

    tbody.innerHTML = rows.slice(0, 300).map(function(p) {
        var av     = getAvailability(p);
        var isDnw  = isDNW(p);
        var rowCls = isDnw ? 'dnw-row' : av !== 'available' ? 'unavailable' : isWatched(p) ? 'watched' : '';
        var avLabel = isDnw
            ? dnwBadge()
            : av === 'available'
            ? '<span style="color:#28a745;font-weight:700;">Available</span>'
            : av === 'keeper'
            ? '<span style="color:#0c5460;">Keeper</span>'
            : '<span style="color:#6c757d;">Drafted</span>';
        var cells = visCols.map(function(c) {
            if (c.key === 'watch')  return '<td>' + watchBtn(p) + '</td>';
            if (c.key === 'dnw')    return '<td>' + dnwBtn(p) + '</td>';
            if (c.key === 'name')   return '<td style="font-weight:600;white-space:nowrap">' + p.First + ' ' + p.Last + '</td>';
            if (c.key === 'P')      return '<td><span class="pos-badge">' + getPosDisplay(p) + '</span></td>';
            if (c.key === 'status') return '<td>' + avLabel + '</td>';
            if (c.key === 'Age')    return '<td>' + (p.Age || '—') + '</td>';
            if (c.key === 'T')      return '<td>' + (p.T || '—') + '</td>';
            if (c.key === 'B')      return '<td>' + (p.B || '—') + '</td>';
            if (c.key === 'Injury') return '<td>' + (p.Injury || '—') + '</td>';
            if (c.key === 'SDur')   return '<td>' + (p.SDur || '—') + '</td>';
            if (c.key === 'RDur')   return '<td>' + (p.RDur || '—') + '</td>';
            if (c.rankCol !== undefined) return rankBadge(getPlayerRank(p, c.rankCol), c.rankCol);
            if (c.frating) {
                var rv = p[c.key];
                if (!rv) return '<td style="color:#ccc">—</td>';
                return '<td style="background:' + gradeBg(rv) + ';color:' + gradeColor(rv) + ';font-weight:600;white-space:nowrap;font-size:0.85em">' + fmtGrade(rv) + '</td>';
            }
            var val = fmt(p[c.key], c.dec);
            return '<td style="color:' + (val === '—' ? '#ccc' : '#333') + '">' + val + '</td>';
        }).join('');
        return '<tr class="' + rowCls + '">' + cells + '</tr>';
    }).join('');
}

function renderPlayerSearch() {
    var filtered = getFilteredPlayers();

    var hitters  = sortFiltered(filtered.filter(function(p) { return !isPitcher(p) && searchHitterMatchesFilter(p); }));
    var pitchers = sortFiltered(filtered.filter(function(p) { return  isPitcher(p) && searchPitcherMatchesFilter(p); }));

    var hCount = document.getElementById('search-hitter-count');
    var pCount = document.getElementById('search-pitcher-count');
    var label  = document.getElementById('player-count-label');
    if (hCount) hCount.textContent = '(' + hitters.length + ')';
    if (pCount) pCount.textContent = '(' + pitchers.length + ')';
    if (label)  label.textContent  = filtered.length + ' players';

    renderSearchTable('search-hitter-thead', 'search-hitter-tbody', hitters,  ALL_HITTER_COLS,  hiddenHitterCols,  'No hitters match');
    renderSearchTable('search-pitcher-thead','search-pitcher-tbody', pitchers, ALL_PITCHER_COLS, hiddenPitcherCols, 'No pitchers match');
}

// ── renderAll ─────────────────────────────────────────────────────────────────

function renderAll() {
    renderHeader();
    renderRoster();
    updateRosterPosChipsHitter();
    updateRosterPosChipsPitcher();
    renderMyPicks();
    renderWatchlist();
    updateSearchPosChipsHitter();
    updateSearchPosChipsPitcher();
    renderPlayerSearch();
}

// ── Card expand / collapse ────────────────────────────────────────────────────

function toggleCollapseCard(btn) {
    btn.closest('.full-card').classList.toggle('collapsed');
}

function toggleExpandCard(btn) {
    var card = btn.closest('.full-card');
    var expanding = !card.classList.contains('expanded');
    collapseExpandedCard();
    if (expanding) {
        card.classList.add('expanded');
        btn.textContent = '✕';
        document.getElementById('expand-backdrop').classList.add('visible');
    }
}
function collapseExpandedCard() {
    document.querySelectorAll('.full-card.expanded').forEach(function(c) { c.classList.remove('expanded'); });
    document.querySelectorAll('.btn-expand').forEach(function(b) { b.textContent = '⛶'; });
    document.getElementById('expand-backdrop').classList.remove('visible');
}
