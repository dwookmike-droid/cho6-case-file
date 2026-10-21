(function(){
// 「왓슨의 사건 수첩」 책 앱. 내용은 data_book.js(원고 md에서 빌드)에서 읽는다.
var C=window.FC_CONFIG,B=window.BOOK,CH=B.chapters,$=function(s){return document.querySelector(s)},app=$('#app');
// 저장소가 막힌 브라우저(쿠키 차단 등)에서도 화면은 뜨게 한다. 그때는 이 탭이 열려 있는 동안만 기억해요.
var mem={};function sget(s,k){try{return window[s].getItem(k)}catch(e){return mem[s+k]===undefined?null:mem[s+k]}}
function sset(s,k,v){try{window[s].setItem(k,v)}catch(e){mem[s+k]=v}}
var teacher=sget('sessionStorage','fc_teacher')==='1';
// 선생님 PIN 모드의 진도는 학생 기록과 섞이지 않게 다른 칸에 둔다
var LS=teacher?'fc_cho6_book_teacher_v1':'fc_cho6_book_v1',st=load();
function load(){var o;try{o=JSON.parse(sget('localStorage',LS))||{}}catch(e){o={}}
 o.clues=o.clues||[];o.ch=o.ch||{};o.queue=o.queue||[];o.held=o.held||[];o.rec=o.rec||{};return o}
function save(){sset('localStorage',LS,JSON.stringify(st))}
// 다른 탭·기다리는 사이 바뀐 저장소를 읽어 st 안에 합친다. st와 장별 객체는 그대로 둬서, 화면이 잡고 있는 진도(S)가 떨어져 나가지 않게
function refresh(){var o=load();Object.keys(o).forEach(function(k){if(k!=='ch')st[k]=o[k]});
 Object.keys(o.ch).forEach(function(c){if(st.ch[c])Object.assign(st.ch[c],o.ch[c]);else st.ch[c]=o.ch[c]});return st}
// 서버가 거절해 따로 둔 기록은 앱을 다시 열 때 한 번 더 보내 본다(DB 제약을 넓힌 뒤 들어가게)
if(st.held.length){st.queue=st.queue.concat(st.held);st.held=[];save()}
if(st.queue.some(function(x){return !x.id})){st.queue.forEach(function(x){if(!x.id)x.id=uuid()});save()}
window.addEventListener('storage',function(e){if(e.key===LS){refresh();hdr()}});
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function uuid(){return crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c=='x'?r:(r&3|8)).toString(16)})}
function pop(t){var p=$('#pop');p.textContent=t;p.hidden=false;clearTimeout(pop.t);pop.t=setTimeout(function(){p.hidden=true},1800)}
document.addEventListener('error',function(e){var t=e.target;if(t.tagName==='IMG'&&/\.jpg$/.test(t.getAttribute('src')||'')){t.src=t.getAttribute('src').replace(/\.jpg$/,'.svg')}},true);
function hdr(){$('#clueCount').textContent=st.clues.length?'단서 '+st.clues.length+'개':''}
function chs(n){return st.ch[n]||(st.ch[n]={})}
function label(n){return B.toc[n].label}
function jo(s,a,b){var c=s.charCodeAt(s.length-1);return s+((c>=44032&&c<=55203&&(c-44032)%28)?a:b)}
function card(c){return '<div class="card"><img src="'+esc(c.img)+'" alt=""><div><b>'+esc(c.en)+'</b> <span class="sub">'+esc(c.ko)+'</span>'+(c.new?'<span class="tag">NEW</span>':'')+'<br>'+esc(c.line)+'</div></div>'}
// ---------- 서버 기록 (fc_ 테이블, 추가만 가능) ----------
function sb(path,body){return fetch(C.url+path,{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:body})}
function send(kind,n,payload,ap){if(!C.sync||!st.learner)return;var o={id:uuid(),learner_id:st.learner.id,day:n,kind:kind,payload:payload};if(ap)o.audio_path=ap;st.queue.push(o);save();flush()}
var busy=false,again=false;
async function flush(){if(!C.sync||!st.learner)return;if(busy){again=true;return}busy=true;
 try{if(!st.learnerSent){var L=st.learner,r=await sb('/rest/v1/fc_learners',JSON.stringify({id:L.id,course:C.course,student_name:L.name,school_grade:L.grade,parent_phone:L.phone||null,consent_privacy:true,consent_guardian:true,consent_at:L.consent_at,source:C.source}));
   if(!r.ok&&r.status!==409&&r.status!==400)throw r.status;
   refresh();st.learnerSent=true;if(r.status===400)st.syncErr='learner 400';save()}  // 400(형식 거절)은 다시 보내도 같으니 멈추지 않는다
  // 기다리는 사이 다른 화면·탭이 저장소를 바꿀 수 있어서, 보낸 뒤에는 저장소를 다시 읽고 그 기록만 id로 뺀다
  while(refresh().queue.length){var q=st.queue[0],r2=await sb('/rest/v1/fc_submissions',JSON.stringify(q));
   if(!r2.ok&&r2.status!==409&&r2.status!==400)throw r2.status;  // 409: 같은 id 가 이미 들어감(응답만 잃은 경우)
   refresh();st.queue=st.queue.filter(function(x){return x.id!==q.id});if(r2.status===400)st.held.push(q);save()}
 st.syncErr=null;save()}catch(e){st.syncErr=String(e);save();clearTimeout(flush.t);flush.t=setTimeout(flush,60000)}busy=false;if(again){again=false;flush()}}
