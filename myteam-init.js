// myteam-init.js — Firebase initialization, auth guard, and event listeners for myteam.html

document.addEventListener('DOMContentLoaded', async function() {
    // Auth guard — verified via Firebase Auth (not localStorage)
    const user = await new Promise(resolve =>
        window.firebaseOnAuthStateChanged(window.firebaseAuth, resolve));
    if (!user) { window.location.href = 'login.html'; return; }

    var team = getMyTeam(); // now reads from auth.currentUser
    players = await fetch('players.json').then(r => r.json());

    loadDraftState();
    loadColPrefs();
    loadRosterColPrefs();
    loadRankings();
    loadWLColPrefs();
    renderAll();

    document.getElementById('search').addEventListener('input', renderPlayerSearch);
    document.getElementById('avail-filter').addEventListener('change', renderPlayerSearch);

    // Event delegation for watch and DNW buttons
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.watch-btn');
        if (btn) { toggleWatch(btn.getAttribute('data-key')); }
        var dbtn = e.target.closest('.dnw-btn');
        if (dbtn) { toggleDNW(dbtn.getAttribute('data-dnw-key')); }
    });

    // Escape key closes password modal or expanded card
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { hideChangePassword(); collapseExpandedCard(); }
    });

    // Click outside password modal closes it
    document.getElementById('chpw-overlay').addEventListener('click', function(e) {
        if (e.target === this) hideChangePassword();
    });

    // Initialize Firebase sync (auth already confirmed above — no timeout needed)
    // Watchlist paths use lowercase team to match Firebase security rules
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
                const raw = unsanitizeFromFirebase(snapshot.val() || {});
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
                console.log('Loaded watchlist from Firebase');
                renderAll();
            }

            // Listen for watchlist changes
            window.firebaseOnValue(window.firebaseRef(window.firebaseDB, 'watchlists/' + teamPath), (snapshot) => {
                const data = snapshot.val() || [];
                const currentWL = getWatchlist();
                if (JSON.stringify(data) !== JSON.stringify(currentWL)) {
                    console.log('Watchlist updated from another device');
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
                console.log('Loaded rankings from Firebase');
                refreshRankingsTabs();
                renderPlayerSearch();
            }

            // Load DNW list from Firebase
            const dnwSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'dnw/' + teamPath));
            if (dnwSnap.exists()) {
                localStorage.setItem('dnw_' + team, JSON.stringify(dnwSnap.val()));
                console.log('Loaded DNW list from Firebase');
                renderAll();
            }
            // Listen for DNW changes
            window.firebaseOnValue(window.firebaseRef(window.firebaseDB, 'dnw/' + teamPath), (snapshot) => {
                const data = snapshot.val() || [];
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
                if (cp.hitter)       localStorage.setItem(wlColPrefsKey('hitter'),  JSON.stringify(cp.hitter));
                if (cp.pitcher)      localStorage.setItem(wlColPrefsKey('pitcher'), JSON.stringify(cp.pitcher));
                if (cp.hitterOrder)  localStorage.setItem(wlColOrderKey('hitter'),  JSON.stringify(cp.hitterOrder));
                if (cp.pitcherOrder) localStorage.setItem(wlColOrderKey('pitcher'), JSON.stringify(cp.pitcherOrder));
                loadWLColPrefs();
                console.log('Loaded column prefs from Firebase');
                renderAll();
            }

            console.log('Firebase sync enabled for team:', team);
        } catch (error) {
            console.error('Firebase sync error:', error);
        }
    }
});

window.addEventListener('storage', function(e) {
    if (e.key === 'busterLeagueDraft') { loadDraftState(); renderAll(); }
});
window.addEventListener('focus', function() { loadDraftState(); renderAll(); });
