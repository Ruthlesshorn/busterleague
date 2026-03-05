// myteam-init.js — DOMContentLoaded handler and global event listeners

document.addEventListener('DOMContentLoaded', async function() {
    // Auth guard — verified via Firebase Auth (not localStorage)
    const user = await new Promise(resolve =>
        window.firebaseOnAuthStateChanged(window.firebaseAuth, resolve));
    if (!user) { window.location.href = 'login.html'; return; }

    var team = getMyTeam();
    applyTeamColors(team);
    players = await fetch('players.json').then(r => r.json());

    loadDraftState();
    loadColPrefs();
    loadRosterColPrefs();
    loadRankings();
    loadWLColPrefs();
    renderAll();

    document.getElementById('search').addEventListener('input', function() {
        renderPlayerSearch();
    });
    document.getElementById('avail-filter').addEventListener('change', function() {
        renderPlayerSearch();
    });

    // Close change-password modal or expanded card on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { hideChangePassword(); collapseExpandedCard(); }
    });
    document.getElementById('chpw-overlay').addEventListener('click', function(e) {
        if (e.target === this) hideChangePassword();
    });

    // Initialize Firebase sync
    var teamPath = team.toLowerCase();
    if (window.firebaseInitialized) {
        try {
            const draftSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'draftedPlayers'));
            if (draftSnapshot.exists()) {
                const raw = unsanitizeFromFirebase(draftSnapshot.val());
                draftedPlayers = Array.isArray(raw) ? raw : Object.values(raw);
                localStorage.setItem('busterLeagueDraft', JSON.stringify({
                    draftedPlayers: draftedPlayers,
                    currentPickIndex: draftedPlayers.length
                }));
                renderAll();
            }

            window.firebaseOnValue(window.firebaseRef(window.firebaseDB, 'draftedPlayers'), (snapshot) => {
                const raw     = unsanitizeFromFirebase(snapshot.val() || {});
                const newPicks = Array.isArray(raw) ? raw : Object.values(raw);
                if (newPicks.length !== draftedPlayers.length) {
                    draftedPlayers = newPicks;
                    localStorage.setItem('busterLeagueDraft', JSON.stringify({
                        draftedPlayers: draftedPlayers,
                        currentPickIndex: draftedPlayers.length
                    }));
                    renderAll();
                }
            });

            // Load initial watchlist from Firebase
            const watchlistSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'watchlists/' + teamPath));
            if (watchlistSnap.exists()) {
                localStorage.setItem('watchlist_' + team, JSON.stringify(watchlistSnap.val()));
                renderAll();
            }

            // Listen for watchlist changes
            window.firebaseOnValue(window.firebaseRef(window.firebaseDB, 'watchlists/' + teamPath), (snapshot) => {
                const data      = snapshot.val() || [];
                const currentWL = getWatchlist();
                if (JSON.stringify(data) !== JSON.stringify(currentWL)) {
                    localStorage.setItem('watchlist_' + team, JSON.stringify(data));
                    renderAll();
                }
            });

            // Load rankings from Firebase (one-time fetch)
            const rankSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'rankings/' + teamPath));
            if (rankSnap.exists()) {
                var fbRankings = rankSnap.val();
                for (var i = 0; i < 6; i++) {
                    var list = fbRankings[i];
                    if (list) {
                        rLists[i].data  = list.data  || {};
                        rLists[i].order = list.order || 'asc';
                        if (list.name) rNames[i] = list.name;
                        localStorage.setItem(rKey(i),     JSON.stringify({data: rLists[i].data, order: rLists[i].order}));
                        localStorage.setItem(rNameKey(i), rNames[i]);
                    }
                }
                refreshRankingsTabs();
                renderPlayerSearch();
            }

            // Load DNW list from Firebase
            const dnwSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'dnw/' + teamPath));
            if (dnwSnap.exists()) {
                localStorage.setItem('dnw_' + team, JSON.stringify(dnwSnap.val()));
                renderAll();
            }
            // Listen for DNW changes
            window.firebaseOnValue(window.firebaseRef(window.firebaseDB, 'dnw/' + teamPath), (snapshot) => {
                const data    = snapshot.val() || [];
                const current = getDNWList();
                if (JSON.stringify(data) !== JSON.stringify(current)) {
                    localStorage.setItem('dnw_' + team, JSON.stringify(data));
                    renderAll();
                }
            });

            // Load column preferences from Firebase (one-time fetch)
            const colSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'colprefs/' + teamPath));
            if (colSnap.exists()) {
                const cp = colSnap.val();
                // Watchlist prefs — new path cp.wl, backward-compat: old flat cp.hitter/pitcher
                const wl  = cp.wl || {};
                const wlH = wl.hitter      || cp.hitter;
                const wlP = wl.pitcher     || cp.pitcher;
                const wlHO = wl.hitterOrder  || cp.hitterOrder;
                const wlPO = wl.pitcherOrder || cp.pitcherOrder;
                if (wlH)  localStorage.setItem(wlColPrefsKey('hitter'),  JSON.stringify(wlH));
                if (wlP)  localStorage.setItem(wlColPrefsKey('pitcher'), JSON.stringify(wlP));
                if (wlHO) localStorage.setItem(wlColOrderKey('hitter'),  JSON.stringify(wlHO));
                if (wlPO) localStorage.setItem(wlColOrderKey('pitcher'), JSON.stringify(wlPO));
                loadWLColPrefs();
                // Roster prefs
                if (cp.roster) {
                    const r = cp.roster;
                    if (r.hitter)       localStorage.setItem(rosterColPrefsKey('hitter'),             JSON.stringify(r.hitter));
                    if (r.pitcher)      localStorage.setItem(rosterColPrefsKey('pitcher'),            JSON.stringify(r.pitcher));
                    if (r.hitterOrder)  localStorage.setItem(rosterColPrefsKey('hitter')  + '_order', JSON.stringify(r.hitterOrder));
                    if (r.pitcherOrder) localStorage.setItem(rosterColPrefsKey('pitcher') + '_order', JSON.stringify(r.pitcherOrder));
                    loadRosterColPrefs();
                }
                // Search prefs
                if (cp.search) {
                    const s = cp.search;
                    if (s.hitter)       localStorage.setItem(colPrefsKeyH(),             JSON.stringify(s.hitter));
                    if (s.pitcher)      localStorage.setItem(colPrefsKeyP(),             JSON.stringify(s.pitcher));
                    if (s.hitterOrder)  localStorage.setItem(colPrefsKeyH() + '_order', JSON.stringify(s.hitterOrder));
                    if (s.pitcherOrder) localStorage.setItem(colPrefsKeyP() + '_order', JSON.stringify(s.pitcherOrder));
                    loadColPrefs();
                }
                renderAll();
            }
        } catch (error) {
            console.error('Firebase sync error:', error);
        }
    }
});

window.addEventListener('storage', function(e) {
    if (e.key === 'busterLeagueDraft') { loadDraftState(); renderAll(); }
});
window.addEventListener('focus', function() { loadDraftState(); renderAll(); });
