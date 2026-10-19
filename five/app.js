(function(){
var C=window.FC_CONFIG,K=window.COMMON,DAYS=window.DAYS,$=function(s){return document.querySelector(s)},app=$('#app');
var LS='fc_cho6_v1',st=load();
function load(){try{return JSON.parse(localStorage.getItem(LS))||{}}catch(e){return {}}}
function save(){localStorage.setItem(LS,JSON.stringify(st))}
st.clues=st.clues||[];st.days=st.days||{};st.queue=st.queue||[];st.rec=st.rec||{};
var teacher=sessionStorage.getItem('fc_teacher')==='1';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function uuid(){return crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c=='x'?r:(r&3|8)).toString(16)})}
function pop(t){var p=$('#pop');p.textContent=t;p.hidden=false;clearTimeout(pop.t);pop.t=setTimeout(function(){p.hidden=true},1800)}
document.addEventListener('error',function(e){var t=e.target;if(t.tagName==='IMG'&&/\.jpg$/.test(t.getAttribute('src')||'')){t.src=t.getAttribute('src').replace(/\.jpg$/,'.svg')}},true);
function cardHtml(c,small){return '<div class="card'+(small?' sm':'')+'"><img src="'+c.img+'" alt=""><div><b>'+esc(c.name)+'</b> <span class="sub">'+esc(c.en)+'</span><br>'+esc(c.line)+'</div></div>'}
function hdr(){$('#clueCount').textContent=st.clues.length?'단서 '+st.clues.length+'개':''}
// ---------- 서버 기록 (fc_ 테이블, 추가만 가능) ----------
function sb(path,body,extra){return fetch(C.url+path,Object.assign({method:'POST',headers:Object.assign({apikey:C.key,'Content-Type':'application/json',Prefer:'return=minimal'},extra||{}),body:body}))}
function send(kind,day,payload,ap){if(!C.sync||!st.learner)return;var o={learner_id:st.learner.id,day:day,kind:kind,payload:payload};if(ap)o.audio_path=ap;st.queue.push(o);save();flush()}
var busy=false,again=false;
async function flush(){if(!C.sync||!st.learner)return;if(busy){again=true;return}busy=true;
 try{if(!st.learnerSent){var L=st.learner,r=await sb('/rest/v1/fc_learners',JSON.stringify({id:L.id,course:C.course,student_name:L.name,school_grade:L.grade,parent_phone:L.phone||null,consent_privacy:true,consent_guardian:true,consent_at:L.consent_at,source:'cho6-app'}));
   if(!r.ok&&r.status!==409)throw r.status;st.learnerSent=true;save()}
  while(st.queue.length){var q=st.queue[0],r2=await sb('/rest/v1/fc_submissions',JSON.stringify(q));if(!r2.ok)throw r2.status;st.queue.shift();save()}
 }catch(e){st.syncErr=String(e);save()}busy=false;if(again){again=false;flush()}}
window.addEventListener('online',flush);
// ---------- 열림 규칙 ----------
function open(n){if(teacher)return true;if(!st.pre)return false;if(n===1)return true;var p=st.days[n-1];if(!p||!p.done)return false;
 return C.unlockRule==='done'||p.doneDate<today()}
// ---------- 라우팅 ----------
function go(h){location.hash=h}
window.addEventListener('hashchange',route);$('#home').onclick=function(e){e.preventDefault();go('#/')};
function route(){window.scrollTo(0,0);$('#pop').hidden=true;stopAudio();hdr();var h=location.hash.replace('#/','').split('/');
 if(!st.learner&&h[0]!==''&&h[0]!=='join'&&h[0]!=='teacher')return start();
 ({'':start,'join':join,'pre':function(){check('pre')},'list':list,'day':function(){day(+h[1],h[2]||'intro')},'post':function(){check('post')},'cert':cert,'report':report,'end':end,'teacher':tpin})[h[0]]?({'':start,'join':join,'pre':function(){check('pre')},'list':list,'day':function(){day(+h[1],h[2]||'intro')},'post':function(){check('post')},'cert':cert,'report':report,'end':end,'teacher':tpin})[h[0]]():start()}
