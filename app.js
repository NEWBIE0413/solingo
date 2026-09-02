// ================= course loader =================
// A course is pure content (courses/*.json). The engine below never hardcodes a language.
let COURSE=null, ORDER=[], FREE=new Set(), WORDS=[], SETS=[], JOIN='';
const rom=k=>COURSE.items[k]?.r??k;
function tok(w){const o=[];for(let i=0;i<w.length;i++){if(i+1<w.length&&JOIN.includes(w[i+1])){o.push(w[i]+w[i+1]);i++}else o.push(w[i])}return o}
const wordKana=w=>tok(w).filter(k=>!FREE.has(k));
async function loadCourse(id){
  const c=await (await fetch(`courses/${id}.json`)).json();
  COURSE=c;ORDER=c.order;FREE=new Set(Object.keys(c.items).filter(k=>c.items[k].free));WORDS=c.words.map(w=>[w.t,w.m]);SETS=c.sets;JOIN=c.tokenize?.joiners||'';
  document.title=`Solingo · ${c.title}`;
}

// ================= state =================
const KEY=()=>`solingo.${COURSE.id}.v2`;
let S=null;
const save=()=>{try{localStorage.setItem(KEY(),JSON.stringify(S))}catch{}};
function loadState(){S=Object.assign({k:{},w:{},xp:0,days:{},sound:null},(()=>{try{return JSON.parse(localStorage.getItem(KEY()))||JSON.parse(localStorage.getItem('kana.duo.v2'))||{}}catch{return{}}})())}
const today=()=>new Date().toISOString().slice(0,10);
const kc=k=>S.k[k]||(S.k[k]={ok:0,no:0,lvl:0});
const learned=()=>ORDER.filter(k=>S.k[k]);
const lvl=k=>S.k[k]?S.k[k].lvl:0; // 0..5
// 하루에 최대 2단계만 오른다 — 금색(5)은 최소 사흘에 걸친 반복이 필요
function grade(k,ok){const c=kc(k);const t=today();if(c.day!==t){c.day=t;c.base=c.lvl}if(ok){c.ok++;if(c.lvl<Math.min(5,c.base+2))c.lvl++}else{c.no++;c.lvl=Math.max(0,c.lvl-1);c.base=Math.min(c.base,c.lvl)}}
function gradeWord(w,ok){const c=S.w[w]||(S.w[w]={ok:0,no:0});ok?c.ok++:c.no++;for(const k of wordKana(w))grade(k,ok)}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=(a,n)=>shuffle(a).slice(0,n);
const weighted=(arr,wf)=>{const w=arr.map(wf);let r=Math.random()*w.reduce((a,b)=>a+b,0),i=0;while((r-=w[i])>0&&i<arr.length-1)i++;return arr[i]};
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1500)}

// ================= sound =================
let AC=null, jaVoice=null, soundOn=false;
function pickVoice(){const vs=speechSynthesis.getVoices();const lang=COURSE?.lang||'ja-JP',base=lang.split('-')[0];const hint=COURSE?.voiceHint?new RegExp(COURSE.voiceHint,'i'):null;jaVoice=vs.find(v=>v.lang.replace('_','-').toLowerCase()===lang.toLowerCase()&&(!hint||hint.test(v.name)))||vs.find(v=>v.lang.toLowerCase().startsWith(base))||null;return jaVoice}
try{speechSynthesis.onvoiceschanged=pickVoice;pickVoice()}catch{}
function unlockAudio(){
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.resume();const o=AC.createOscillator(),g=AC.createGain();g.gain.value=0;o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+.01)}catch{}
  try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch{}
}
function speak(t){if(!soundOn)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang=COURSE.lang;u.rate=.85;u.pitch=1;if(jaVoice||pickVoice())u.voice=jaVoice;
  setTimeout(()=>speechSynthesis.speak(u),40)}catch{}}
