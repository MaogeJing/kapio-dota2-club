'use strict';
const $ = s => document.querySelector(s);
function filterMatches(){const q=$('#match-search').value.trim().toLowerCase(),day=$('#match-day').value;let n=0;document.querySelectorAll('.match-card').forEach(c=>{c.hidden=!!((day&&c.dataset.day!==day)||(q&&!c.dataset.search.toLowerCase().includes(q)));if(!c.hidden)n++});$('#match-count').textContent=n+'场';$('#match-empty').hidden=n!==0}
$('#match-search').addEventListener('input',filterMatches);$('#match-day').addEventListener('change',filterMatches);
$('#player-search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.player').forEach(p=>p.hidden=!p.dataset.search.toLowerCase().includes(q))});
function filterHeroes(){const q=$('#hero-search').value.trim().toLowerCase(),min=$('#hero-sample').checked?3:0;document.querySelectorAll('#hero-table tbody tr').forEach(r=>r.hidden=Number(r.dataset.games)<min||!r.dataset.search.toLowerCase().includes(q))}
$('#hero-search').addEventListener('input',filterHeroes);$('#hero-sample').addEventListener('change',filterHeroes);