function start(){if(st.learner)return go(st.pre?'#/list':'#/pre');
 app.innerHTML='<p class="dots">리드앤라이트 영어교습소 · 5일 무료 코스</p><h1>영어 사건 파일</h1><img class="scene" src="img/d1_a.jpg" alt=""><p>하루에 영어 이야기 한 편을 듣고 읽어요. 이야기 속 단서 단어를 모으고, 추리 문제를 풀어요.</p><p>5일째에는 그동안 모은 단서로 범인을 찾아요. 하루 10분이면 충분해요.</p><button class="main" id="b">시작할게요</button>';
 $('#b').onclick=function(){go('#/join')}}
function join(){app.innerHTML='<h1>탐정 등록</h1><p class="sub">기록을 남기려면 이름과 동의가 필요해요.</p>'+
 '<label>이름<input type="text" id="nm" autocomplete="name"></label><label>학년<input type="text" id="gr" placeholder="예: 초6"></label><label>보호자 연락처 (선택)<input type="tel" id="ph" placeholder="010-"></label>'+
 '<h2>개인정보 수집·이용 동의</h2><p class="sub">리드앤라이트 영어교습소가 무료 코스 진행과 결과 안내를 위해 이름, 학년, 보호자 연락처(적은 경우), 문제 풀이 기록, 녹음(직접 녹음한 경우)을 받아요. 코스가 끝나고 1년 동안 보관한 뒤 지워요. 동의하지 않으면 코스를 쓸 수 없어요.</p>'+
 '<label class="chk"><input type="checkbox" id="c1">개인정보 수집·이용에 동의해요 (필수)</label>'+
 '<label class="chk"><input type="checkbox" id="c2">보호자가 내용을 확인하고 동의했어요 (필수, 만 14세 미만)</label>'+
 '<button class="main" id="b" disabled>등록할게요</button>';
 var chk=function(){$('#b').disabled=!($('#nm').value.trim()&&$('#c1').checked&&$('#c2').checked)};['#nm','#c1','#c2'].forEach(function(s){$(s).oninput=chk;$(s).onchange=chk});
 $('#b').onclick=function(){st.learner={id:uuid(),name:$('#nm').value.trim(),grade:$('#gr').value.trim(),phone:$('#ph').value.trim(),consent_at:new Date().toISOString(),start:today()};save();flush();go('#/pre')}}
function check(kind){var W=K.word_check.items,ans={},i=0,done=st[kind];
 if(done){app.innerHTML='<h1>'+(kind=='pre'?'시작 전':'끝난 뒤')+' 단어 점검</h1><p>'+done.score+' / 15 맞혔어요.</p><button class="main" id="b">계속할게요</button>';$('#b').onclick=function(){go(kind=='pre'?'#/list':'#/cert')};return}
 function q(){var it=W[i];app.innerHTML='<p class="dots">단어 점검 '+(i+1)+' / 15</p><h1>'+(i===0?(kind=='pre'?'시작하기 전에, 아는 단어를 확인해요':'처음 풀었던 15문제를 다시 풀어요'):'')+'</h1>'+
  '<p style="font-size:20px"><b>'+esc(it.word)+'</b> 의 뜻은?</p>'+it.보기.map(function(b,j){return '<button class="opt" data-k="'+b.charAt(0)+'">'+esc(b)+'</button>'}).join('')+'<p class="sub">몰라도 괜찮아요. 가장 그럴듯한 걸 골라요.</p>';
  app.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){ans[it.word]=b.dataset.k===it.정답;i++;i<W.length?q():fin()}})}
 function fin(){var sc=Object.values(ans).filter(Boolean).length;st[kind]={score:sc,ans:ans,date:today()};save();send(kind=='pre'?'pretest':'posttest',kind=='pre'?0:6,{score:sc,total:15,ans:ans});
  app.innerHTML='<h1>'+sc+' / 15</h1><p>'+(kind=='pre'?'지금 점수는 출발선이에요. 5일 뒤에 같은 문제를 다시 풀어 볼 거예요.':'처음엔 '+st.pre.score+'개였어요. 5일 동안 모은 단어가 여기 있어요.')+'</p><button class="main" id="b">'+(kind=='pre'?'1일 차 사건으로':'수료증 받기')+'</button>';
  $('#b').onclick=function(){go(kind=='pre'?'#/day/1':'#/cert')}}
 q()}