window.addEventListener('online',flush);
// ---------- 열림 규칙 ----------
function ready(n){return !!(B.toc[n]&&B.toc[n].ready&&CH[n])}
function open(n){if(!ready(n))return false;if(teacher)return true;if(!st.learner)return false;if(n===0)return true;var p=st.ch[n-1];if(!p||!p.done)return false;
 if(n===1)return true;return C.unlockRule==='done'||p.doneDate<today()}
function steps(n){var D=CH[n],s=['','words'];D.scenes.forEach(function(x,i){s.push('s/'+(i+1));if(D.solve&&D.solve.after===i+1){if(D.clues.length)s.push('clues');s.push('solve')}});
 if(D.clues.length&&s.indexOf('clues')<0)s.push('clues');if(D.quiz.length)s.push('quiz');if(D.think)s.push('think');if(D.record.length)s.push('rec');if(D.reflect)s.push('reflect');s.push('done');return s}
// ---------- 라우팅 ----------
function go(h){location.hash=h}
function redirect(h){location.replace(location.pathname+location.search+h)}
window.addEventListener('hashchange',route);
function route(){st=load();window.scrollTo(0,0);$('#pop').hidden=true;stopAudio();hdr();var h=location.hash.replace(/^#\/?/,'').split('/');
 if(!st.learner&&['','join','teacher'].indexOf(h[0])<0)return start();
 var R={'':start,join:join,toc:toc,c:function(){chapter(+h[1],h.slice(2).join('/'))},words:wordbook,people:people,notebook:notebook,report:report,teacher:tpin,cert:cert,end:end};
 (R[h[0]]||start)()}
function start(){if(st.learner)return redirect('#/toc');
 app.innerHTML='<p class="dots">리드앤라이트 · 무료 코스</p><h1>'+esc(B.title_ko)+'<br><span class="sub" style="font-size:17px">'+esc(B.title_en)+': Three Cases of Sherlock Holmes</span></h1><img class="scene" src="'+esc(B.cover)+'" alt="">'+
  '<p>의사 왓슨의 수첩을 따라 셜록 홈즈의 사건 세 개를 영어로 읽어요. 하루에 한 장씩 읽고, 단서를 모으고, 홈즈보다 먼저 범인을 맞혀 봐요.</p><p class="sub">문장마다 영어 음성(AI 음성)이 있고, 천천히 듣기도 할 수 있어요.</p><button class="main" id="b">시작할게요</button>';
 $('#b').onclick=function(){go('#/join')}}
function join(){if(st.learner)return redirect('#/toc');app.innerHTML='<h1>탐정 등록</h1><p class="sub">기록을 남기려면 이름과 동의가 필요해요.</p>'+
 '<label>이름<input type="text" id="nm" autocomplete="name"></label><label>학년<input type="text" id="gr" placeholder="예: 초6"></label><label>보호자 연락처 (선택)<input type="tel" id="ph" placeholder="010-"></label>'+
 '<h2>개인정보 수집·이용 동의</h2><p class="sub">리드앤라이트 영어교습소가 무료 코스 진행, 결과 안내, 등록 상담 연락을 위해 이름, 학년, 보호자 연락처(적은 경우), 문제 풀이 기록(직접 풀어 보기 답과 감상 글 포함), 녹음(직접 녹음한 경우)을 받아요. 기록은 외부 데이터 서버(Supabase)에 저장하고, 코스가 끝나고 1년 동안 보관한 뒤 지워요. 동의는 언제든 0507-1312-1196으로 연락해 거둘 수 있어요. 동의하지 않으면 코스를 이용할 수 없어요.</p>'+
 '<label class="chk"><input type="checkbox" id="c1">개인정보 수집·이용에 동의해요 (필수)</label>'+
 '<label class="chk"><input type="checkbox" id="c2">보호자(부모님)가 위 내용을 읽고 동의했어요 (필수)</label>'+
 '<button class="main" id="b" disabled>등록할게요</button>';
 var chk=function(){$('#b').disabled=!($('#nm').value.trim()&&$('#c1').checked&&$('#c2').checked)};['#nm','#c1','#c2'].forEach(function(s){$(s).oninput=chk;$(s).onchange=chk});
 $('#b').onclick=function(){if(st.learner)return redirect('#/toc');st.learnerSent=false;st.learner={id:uuid(),name:$('#nm').value.trim(),grade:$('#gr').value.trim(),phone:$('#ph').value.trim(),consent_at:new Date().toISOString(),start:today()};save();flush();go('#/toc')}}
// ---------- 목차 ----------
function status(n){var s=st.ch[n];if(s&&s.done)return '<a class="acc" href="#/c/'+n+'">다 읽음 · 다시 보기</a>';if(!ready(n))return '준비 중';if(open(n))return '<a class="acc" href="#/c/'+n+'">'+(s&&s.started?'이어 읽기':'열기')+'</a>';
 var p=st.ch[n-1];return p&&p.done?'내일 열려요':'잠김'}
function toc(){var h='<p class="dots">목차</p><h1>'+esc(st.learner.name)+' 탐정의 수첩</h1>'+(teacher?'<p class="acc sub">선생님 모드: 준비된 장이 모두 열려 있어요.</p>':'');
 if(st.mark&&st.mark.n!==undefined&&open(st.mark.n)&&!(st.ch[st.mark.n]||{}).done)h+='<button class="main" id="cont" style="margin:6px 0 4px">이어 읽기 · '+esc(label(st.mark.n))+'</button>';
 var work='';h+='<ul class="toc">';
 B.toc.forEach(function(t){if(t.work!==work&&t.work!=='새로 쓴 글'){work=t.work;h+='</ul><p class="work">'+esc(work)+'</p><ul class="toc">'}
  if(t.work==='새로 쓴 글'&&t.n===11)h+='</ul><p class="work">&nbsp;</p><ul class="toc">';
  var o=open(t.n);h+='<li class="'+(o||(st.ch[t.n]||{}).done?'':'lock')+'"><span class="t">'+esc(t.label)+' · '+esc(t.title_en)+(t.work==='새로 쓴 글'?'<span class="tag">새로 쓴 글</span>':'')+'<small>'+esc(t.title_ko)+'</small></span><span class="st">'+status(t.n)+'</span></li>'});
 h+='</ul><div class="links"><a href="#/notebook">단서 수첩</a><a href="#/words">단어장</a><a href="#/people">등장인물</a><a href="#/report">학부모 리포트</a>'+((st.ch[11]&&st.ch[11].done)||teacher&&CH[11]?'<a href="#/cert">수료증</a>':'')+(teacher?'<a href="teacher.html">학생 기록 보기 (선생님 로그인)</a>':'')+'</div>';
 app.innerHTML=h;if($('#cont'))$('#cont').onclick=function(){go(st.mark.hash)}}
// ---------- 한 장 ----------
var audio=new Audio(),playing=null;
function stopAudio(){audio.pause();playing=null;document.querySelectorAll('.s.on').forEach(function(e){e.classList.remove('on')})}
function play(src){stopAudio();audio.src=src;audio.playbackRate=st.slow?0.75:1;audio.preservesPitch=true;audio.play().catch(function(){})}
function chapter(n,step){var D=CH[n];if(!D||!(open(n)||(st.ch[n]&&st.ch[n].done)))return redirect('#/toc');var S=chs(n),ss=steps(n),i=ss.indexOf(step);if(i<0)return redirect('#/c/'+n);
 // 주소를 직접 쳐서 단계를 건너뛰지 못하게: 지금까지 간 단계 바로 다음까지만 열어 준다(다 읽은 장과 선생님 모드는 자유)
 var far=S.done?ss.length:(S.far||0);if(!teacher&&i>far+1)return redirect('#/c/'+n+(ss[far]?'/'+ss[far]:''));if(i>(S.far||0)){S.far=i;save()}
 // 직접 풀어 보기를 고르기 전에는 그 뒤로 못 간다
 var si=ss.indexOf('solve');if(si>=0&&i>si&&!S.solve&&!teacher)return redirect('#/c/'+n+'/solve');
 var next=function(){go('#/c/'+n+(ss[i+1]?'/'+ss[i+1]:''))},bar='<p class="dots">'+esc(label(n))+' · '+(i+1)+' / '+ss.length+'</p>';
 if(step!=='done'){st.mark={n:n,hash:location.hash};save()}
 if(step===''){S.started=S.started||today();save();
  app.innerHTML=bar+'<h1>'+esc(D.title_en)+(D.new_text?'<span class="tag">새로 쓴 글</span>':'')+'<br><span class="sub" style="font-size:17px">'+esc(D.title_ko)+'</span></h1><p class="sub">'+esc(D.source)+'</p>'+
   (D.recap.length?'<div class="recap"><p class="sub">'+esc(D.recap_title)+'</p>'+D.recap.map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'</div>':'')+
   '<h2>등장인물</h2>'+D.cards.map(card).join('')+'<button class="main" id="b">오늘의 단어 보기</button>';$('#b').onclick=next}
 else if(step==='words'){var h=bar+'<h1>오늘의 단어</h1><p class="sub">단어를 누르면 발음, ▶를 누르면 본문 문장을 들려줘요.</p>';
  D.words.forEach(function(w,j){h+='<div class="word"><b>'+esc(w.w)+'</b><button class="mini" data-a="'+esc(w.src)+'">발음</button> <span>'+esc(w.ko)+'</span><p class="ex">'+esc(w.ex)+' <button class="mini" data-a="'+esc(w.exsrc)+'">▶</button></p><p class="sub">'+esc(w.why)+'</p></div>'});
  app.innerHTML=h+'<button class="main" id="b">이야기 읽으러 가요</button>';app.querySelectorAll('[data-a]').forEach(function(b){b.onclick=function(){play(b.dataset.a)}});$('#b').onclick=next}
 else if(step.indexOf('s/')===0)scene(D,+step.split('/')[1],bar,next,ss[i+1]);
 else if(step==='solve')solve(D,S,n,bar,next);
 else if(step==='clues')clues(D,n,bar,next);
 else if(step==='quiz')quiz(D,S,n,bar,next);
 else if(step==='rec')rec(D,n,bar,next);
 else if(step==='think')think(D,S,n,bar,next);
 else if(step==='reflect')reflect(D,n,bar,next);
 else if(step==='done')done(D,S,n)}
function scene(D,k,bar,next,after){var sc=D.scenes[k-1],U=[],h=bar+'<h1>Scene '+sc.no+'. '+esc(sc.title)+'</h1>';
 h+='<div class="row"><button id="play">처음부터 듣기</button><label class="chk" style="margin:0"><input type="checkbox" id="slow"'+(st.slow?' checked':'')+'>천천히</label></div><p class="sub" style="margin-top:8px">문장을 누르면 그 부분만 다시 들려요.</p>';
 sc.paras.forEach(function(p,pi){sc.imgs.forEach(function(im){if(im.at===pi)h+='<img class="scene" src="'+esc(im.src)+'" alt="">'});
  var sp=p.units.map(function(u){U.push(u);return '<span class="s" data-i="'+(U.length-1)+'">'+esc(u.t)+'</span>'}).join(' ');
  h+=p.kind==='sign'?'<div class="sign">'+sp+'</div>':'<p class="en">'+sp+'</p>'});
 h+='<div class="check"><span class="acc">지금 무슨 일이?</span> '+esc(sc.check.q)+'<br><button id="ans">답 보기</button><span class="ans" id="an" hidden>→ '+esc(sc.check.a)+'</span></div>';
 h+='<button class="main" id="b">'+(after==='solve'?'직접 풀어 보기':after&&after.indexOf('s/')===0?'다음 장면':'다 읽었어요')+'</button>';app.innerHTML=h;
 $('#ans').onclick=function(){$('#an').hidden=false;this.hidden=true};
 $('#slow').onchange=function(){st.slow=this.checked;save();audio.playbackRate=st.slow?0.75:1};
 function from(i,one){stopAudio();var u=U[i];if(!u)return;var el=app.querySelector('.s[data-i="'+i+'"]');el.classList.add('on');
  audio.src=u.src;audio.playbackRate=st.slow?0.75:1;audio.preservesPitch=true;playing=i;
  audio.onended=function(){el.classList.remove('on');if(!one&&playing===i)from(i+1)};audio.play().catch(function(){})}
 $('#play').onclick=function(){from(0)};
 app.querySelectorAll('.s').forEach(function(e){e.onclick=function(){from(+e.dataset.i,true)}});
 $('#b').onclick=next}
function solve(D,S,n,bar,next){var V=D.solve,pick=S.solve?S.solve.picks.slice():[];
 function draw(){var h=bar+'<h1>직접 풀어 보기</h1>'+V.intro.map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'<details class="nb"><summary>단서 수첩 펼쳐 보기</summary>'+notebookHtml()+'</details>';
  V.qs.forEach(function(q,j){h+='<h2>질문 '+(j+1)+'. '+esc(q.q)+'</h2>'+q.opts.map(function(o){var k=o.charAt(0);return '<button class="opt'+(pick[j]===k?' sel':'')+'" data-q="'+j+'" data-k="'+k+'"'+(S.solve?' disabled':'')+'>'+esc(o)+'</button>'}).join('')});
  h+=S.solve?'<p class="note">답을 저장했어요. '+(D.solve_reveal!==undefined?esc(label(D.solve_reveal))+' 끝에서':'이 장을 끝까지 읽으면')+' 맞춰 볼 수 있어요.</p><button class="main" id="b">계속 읽기</button>':'<button class="main" id="b"'+(pick.filter(Boolean).length<V.qs.length?' disabled':'')+'>이 답으로 저장하고 계속 읽기</button>';
  app.innerHTML=h;
  app.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){pick[+b.dataset.q]=b.dataset.k;draw()}});
  $('#b').onclick=function(){if(!S.solve){S.solve={picks:pick,date:today()};save();
    send('solve',n,{picks:pick,correct:pick.map(function(p,j){return p===D.solve_answers[j].answer})})}next()}}
 draw()}
