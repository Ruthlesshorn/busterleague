// draft-utils.js
// Shared utility functions used by both index.html (dashboard) and draft.html (admin board).
// Depends on the following globals defined in each page's inline <script>:
//   players, draftedPlayers, currentPickIndex, saveDraftState(), renderAll()

const teams = [
    'PHI', 'SEA', 'BAL', 'CWS', 'PIT', 'NYM', 'KC', 'BOS', 'STL', 'CIN',
    'OAK', 'LA', 'CHC', 'DET', 'CLE', 'HOU', 'SF', 'TEX', 'ATL', 'NYY'
];

function getCurrentTeam() {
    const round = Math.floor(currentPickIndex / teams.length) + 1;
    const pickInRound = currentPickIndex % teams.length;

    // Snake draft: odd rounds go forward, even rounds go backward
    if (round % 2 === 1) {
        return teams[pickInRound];
    } else {
        return teams[teams.length - 1 - pickInRound];
    }
}

function getNextTeams(count = 10) {
    const nextTeams = [];
    for (let i = 1; i <= count; i++) {
        const pickIndex = currentPickIndex + i;
        if (pickIndex >= teams.length * 100) break; // Prevent infinite rounds

        const round = Math.floor(pickIndex / teams.length) + 1;
        const pickInRound = pickIndex % teams.length;

        let team;
        if (round % 2 === 1) {
            team = teams[pickInRound];
        } else {
            team = teams[teams.length - 1 - pickInRound];
        }
        nextTeams.push({ team, pickNumber: pickIndex + 1 });
    }
    return nextTeams;
}

function updateDraftStatus() {
    const currentTeam = getCurrentTeam();
    const round = Math.floor(currentPickIndex / teams.length) + 1;
    const pickInRound = (currentPickIndex % teams.length) + 1;

    document.getElementById('current-pick-text').textContent =
        `Pick ${currentPickIndex + 1} - ${currentTeam} is on the clock`;
    document.getElementById('current-round').textContent = round;
    document.getElementById('current-pick-number').textContent = pickInRound;
    document.getElementById('total-picks').textContent = teams.length;
}

function getPlayerPosition(player) {
    return player.P || 'UTIL';
}

function getEligiblePositions(player) {
    if (player.eligible_positions && Array.isArray(player.eligible_positions)) {
        return player.eligible_positions;
    }
    const pos = player.P;
    return pos ? [pos] : [];
}

function isPreDrafted(player) {
    return player.Team != null && player.Team !== '';
}

function draftPlayerByKey(playerKey) {
    const [firstName, lastName, age] = playerKey.split('|');
    const player = players.find(p =>
        p.First === firstName && p.Last === lastName && p.Age == age
    );

    if (!player) {
        alert('Player not found!');
        return;
    }

    if (isPreDrafted(player)) {
        alert(`${player.First} ${player.Last} is a keeper for ${player.Team}.`);
        return;
    }

    const currentTeam = getCurrentTeam();

    if (!confirm(`Draft ${player.First} ${player.Last} for ${currentTeam}?`)) {
        return;
    }

    draftedPlayers.push({
        pickNumber: currentPickIndex + 1,
        team: currentTeam,
        player: player,
        round: Math.floor(currentPickIndex / teams.length) + 1
    });

    currentPickIndex++;
    saveDraftState();
    renderAll();
}

function undoLastPick() {
    if (draftedPlayers.length === 0) return;
    if (!confirm('Undo the last pick?')) return;

    draftedPlayers.pop();
    currentPickIndex--;
    saveDraftState();
    renderAll();
}

function toggleDropdown(e) {
    e.stopPropagation();
    const menu = e.currentTarget.nextElementSibling;
    menu.classList.toggle('open');
}

function loadDraftState() {
    const saved = localStorage.getItem('busterLeagueDraft');
    if (saved) {
        const data = JSON.parse(saved);
        draftedPlayers = data.draftedPlayers || [];
        currentPickIndex = data.currentPickIndex || 0;
    }
}

function renderDraftOrder(nextCount = 10) {
    const orderList = document.getElementById('draft-order-list');
    if (!orderList) return;
    const currentTeam = getCurrentTeam();
    const nextTeams = getNextTeams(nextCount);

    let html = `<div class="team-item current-turn">ON THE CLOCK: ${currentTeam}</div>`;

    if (nextTeams.length > 0) {
        html += '<div style="margin-top: 15px; font-weight: 600; color: #6c757d; font-size: 0.9em;">Next Up:</div>';
        nextTeams.forEach(item => {
            html += `<div class="team-item">Pick ${item.pickNumber}: ${item.team}</div>`;
        });
    }

    orderList.innerHTML = html;
}
