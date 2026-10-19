(function(){
// 선생님 기록 보기. Supabase Auth 로그인 세션으로만 읽는다. config.js 의 PIN 은 여기서 아무 것도 열지 않는다.
var C=window.FC_CONFIG,K=window.COMMON,DAYS=window.DAYS,$=function(s){return document.querySelector(s)},app=$('#app'),SK='fc_teacher_auth';
var HERE=location.origin+location.pathname,data=null,hideTest=true;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pop(t){var p=$('#pop');p.textContent=t;p.hidden=false;clearTimeout(pop.t);pop.t=setTimeout(function(){p.hidden=true},2600)}
function t(s){if(!s)return '-';var d=new Date(s);return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function sess(){try{return JSON.parse(localStorage.getItem(SK))}catch(e){return null}}
function keep(j){var s={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+(+j.expires_in||3600)*1000};localStorage.setItem(SK,JSON.stringify(s));return s}
async function fresh(){var s=sess();if(!s)return null;if(s.expires_at-Date.now()>60000)return s;
 var r=await fetch(C.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
 if(!r.ok){localStorage.removeItem(SK);return null}return keep(await r.json())}
async function api(path,opt){var s=await fresh();if(!s)throw 'auth';opt=opt||{};var r=await fetch(C.url+path,{method:opt.method||'GET',headers:Object.assign({apikey:C.key,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},opt.headers||{}),body:opt.body});
 if(r.status===401){localStorage.removeItem(SK);throw 'auth'}if(!r.ok)throw r.status;var x=await r.text();return x?JSON.parse(x):null}
// 메일 링크로 돌아오면 주소의 # 뒤에 토큰이 붙어 온다
(function(){var h=new URLSearchParams(location.hash.slice(1));if(h.get('access_token')){keep({access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),expires_in:h.get('expires_in')});history.replaceState(null,'',HERE)}
 else if(h.get('error_description')){setTimeout(function(){pop('로그인 링크가 만료됐거나 이미 쓰였어요. 다시 받아 주세요.')},300);history.replaceState(null,'',HERE)}})();
function login(){$('#who').textContent='';app.innerHTML='<h1>학생 기록 보기</h1><p class="sub">선생님 계정으로 로그인해야 볼 수 있어요. 학생 화면의 선생님 번호로는 열리지 않아요.</p>'+
 '<label>이메일<input type="text" id="em" inputmode="email" autocomplete="email" value="'+esc(localStorage.getItem('fc_teacher_email')||'')+'"></label>'+
 '<button class="main" id="link">로그인 링크 받기</button><p class="sub" id="msg"></p>'+
 '<h2>비밀번호로 로그인</h2><p class="sub">학원앱 선생님 계정과 같은 계정이에요.</p><label>비밀번호<input type="password" id="pw" autocomplete="current-password"></label><button class="main" id="pwb" style="background:none;color:var(--ink)">비밀번호로 로그인</button>';
 $('#link').onclick=async function(){var e=$('#em').value.trim();if(!e)return;localStorage.setItem('fc_teacher_email',e);this.disabled=true;
  var r=await fetch(C.url+'/auth/v1/otp?redirect_to='+encodeURIComponent(HERE),{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify({email:e,create_user:false})});
  $('#msg').textContent=r.ok?'메일을 보냈어요. 이 기기에서 메일의 Sign in 링크를 누르면 바로 들어와요.':(r.status===429?'메일은 한 시간에 몇 번만 보낼 수 있어요. 잠시 뒤에 다시 해 주세요.':'보내지 못했어요. 이메일을 확인해 주세요.');this.disabled=false};
 $('#pwb').onclick=async function(){var e=$('#em').value.trim(),p=$('#pw').value;if(!e||!p)return;localStorage.setItem('fc_teacher_email',e);
  var r=await fetch(C.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})});
  if(!r.ok){$('#msg').textContent='이메일이나 비밀번호가 맞지 않아요.';return}keep(await r.json());$('#pw').value='';start()}}
async function logout(){var s=sess();if(s)try{await fetch(C.url+'/auth/v1/logout',{method:'POST',headers:{apikey:C.key,Authorization:'Bearer '+s.access_token}})}catch(e){}localStorage.removeItem(SK);data=null;login()}
async function start(){if(!sess())return login();app.innerHTML='<p class="sub">불러오는 중이에요.</p>';
 try{var me=await api('/auth/v1/user'),ok=await api('/rest/v1/rpc/fc_is_teacher',{method:'POST',body:'{}'});
  $('#who').innerHTML=esc(me.email)+' · <a href="#" id="out">로그아웃</a>';$('#out').onclick=function(e){e.preventDefault();logout()};
  if(!ok){app.innerHTML='<h1>볼 수 있는 기록이 없어요</h1><p>'+esc(me.email)+' 계정은 선생님 목록에 없어요. 원장님께 등록을 부탁해 주세요.</p>';return}
  var L=await api('/rest/v1/fc_learners?select=*&course=eq.'+C.course+'&order=created_at.desc'),S=await api('/rest/v1/fc_submissions?select=*&order=created_at.asc');
  data={L:L,S:S};route()}catch(e){if(e==='auth')return login();app.innerHTML='<p>기록을 불러오지 못했어요. ('+esc(e)+')</p><button id="re">다시 시도</button>';$('#re').onclick=start}}