function clues(D,n,bar,next){var h=bar+'<h1>단서 수첩</h1><p>'+esc(D.clue_intro)+'</p><p class="sub">단서를 하나씩 눌러 수첩에 넣어요.</p>';
 D.clues.forEach(function(c,j){var id=n+'_'+j,got=st.clues.indexOf(id)>=0;h+='<div class="clue-card'+(got?' got':'')+'"><p>'+esc(c.ko)+'</p><p class="en2">'+esc(c.en)+'</p><button data-c="'+id+'"'+(got?' disabled':'')+'>'+(got?'수첩에 넣었어요':'수첩에 넣기')+'</button></div>'});
 app.innerHTML=h+'<button class="main" id="b">다음으로</button>';
 function upd(){$('#b').disabled=D.clues.some(function(c,j){return st.clues.indexOf(n+'_'+j)<0})}
 app.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){if(st.clues.indexOf(b.dataset.c)<0){st.clues.push(b.dataset.c);save()}b.disabled=true;b.textContent='수첩에 넣었어요';b.parentNode.classList.add('got');hdr();upd();pop('단서를 수첩에 넣었어요')}});
 upd();$('#b').onclick=next}
function quiz(D,S,n,bar,next){var Q=D.quiz;S.quiz=S.quiz||{};var i=0;while(i<Q.length-1&&S.quiz[i]&&S.quiz[i].ok)i++;  // 새로고침하면 아직 다 맞히지 않은 문제부터
 function one(){var q=Q[i],shown=false;app.innerHTML=bar+'<p class="prog">내용 확인 '+(i+1)+' / '+Q.length+'</p><h1>'+esc(q.q)+'</h1><p class="sub">'+esc(q.ko)+'</p>'+q.opts.map(function(o){return '<button class="opt" data-k="'+o.charAt(0)+'">'+esc(o)+'</button>'}).join('')+'<div id="ex"></div>';
  app.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){if(shown)return;var ok=b.dataset.k===q.answer;
   if(S.quiz[i]===undefined){S.quiz[i]={first:ok,pick:b.dataset.k};save();send('answer',n,{q:i,pick:b.dataset.k,correct:ok})}
   b.classList.add(ok?'ok':'no');if(!ok){pop('다시 골라 봐요');return}shown=true;S.quiz[i].ok=true;save();
   $('#ex').innerHTML='<p class="note">'+esc(q.why)+'</p><button class="main" id="b">'+(i<Q.length-1?'다음 문제':'다음으로')+'</button>';$('#b').onclick=function(){i++;i<Q.length?one():next()}}})}
 one()}