function list(){var h='<h1>'+esc(st.learner.name)+' 탐정의 사건 목록</h1>'+(teacher?'<p class="acc sub">선생님 모드: 모든 날이 열려 있어요.</p>':'')+'<ul class="days">';
 K.titles.forEach(function(t,j){var n=j+1,o=open(n)&&DAYS[n],d=st.days[n]&&st.days[n].done;h+='<li class="'+(o?'':'lock')+'"><span>'+n+'일 차 · '+esc(t)+'</span><span>'+(d?'완료':o?'<a class="acc" href="#/day/'+n+'">열기</a>':(DAYS[n]?'잠김':'준비 중'))+'</span></li>'});
 h+='</ul>';var all=[1,2,3,4,5].every(function(n){return st.days[n]&&st.days[n].done});
 if(all||teacher)h+='<button class="main" id="b">끝난 뒤 단어 점검</button>';h+='<p class="sub" style="margin-top:24px"><a href="#/report">학부모 리포트 보기</a>'+(teacher?' · <a href="teacher.html">학생 기록 보기 (선생님 계정 로그인)</a>':'')+'</p>';
 app.innerHTML=h;if($('#b'))$('#b').onclick=function(){go('#/post')}}
// ---------- 하루 사건 ----------
var audio=new Audio(),playing=null;
function stopAudio(){audio.pause();playing=null;document.querySelectorAll('.s.on').forEach(function(e){e.classList.remove('on')})}
function dayState(n){return st.days[n]||(st.days[n]={})}
function day(n,step){var D=DAYS[n];if(!D||!open(n))return go('#/list');var S=dayState(n);
 var steps=['intro','story','clue','rec','quiz','done'],nx=function(){go('#/day/'+n+'/'+steps[steps.indexOf(step)+1])};
 if(step==='intro'){app.innerHTML='<p class="dots">'+n+'일 차</p><h1>'+esc(D.title)+'</h1>'+(D.recap?'<div class="recap"><p class="sub">지난 이야기</p><p>'+esc(D.recap)+'</p></div>':'')+'<img class="scene" src="'+D.cover+'" alt="">'+D.intro.map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'<h2>오늘 나오는 인물</h2>'+D.cards.map(function(c){return cardHtml(c)}).join('')+'<button class="main" id="b">이야기 들으러 가요</button>';$('#b').onclick=nx}
 if(step==='story'||step==='clue')story(D,S,step,nx);
 if(step==='rec')rec(D,n,nx);
 if(step==='quiz')quiz(D,S,n,nx);
 if(step==='done')done(D,S,n)}