window.addEventListener('hashchange',function(){if(data)route()});
function route(){var m=location.hash.match(/^#\/s\/(.+)$/);window.scrollTo(0,0);m?detail(m[1]):list()}
function subsOf(id){return data.S.filter(function(s){return s.learner_id===id})}
function isTest(l){return /^TEST_/i.test(l.student_name||'')||l.source==='TEST_grokbot'}
function dots(ss){var d='';for(var n=1;n<=5;n++){var done=ss.some(function(s){return s.kind==='done'&&s.day===n}),any=ss.some(function(s){return s.day===n});d+=done?'<b>'+n+'</b>':(any?n:'·')}return d}
function list(){var L=data.L.filter(function(l){return !hideTest||!isTest(l)});
 var h='<h1>학생 기록</h1><div class="row"><label class="chk" style="margin:0"><input type="checkbox" id="ht" '+(hideTest?'checked':'')+'>테스트 기록 숨기기</label><button id="rf">새로고침</button></div>';
 h+='<p class="mut">진도: 굵은 숫자는 그날을 끝낸 것, 보통 숫자는 시작만 한 것이에요.</p>';
 if(!L.length)h+='<p>아직 기록이 없어요.</p>';else{h+='<table class="tbl"><tr><th>이름</th><th>학년</th><th class="hide-s">동의</th><th>최근 활동</th><th>진도</th></tr>';
  L.forEach(function(l){var ss=subsOf(l.id),last=ss.length?ss[ss.length-1].created_at:l.created_at;
   h+='<tr class="l" data-id="'+l.id+'"><td>'+esc(l.student_name)+'</td><td>'+esc(l.school_grade||'-')+'</td><td class="hide-s">'+t(l.consent_at)+'</td><td>'+t(last)+'</td><td class="dd">'+dots(ss)+'</td></tr>'});h+='</table>'}
 app.innerHTML=h;$('#ht').onchange=function(){hideTest=this.checked;list()};$('#rf').onclick=start;
 app.querySelectorAll('tr.l').forEach(function(r){r.onclick=function(){location.hash='#/s/'+r.dataset.id}})}
function wc(p){if(!p||!p.ans)return '';var W=K.word_check.items;return '<p class="mut">'+W.map(function(i){var v=p.ans[i.word];return v===undefined?'':(v?i.word:'<s>'+esc(i.word)+'</s>')}).filter(Boolean).join(' · ')+'</p>'}
async function detail(id){var l=data.L.find(function(x){return x.id===id});if(!l)return list();var ss=subsOf(id);
 var h='<p class="sub"><a href="#/">← 목록</a></p><h1>'+esc(l.student_name)+'</h1>';
 h+='<p class="kv"><span>학년</span>'+esc(l.school_grade||'-')+'</p><p class="kv"><span>보호자 연락처</span>'+esc(l.parent_phone||'-')+'</p><p class="kv"><span>동의</span>개인정보 '+(l.consent_privacy?'예':'아니요')+' · 보호자 '+(l.consent_guardian?'예':'아니요')+' · '+t(l.consent_at)+'</p><p class="kv"><span>등록</span>'+t(l.created_at)+'</p>';
 var pre=ss.filter(function(s){return s.kind==='pretest'}).pop(),post=ss.filter(function(s){return s.kind==='posttest'}).pop();
 h+='<h2>단어 점검</h2><p class="kv"><span>시작 전</span>'+(pre?pre.payload.score+' / 15 · '+t(pre.created_at):'아직 안 했어요')+'</p>'+(pre?wc(pre.payload):'')+'<p class="kv"><span>끝난 뒤</span>'+(post?post.payload.score+' / 15 · '+t(post.created_at):'아직 안 했어요')+'</p>'+(post?wc(post.payload):'');
 for(var n=1;n<=5;n++){var D=DAYS[n],ds=ss.filter(function(s){return s.day===n});h+='<h2>'+n+'일 차 · '+esc(D?D.title:'')+'</h2>';
  if(!ds.length){h+='<p class="mut">기록 없음</p>';continue}
  ds.forEach(function(s){var p=s.payload||{};
   if(s.kind==='answer'){var q=D&&D.questions[p.q||0];h+='<p class="kv"><span>문제</span>'+(p.correct?'처음에 맞혔어요':'처음엔 틀렸어요')+' (고른 답 '+esc(p.pick)+(q?', 정답 '+esc(q.정답):'')+') · '+t(s.created_at)+'</p>'}
   else if(s.kind==='done'){h+='<p class="kv"><span>마침</span>'+t(s.created_at)+' · 맞힌 문제 '+(p.correct||0)+'/'+(p.total||1)+(p.clues?' · 모은 단서 '+p.clues.length+'개':'')+'</p>'}
   else if(s.kind==='recording'){h+='<p class="kv"><span>녹음</span>'+esc(p.speaker||'')+' 대사 · '+t(s.created_at)+'</p>'+(s.audio_path?'<audio controls preload="none" data-path="'+esc(s.audio_path)+'"></audio>':'')}})}
 h+='<p class="mut" style="margin-top:28px">이야기 속 \'지금 무슨 일이?\' 안내는 읽기 도움이라 따로 기록하지 않아요.</p>';
 app.innerHTML=h;
 var au=app.querySelectorAll('audio[data-path]');for(var i=0;i<au.length;i++){try{var r=await api('/storage/v1/object/sign/'+C.bucket+'/'+au[i].dataset.path.split('/').map(encodeURIComponent).join('/'),{method:'POST',body:JSON.stringify({expiresIn:3600})});au[i].src=C.url+'/storage/v1'+r.signedURL}catch(e){au[i].insertAdjacentHTML('afterend','<p class="mut">녹음을 불러오지 못했어요.</p>')}}}
start();
})();