function rec(D,n,bar,next){var h=bar+'<h1>따라 말하기</h1><p class="sub">본보기를 한 번 듣고, 따라 말하면서 녹음해요. 녹음은 선생님만 들을 수 있게 비공개로 보내요. 건너뛰어도 괜찮아요.</p>';
 D.record.forEach(function(l,i){h+='<p class="en" style="margin-top:18px">'+esc(l.t)+'</p><div class="row"><button data-p="'+esc(l.src)+'">듣기</button><button data-r="'+i+'">녹음</button><span class="sub" id="rs'+i+'">'+(st.rec[n+'_'+i]?'보냈어요':'')+'</span></div>'});
 app.innerHTML=h+'<button class="main" id="b">다음으로</button>';$('#b').onclick=next;
 app.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){play(b.dataset.p)}});
 var mr=null;app.querySelectorAll('[data-r]').forEach(function(b){b.onclick=async function(){var i=b.dataset.r,lab=$('#rs'+i);
  if(mr){mr.stop();return}stopAudio();
  try{var s=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){lab.textContent='마이크를 쓸 수 없어요';return}
  var chunks=[];mr=new MediaRecorder(s);mr.ondataavailable=function(e){chunks.push(e.data)};b.textContent='멈추기';lab.textContent='녹음 중';
  mr.onstop=async function(){s.getTracks().forEach(function(t){t.stop()});mr=null;b.textContent='다시 녹음';var blob=new Blob(chunks,{type:chunks[0]&&chunks[0].type||'audio/webm'});
   var ext=blob.type.indexOf('mp4')>=0?'m4a':'webm',path=st.learner.id+'/b'+n+'_'+i+'_'+Date.now()+'.'+ext;lab.textContent='보내는 중';
   if(!C.sync){lab.textContent='지금은 녹음을 보낼 수 없어요';return}
   try{await flush();var r=await fetch(C.url+'/storage/v1/object/'+C.bucket+'/'+path,{method:'POST',headers:{apikey:C.key,'Content-Type':blob.type},body:blob});if(!r.ok)throw r.status;
    st.rec[n+'_'+i]=1;save();send('recording',n,{line:i,speaker:D.record[i].sp,text:D.record[i].t},path);lab.textContent='보냈어요'}catch(e){lab.textContent='못 보냈어요. 다시 눌러 주세요'}};
  mr.start()}})}
