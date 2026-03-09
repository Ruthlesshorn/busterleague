// team-colors.js — Single source of truth for team color palettes
// p=primary, pl=primary-light, s=secondary, sl=secondary-light, ss=secondary-subtle

const TEAM_COLORS = {
    PHI: { p:'#E81828', pl:'#f04050', s:'#002D72', sl:'#003fa0', ss:'#e6e8f2' }, // Phillies: red / navy
    SEA: { p:'#005C5C', pl:'#007a7a', s:'#0C2C56', sl:'#173f78', ss:'#e5eaef' }, // Mariners: teal / navy
    BAL: { p:'#DF4601', pl:'#f05a1a', s:'#1a1a1a', sl:'#2d2d2d', ss:'#e8e8e8' }, // Orioles: orange / black
    CWS: { p:'#3d3a31', pl:'#504d42', s:'#27251F', sl:'#3a3730', ss:'#eaeae8' }, // White Sox: charcoal / black
    PIT: { p:'#b88010', pl:'#c89020', s:'#27251F', sl:'#3a3730', ss:'#eaeae8' }, // Pirates: gold / black
    NYM: { p:'#FF5910', pl:'#ff7a40', s:'#002D72', sl:'#003fa0', ss:'#e6e8f2' }, // Mets: orange / blue
    KC:  { p:'#8a6030', pl:'#9a7040', s:'#004687', sl:'#005aaa', ss:'#e5eaf5' }, // Royals: gold / blue
    BOS: { p:'#BD3039', pl:'#d44552', s:'#0D2B56', sl:'#183d78', ss:'#e5e8ef' }, // Red Sox: red / navy
    STL: { p:'#C41E3A', pl:'#d94e59', s:'#0C2340', sl:'#173457', ss:'#e5e7f0' }, // Cardinals: red / navy
    CIN: { p:'#C6011F', pl:'#d62535', s:'#1a1a1a', sl:'#2d2d2d', ss:'#e8e8e8' }, // Reds: red / black
    OAK: { p:'#a07a00', pl:'#b08a10', s:'#003831', sl:'#004d43', ss:'#e0efed' }, // Athletics: gold / green
    LA:  { p:'#005A9C', pl:'#1a70b8', s:'#1c1c1c', sl:'#2d2d2d', ss:'#e8e8e8' }, // Dodgers: blue / black
    CHC: { p:'#CC3433', pl:'#de4d4c', s:'#0E3386', sl:'#1945a8', ss:'#e6e9f5' }, // Cubs: red / blue
    DET: { p:'#FA4616', pl:'#fb6438', s:'#0C2340', sl:'#173457', ss:'#e5e7f0' }, // Tigers: orange / navy
    CLE: { p:'#E31937', pl:'#f03550', s:'#00385D', sl:'#004d7e', ss:'#e0e8ef' }, // Guardians: red / navy
    HOU: { p:'#EB6E1F', pl:'#f48840', s:'#002D62', sl:'#003e87', ss:'#e5e8f2' }, // Astros: orange / navy
    SF:  { p:'#FD5A1E', pl:'#fd7545', s:'#27251F', sl:'#3a3730', ss:'#eaeae8' }, // Giants: orange / black
    TEX: { p:'#C0111F', pl:'#d42535', s:'#003278', sl:'#003e96', ss:'#e5e8f4' }, // Rangers: red / blue
    ATL: { p:'#CE1141', pl:'#e02558', s:'#13274F', sl:'#1e3a72', ss:'#e6e9f0' }, // Braves: red / navy
    NYY: { p:'#003087', pl:'#1a4aad', s:'#1a1a2e', sl:'#252540', ss:'#eaeaee' }, // Yankees: navy / dark navy
};

function applyTeamColors(team) {
    var c = TEAM_COLORS[team] || TEAM_COLORS['STL'];
    var root = document.documentElement;
    root.style.setProperty('--team-primary', c.p);
    root.style.setProperty('--team-primary-light', c.pl);
    root.style.setProperty('--team-secondary', c.s);
    root.style.setProperty('--team-secondary-light', c.sl);
    root.style.setProperty('--team-secondary-subtle', c.ss);
    try { localStorage.setItem('busterLeagueColors', JSON.stringify(c)); } catch(e) {}
}
