// myteam-state.js — Global mutable state, localStorage helpers, and load functions

let players = [];
let draftedPlayers = [];
let currentPickIndex = 0;

function loadDraftState() {
    const saved = localStorage.getItem('busterLeagueDraft');
    if (saved) {
        const d = JSON.parse(saved);
        draftedPlayers = d.draftedPlayers || [];
        currentPickIndex = d.currentPickIndex || 0;
    }
}

// Search column visibility + order
var hiddenHitterCols      = new Set();
var hiddenPitcherCols     = new Set();
var searchColOrderHitter  = null;
var searchColOrderPitcher = null;
var searchReorderMode     = { hitter: false, pitcher: false };

// Watchlist column visibility + order
var hiddenWLHitterCols  = new Set();
var hiddenWLPitcherCols = new Set();
var wlColOrderHitter    = null;
var wlColOrderPitcher   = null;
var wlReorderMode       = { hitter: false, pitcher: false };

// Watchlist sort state
var wlSortCol  = null;
var wlSortDir  = 'asc';
var wlSortList = 0;

// Watchlist position filters
var wlActivePosFiltersHitter  = new Set();
var wlActivePosFiltersPitcher = new Set();

// Search position filters
var searchActivePosFiltersHitter  = new Set();
var searchActivePosFiltersPitcher = new Set();

// Search sort state
var searchSortCol  = null;
var searchSortDir  = 'asc';
var searchSortList = 0;

// Roster column visibility + order + position filters
var hiddenRosterHitterCols    = new Set();
var hiddenRosterPitcherCols   = new Set();
var rosterColOrderHitter      = null;
var rosterColOrderPitcher     = null;
var rosterReorderMode         = { hitter: false, pitcher: false };
var rosterActivePosFiltersHitter  = new Set();
var rosterActivePosFiltersPitcher = new Set();

// Rankings data
var rLists = [
    {data:{},order:'asc'}, {data:{},order:'asc'}, {data:{},order:'asc'},
    {data:{},order:'asc'}, {data:{},order:'asc'}, {data:{},order:'asc'}
];
var rNames = [
    'Hitter Rank 1', 'Hitter Rank 2', 'Hitter Rank 3',
    'Pitcher Rank 1', 'Pitcher Rank 2', 'Pitcher Rank 3'
];
var activeRankTab = 0;
var pendingRows   = [null, null, null, null, null, null];

// localStorage key helpers
function colPrefsKeyH() { return 'colPrefs_hitter_'  + getMyTeam(); }
function colPrefsKeyP() { return 'colPrefs_pitcher_' + getMyTeam(); }

function rKey(i)     { return 'busterRankings_'     + i + '_' + (getMyTeam() || 'x'); }
function rNameKey(i) { return 'busterRankingsName_' + i + '_' + (getMyTeam() || 'x'); }

function rosterColPrefsKey(type) { return 'colPrefs_roster_' + type + '_' + getMyTeam(); }
function wlColPrefsKey(type)     { return 'wlColPrefs_' + type + '_' + (getMyTeam() || 'x'); }
function wlColOrderKey(type)     { return 'wlColOrder_' + type + '_' + (getMyTeam() || 'x'); }

function loadColPrefs() {
    try {
        var h = localStorage.getItem(colPrefsKeyH());
        var p = localStorage.getItem(colPrefsKeyP());
        hiddenHitterCols  = h ? new Set(JSON.parse(h)) : new Set();
        hiddenPitcherCols = p ? new Set(JSON.parse(p)) : new Set();
        var oh = localStorage.getItem(colPrefsKeyH() + '_order');
        var op = localStorage.getItem(colPrefsKeyP() + '_order');
        searchColOrderHitter  = oh ? JSON.parse(oh) : null;
        searchColOrderPitcher = op ? JSON.parse(op) : null;
    } catch(e) {
        hiddenHitterCols  = new Set();
        hiddenPitcherCols = new Set();
    }
}

function loadRosterColPrefs() {
    try {
        var h = localStorage.getItem(rosterColPrefsKey('hitter'));
        var p = localStorage.getItem(rosterColPrefsKey('pitcher'));
        hiddenRosterHitterCols  = h ? new Set(JSON.parse(h)) : new Set();
        hiddenRosterPitcherCols = p ? new Set(JSON.parse(p)) : new Set();
        var hOrder = localStorage.getItem(rosterColPrefsKey('hitter') + '_order');
        var pOrder = localStorage.getItem(rosterColPrefsKey('pitcher') + '_order');
        rosterColOrderHitter  = hOrder ? JSON.parse(hOrder) : null;
        rosterColOrderPitcher = pOrder ? JSON.parse(pOrder) : null;
    } catch(e) {}
}

function loadWLColPrefs() {
    try {
        var h = localStorage.getItem(wlColPrefsKey('hitter'));
        var p = localStorage.getItem(wlColPrefsKey('pitcher'));
        hiddenWLHitterCols  = h ? new Set(JSON.parse(h)) : new Set(['OBP','SPC','wOBA','wRC','BABIP','ISO','pull','cent','oppo','hard','LD','GB','FB','age_adj','c','1b','2b','3b','ss','lf','cf','rf','OF-Arm','C-Arm','Run','Stl','_rank1','_rank2']);
        hiddenWLPitcherCols = p ? new Set(JSON.parse(p)) : new Set(['FIP','xFIP','BABIP_p','LOB','GB_p','HR9','K9','BB9','_rank1','_rank2']);
        var oh = localStorage.getItem(wlColOrderKey('hitter'));
        var op = localStorage.getItem(wlColOrderKey('pitcher'));
        wlColOrderHitter  = oh ? JSON.parse(oh) : null;
        wlColOrderPitcher = op ? JSON.parse(op) : null;
    } catch(e) {
        hiddenWLHitterCols  = new Set();
        hiddenWLPitcherCols = new Set();
    }
}

function loadRankings() {
    for (var i = 0; i < 6; i++) {
        var saved = localStorage.getItem(rKey(i));
        if (saved) {
            try {
                var parsed = JSON.parse(saved);
                rLists[i].data  = parsed.data  || {};
                rLists[i].order = parsed.order || 'asc';
            } catch(e) { rLists[i].data = {}; }
        }
        var savedName = localStorage.getItem(rNameKey(i));
        if (savedName) rNames[i] = savedName;

        var loadedEl = document.getElementById('rlist-loaded-' + i);
        var countEl  = document.getElementById('rlist-count-' + i);
        var nameEl   = document.getElementById('rname-' + i);
        if (nameEl) nameEl.value = rNames[i];

        var count = Object.keys(rLists[i].data).length;
        if (count && loadedEl && countEl) {
            countEl.textContent = count + ' players loaded';
            loadedEl.style.display = 'flex';
        }
    }
    renderPlayerSearch();
    renderWatchlist();
}