function think(D,S,n,bar,next){app.innerHTML=bar+'<h1>생각해 볼 질문</h1><p>'+esc(D.think)+'</p><textarea id="tx" rows="3" maxlength="300" placeholder="여기에 써요. 한국어도 영어도 괜찮아요.">'+esc(S.think||'')+'</textarea><p class="sub">쓰지 않고 넘어가도 괜찮아요.</p><button class="main" id="b">다음으로</button>';
 $('#b').onclick=function(){var v=$('#tx').value.trim();if(v&&v!==S.think){S.think=v;save();send('reflection',n,{type:'think',text:v})}next()}}
function reflect(D,n,bar,next){var R=D.reflect;app.innerHTML=bar+'<h1>한 줄 감상</h1><p>'+esc(R.q)+'</p><p class="sub">'+esc(R.help)+'</p><textarea id="tx" rows="2" maxlength="200" placeholder="한국어도 영어도 괜찮아요.">'+esc(st.reflection||'')+'</textarea><button class="main" id="b">저장하고 수료증으로</button>';
 var chk=function(){$('#b').disabled=$('#tx').value.trim().length<2};$('#tx').oninput=chk;chk();
 $('#b').onclick=function(){var v=$('#tx').value.trim();if(v!==st.reflection){st.reflection=v;save();send('reflection',12,{type:'book',text:v})}next()}}