function tone(seq,type='sine',vol=.18){if(!soundOn||!AC)return;try{const t0=AC.currentTime;seq.forEach(([f,dt,dur],i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t0+dt);g.gain.linearRampToValueAtTime(vol,t0+dt+.01);g.gain.exponentialRampToValueAtTime(.001,t0+dt+dur);o.connect(g).connect(AC.destination);o.start(t0+dt);o.stop(t0+dt+dur+.05)})}catch{}}
const sfx={ok:()=>tone([[880,0,.12],[1174.7,.09,.18]]),great:()=>tone([[784,0,.1],[988,.08,.1],[1318.5,.16,.25]]),no:()=>tone([[220,0,.18],[196,.12,.22]],'triangle',.22),tap:()=>tone([[1400,0,.04]],'sine',.06),done:()=>tone([[523,0,.15],[659,.12,.15],[784,.24,.15],[1046,.36,.4]])};
function haptic(kind){try{navigator.vibrate&&navigator.vibrate(kind==='ok'?12:kind==='no'?[24,40,24]:[10,30,10,30,30])}catch{}}
function askPerm(cb){$('#perm').classList.add('on');$('#perm-note').textContent=('speechSynthesis' in window)?'':'이 브라우저는 음성 합성을 지원하지 않아요. 효과음만 나옵니다.';
  $('#perm-ok').onclick=()=>{unlockAudio();soundOn=true;S.sound=true;save();$('#perm').classList.remove('on');setTimeout(()=>{sfx.ok();if(!pickVoice())toast('이 언어 음성이 없어 효과음만 나와요')},150);cb&&cb()};
  $('#perm-no').onclick=()=>{soundOn=false;S.sound=false;save();$('#perm').classList.remove('on');cb&&cb()};}
$('#snd-reset').addEventListener('click',()=>askPerm());

// ================= home =================
function renderHome(){
  let streak=0;for(let i=0;;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);if(S.days[k])streak++;else if(i===0)continue;else break}
  const L=learned();
  $('#h-streak').textContent=streak;$('#h-xp').textContent=S.xp;$('#h-known').textContent=L.filter(k=>lvl(k)>=3).length;
  const nxt=ORDER.filter(k=>!S.k[k]).slice(0,3);
  const cell=k=>k?`<div class="cell ${S.k[k]?'':'new'} ${lvl(k)>=5?'gold':''}"><i style="height:${lvl(k)/5*100}%"></i><span class="k kana">${k}</span><span class="r">${rom(k)}</span></div>`:'<div class="cell empty"></div>';
  const pct=list=>Math.round(list.reduce((a,k)=>a+lvl(k),0)/(list.length*5)*100)+'%';
  $('#sets').innerHTML=SETS.map(st=>{const all=[...st.grid.flat().filter(Boolean),...(st.extra||[])];return `<div class="section-t">${st.title} <span>${pct(all)}</span></div><div class="chart" style="grid-template-columns:repeat(${st.grid[0].length},1fr)">${st.grid.map(r=>r.map(cell).join('')).join('')}${(st.extra||[]).map(cell).join('')}</div>`}).join('');
  $('#start-sub').textContent=L.length===0?`첫 글자 ${ORDER.slice(0,3).join(' ')}부터`:nxt.length?`복습 + 새 글자 ${nxt.join(' ')}`:'전체 복습';
  const Ls=new Set(L); const avail=WORDS.filter(([w])=>wordKana(w).every(k=>Ls.has(k)));
  const rows=[...avail.map(x=>[x,false]),...WORDS.filter(x=>!avail.includes(x)).slice(0,6).map(x=>[x,true])];
  $('#wordlist').innerHTML=rows.map(([[w,m],lock])=>{const c=S.w[w];const p=c?Math.min(100,c.ok*25):0;return `<div class="word ${lock?'locked':''}"><span class="w kana">${w}</span><span class="m">${m}</span><span class="bar"><i style="width:${p}%"></i></span></div>`}).join('');
  $('#w-pct').textContent=`${avail.length} / ${WORDS.length}`;
}