function story(D,S,step,nx){var gseen={},cw=D.clue_words.map(function(c){return c.word});
 function words(t){return esc(t).replace(/[A-Za-z']+/g,function(w){var l=w.toLowerCase(),c=cw.find(function(x){return l===x||(D.forms[x]||[]).indexOf(l)>=0||l.indexOf(x)===0&&l.length<=x.length+2});
  if(c)return '<span class="clue'+(st.clues.indexOf(c)>=0?' got':'')+'" data-c="'+c+'">'+w+'</span>';
  if(D.gloss[l]&&!gseen[l.replace(/s$|ves$/,'')]){gseen[l.replace(/s$|ves$/,'')]=1;return '<span class="gl" data-g="'+esc(D.gloss[l])+'" data-w="'+w+'">'+w+'</span>'}return w})}
 var h='<p class="dots">'+(step==='story'?'이야기 듣기':'단서 모으기')+'</p>';
 h+=step==='story'?'<p class="sub">문장을 누르면 그 문장만 다시 들려요. 점선 단어는 누르면 뜻이 나와요.</p>':'<p>밑줄 친 단어가 오늘의 단서예요. 눌러서 단서 수첩에 넣어요. <span class="acc" id="cn"></span></p>';
 h+='<div class="row"><button id="play">처음부터 듣기</button><label class="chk" style="margin:0"><input type="checkbox" id="slow">천천히</label></div><div class="story">';
 D.sentences.forEach(function(s,i){D.checks.forEach(function(c){if(c.at===i)h+='<div class="check"><span class="acc">'+esc(c.text.split('? ')[0])+'?</span> '+esc(c.text.split('? ').slice(1).join('? '))+c.chars.map(function(x){return cardHtml(x,1)}).join('')+'</div>'});
  D.scenes.forEach(function(c){if(c.at===i)h+='<img class="scene" src="'+c.src+'" alt="">'});
  h+='<span class="s'+(s.speaker!=='narrator'?' q':'')+'" data-i="'+i+'">'+(s.speaker!=='narrator'?'<span class="who">'+esc(s.speaker)+'</span>':'')+words(s.text)+'</span> '});
 h+='</div>'+(step==='clue'?'<div id="note"></div>':'')+'<button class="main" id="b">'+(step==='story'?'다 들었어요':'단서 수첩 덮기')+'</button>';app.innerHTML=h;
 if(step!=='clue')app.querySelectorAll('.clue').forEach(function(e){e.className=''});
 function cnt(){if($('#cn'))$('#cn').textContent='('+cw.filter(function(c){return st.clues.indexOf(c)>=0}).length+' / '+cw.length+')';
  if($('#note'))$('#note').innerHTML='<h2>단서 수첩</h2>'+D.clue_words.filter(function(c){return st.clues.indexOf(c.word)>=0}).map(function(c){return '<p class="note"><b>'+c.word+'</b> '+esc(c.뜻)+'<br><span class="sub">'+esc(c.예문)+'</span></p>'}).join('');
  if(step==='clue')$('#b').disabled=cw.some(function(c){return st.clues.indexOf(c)<0});hdr()}
 cnt();
 function playFrom(i,one){stopAudio();var s=D.sentences[i];if(!s)return;var el=app.querySelector('.s[data-i="'+i+'"]');el.classList.add('on');
  audio.src=s.src;audio.playbackRate=$('#slow').checked?0.75:1;audio.preservesPitch=true;playing=i;
  audio.onended=function(){el.classList.remove('on');if(!one&&playing===i)playFrom(i+1)};audio.play().catch(function(){})}
 $('#play').onclick=function(){playFrom(0)};
 app.querySelector('.story').onclick=function(e){var c=e.target.closest('.clue'),g=e.target.closest('.gl'),s=e.target.closest('.s');
  if(g){pop(g.dataset.w+' : '+g.dataset.g);return}
  if(c&&step==='clue'){var w=c.dataset.c;if(st.clues.indexOf(w)<0){st.clues.push(w);save()}app.querySelectorAll('.clue[data-c="'+w+'"]').forEach(function(x){x.classList.add('got')});
   var a=new Audio('audio/w_'+w+'.mp3');a.play().catch(function(){});pop(w+' : '+D.clue_words.find(function(x){return x.word===w}).뜻);cnt();return}
  if(s)playFrom(+s.dataset.i,true)};
 $('#b').onclick=function(){if(step==='story'){dayState(D.day).heard=true;save()}nx()}}
function rec(D,n,nx){var lines=D.record_lines,h='<p class="dots">대사 따라 하기 (선택)</p><h1>등장인물이 되어 말해 봐요</h1><p class="sub">녹음은 선생님만 들을 수 있게 비공개로 보내요. 건너뛰어도 괜찮아요.</p>';
 lines.forEach(function(l,i){h+='<h2>'+esc(l.speaker)+'</h2><p class="story" style="font-size:18px">'+esc(l.line)+'</p><p class="sub">'+esc(l.연기_팁)+'</p><div class="row"><button data-r="'+i+'">녹음</button><span class="sub" id="rs'+i+'">'+(st.rec[n+'_'+i]?'보냈어요':'')+'</span></div>'});
 h+='<button class="main" id="b">다음으로</button>';app.innerHTML=h;$('#b').onclick=nx;
 var mr=null;app.querySelectorAll('[data-r]').forEach(function(b){b.onclick=async function(){var i=b.dataset.r,lab=$('#rs'+i);
  if(mr){mr.stop();return}
  try{var s=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){lab.textContent='마이크를 쓸 수 없어요';return}
  var ch=[];mr=new MediaRecorder(s);mr.ondataavailable=function(e){ch.push(e.data)};b.textContent='멈추기';lab.textContent='녹음 중';
  mr.onstop=async function(){s.getTracks().forEach(function(t){t.stop()});mr=null;b.textContent='다시 녹음';var blob=new Blob(ch,{type:ch[0]&&ch[0].type||'audio/webm'});
   var ext=blob.type.indexOf('mp4')>=0?'m4a':'webm',path=st.learner.id+'/d'+n+'_'+i+'_'+Date.now()+'.'+ext;lab.textContent='보내는 중';
   if(!C.sync){lab.textContent='저장 안 함(서버 꺼짐)';return}
   try{await flush();var r=await fetch(C.url+'/storage/v1/object/'+C.bucket+'/'+path,{method:'POST',headers:{apikey:C.key,'Content-Type':blob.type},body:blob});if(!r.ok)throw r.status;
    st.rec[n+'_'+i]=1;save();send('recording',n,{line:i,speaker:lines[i].speaker},path);lab.textContent='보냈어요'}catch(e){lab.textContent='못 보냈어요. 다시 눌러 주세요'}};
  mr.start()}})}
