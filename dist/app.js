'use strict';
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '收起导航' : '展开导航');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', '展开导航');
  navigation.classList.remove('open');
}));
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let matches = [];
function renderMatches(day = 'all') {
  const shown = matches.filter(match => day === 'all' || match.day === day);
  document.querySelector('#match-list').innerHTML = shown.map(match => `<a class="match-row" href="reports/index.html?match=${encodeURIComponent(match.id)}" aria-label="${escapeHTML(match.publicLabel + '，' + match.title)}"><img class="match-icon" src="${escapeHTML(match.image)}" alt="${escapeHTML(match.hero)}" loading="lazy"><div><p class="match-meta">${escapeHTML(match.publicLabel)} <span> / ${escapeHTML(match.duration)}</span></p><h4>${escapeHTML(match.title)}</h4><p class="match-summary">${escapeHTML(match.summary)}</p></div><div class="match-result"><div class="score"><span class="${match.winner === '天辉' ? 'winner' : ''}">${match.radiant}</span><span class="colon">:</span><span class="${match.winner === '夜魇' ? 'winner' : ''}">${match.dire}</span></div><p class="result-caption">天辉 / 夜魇 · ${match.winner}胜</p></div><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('');
  document.querySelector('.archive-toolbar h3 span').textContent = shown.length;
}
fetch('content.json').then(response => {
  if (!response.ok) throw new Error('档案载入失败');
  return response.json();
}).then(content => { matches = content.matches; renderMatches(); }).catch(() => {
  document.querySelector('#match-list').innerHTML = '<p style="padding:25px 0">档案暂未载入。<a href="reports/index.html">直接打开五局详细战报 ↗</a></p>';
});
document.querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-day]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderMatches(button.dataset.day);
}));
const videoLibrary = {
  host: {title:'发条酒仙 · 跟大家打个招呼', src:'assets/jiuxian-intro.mp4', poster:'assets/jiuxian.webp', note:'KAPIO 虚拟讲解人 · 发条酒仙'}
};
// 视频号作品使用 HTML 原生链接，脚本未加载时也可以前往观看。
const mediaDialog = document.querySelector('#media-dialog');
const player = mediaDialog.querySelector('video');
document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => {
  const item = videoLibrary[button.dataset.video];
  document.querySelector('#media-title').textContent = item.title;
  mediaDialog.querySelector('.dialog-note').textContent = item.note;
  player.src = item.src;
  player.poster = item.poster;
  mediaDialog.showModal();
  document.body.style.overflow = 'hidden';
  player.play().catch(() => {});
}));
mediaDialog.addEventListener('close', () => { player.pause(); player.removeAttribute('src'); player.load(); });
const brandDialog = document.querySelector('#brand-dialog');
document.querySelector('[data-brand]').addEventListener('click', () => {brandDialog.showModal(); document.body.style.overflow = 'hidden';});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {document.body.style.overflow = '';});
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});

const memberSearch = document.querySelector('#member-search');
const memberCards = [...document.querySelectorAll('.member-card')];
memberSearch.addEventListener('input', () => {
  const query = memberSearch.value.trim().toLocaleLowerCase();
  let shown = 0;
  memberCards.forEach(card => { card.hidden = !card.dataset.memberName.toLocaleLowerCase().includes(query); if (!card.hidden) shown++; });
  document.querySelector('#members-count').textContent = query ? `找到 ${shown} 位朋友` : `${memberCards.length} 位朋友 · 10 场对黑的共同记忆`;
  document.querySelector('.members-empty').hidden = shown !== 0;
});