// ================= session engine =================
let steps=[],si=0,checkFn=null,state='idle',score={ok:0,no:0},combo=0,newK=[],sessionWords=new Set();
function buildSession(){
  const L=learned(); const Ls=new Set(L);
  const recent=L.slice(-4); const settled=recent.every(k=>lvl(k)>=2);
  const n=L.length===0?3:(!settled?0:L.length<10?3:2);
  newK=ORDER.filter(k=>!S.k[k]).slice(0,n); newK.forEach(k=>Ls.add(k));
  const active=[...Ls];
  // focus set: new kana + weakest learned, 4~5 total. Everything in the session revolves around these.
  const weak=L.filter(k=>!newK.includes(k)).sort((a,b)=>lvl(a)-lvl(b)||Math.random()-.5);
  const focus=[...newK,...weak.slice(0,Math.max(0,5-newK.length))].slice(0,5);
  const dist=(k,m)=>pick(active.filter(x=>x!==k),m);
  const words=WORDS.filter(([w])=>wordKana(w).every(k=>Ls.has(k)));
  const fw=words.filter(([w])=>wordKana(w).some(k=>focus.includes(k)));
  const sw=pick(fw.length>=3?fw:[...fw,...pick(words.filter(x=>!fw.includes(x)),3-fw.length)],3);
  const st=[];
  for(const k of newK){st.push({t:'intro',k});st.push({t:'trace',k})}
  const wordEx=(w,i)=>[{t:'build',w:w[0],m:w[1],extra:pick(active.filter(k=>!tok(w[0]).includes(k)),3)},{t:'word-mean',w:w[0],m:w[1],opts:pick(words.filter(x=>x!==w),3).map(x=>x[1])},{t:'build',w:w[0],m:w[1],extra:pick(active.filter(k=>!tok(w[0]).includes(k)),3)},{t:'trace-word',w:w[0],m:w[1]}][i];
  // 4 rounds: same focus kana, different form each round; words woven in from round 2
  const forms=[['choose-kana','listen'],['listen','choose-rom'],['choose-rom','choose-kana'],['listen','choose-kana']];
  for(let r=0;r<4;r++){
    let round=shuffle(focus).map(k=>{const t=forms[r][Math.random()<.6?0:1];return {t,k,opts:dist(k,3)}});
    if(r>=1)round=round.concat(sw.map(w=>wordEx(w,r-1)).filter(Boolean));
    round=shuffle(round);
    if(r===1||r===3)round.push({t:'match',ks:[...focus.slice(0,4),...dist(focus[0],Math.max(0,4-focus.length))]});
    st.push(...round);
  }
  // a pinch of older review
  const old=L.filter(k=>!focus.includes(k)&&lvl(k)<5); if(old.length){const k=weighted(old,k=>6-lvl(k));st.splice(6,0,{t:'choose-rom',k,opts:dist(k,3)})}
  return st.filter((s,i)=>!(i&&s.t===st[i-1].t&&s.k&&s.k===st[i-1].k));
}
function startSession(){
  steps=buildSession();si=0;score={ok:0,no:0};combo=0;sessionWords=new Set();
  $('#lesson').classList.add('on');$('#stage').innerHTML='';$('#l-combo').textContent='';renderStep(true);
}
$('#start').addEventListener('click',()=>{if(S.sound===null)askPerm(startSession);else{if(S.sound){soundOn=true;unlockAudio()}startSession()}});
$('#l-x').addEventListener('click',()=>{if(confirm('세션을 나갈까요? 지금까지 맞힌 건 저장돼요.')){endSession(false)}});
function setFoot(mode,label,verdict=''){const f=$('#l-foot');f.className='foot'+(mode?' '+mode:'');$('#l-btn').textContent=label;$('#l-verdict').innerHTML=verdict}
let autoT=null;
function renderStep(first){
  clearTimeout(autoT);
  if(si>=steps.length)return finish();
  const s=steps[si]; state='answer'; checkFn=null;
  $('#l-meter').style.width=(si/steps.length*100)+'%';
  setFoot('','확인'); $('#l-btn').disabled=true;
  const old=$('.step',$('#stage')); if(old){old.classList.remove('in');old.classList.add('out');setTimeout(()=>old.remove(),240)}
  const b=document.createElement('div'); b.className='step in'; $('#stage').appendChild(b);
  ({intro,trace,'choose-kana':chooseKana,'choose-rom':chooseRom,listen,match,build,'word-mean':wordMean,'trace-word':traceWord})[s.t](s,b);
}
function advance(){si++;renderStep()}
function onResult(r){
  const s=steps[si];
  if(r===true){state='next';score.ok++;combo++;const c=$('#l-combo');c.textContent=combo>=2?`🔥${combo}`:'';c.classList.add('bump');setTimeout(()=>c.classList.remove('bump'),250);
    combo>=5&&combo%5===0?sfx.great():sfx.ok();haptic('ok');flyXP();setFoot('ok','계속',`맞았어요${combo>=3?` <small>${combo}연속</small>`:''}`);autoT=setTimeout(advance,850)}
  else if(r===false){state='next';score.no++;combo=0;$('#l-combo').textContent='';sfx.no();haptic('no');setFoot('no','계속',`아쉬워요 <small>${s.sol||''}</small>`);
    steps.splice(Math.min(steps.length,si+2+Math.floor(Math.random()*3)),0,{...s,retry:true})}
  else {state='next';setFoot('','다음');autoT=setTimeout(advance,s.t==='intro'?1400:0)}
}
$('#l-btn').addEventListener('click',()=>{
  if($('#l-btn').disabled)return;
  if(state==='home'){state='idle';renderHome();startSession();return}
  if(state==='answer'){onResult(checkFn?checkFn():null);return}
  clearTimeout(autoT);advance();
});
function flyXP(){const e=document.createElement('div');e.className='fly';e.textContent='+1';const r=$('#l-combo').getBoundingClientRect();e.style.left=(r.left-10)+'px';e.style.top=(r.top+8)+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),900)}
const optHandler=(b,getSel)=>b.addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o||state!=='answer')return;o.classList.add('sel');sfx.tap();getSel(o.dataset.v);onResult(checkFn())});
function markOpts(b,answer,sel){$$('.opt',b).forEach(x=>{if(x.dataset.v===answer)x.classList.add('ok');else if(x.dataset.v===sel)x.classList.add('no');else x.classList.add('dim')})}