function fill(t,m){return t.replace(/\{([^}]+)\}/g,function(a,k){return m[k]!==undefined?m[k]:a})}
function cert(){var E=CH[11];if(!E||!E.cert||!(teacher||(st.ch[11]&&st.ch[11].done)))return redirect('#/toc');
 var m={'이름':st.learner.name,'읽은 단어 수':wordsRead().toLocaleString('en-US'),'모은 단서 수':st.clues.length,'끝낸 날짜':(st.ch[11]&&st.ch[11].doneDate)||today(),'선생님 이름':C.teacher},foot=E.cert.foot;
 if(!C.teacher)foot=foot.replace(/\s*·\s*담당 \{선생님 이름\}/,'');
 app.innerHTML='<div class="cert"><p class="dots">리드앤라이트 영어교습소</p><h1>'+esc(E.cert.title)+'</h1><p>'+esc(fill(E.cert.body,m))+'</p><p class="sub">'+esc(fill(foot,m))+'</p></div><div class="row noprint" style="margin-top:14px"><button id="pr">인쇄하기</button></div><button class="main noprint" id="b">마치며</button>';
 $('#pr').onclick=function(){window.print()};$('#b').onclick=function(){go('#/end')}}
function end(){var E=CH[11];if(!E||!E.end||!(teacher||(st.ch[11]&&st.ch[11].done)))return redirect('#/toc');
 app.innerHTML='<h1>'+esc(E.end.title)+'</h1>'+E.end.items.map(function(x){return '<p>'+esc(x).replace('10% 할인','<b class="acc">10% 할인</b>').replace(/0507-1312-1196/,'<a class="acc" href="tel:050713121196">0507-1312-1196</a>')+'</p>'}).join('')+'<p class="sub"><a href="#/cert">수료증 다시 보기</a> · <a href="#/report">학부모 리포트 보기</a> · <a href="#/toc">목차</a></p>'}
function wordsRead(){var s=0;Object.keys(st.ch).forEach(function(n){if(st.ch[n].done&&CH[n])s+=CH[n].words_read});return s}
function cmp(m){var V=CH[m],SS=st.ch[m]||{},h='';if(!V||!V.solve)return '';
 h+='<h2>직접 풀어 보기 맞춰 보기'+(V.solve_reveal!==undefined?' ('+esc(label(m))+'의 질문)':'')+'</h2>';
 if(!SS.solve)return h+'<p class="sub">'+esc(label(m))+'에서 고른 답이 없어요.</p>';
 V.solve.qs.forEach(function(q,j){var a=V.solve_answers[j],mine=SS.solve.picks[j],ok=mine===a.answer,mo=q.opts.find(function(o){return o.charAt(0)===mine})||'';
  h+='<div class="cmp"><p><b>질문 '+(j+1)+'.</b> '+esc(q.q)+'</p><p>내 답: <span class="'+(ok?'ok':'no')+'">'+esc(mo)+'</span>'+(ok?' · 맞았어요':'')+'</p><p>정답: <b>'+esc(a.answer+' '+a.label)+'</b></p><p class="sub">'+esc(a.why)+'</p></div>'});return h}
