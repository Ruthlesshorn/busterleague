// myteam-constants.js — Static constants and column definitions for myteam.html

const TEAMS = ['PHI','SEA','BAL','CWS','PIT','NYM','KC','BOS','STL','CIN',
               'OAK','LA','CHC','DET','CLE','HOU','SF','TEX','ATL','NYY'];

// Team color palettes: p=primary, pl=primary-light, s=secondary, sl=secondary-light, ss=secondary-subtle
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
const REQUIREMENTS = { C: 3, SP: 8, RP: 8 };
const POS_LABELS = { C:'C', SP:'SP', RP:'RP', '1b':'1B', '2b':'2B', '3b':'3B', ss:'SS', lf:'LF', cf:'CF', rf:'RF', dh:'DH' };
const ALL_POS = ['C','SP','RP','1b','2b','3b','ss','lf','cf','rf','dh'];
const NUM_ROUNDS = 25;

var ALL_HITTER_COLS = [
    { key: 'watch',    label: 'Watch' },
    { key: 'dnw',      label: '🚫' },
    { key: 'name',     label: 'Player' },
    { key: 'P',        label: 'Pos' },
    { key: 'status',   label: 'Status' },
    { key: '_rank0',   label: 'Rank 1', rankCol: 0 },
    { key: '_rank1',   label: 'Rank 2', rankCol: 1 },
    { key: '_rank2',   label: 'Rank 3', rankCol: 2 },
    { key: 'Age',      label: 'Age' },
    { key: 'T',        label: 'Throw' },
    { key: 'B',        label: 'Bat' },
    { key: 'AVG',      label: 'AVG',    dec: 3 },
    { key: 'OBP',      label: 'OBP',    dec: 3 },
    { key: 'SPC',      label: 'SLG',    dec: 3 },
    { key: 'OPS',      label: 'OPS',    dec: 3 },
    { key: 'OPS+',     label: 'OPS+',   dec: 0 },
    { key: 'wRC+',     label: 'wRC+',   dec: 0 },
    { key: 'wOBA',     label: 'wOBA',   dec: 3 },
    { key: 'ISO',      label: 'ISO',    dec: 3 },
    { key: 'BABIP',    label: 'BABIP',  dec: 3 },
    { key: 'HR',       label: 'HR',     dec: 0 },
    { key: 'RBI',      label: 'RBI',    dec: 0 },
    { key: 'SB',       label: 'SB',     dec: 0 },
    { key: 'R',        label: 'R',      dec: 0 },
    { key: 'BB',       label: 'BB',     dec: 0 },
    { key: 'K',        label: 'K',      dec: 0 },
    { key: 'PA',       label: 'PA',     dec: 0 },
    { key: 'AB',       label: 'AB',     dec: 0 },
    { key: 'TB',       label: 'TB',     dec: 0 },
    { key: 'EBH',      label: 'XBH',    dec: 0 },
    { key: 'RC',       label: 'RC',     dec: 0 },
    { key: 'RC27',     label: 'RC/27',  dec: 2 },
    { key: 'L-PA',     label: 'vs L PA',  dec: 0 },
    { key: 'L-AVG',    label: 'vs L AVG', dec: 3 },
    { key: 'L-OBP',    label: 'vs L OBP', dec: 3 },
    { key: 'L-SPC',    label: 'vs L SPC', dec: 3 },
    { key: 'L-OPS',    label: 'vs L OPS', dec: 3 },
    { key: 'R-PA',     label: 'vs R PA',  dec: 0 },
    { key: 'R-AVG',    label: 'vs R AVG', dec: 3 },
    { key: 'R-OBP',    label: 'vs R OBP', dec: 3 },
    { key: 'R-SPC',    label: 'vs R SPC', dec: 3 },
    { key: 'R-OPS',    label: 'vs R OPS', dec: 3 },
    { key: 'Injury',   label: 'Injury',   dec: 0 },
    { key: 'WAR-BR',   label: 'WAR(BR)', dec: 1 },
    { key: 'WAR-FG',   label: 'WAR(FG)', dec: 1 },
    { key: 'c',        label: 'C Fld',   frating: true },
    { key: '1b',       label: '1B Fld',  frating: true },
    { key: '2b',       label: '2B Fld',  frating: true },
    { key: '3b',       label: '3B Fld',  frating: true },
    { key: 'ss',       label: 'SS Fld',  frating: true },
    { key: 'lf',       label: 'LF Fld',  frating: true },
    { key: 'cf',       label: 'CF Fld',  frating: true },
    { key: 'rf',       label: 'RF Fld',  frating: true },
    { key: 'OF-Arm',   label: 'OF Arm',  frating: true },
    { key: 'C-Arm',    label: 'C Arm',   frating: true },
    { key: 'Run',      label: 'Run',     frating: true },
    { key: 'Stl',      label: 'Stl',     frating: true },
];