// ---- exercises ----
function intro(s,b){
  const ex=WORDS.find(([w])=>wordKana(w).includes(s.k)&&wordKana(w).every(k=>S.k[k]||newK.includes(k)));
  b.innerHTML=`<div class="prompt">새 글자</div><div class="hero"><div class="glyph kana">${s.k}</div><div class="romaji">${rom(s.k)}</div><button class="spk" data-say="${s.k}">🔊</button></div>
  ${ex?`<div style="text-align:center;margin-top:10px"><div class="wordline kana">${tok(ex[0]).map(k=>k===s.k?`<span class="hi">${k}</span>`:k).join('')}</div><div class="meaning">${ex[1]} · ${tok(ex[0]).map(rom).join(' ')}</div></div>`:''}
  <p class="tiny" style="text-align:center;margin-top:14px">듣고 따라 말해보세요</p>`;
  setTimeout(()=>speak(s.k),250); if(ex)setTimeout(()=>speak(ex[0]),1500);
  $('#l-btn').disabled=false; checkFn=()=>null;
}
function trace(s,b,word){
  const target=word||s.k;
  b.innerHTML=`<div class="prompt">${word?'단어를 써보세요':'따라 써보세요'}</div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span class="romaji">${word?tok(word).map(rom).join(' '):rom(target)}</span><button class="spk" data-say="${target}">🔊</button></div>
  <canvas class="pad ${word?'wide':''}"></canvas>
  <div class="padrow"><button class="ghost" data-a="clear">지우기</button><button class="ghost" data-a="ghost">본보기 숨기기</button></div>
  <p class="tiny" style="text-align:center;margin-top:10px">본보기 없이도 써지면 확인. 획 인식은 없어요, 솔직하게.</p>`;
  const cv=$('canvas',b); let ghost=true; const dpr=devicePixelRatio||1; const strokes=[]; let cur=null;
  function draw(){const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const W=cv.width/dpr,H=cv.height/dpr;c.clearRect(0,0,W,H);
    c.strokeStyle='rgba(128,128,128,.18)';c.lineWidth=1;c.setLineDash([6,6]);c.beginPath();c.moveTo(W/2,0);c.lineTo(W/2,H);c.moveTo(0,H/2);c.lineTo(W,H/2);c.stroke();c.setLineDash([]);
    if(ghost){c.fillStyle='rgba(128,128,128,.22)';c.textAlign='center';c.textBaseline='middle';c.font=`${word?Math.min(H*.7,W/(target.length+.5)):H*.72}px system-ui,"Hiragino Sans","Noto Sans JP","Apple SD Gothic Neo",sans-serif`;c.fillText(target,W/2,H/2+(word?0:H*.04))}
    c.strokeStyle=getComputedStyle(document.body).color;c.lineWidth=Math.max(6,W/28);c.lineCap='round';c.lineJoin='round';
    for(const st of [...strokes,cur].filter(Boolean)){c.beginPath();st.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()}}
  const fit=()=>{const r=cv.getBoundingClientRect();if(!r.width)return requestAnimationFrame(fit);cv.width=r.width*dpr;cv.height=r.height*dpr;draw()};
  const pt=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);cur=[pt(e)];draw();e.preventDefault()});
  cv.addEventListener('pointermove',e=>{if(!cur)return;cur.push(pt(e));draw()});
  const up=()=>{if(cur){strokes.push(cur);cur=null;draw();$('#l-btn').disabled=false}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  b.addEventListener('click',e=>{const a=e.target.dataset.a;if(a==='clear'){strokes.length=0;draw()}if(a==='ghost'){ghost=!ghost;e.target.textContent='본보기 '+(ghost?'숨기기':'보기');draw()}});
  requestAnimationFrame(fit); setTimeout(()=>speak(target),300); checkFn=()=>null;
}
function chooseKana(s,b){const opts=shuffle([s.k,...s.opts]);let sel=null;
  b.innerHTML=`<div class="prompt">이 소리는 어떤 글자?</div><div class="hero" style="padding-top:0"><div class="romaji" style="font-size:44px">${rom(s.k)}</div></div>
  <div class="opts">${opts.map(o=>`<button class="opt" data-v="${o}"><div class="kana">${o}</div></button>`).join('')}</div>`;
  optHandler(b,v=>sel=v); s.sol=`정답: ${s.k}`; checkFn=()=>{const ok=sel===s.k;markOpts(b,s.k,sel);speak(s.k);grade(s.k,ok);return ok};}