function done(D,S,n){var c=Object.values(S.quiz||{}).filter(function(x){return x.first}).length;
 if(!S.done){S.done=true;S.doneDate=today();save();send('done',n,{correct:c,total:D.quiz.length,clues:st.clues.filter(function(x){return x.indexOf(n+'_')===0}).length,words:D.words_read})}
 var h='<p class="dots">'+esc(label(n))+' 끝</p><h1>'+esc(jo(label(n),'을','를'))+' 다 읽었어요</h1><p>오늘 읽은 영어 <b class="acc">'+D.words_read+'단어</b>'+(D.quiz.length?' · 내용 확인 처음에 맞힌 문제 '+c+' / '+D.quiz.length:'')+'</p><p class="sub">지금까지 읽은 영어 '+wordsRead().toLocaleString('en-US')+'단어 · 모은 단서 '+st.clues.length+'개</p>';
 if(D.solve&&D.solve_reveal===undefined)h+=cmp(n);
 if(D.solve&&D.solve_reveal!==undefined)h+='<p class="note">직접 풀어 보기에서 고른 답은 '+esc(label(D.solve_reveal))+' 끝에서 맞춰 봐요.</p>';
 if(D.solve_check_for!==undefined)h+=cmp(D.solve_check_for);
 if(D.cert){h+='<p class="note">책 한 권을 끝까지 읽었어요. 이제 수료증을 받아요.</p><button class="main" id="b">수료증 받기</button>';app.innerHTML=h;$('#b').onclick=function(){go('#/cert')};return}
 var nx=n+1,msg='';if(ready(nx)){msg=open(nx)?esc(jo(label(nx),'이','가'))+' 열렸어요.':'다음 장('+esc(label(nx))+')은 내일 열려요. 하루에 한 장씩 읽어요.'}else if(B.toc[nx])msg='다음 장('+esc(label(nx))+')은 곧 열려요.';
 h+=msg?'<p class="note">'+msg+'</p>':'';
 h+='<button class="main" id="b">'+(open(nx)?esc(label(nx))+' 읽기':'목차로')+'</button>';app.innerHTML=h;$('#b').onclick=function(){go(open(nx)?'#/c/'+nx:'#/toc')}}
// ---------- 책 전체 ----------
function seen(){return Object.keys(CH).map(Number).filter(function(n){return teacher||(st.ch[n]&&st.ch[n].started)}).sort(function(a,b){return a-b})}
function wordbook(){var mode=st.wmode||'ch',list=[];seen().forEach(function(n){CH[n].words.forEach(function(w){list.push({n:n,w:w})})});
 var h='<p class="sub"><a href="#/toc">← 목차</a></p><h1>단어장</h1><p class="sub">읽기 시작한 장의 단어가 모여요. 지금 '+list.length+'개예요.</p><div class="row"><button id="m1"'+(mode==='ch'?' class="main" style="width:auto;margin:0"':'')+'>장별</button><button id="m2"'+(mode==='abc'?' class="main" style="width:auto;margin:0"':'')+'>ABC 순</button></div>';
 if(mode==='abc')list.sort(function(a,b){return a.w.w.localeCompare(b.w.w)});var last=null;
 list.forEach(function(x){if(mode==='ch'&&x.n!==last){last=x.n;h+='<h2>'+esc(label(x.n))+' · '+esc(CH[x.n].title_en)+'</h2>'}
  h+='<div class="word"><b>'+esc(x.w.w)+'</b><button class="mini" data-a="'+esc(x.w.src)+'">발음</button> <span>'+esc(x.w.ko)+'</span>'+(mode==='abc'?' <span class="sub">'+esc(label(x.n))+'</span>':'')+'<p class="ex">'+esc(x.w.ex)+' <button class="mini" data-a="'+esc(x.w.exsrc)+'">▶</button></p></div>'});
 app.innerHTML=h;$('#m1').onclick=function(){st.wmode='ch';save();wordbook()};$('#m2').onclick=function(){st.wmode='abc';save();wordbook()};
 app.querySelectorAll('[data-a]').forEach(function(b){b.onclick=function(){play(b.dataset.a)}})}
function people(){var m={},order=[];seen().forEach(function(n){CH[n].cards.forEach(function(c){if(!m[c.en])order.push(c.en);m[c.en]={c:c,n:n}})});
 app.innerHTML='<p class="sub"><a href="#/toc">← 목차</a></p><h1>등장인물</h1><p class="sub">읽은 데까지 알게 된 것만 적혀 있어요.</p>'+order.map(function(k){var x=m[k];return card({en:x.c.en,ko:x.c.ko,img:x.c.img,line:x.c.line,new:false}).replace('</div></div>','<br><span class="sub">'+esc(label(x.n))+'까지</span></div></div>')}).join('')}