function board(q){var have=allClues();return '<p class="note">'+esc(D5c(q))+'</p><h2>범인을 가리키는 단서 7개</h2><p class="sub">진하게 보이는 건 내가 모은 단서예요.</p><p class="board">'+q.단서_연결.map(function(c){return '<span class="'+(have.indexOf(c.word)>=0?'got':'')+'">'+esc(c.word)+' <small>'+esc(c.날짜)+'</small></span>'}).join('')+'</p>'}
function D5c(q){return DAYS[5].cliffhanger}
function allClues(){return st.clues}
function quiz(D,S,n,nx){var Q=D.questions,i=0;S.quiz=S.quiz||{};
 function one(){var q=Q[i];app.innerHTML='<p class="dots">'+(q.단서_연결?'범인 찾기':'추리 문제')+(Q.length>1?' '+(i+1)+' / '+Q.length:'')+'</p>'+(q.단서_연결?board(q):'')+'<h1>'+esc(q.문제)+'</h1>'+q.보기.map(function(b){return '<button class="opt" data-k="'+b.charAt(0)+'">'+esc(b)+'</button>'}).join('')+'<div id="ex"></div>';
  app.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){if(S.quiz[i]!==undefined&&S.quiz[i].first!==undefined&&$('#ex').innerHTML)return;var ok=b.dataset.k===q.정답;
   if(S.quiz[i]===undefined){S.quiz[i]={first:ok,pick:b.dataset.k};save();send('answer',n,{q:i,pick:b.dataset.k,correct:ok})}
   b.classList.add(ok?'ok':'no');if(!ok){pop('다시 골라 봐요');return}
   $('#ex').innerHTML=(q.단서_연결?'<h2>단서를 이어 보면</h2>'+q.단서_연결.map(function(c){return '<p><b class="acc">'+esc(c.word)+'</b> '+esc(c.추리)+'</p>'}).join(''):'')+'<p class="note">'+esc(q.해설)+'</p>'+(q.한_줄_답_예시?'<p class="story" style="font-size:18px">'+esc(q.한_줄_답_예시)+' <button id="ans">듣기</button></p>':'')+'<button class="main" id="b">'+(i<Q.length-1?'다음 문제':'사건 정리')+'</button>';$('#b').onclick=function(){i++;i<Q.length?one():nx()};if($('#ans'))$('#ans').onclick=function(){stopAudio();audio.src=q.answer_audio;audio.play().catch(function(){})}}})}
 one()}
function done(D,S,n){if(!S.done){S.done=true;S.doneDate=today();save();var c=Object.values(S.quiz||{}).filter(function(x){return x.first}).length;send('done',n,{correct:c,total:D.questions.length,clues:st.clues.slice()})}
 app.innerHTML='<p class="dots">'+n+'일 차 끝</p><h1>'+esc(D.badge)+(((D.badge.charCodeAt(D.badge.length-1)-44032)%28)?'을':'를')+' 받았어요</h1><p>오늘 모은 단서: <span class="acc">'+D.clue_words.map(function(c){return c.word}).join(', ')+'</span></p>'+
  '<img class="scene" src="'+D.teaser_img+'" alt="">'+(n<5?'<p class="note">'+esc(D.cliffhanger)+'</p>':'<p>5일 동안 모은 단서는 모두 '+st.clues.length+'개예요. 이제 처음에 풀었던 단어 문제를 다시 풀어 봐요.</p>')+(n<5?'<p class="sub">다음 사건: '+esc(D.next_title)+'</p><p class="sub">'+(C.unlockRule==='done'?'다음 사건이 열렸어요.':'다음 사건은 내일 열려요.')+'</p>':'')+
  '<button class="main" id="b">'+(n<5?'사건 목록으로':'끝난 뒤 단어 점검')+'</button>';$('#b').onclick=function(){go(n<5?'#/list':'#/post')}}