function chooseRom(s,b){const opts=shuffle([s.k,...s.opts]);let sel=null;
  b.innerHTML=`<div class="prompt">어떻게 읽어요?</div><div class="hero" style="padding-top:0"><div class="glyph kana" style="font-size:100px">${s.k}</div></div>
  <div class="opts">${opts.map(o=>`<button class="opt" data-v="${o}"><span class="romaji" style="font-size:22px">${rom(o)}</span></button>`).join('')}</div>`;
  optHandler(b,v=>sel=v); s.sol=`정답: ${rom(s.k)}`; checkFn=()=>{const ok=sel===s.k;markOpts(b,s.k,sel);speak(s.k);grade(s.k,ok);return ok};}
function listen(s,b){if(!soundOn)return chooseKana(s,b);const opts=shuffle([s.k,...s.opts]);let sel=null;
  b.innerHTML=`<div class="prompt">들리는 글자를 고르세요</div><div class="hero"><button class="spk big playing" data-say="${s.k}">🔊</button></div>
  <div class="opts">${opts.map(o=>`<button class="opt" data-v="${o}"><div class="kana">${o}</div></button>`).join('')}</div>`;
  setTimeout(()=>speak(s.k),300); setTimeout(()=>$('.spk',b)?.classList.remove('playing'),1500);
  optHandler(b,v=>sel=v); s.sol=`정답: ${s.k} (${rom(s.k)})`; checkFn=()=>{const ok=sel===s.k;markOpts(b,s.k,sel);grade(s.k,ok);return ok};}