function notebookHtml(){var h='',any=false;
 Object.keys(CH).map(Number).sort(function(a,b){return a-b}).forEach(function(n){var got=CH[n].clues.map(function(c,j){return st.clues.indexOf(n+'_'+j)>=0?c:null}).filter(Boolean);
  if(!got.length)return;any=true;h+='<h2>'+esc(label(n))+' · '+esc(CH[n].title_en)+'</h2>'+got.map(function(c){return '<div class="clue-card got"><p>'+esc(c.ko)+'</p><p class="en2">'+esc(c.en)+'</p></div>'}).join('')});
 return any?h:'<p>아직 모은 단서가 없어요. 1장부터 단서가 나와요.</p>'}
function notebook(){app.innerHTML='<p class="sub"><a href="#/toc">← 목차</a></p><h1>단서 수첩</h1><p class="sub">모은 단서 '+st.clues.length+'개</p>'+notebookHtml()}
function report(){var L=st.learner,lines=[],dates=[],totC=0,totQ=0,rc=Object.keys(st.rec).length;
 B.toc.forEach(function(t){var s=st.ch[t.n],D=CH[t.n];if(!s||!s.started||!D)return;var c=Object.values(s.quiz||{}).filter(function(x){return x.first}).length;
  if(s.done){dates.push(s.doneDate);totC+=c;totQ+=D.quiz.length}
  var r=t.label+' '+t.title_en+': '+(s.done?'다 읽음('+s.doneDate+')':'읽는 중')+(D.quiz.length&&s.done?', 내용 확인 '+c+'/'+D.quiz.length:'');
  if(D.think&&s.think)r+=', 생각해 볼 질문: '+s.think;
  if(D.solve&&s.solve)r+=', 직접 풀어 보기 '+D.solve.qs.map(function(q,j){return '질문'+(j+1)+' '+(s.solve.picks[j]===D.solve_answers[j].answer?'O':'X')}).join(' ');lines.push(r)});
 var txt='「왓슨의 사건 수첩」 학부모 리포트\n\n학생: '+L.name+'\n학년: '+(L.grade||'-')+'\n시작일: '+L.start+'\n담당: '+(C.teacher||'(선생님이 적어요)')+'\n\n[장별 기록]\n'+(lines.join('\n')||'아직 읽은 장이 없어요.')+
  '\n\n[모아 보기]\n다 읽은 장 '+dates.length+'개 · 읽은 영어 '+wordsRead()+'단어 · 모은 단서 '+st.clues.length+'개 · 녹음 '+rc+'개\n내용 확인 처음에 맞힌 문제 '+totC+'/'+totQ+(totQ?' ('+Math.round(totC/totQ*100)+'%)':'')+'\n참여한 날: '+(dates.join(', ')||'없음')+
  '\n\n[한 줄 감상]\n'+(st.reflection||'책을 다 읽은 뒤에 적어요.')+'\n\n[잘한 점]\n(선생님이 녹음과 기록을 보고 적어요)\n\n[다음 단계]\n(선생님이 적어요)';
 app.innerHTML='<p class="sub"><a href="#/toc">← 목차</a></p><h1>학부모 리포트</h1><p class="sub">이 기기에서 읽은 기록으로 채웠어요. 잘한 점과 다음 단계는 선생님이 직접 적어요. 자동으로 보내지 않아요.</p><pre id="rp">'+esc(txt)+'</pre><button class="main" id="b">복사하기</button>';
 $('#b').onclick=function(){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){pop('복사했어요')},function(){var r=document.createRange();r.selectNode($('#rp'));getSelection().removeAllRanges();getSelection().addRange(r);document.execCommand('copy');pop('복사했어요')})}}
function tpin(){app.innerHTML='<h1>선생님 확인</h1><label>번호<input type="password" id="pin" inputmode="numeric"></label><button class="main" id="b">확인</button>';
 $('#b').onclick=function(){if($('#pin').value!==C.teacherPin)return pop('번호가 맞지 않아요');
  // 선생님 모드는 학생 기록과 다른 칸(fc_cho6_book_teacher_v1)에만 저장하고, 서버로 보내지 않는다
  sset('sessionStorage','fc_teacher','1');teacher=true;C.sync=false;LS='fc_cho6_book_teacher_v1';st=load();
  if(!st.learner){st.learner={id:'teacher',name:'선생님',grade:'',consent_at:new Date().toISOString(),start:today()}}save();redirect('#/toc')}}
if(teacher)C.sync=false;
if(/[?&]teacher=1/.test(location.search)&&!teacher)location.hash='#/teacher';
route();flush();
})();