// ---------- 수료증·리포트·안내 ----------
function fill(t,m){return t.replace(/\{([^}]+)\}/g,function(a,k){return m[k]!==undefined&&m[k]!==''?m[k]:'(선생님이 적어요)'})}
function vals(){var L=st.learner,c=0,res=[],dates=[],rc=Object.keys(st.rec).length;for(var n=1;n<=5;n++){var d=st.days[n],q=d&&d.quiz&&d.quiz[0];res.push(q?(q.first?'O':'X'):'미응시');if(q&&q.first)c++;if(d&&d.done)dates.push(d.doneDate)}
 var newW=st.pre&&st.post?Object.keys(st.post.ans).filter(function(w){return st.post.ans[w]&&!st.pre.ans[w]}).join(', ')||'없음':'사후 점검 뒤에 채워져요';
 return {'학생이름':L.name,'학년':L.grade,'시작일':L.start,'종료일':st.post?st.post.date:'진행 중','담당_선생님':C.teacher,'사전_점수':st.pre?st.pre.score:'','사후_점수':st.post?st.post.score:'-','새로_맞힌_단어':newW,
  '맞힌_문제_수':c,'정답률':Math.round(c/5*100),'1일_결과':res[0],'2일_결과':res[1],'3일_결과':res[2],'4일_결과':res[3],'5일_결과':res[4],'참여일수':dates.length,'참여_날짜':dates.join(', ')||'없음',
  '모은_단서_단어_수':st.clues.length,'녹음한_대사_수':rc,'수료일':st.post?st.post.date:today()}}
function cert(){var T=K.certificate,m=vals();app.innerHTML='<div class="cert"><p class="dots">리드앤라이트 영어교습소</p><h1>'+esc(T.title)+'</h1>'+fill(T.text,m).split('\n').map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+'<p class="sub">'+esc(fill(T.footer,m))+'</p></div><button class="main" id="b">마치며</button>';$('#b').onclick=function(){go('#/end')}}
function report(){var T=K.parent_report_template,m=vals(),txt=T.title+'\n\n'+Object.keys(T.header).map(function(k){return k+': '+fill(T.header[k],m)}).join('\n')+'\n';
 T.sections.forEach(function(s){txt+='\n['+s.항목+']\n'+fill(s.내용,m)+'\n'});txt+='\n'+fill(T.closing,m);
 app.innerHTML='<h1>학부모 리포트</h1><p class="sub">이 기기에서 푼 기록으로 채웠어요. 녹음 관찰과 잘한 점은 선생님이 직접 적어요. 자동으로 보내지 않아요.</p><pre id="rp">'+esc(txt)+'</pre><button class="main" id="b">복사하기</button>';
 $('#b').onclick=function(){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){pop('복사했어요')},function(){var r=document.createRange();r.selectNode($('#rp'));getSelection().removeAllRanges();getSelection().addRange(r);document.execCommand('copy');pop('복사했어요')})}}
function end(){app.innerHTML='<h1>5일 사건 수사를 마쳤어요</h1><p>끝까지 와 준 것만으로도 큰 일이에요.</p>'+
 '<p class="note">리드앤라이트에 등록하면 <b class="acc">10% 할인</b>해 드려요. (무료코스 수료 할인)</p><p>등록하면 이번 5일 동안의 기록으로 진단 자료를 드려요.</p>'+
 '<h2>레벨테스트</h2><p>11월 2일~6일, 11월 9일~13일</p><h2>문의</h2><p><a class="acc" href="tel:050713121196">0507-1312-1196</a></p><p class="sub">리드앤라이트 영어교습소 · 교습소 신고번호 제3-가-05019호</p>'+
 '<p class="sub"><a href="#/report">학부모 리포트 보기</a></p>'}
function tpin(){app.innerHTML='<h1>선생님 확인</h1><label>번호<input type="password" id="pin" inputmode="numeric"></label><button class="main" id="b">확인</button>';
 $('#b').onclick=function(){if($('#pin').value===C.teacherPin){sessionStorage.setItem('fc_teacher','1');teacher=true;if(!st.learner){st.learner={id:uuid(),name:'선생님',grade:'',consent_at:new Date().toISOString(),start:today()};st.pre=st.pre||{score:0,ans:{},date:today()};C.sync=false}save();go('#/list')}else pop('번호가 달라요')}}
if(/[?&]teacher=1/.test(location.search)&&!teacher)location.hash='#/teacher';
route();flush();
})();