function match(s,b){const left=shuffle(s.ks),right=shuffle(s.ks);let a=null,pairs=0,wrong=0;
  b.innerHTML=`<div class="prompt">짝을 맞추세요</div><div class="match"><div class="col">${left.map(k=>`<button class="opt" data-side="l" data-v="${k}"><div class="kana">${k}</div></button>`).join('')}</div><div class="col">${right.map(k=>`<button class="opt" data-side="r" data-v="${k}"><span class="romaji" style="font-size:20px">${rom(k)}</span></button>`).join('')}</div></div>`;
  b.addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o||o.classList.contains('dim')||state!=='answer')return;sfx.tap();
    if(a&&a.dataset.side===o.dataset.side){a.classList.remove('sel');a=o;o.classList.add('sel');return}
    if(!a){a=o;o.classList.add('sel');return}
    if(a.dataset.v===o.dataset.v){a.classList.remove('sel');[a,o].forEach(x=>{x.classList.add('ok');setTimeout(()=>x.classList.add('dim'),300)});speak(o.dataset.v);sfx.ok();haptic('ok');grade(o.dataset.v,true);pairs++;a=null;
      if(pairs===s.ks.length){checkFn=()=>wrong===0?true:null;setTimeout(()=>onResult(checkFn()),350)}}
    else{wrong++;grade(o.dataset.v,false);sfx.no();o.classList.add('no');a.classList.add('no');haptic('no');const aa=a;setTimeout(()=>{o.classList.remove('no');aa.classList.remove('no','sel')},400);a=null}});
  s.sol='';}
function build(s,b){const parts=tok(s.w);const bank=shuffle([...parts,...s.extra]);const chosen=[];
  b.innerHTML=`<div class="prompt">단어를 만드세요</div><div style="text-align:center"><span class="romaji" style="font-size:30px">${tok(s.w).map(rom).join(' ')}</span><div class="meaning">${s.m}</div><button class="spk" data-say="${s.w}" style="margin-top:6px">🔊</button></div>
  <div class="slots"></div><div class="bank">${bank.map((k,i)=>`<button class="tile kana" data-i="${i}" data-v="${k}">${k}</button>`).join('')}</div>`;
  const slots=$('.slots',b),bk=$('.bank',b);
  const render=()=>{slots.innerHTML=chosen.map(c=>`<button class="tile kana" data-i="${c.i}">${c.v}</button>`).join('');$$('.tile',bk).forEach(t=>t.classList.toggle('used',chosen.some(c=>c.i==t.dataset.i)));$('#l-btn').disabled=!chosen.length;
    if(chosen.length===parts.length&&chosen.map(c=>c.v).join('')===s.w)setTimeout(()=>state==='answer'&&onResult(checkFn()),150)};
  bk.addEventListener('click',e=>{const t=e.target.closest('.tile');if(!t||state!=='answer')return;sfx.tap();chosen.push({i:+t.dataset.i,v:t.dataset.v});render()});
  slots.addEventListener('click',e=>{const t=e.target.closest('.tile');if(!t||state!=='answer')return;chosen.splice(chosen.findIndex(c=>c.i==t.dataset.i),1);render()});
  setTimeout(()=>speak(s.w),300);
  s.sol=`정답: ${s.w}`; checkFn=()=>{const ok=chosen.map(c=>c.v).join('')===s.w;speak(s.w);slots.style.borderColor=ok?'var(--good)':'var(--bad)';gradeWord(s.w,ok);return ok};}
