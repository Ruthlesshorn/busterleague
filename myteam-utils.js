// myteam-utils.js — Pure utility functions for myteam.html

function escapeHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fmt(val, dec) {
    if (val == null || val === '') return '—';
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return dec != null ? n.toFixed(dec) : Math.round(n);
}

function gradeColor(val) {
    if (!val) return '#999';
    var g = String(val).split('/')[0];
    return {Ex:'#155724', Vg:'#1a6830', Av:'#7d6608', Fr:'#842029', Pr:'#6c1b22'}[g] || '#333';
}
function gradeBg(val) {
    if (!val) return 'transparent';
    var g = String(val).split('/')[0];
    return {Ex:'#d1e7dd', Vg:'#d1e7dd', Av:'#fff3cd', Fr:'#f8d7da', Pr:'#f8d7da'}[g] || 'transparent';
}
function fmtGrade(val) {
    if (!val) return '—';
    return String(val).replace('/', ' / ');
}

function getPlayerPosition(p) { return (p.P || 'UTIL'); }

function getEligiblePositions(p) {
    if (p.eligible_positions && p.eligible_positions.length)
        return p.eligible_positions.map(function(x){ return x.toLowerCase(); });
    return [getPlayerPosition(p).toLowerCase()];
}
function getPosDisplay(p) {
    var elig = getEligiblePositions(p);
    return elig.map(function(x){ return x.toUpperCase(); }).join('/');
}

function isPitcher(p) {
    const pos = getPlayerPosition(p).toUpperCase();
    return pos === 'SP' || pos === 'RP';
}

function getAvailability(p) {
    if (p.Team) return 'keeper';
    const found = draftedPlayers.find(function(d) {
        return d.player.First === p.First && d.player.Last === p.Last && d.player.Age === p.Age;
    });
    return found ? 'drafted' : 'available';
}

function watchKey(p) { return p.First + '|' + p.Last + '|' + p.Age; }

function unsanitizeFromFirebase(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(unsanitizeFromFirebase);

    const unsanitized = {};
    const keyMap = {
        'H_9': 'H/9', 'K_9': 'K/9', 'BB_9': 'BB/9', 'HR_9': 'HR/9'
    };

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const originalKey = keyMap[key] || key;
            unsanitized[originalKey] = unsanitizeFromFirebase(obj[key]);
        }
    }
    return unsanitized;
}

function mkPlayerKey(first, last) {
    return (first||'').toLowerCase().replace(/[.#$\/\[\]]/g,'') + '|' +
           (last||'').toLowerCase().replace(/[.#$\/\[\]]/g,'');
}

function getRosterRows() {
    var team = getMyTeam().toUpperCase();
    var keepers = players.filter(function(p) { return (p.Team || '').toUpperCase() === team; });
    var drafted = draftedPlayers.filter(function(d) { return (d.team || '').toUpperCase() === team; });
    return keepers.map(function(p) { return { player: p, type: 'keeper' }; })
        .concat(drafted.map(function(d) { return { player: d.player, type: 'drafted' }; }));
}

function getMyTeam() {
    const u = window.firebaseAuth && window.firebaseAuth.currentUser;
    return u ? u.email.split('@')[0].toUpperCase() : '';
}

function logout() {
    const doRedirect = function() {
        localStorage.removeItem('busterLeagueTeam');
        window.location.href = 'login.html';
    };
    if (window.firebaseAuth && window.firebaseSignOut) {
        window.firebaseSignOut(window.firebaseAuth).then(doRedirect, doRedirect);
    } else {
        doRedirect();
    }
}

function showChangePassword() {
    var el = document.getElementById('chpw-overlay');
    el.style.display = 'flex';
    document.getElementById('chpw-current').value = '';
    document.getElementById('chpw-new').value = '';
    document.getElementById('chpw-confirm').value = '';
    document.getElementById('chpw-msg').style.display = 'none';
    document.getElementById('chpw-current').focus();
}

function hideChangePassword() {
    document.getElementById('chpw-overlay').style.display = 'none';
}

async function submitChangePassword() {
    var currentPass = document.getElementById('chpw-current').value;
    var newPass     = document.getElementById('chpw-new').value;
    var confirmPass = document.getElementById('chpw-confirm').value;
    var msg         = document.getElementById('chpw-msg');

    function showMsg(text, isError) {
        msg.textContent = text;
        msg.style.background = isError ? '#fff5f5' : '#f0fff4';
        msg.style.color      = isError ? '#c41e3a' : '#276749';
        msg.style.border     = isError ? '1px solid #f8d7da' : '1px solid #c6f6d5';
        msg.style.display    = 'block';
    }

    if (!currentPass || !newPass || !confirmPass) { showMsg('Please fill in all fields.', true); return; }
    if (newPass.length < 6)                        { showMsg('New password must be at least 6 characters.', true); return; }
    if (newPass !== confirmPass)                    { showMsg('New passwords do not match.', true); return; }

    var user = window.firebaseAuth && window.firebaseAuth.currentUser;
    if (!user) { showMsg('Not signed in. Please reload the page.', true); return; }

    try {
        var credential = window.firebaseEmailAuthProvider.credential(user.email, currentPass);
        await window.firebaseReauthenticate(user, credential);
        await window.firebaseUpdatePassword(user, newPass);
        showMsg('Password updated successfully!', false);
        setTimeout(hideChangePassword, 1800);
    } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
            showMsg('Current password is incorrect.', true);
        } else {
            showMsg('Error: ' + e.message, true);
        }
    }
}
