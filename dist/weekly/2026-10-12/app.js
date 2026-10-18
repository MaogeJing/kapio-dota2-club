'use strict';
(() => {
  const D=window.WEEKLY_DATA, $=s=>document.querySelector(s);
  const players=new Map(D.players.map(p=>[p.id,p])),heroes=new Map(D.heroes.map(h=>[h.id,h]));
  const accounts=new Map(D.players.flatMap(p=>p.accounts.map(a=>[a.id,a])));
  const state={mode:'all',party:'all',day:'all',search:'',sort:'games',heroMin:true,heroAll:false,matchLimit:6};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct=(w,n)=>n?`${(w/n*100).toFixed(1)}%`:'—';
  const modeName=m=>m==='ranked'?'天梯':m==='unranked'?'普通匹配':'其他';
  const partyName=r=>r.party==='party'?`${r.size}人组排${r.partySource==='administrator_confirmation'?' · 管理员确认':''}`:r.party==='solo'?'单排':'组队信息未公开';
  const shortDate=t=>`${t.slice(5,7)}/${t.slice(8,10)} ${t.slice(11,16)}`;
  const sum=rs=>{const w=rs.filter(r=>r.win===true).length,l=rs.filter(r=>r.win===false).length,k=rs.reduce((s,r)=>s+r.k,0),d=rs.reduce((s,r)=>s+r.d,0),a=rs.reduce((s,r)=>s+r.a,0);return {n:rs.length,w,l,k,d,a,rate:rs.length?w/rs.length:0,kda:(k+a)/Math.max(1,d)}};
  const visible=(ignoreDay=false)=>D.entries.filter(r=>(state.mode==='all'||r.mode===state.mode)&&(state.party==='all'||r.party===state.party)&&(ignoreDay||state.day==='all'||r.day===state.day));
  const currentActor=new Map(D.entries.map(r=>[r.actor,{name:r.name,owner:r.ownerName,avatar:players.get(r.player).avatar,conflict:r.conflict}]));
  const rankBadge=a=>`<span class="account-rank" title="${esc(a.rankName)}${a.leaderboard?' · 天梯排名 #'+a.leaderboard:''} · 资料查询 ${a.rankObservedAt||'未知'}"><img src="${a.rankImage}" alt="${esc(a.rankName)}" loading="lazy"><span>${esc(a.rankShort)}${a.leaderboard?'<b>#'+a.leaderboard+'</b>':''}</span></span>`;
  const heroCounts=rs=>{const m=new Map;rs.forEach(r=>{if(!m.has(r.hero))m.set(r.hero,[]);m.get(r.hero).push(r)});return [...m].map(([id,rs])=>({hero:heroes.get(id),rows:rs,...sum(rs)})).sort((a,b)=>b.n-a.n||b.rate-a.rate||a.hero.id-b.hero.id)};
  const chips=(rs,mobile=false)=>`<span class="${mobile?'mobile-heroes':'hero-strip'}">${heroCounts(rs).slice(0,3).map(h=>`<span class="hero-chip" title="${esc(h.hero.name)} · ${h.n}场，${h.w}胜${h.l}负"><img src="${h.hero.image}" alt="${esc(h.hero.name)}" loading="lazy"><small>${h.n}</small></span>`).join('')}</span>`;
  const empty=t=>`<p class="empty">${esc(t)}</p>`;
  let currentRows=[],pairs=[];

  function getPairs(rs){
    if(state.party!=='all'&&state.party!=='party')return [];
    const allowed=new Set(rs.map(r=>`${r.actor}@${r.match}`)), map=new Map;
    for(const g of D.groups){
      if(state.mode!=='all'&&g.mode!==state.mode||state.day!=='all'&&g.day!==state.day)continue;
      const ids=[...new Set(g.actors.filter(id=>allowed.has(`${id}@${g.match}`)))].sort();
      for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
        const key=`${ids[i]}|${ids[j]}`;
        if(!map.has(key))map.set(key,{actors:[ids[i],ids[j]],matches:new Map});
        map.get(key).matches.set(g.match,g);
      }
    }
    return [...map.values()].map(p=>{const gs=[...p.matches.values()],w=gs.filter(g=>g.win).length;return {...p,n:gs.length,w,l:gs.length-w,rate:w/gs.length,groups:gs}}).sort((a,b)=>b.n-a.n||b.rate-a.rate||a.actors.join().localeCompare(b.actors.join()));
  }

  function renderMetrics(rs){
    const s=sum(rs),n=new Set(rs.map(r=>r.match)).size,party=new Set(rs.filter(r=>r.party==='party').map(r=>r.match)).size;
    $('#metrics').innerHTML=[
      ['去重比赛',`${n}`,`天梯 ${new Set(rs.filter(r=>r.mode==='ranked').map(r=>r.match)).size} · 匹配 ${new Set(rs.filter(r=>r.mode==='unranked').map(r=>r.match)).size}`,''],
      ['账号出场',`${s.n}`,`${new Set(rs.map(r=>r.account)).size} 个账号有公开样本 · 同场各记一次`,''],
      ['账号出场胜率',`${s.n?(s.rate*100).toFixed(1):'—'}<small>${s.n?'%':''}</small>`,`${s.w} 胜 / ${s.l} 负 · 以账号出场为分母`,'accent'],
      ['已确认开黑',`${party}`,`筛选范围内的组排比赛 · 与比赛类型可重叠`,'']
    ].map(([label,value,note,cl])=>`<article class="metric ${cl}"><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><span class="metric-note">${note}</span></article>`).join('');
  }
  function renderDaily(){
    const rs=visible(true),days=Array.from({length:7},(_,i)=>`2026-10-${String(12+i).padStart(2,'0')}`),stats=days.map(day=>({day,...sum(rs.filter(r=>r.day===day))})),max=Math.max(...stats.map(s=>s.n),1);
    $('#daily-chart').innerHTML=stats.map((s,i)=>`<button class="day-bar" data-day="${s.day}" aria-pressed="${state.day===s.day}" aria-label="10月${i+12}日，${s.n}次成员出场，${s.w}胜${s.l}负"><span class="total">${s.n}</span><span class="bar-stack" style="height:${Math.max(s.n/max*111,2)}px"><i class="w" style="height:${s.n?s.w/s.n*100:0}%"></i><i class="l" style="height:${s.n?s.l/s.n*100:0}%"></i></span><span class="day-date">10.${i+12}<span class="day-week">${['周一','周二','周三','周四','周五','周六','周日'][i]}</span></span></button>`).join('');
    $('#clear-day').hidden=state.day==='all';
  }
  function renderInsights(rs){
    const stats=[...accounts.values()].map(a=>({acc:a,...sum(rs.filter(r=>r.account===a.id))})).sort((a,b)=>b.n-a.n||b.rate-a.rate),active=stats.find(s=>s.n),leaders=stats.filter(s=>s.n>=5).sort((a,b)=>b.rate-a.rate||b.n-a.n),best=leaders[0],pair=pairs[0];
    const notes=[['当前上桌最多的账号',active?`${active.acc.nickname} · ${active.n} 场`:'暂无公开样本',active?`归属 ${players.get(active.acc.player).name} · ${active.w}胜 ${active.l}负`:'换个筛选看看'],['账号胜率领先 · 至少 5 场',best?`${best.acc.nickname} · ${pct(best.w,best.n)}`:'当前样本不足 5 场',best?`归属 ${players.get(best.acc.player).name} · ${best.w}胜 ${best.l}负`:'小样本保留在账号表中'],['最常一起开黑的账号',pair?pair.actors.map(id=>currentActor.get(id).name).join(' × '):'当前筛选暂无同车组合',pair?`共同 ${pair.n} 场 · ${pair.w}胜 ${pair.l}负`:'仅用明确组队证据']];
    $('#insights').innerHTML=notes.map((n,i)=>`<article class="note-item"><span class="note-number">0${i+1}</span><div class="note-content"><small>${n[0]}</small><strong>${esc(n[1])}</strong><p>${esc(n[2])}</p></div></article>`).join('');
  }
  const rateMood=s=>!s.n?'':s.rate>=.7?'<img class="rate-mood fire" src="assets/status/fire.svg" alt="冒火" title="本期账号胜率≥70%">':s.rate<.3?'<img class="rate-mood turtle" src="assets/status/green-hat-turtle.svg" alt="戴绿帽的小乌龟" title="本期账号胜率低于30%">':'';
  function renderMembers(rs){
    const q=state.search.toLowerCase();
    const comparator=(a,b)=>state.sort==='winrate'?(b.rate-a.rate||b.n-a.n):state.sort==='kda'?(b.kda-a.kda||b.n-a.n):(b.n-a.n||b.rate-a.rate);
    let groups=D.players.map(p=>({p,accounts:p.accounts.map(a=>({acc:a,rows:rs.filter(r=>r.account===a.id)})).map(a=>({...a,...sum(a.rows)}))}));
    if(q)groups=groups.map(g=>({...g,accounts:g.accounts.filter(s=>g.p.name.toLowerCase().includes(q)||s.acc.nickname.toLowerCase().includes(q))})).filter(g=>g.accounts.length);
    groups.forEach(g=>g.accounts.sort(comparator));
    groups.sort((a,b)=>comparator(a.accounts[0],b.accounts[0]));
    const count=groups.reduce((n,g)=>n+g.accounts.length,0);
    $('#member-count').textContent=`${groups.length}人 / ${count}账号`;
    $('#member-rows').innerHTML=groups.map(g=>g.accounts.map((s,i)=>`<tr class="account-row ${i===0?'owner-start':''}" data-account-row="${s.acc.id}">${i===0?`<th scope="rowgroup" rowspan="${g.accounts.length}" class="owner-cell"><button class="owner-button" data-player="${g.p.id}" aria-label="查看${esc(g.p.name)}的账号"><img src="${g.p.avatar}" alt="${esc(g.p.name)}主号头像" loading="lazy"><strong>${esc(g.p.name)}</strong>${g.p.temporary?'<span class="temporary">临时成员</span>':''}<small>${g.p.accounts.length}个登记账号</small></button></th>`:''}<td><button class="account-button" data-account="${s.acc.id}" aria-label="查看账号${esc(s.acc.nickname)}，归属${esc(g.p.name)}，${s.n}场" title="${esc(s.acc.nickname)}"><strong>${esc(s.acc.nickname)}</strong><small>${esc(s.acc.label||'战绩账号')}${s.rows.some(r=>r.conflict)?' · 有同场账号记录':''}</small></button></td><td>${rankBadge(s.acc)}</td><td class="account-games">${s.n}</td><td><span class="rate-cell ${s.rate<.4?'low':''}"><strong>${pct(s.w,s.n)}${rateMood(s)}</strong><span class="rate-line"><i style="width:${s.rate*100}%"></i></span><small>${s.n?`${s.w}胜 ${s.l}负`:'暂无公开样本'}</small></span></td><td class="desktop-col"><span class="kda-cell">${s.n?s.kda.toFixed(2):'—'}<small>${s.n?`${(s.k/s.n).toFixed(1)} / ${(s.d/s.n).toFixed(1)} / ${(s.a/s.n).toFixed(1)}`:'—'}</small></span></td><td class="desktop-col">${s.n?chips(s.rows):'<span class="player-sub">暂无本期英雄</span>'}</td></tr>`).join('')).join('')||'<tr><td colspan="7" class="empty">没有找到该成员或账号昵称。</td></tr>';
    const conflicts=rs.filter(r=>r.conflict);
    $('#conflict-count').textContent=`${conflicts.length} 条`;
    $('#conflict-rows').innerHTML=conflicts.map(r=>`<div class="conflict-entry"><b>${esc(r.nickname||r.name)}</b><span>${esc(heroes.get(r.hero).name)} · ${r.k}/${r.d}/${r.a} · ${r.win?'胜':'负'}</span><small>${shortDate(r.time)} · ${r.match}</small></div>`).join('')||empty('当前筛选没有多账号同场记录。');
  }

  function renderPairs(){
    const shown=pairs.filter(p=>p.n>=2).slice(0,6);
    $('#pair-grid').innerHTML=shown.map(p=>{const [a,b]=p.actors.map(id=>currentActor.get(id)),sizes=new Map;p.groups.forEach(g=>sizes.set(g.size,(sizes.get(g.size)||0)+1));return `<article class="pair-card"><div class="pair-avatars"><img src="${a.avatar}" alt="${esc(a.name)}" loading="lazy"><span class="times">×</span><img src="${b.avatar}" alt="${esc(b.name)}" loading="lazy"></div><h3>${esc(a.name)}<span>×</span>${esc(b.name)}</h3><small class="pair-owner">归属 ${esc(a.owner)} × ${esc(b.owner)}</small><div class="pair-nums"><strong>${p.n}<small>场同车</small></strong><span class="pair-rate">${pct(p.w,p.n)}<small>${p.w}胜 ${p.l}负</small></span></div><p>${[...sizes].sort((a,b)=>b[0]-a[0]).map(([size,n])=>`${size}人队 ${n}场`).join(' · ')}</p></article>`}).join('')||empty(state.party==='solo'?'单排筛选下没有开黑组合。':'当前筛选未找到至少共同开黑两场的组合。');
    $('#pair-foot').textContent=shown.length?'共同开黑至少 2 场，按共同场数排列，最多展示六组；每组列出当时的完整组队人数，不把五排中的两人称为“纯双排”。':'组队字段未公开的同队记录不纳入同车组合。';
  }
  function renderHeroes(rs){
    let hs=heroCounts(rs).filter(h=>!state.heroMin||h.n>=3);const total=hs.length;
    if(!state.heroAll)hs=hs.slice(0,12);
    $('#hero-grid').innerHTML=hs.map(h=>`<button class="hero-card" data-hero="${h.hero.id}" aria-label="查看${esc(h.hero.name)}：${h.n}次出场，${h.w}胜${h.l}负"><img src="${h.hero.image}" alt="${esc(h.hero.name)}" loading="lazy"><span><h3>${esc(h.hero.name)}</h3><p>${h.n} 次出场 · ${h.w}胜 ${h.l}负</p><strong class="hero-percent">${pct(h.w,h.n)}<small>胜率</small></strong></span></button>`).join('')||empty('当前筛选没有达到样本门槛的英雄，可取消“至少出场3次”。');
    $('#hero-more').hidden=total<=12;
    $('#hero-more').textContent=state.heroAll?'收起英雄 ↑':`展开全部 ${total} 位英雄 ↓`;
  }
  function renderMatches(rs){
    const groups=new Map;rs.forEach(r=>{if(!groups.has(r.match))groups.set(r.match,[]);groups.get(r.match).push(r)});
    const ms=D.matches.filter(m=>groups.has(m.id)).sort((a,b)=>b.time.localeCompare(a.time));
    $('#match-count').textContent=`${ms.length} 场比赛`;
    $('#match-list').innerHTML=ms.slice(0,state.matchLimit).map(m=>{const es=groups.get(m.id),s=sum(es);return `<button class="match-card" data-match="${m.id}" aria-label="查看${m.id}，${shortDate(m.time)}"><span class="match-top"><span class="mode-tag ${m.mode==='unranked'?'normal':''}">${modeName(m.mode)}</span><time datetime="${m.time}">${shortDate(m.time)}</time></span><span class="match-players">${es.slice(0,3).map(r=>`<span class="match-person"><img src="${heroes.get(r.hero).image}" alt="${esc(heroes.get(r.hero).name)}" loading="lazy"><span>${esc(r.name)}</span></span>`).join('')}${es.length>3?`<small>+${es.length-3}</small>`:''}</span><span class="match-bottom"><span>#${m.id} · ${Math.floor(m.duration/60)}:${String(m.duration%60).padStart(2,'0')}</span><strong>成员 ${s.w}胜 <span class="lose">${s.l}负</span> ↗</strong></span></button>`}).join('')||empty('当前筛选没有比赛记录。');
    $('#match-more').hidden=ms.length<=state.matchLimit;
    $('#match-more').textContent=`再看一些 ↓（还剩 ${Math.max(0,ms.length-state.matchLimit)} 场）`;
  }
  function render(){
    currentRows=visible();pairs=getPairs(currentRows);
    document.querySelectorAll('[data-filter]').forEach(group=>group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(state[group.dataset.filter]===b.dataset.value))));
    $('#filter-label').textContent=`${state.mode==='all'?'全部比赛':modeName(state.mode)} · ${state.party==='all'?'全部组队方式':state.party==='party'?'开黑':state.party==='solo'?'单排':'组队未公开'}${state.day!=='all'?' · '+state.day.slice(5).replace('-','月')+'日':''}`;
    renderMetrics(currentRows);renderDaily();renderInsights(currentRows);renderMembers(currentRows);renderPairs();renderHeroes(currentRows);renderMatches(currentRows);
  }
  function detailEntries(rs,showPlayer=false){
    return [...rs].sort((a,b)=>b.time.localeCompare(a.time)).map(r=>`<div class="detail-entry"><img src="${heroes.get(r.hero).image}" alt="${esc(heroes.get(r.hero).name)}" loading="lazy"><div><strong>${showPlayer?esc(r.ownerName)+' / '+esc(r.name)+' · ':''}${esc(heroes.get(r.hero).name)}</strong><small>${shortDate(r.time)} · ${modeName(r.mode)} · ${partyName(r)}<br>#${r.match}</small></div><div class="result ${r.win?'':'lose'}">${r.win?'胜':'负'}<span>${r.k} / ${r.d} / ${r.a}</span></div></div>`).join('')||empty('当前筛选没有公开样本。');
  }
  function showDialog(heading,body){$('#dialog-heading').innerHTML=heading;$('#dialog-body').innerHTML=body;if(!$('#detail-dialog').open)$('#detail-dialog').showModal();document.body.style.overflow='hidden'}
  function dialogSummary(rs){const s=sum(rs);return `<div class="dialog-summary"><div><strong>${s.n}</strong><small>成员出场</small></div><div><strong>${pct(s.w,s.n)}${rateMood(s)}</strong><small>${s.w}胜 ${s.l}负</small></div><div><strong>${s.n?s.kda.toFixed(2):'—'}</strong><small>账号 KDA</small></div></div>`}
  function openPlayer(id){const p=players.get(id);showDialog(`<div class="dialog-title"><img src="${p.avatar}" alt="${esc(p.name)}"><div><h2>战绩归属人：${esc(p.name)}</h2><p>${p.temporary?'临时成员 · ':''}${p.accounts.length}个登记账号 · 战绩独立计算</p></div></div>`,`<div class="account-note">以下账号按已确认归属归组展示。每个账号分别计算场次和胜负，不汇成个人战绩；归属关系不代表每场实际操作者。</div><div class="owner-account-list">${p.accounts.map(a=>{const s=sum(currentRows.filter(r=>r.account===a.id));return `<button class="owner-account-card" data-account="${a.id}">${rankBadge(a)}<span><strong>${esc(a.nickname)}</strong><small>${esc(a.label||'战绩账号')} · ${s.n}场 · ${s.w}胜${s.l}负 · ${pct(s.w,s.n)}</small></span><b>↗</b></button>`}).join('')}</div>`)}
  function openAccount(id){const a=accounts.get(id),p=players.get(a.player),rs=currentRows.filter(r=>r.account===id);showDialog(`<div class="dialog-title">${rankBadge(a)}<div><h2>${esc(a.nickname)}</h2><p>归属 ${esc(p.name)}${a.label?' · '+esc(a.label):''} · ${esc(a.rankName)}${a.leaderboard?' #'+a.leaderboard:''}</p></div></div>`,dialogSummary(rs)+`<div class="account-note">本账号独立战绩，含同一归属人多账号同时参赛的记录。<br>公开段位资料采集于 ${a.rankObservedAt||'未知日期'}；源站更新时间未知。</div><div class="detail-list">${detailEntries(rs)}</div>`)}
  function openHero(id){const h=heroes.get(id),rs=currentRows.filter(r=>r.hero===id);showDialog(`<div class="dialog-title"><img src="${h.image}" alt="${esc(h.name)}"><div><h2>${esc(h.name)}</h2><p>本周出场依据 · 当前筛选范围</p></div></div>`,dialogSummary(rs)+`<div class="detail-list">${detailEntries(rs,true)}</div>`)}
  function openMatch(id){const m=D.matches.find(m=>m.id===id),rs=D.entries.filter(r=>r.match===id);showDialog(`<div class="dialog-title"><div><h2>${modeName(m.mode)} · #${m.id}</h2><p>${shortDate(m.time)} · 比赛时长 ${Math.floor(m.duration/60)}:${String(m.duration%60).padStart(2,'0')}</p></div></div>`,`<div class="account-note">以下是本场全部已收录成员。胜负按各自阵营记录；组队未公开的成员不自动视为单排或同车。</div><div class="detail-list">${detailEntries(rs,true)}</div><a class="dialog-link" href="https://www.opendota.com/matches/${m.id}" target="_blank" rel="noopener noreferrer">查看 OpenDota 比赛页 ↗</a>`)}
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    const filter=b.closest('[data-filter]');if(filter){state[filter.dataset.filter]=b.dataset.value;state.matchLimit=6;render();return}
    if(b.dataset.day){state.day=state.day===b.dataset.day?'all':b.dataset.day;state.matchLimit=6;render();return}
    if(b.dataset.account){openAccount(b.dataset.account);return}
    if(b.dataset.player){openPlayer(b.dataset.player);return}
    if(b.dataset.hero){openHero(Number(b.dataset.hero));return}
    if(b.dataset.match){openMatch(Number(b.dataset.match));return}
  });
  $('#member-search').addEventListener('input',e=>{state.search=e.target.value.trim();renderMembers(currentRows)});
  $('#member-sort').addEventListener('change',e=>{state.sort=e.target.value;renderMembers(currentRows)});
  $('#hero-min').addEventListener('change',e=>{state.heroMin=e.target.checked;renderHeroes(currentRows)});
  $('#hero-more').addEventListener('click',()=>{state.heroAll=!state.heroAll;renderHeroes(currentRows)});
  $('#match-more').addEventListener('click',()=>{state.matchLimit+=6;renderMatches(currentRows)});
  $('#clear-day').addEventListener('click',()=>{state.day='all';render()});
  $('#reset').addEventListener('click',()=>{state.mode='all';state.party='all';state.day='all';state.search='';state.sort='games';state.matchLimit=6;$('#member-search').value='';$('#member-sort').value='games';render()});
  $('#dialog-close').addEventListener('click',()=>$('#detail-dialog').close());
  $('#detail-dialog').addEventListener('close',()=>{document.body.style.overflow=''});
  $('#detail-dialog').addEventListener('click',e=>{if(e.target===$('#detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
  render();
})();