function wordMean(s,b){const opts=shuffle([s.m,...s.opts]);let sel=null;
  b.innerHTML=`<div class="prompt">무슨 뜻일까요?</div><div class="hero" style="padding-top:0"><div class="wordline kana" style="font-size:64px">${s.w}</div><button class="spk" data-say="${s.w}">🔊</button></div>
  <div class="opts">${opts.map(o=>`<button class="opt" data-v="${o}"><span style="font-size:18px;font-weight:600">${o}</span></button>`).join('')}</div>`;
  setTimeout(()=>speak(s.w),300);
  optHandler(b,v=>sel=v); s.sol=`${s.w} = ${s.m} (${tok(s.w).map(rom).join(' ')})`; checkFn=()=>{const ok=sel===s.m;markOpts(b,s.m,sel);gradeWord(s.w,ok);return ok};}
function traceWord(s,b){trace(s,b,s.w);b.insertAdjacentHTML('afterbegin',`<div class="wordline kana">${s.w}</div><div class="meaning" style="text-align:center;margin-bottom:8px">${s.m}</div>`);const f=checkFn;checkFn=()=>{gradeWord(s.w,true);return null}}
document.addEventListener('click',e=>{const k=e.target.closest('.spk');if(k)speak(k.dataset.say)});

// ================= finish =================
function endSession(complete){clearTimeout(autoT);save();state='idle';$('#lesson').classList.remove('on');renderHome()}
function finish(){
  const total=score.ok+score.no,pct=total?Math.round(score.ok/total*100):100,xp=10+Math.round(pct/10)+newK.length*2;
  S.xp+=xp;S.days[today()]=(S.days[today()]||0)+1;save();
  $('#l-meter').style.width='100%';sfx.done();haptic('done');confetti();
  const b=document.createElement('div');b.className='step in';$('#stage').innerHTML='';$('#stage').appendChild(b);
  b.innerHTML=`<div class="done-hero"><div class="big">${pct>=90?'🎉':pct>=70?'👍':'💪'}</div><div class="xp">+${xp} XP</div><p class="lead" style="margin-top:4px">정확도 ${pct}%</p>
  ${newK.length?`<div class="tiny">오늘 새로 배운 글자</div><div class="newk kana">${newK.map(k=>`<span>${k}</span>`).join('')}</div>`:''}
  <div class="stat"><div><b>${score.ok}</b><span>정답</span></div><div><b>${score.no}</b><span>오답</span></div><div><b>${S.xp}</b><span>누적 XP</span></div></div>
  <p class="tiny" style="margin-top:16px">${pct<75?'한 세션 더 하면 새 글자 대신 복습이 나와요. 그게 맞아요.':'좋아요. 한 세션 더 하면 다음 글자가 열립니다.'}</p></div>`;
  setFoot('','한 세션 더'); $('#l-btn').disabled=false; state='home';
  $('#l-btn').onclick=null;
}
function confetti(){const cv=$('#confetti');const c=cv.getContext('2d');cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;c.scale(devicePixelRatio,devicePixelRatio);
  const cols=['#ffcc00','#0a84ff','#34c759','#ff3b30','#ff9f0a','#af52de'];const P=Array.from({length:120},()=>({x:innerWidth/2+(Math.random()-.5)*120,y:innerHeight*.45,vx:(Math.random()-.5)*14,vy:-Math.random()*16-6,r:Math.random()*6+3,c:cols[Math.random()*cols.length|0],a:Math.random()*6,va:(Math.random()-.5)*.4}));
  let t=0;(function f(){c.clearRect(0,0,innerWidth,innerHeight);for(const p of P){p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.a+=p.va;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=p.c;c.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6);c.restore()}if(t++<110)requestAnimationFrame(f);else c.clearRect(0,0,innerWidth,innerHeight)})()}

(async()=>{const id=new URLSearchParams(location.search).get('course')||'ja-kana';await loadCourse(id);loadState();if(S.sound===true)soundOn=true;pickVoice();renderHome()})();