var ALL_PITCHER_COLS = [
    { key: 'watch',   label: 'Watch' },
    { key: 'dnw',     label: '🚫' },
    { key: 'name',    label: 'Player' },
    { key: 'P',       label: 'Pos' },
    { key: 'status',  label: 'Status' },
    { key: '_rank0',  label: 'Rank 1', rankCol: 3 },
    { key: '_rank1',  label: 'Rank 2', rankCol: 4 },
    { key: '_rank2',  label: 'Rank 3', rankCol: 5 },
    { key: 'Age',     label: 'Age' },
    { key: 'T',       label: 'Throw' },
    { key: 'B',       label: 'Bat' },
    { key: 'ERA',     label: 'ERA',    dec: 2 },
    { key: 'FIP',     label: 'FIP',    dec: 2 },
    { key: 'xFIP',    label: 'xFIP',   dec: 2 },
    { key: 'CERA',    label: 'CERA',   dec: 2 },
    { key: 'ERA+',    label: 'ERA+',   dec: 0 },
    { key: 'WHIP',    label: 'WHIP',   dec: 3 },
    { key: 'W',       label: 'W',      dec: 0 },
    { key: 'L',       label: 'L',      dec: 0 },
    { key: 'S',       label: 'SV',     dec: 0 },
    { key: 'K',       label: 'K',      dec: 0 },
    { key: 'IP',      label: 'IP',     dec: 1 },
    { key: 'G',       label: 'G',      dec: 0 },
    { key: 'GS',      label: 'GS',     dec: 0 },
    { key: 'K/9',     label: 'K/9',    dec: 1 },
    { key: 'BB/9',    label: 'BB/9',   dec: 2 },
    { key: 'H/9',     label: 'H/9',    dec: 1 },
    { key: 'HR/9',    label: 'HR/9',   dec: 2 },
    { key: 'K/BB',    label: 'K/BB',   dec: 2 },
    { key: 'BABIP',   label: 'BABIP',  dec: 3 },
    { key: 'L-PA',    label: 'vs L PA',  dec: 0 },
    { key: 'L-AVG',   label: 'vs L AVG', dec: 3 },
    { key: 'L-OBP',   label: 'vs L OBP', dec: 3 },
    { key: 'L-SPC',   label: 'vs L SPC', dec: 3 },
    { key: 'L-OPS',   label: 'vs L OPS', dec: 3 },
    { key: 'R-PA',    label: 'vs R PA',  dec: 0 },
    { key: 'R-AVG',   label: 'vs R AVG', dec: 3 },
    { key: 'R-OBP',   label: 'vs R OBP', dec: 3 },
    { key: 'R-SPC',   label: 'vs R SPC', dec: 3 },
    { key: 'R-OPS',   label: 'vs R OPS', dec: 3 },
    { key: 'SDur',    label: 'SDur',   dec: 0 },
    { key: 'RDur',    label: 'RDur',   dec: 0 },
    { key: 'Injury',  label: 'Injury',   dec: 0 },
    { key: 'WAR-BR',  label: 'WAR(BR)', dec: 1 },
    { key: 'WAR-FG',  label: 'WAR(FG)', dec: 1 }
];

// Roster column sets — exclude action/status columns not shown in roster tables
var _rosterExclude = ['watch', 'dnw', 'status'];
var HITTER_COLS  = ALL_HITTER_COLS.filter(function(c)  { return _rosterExclude.indexOf(c.key) === -1; });
var PITCHER_COLS = ALL_PITCHER_COLS.filter(function(c) { return _rosterExclude.indexOf(c.key) === -1; });
