/* Imagens em assets/. As chaves sao usadas pelo jogo: b = banana por fase,
   m = poses do Bento, s1-s8 = cenas da historia, s9-s13 = cenario de cada fase. */
const IMG={
 b0:"assets/bananas/nanica.webp",
 b1:"assets/bananas/prata.webp",
 b2:"assets/bananas/maca.webp",
 b3:"assets/bananas/dourada.webp",
 b4:"assets/bananas/cosmica.webp",
 m0:"assets/bento/andando.webp",
 m1:"assets/bento/correndo.webp",
 m2:"assets/bento/comendo.webp",
 m3:"assets/bento/feliz.webp",
 s1:"assets/historia/cena-1.webp",
 s2:"assets/historia/cena-2.webp",
 s3:"assets/historia/cena-3.webp",
 s4:"assets/historia/cena-4.webp",
 s5:"assets/historia/cena-5.webp",
 s6:"assets/historia/cena-6.webp",
 s7:"assets/historia/cena-7.webp",
 s8:"assets/historia/cena-8.webp",
 s9:"assets/cenarios/fase-1.webp",
 s10:"assets/cenarios/fase-2.webp",
 s11:"assets/cenarios/fase-3.webp",
 s12:"assets/cenarios/fase-4.webp",
 s13:"assets/cenarios/fase-5.webp"
};
/* pre-carrega para nao piscar ao trocar de fase ou de cena */
Object.keys(IMG).forEach(function(k){new Image().src=IMG[k]});
var $=function(i){return document.getElementById(i)};
var CS=[
 {i:"s1",k:"kin",d:6000,t:"Houve um tempo em que a floresta era farta."},
 {i:"s2",k:"kl",d:5400,t:"Então veio a seca. Os rios encolheram. As frutas sumiram."},
 {i:"s3",k:"kin",d:5400,t:"Bento era só um filhote. Fazia dias que não comia."},
 {i:"s4",k:"kr",d:5000,t:"Tudo o que encontrava eram restos queimados."},
 {i:"s5",k:"kin",d:5400,t:"Quando a chuva finalmente veio, não trouxe comida."},
 {i:"s6",k:"kout",d:5400,t:"Sem nada a perder, ele seguiu em frente."},
 {i:"s7",k:"kin",d:5600,t:"Até que, no meio da mata, um cacho de bananas brilhou."},
 {i:"s8",k:"kout",d:6200,t:"Agora elas são suas. Mas Bento também as viu."}
];
var LV=[
 {n:"Banana Nanica",g:30,t:15,m:"Clique para começar!"},
 {n:"Banana Prata",g:100,t:20,m:"Ela está brilhando mais…"},
 {n:"Banana Maçã",g:300,t:25,m:"Cheirinho de maçã. Bento sentiu."},
 {n:"Banana Dourada",g:800,t:30,m:"Ouro puro. Ele está salivando."},
 {n:"Banana Cósmica",g:2000,t:35,m:"A última. Aguente firme!"}
];
var UP=[
 {id:"luva",nome:"Luva",desc:"+1 por clique",base:15,mult:1.6},
 {id:"faz",nome:"Fazendeiro",desc:"+1 por segundo",base:40,mult:1.7},
 {id:"esp",nome:"Espantalho",desc:"+3s de tempo",base:60,mult:2.2}
];
var S={lvl:0,prog:0,coins:0,own:{luva:0,faz:0,esp:0},left:0,total:0,run:false,over:false};

/* ---------- som (gerado no navegador) ---------- */
var AC=null,master,droneG=[],rainG,muted=false;
function audioInit(){
  if(AC)return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=.8;master.connect(AC.destination);
    [55,82.5,110.4].forEach(function(f,i){
      var o=AC.createOscillator(),g=AC.createGain();o.type="sine";o.frequency.value=f;
      g.gain.value=0;o.connect(g);g.connect(master);o.start();droneG.push([g,.07/(i+1)]);
    });
    var len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);
    for(var k=0;k<len;k++)d[k]=Math.random()*2-1;
    var n=AC.createBufferSource();n.buffer=buf;n.loop=true;
    var hp=AC.createBiquadFilter();hp.type="highpass";hp.frequency.value=2200;
    rainG=AC.createGain();rainG.gain.value=0;n.connect(hp);hp.connect(rainG);rainG.connect(master);n.start();
  }catch(e){AC=null}
}
function drone(v){if(!AC)return;droneG.forEach(function(p){p[0].gain.linearRampToValueAtTime(p[1]*v,AC.currentTime+1.5)})}
function rain(v){if(!AC)return;rainG.gain.linearRampToValueAtTime(v,AC.currentTime+1.5)}
function blip(f,dur,type,vol){
  if(!AC)return;
  var o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
  o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+dur);
}
$("mute").addEventListener("click",function(){
  muted=!muted;if(master)master.gain.value=muted?0:.8;this.textContent=muted?"Som: desligado":"Som: ligado";
});

/* ---------- telas ---------- */
function show(id){["intro","cine","title","game"].forEach(function(s){$(s).classList.toggle("on",s===id)})}
$("introbg").style.backgroundImage="url("+IMG.s1+")";

/* ---------- cutscene ---------- */
var T=null,ci=0,side=0,subT=[];
function playCine(){audioInit();show("cine");ci=0;drone(1);nextShot()}
function nextShot(){
  var sub=$("sub");
  if(ci>=CS.length){sub.style.opacity=0;rain(0);T=setTimeout(showTitle,900);return}
  var c=CS[ci],A=[$("shA"),$("shB")],n=side^1,d=A[n];
  d.className="shot";d.style.backgroundImage="url("+IMG[c.i]+")";void d.offsetWidth;
  d.className="shot on "+c.k;
  A[side].classList.remove("on");side=n;
  rain(ci===4||ci===5?.35:0);
  sub.style.opacity=0;
  subT.push(setTimeout(function(){sub.textContent=c.t;sub.style.opacity=1},900));
  subT.push(setTimeout(function(){sub.style.opacity=0},c.d-700));
  ci++;T=setTimeout(nextShot,c.d);
}
function stopCine(){clearTimeout(T);subT.forEach(clearTimeout);subT=[];rain(0)}
$("watch").addEventListener("click",playCine);
$("skipIntro").addEventListener("click",function(){audioInit();showTitle()});
$("skip").addEventListener("click",function(){stopCine();showTitle()});

/* ---------- API (backend via nginx em /api) ---------- */
var API="/api",NAME_RE=/^[A-Za-z0-9_]{3,20}$/,MAXC=500,MAXB=50000;
var me=null,pend={c:0,b:0},syncing=false;
try{me=localStorage.getItem("bv_user")}catch(e){}
if(me&&!NAME_RE.test(me))me=null;
if(me)$("username").value=me;
function api(path,opt){
  opt=opt||{};
  return fetch(API+path,{method:opt.method||"GET",headers:{"Content-Type":"application/json"},body:opt.body?JSON.stringify(opt.body):undefined})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()});
}
function takeBatch(){
  var c=Math.min(pend.c,MAXC),b=Math.min(Math.floor(pend.b),MAXB);
  if(!me||(c<=0&&b<=0))return null;
  pend.c-=c;pend.b-=b;return {clicks:c,bananas:b};
}
function flush(){
  if(syncing)return Promise.resolve();
  var body=takeBatch();if(!body)return Promise.resolve();
  syncing=true;
  return api("/players/"+me+"/progress",{method:"POST",body:body})
    .catch(function(){pend.c+=body.clicks;pend.b+=body.bananas})
    .then(function(){syncing=false});
}
setInterval(flush,5000);
document.addEventListener("visibilitychange",function(){
  if(document.visibilityState!=="hidden"||!navigator.sendBeacon)return;
  var body=takeBatch();if(!body)return;
  var ok=navigator.sendBeacon(API+"/players/"+me+"/progress",new Blob([JSON.stringify(body)],{type:"application/json"}));
  if(!ok){pend.c+=body.clicks;pend.b+=body.bananas}
});
function loadRank(id){
  var el=$(id);
  el.innerHTML="<h3>Ranking de colheita</h3><span class='empty'>Carregando…</span>";
  flush().then(function(){return api("/leaderboard?limit=10")}).then(function(rows){
    var h="<h3>Ranking de colheita</h3>";
    if(!rows.length){el.innerHTML=h+"<span class='empty'>Ninguém colheu ainda. Seja o primeiro!</span>";return}
    var ol=document.createElement("ol");
    rows.forEach(function(r,i){
      var li=document.createElement("li");if(r.username===me)li.className="me";
      var a=document.createElement("span");a.textContent=(i+1)+". "+r.username;
      var b=document.createElement("span");b.textContent=r.bananas.toLocaleString("pt-BR")+" 🍌";
      li.appendChild(a);li.appendChild(b);ol.appendChild(li);
    });
    el.innerHTML=h;el.appendChild(ol);
  }).catch(function(){el.innerHTML="<h3>Ranking de colheita</h3><span class='empty'>Ranking indisponível no momento.</span>"});
}
function showTitle(){show("title");loadRank("rankTitle")}
$("nameForm").addEventListener("submit",function(e){
  e.preventDefault();
  var v=$("username").value.trim();
  if(!NAME_RE.test(v)){$("nameErr").textContent="Use de 3 a 20 letras, números ou _.";$("username").focus();return}
  $("nameErr").textContent="";
  if(v!==me){flush();pend={c:0,b:0}}
  me=v;try{localStorage.setItem("bv_user",v)}catch(e){}
  api("/players",{method:"POST",body:{username:v}}).catch(function(){});
  audioInit();startGame();
});

/* ---------- jogo ---------- */
var gl=0;
function setGbg(i){
  var A=[$("gb1"),$("gb2")],n=gl^1;
  A[n].style.backgroundImage="url("+IMG["s"+(9+i)]+")";
  A[n].classList.add("on");A[gl].classList.remove("on");gl=n;
}
function cost(u){return Math.ceil(UP[u].base*Math.pow(UP[u].mult,S.own[UP[u].id]))}

/* Bento: animacao procedural (passos, balanco, perspectiva, salto) */
var M={x:112,mode:"in",phase:0,t0:0,fx:112,pose:0,run:false,done:false,step:0};
["m0","m1","m2"].forEach(function(k,i){$("mk"+i).src=IMG[k]});
function pose(p){M.pose=p;for(var i=0;i<3;i++)$("mk"+i).style.opacity=i===p?1:0}
function resetMonkey(){M.mode="in";M.x=112;M.run=false;M.done=false;M.phase=0;M.step=0;pose(0)}
var lastT=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  var dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(!$("game").classList.contains("on"))return;
  var W=$("stage").clientWidth,mon=$("monkey"),sh=$("mshadow");
  var y=0,rot=0,sx=1,sy=1,sc=1;
  if(M.mode==="in"){
    var d=(S.run&&!S.over)?1-S.left/S.total:0,tgt=112;
    if(d>.6)tgt=104-(d-.6)/.4*50;
    M.x+=(tgt-M.x)*(1-Math.exp(-dt*3));
    var prog=Math.max(0,Math.min(1,(d-.6)/.4));
    sc=.62+.4*prog;
    var run=d>.88;
    if(run!==M.run){M.run=run;pose(run?1:0)}
    if(M.x<109){
      M.phase+=dt*(run?4.4:2.4);
      var s=Math.abs(Math.sin(M.phase*Math.PI));
      y=-s*(run?14:7)*sc;
      rot=Math.sin(M.phase*Math.PI)*(run?3:2);
      sy=.98+.04*s;sx=1.02-.04*s;
      var st=Math.floor(M.phase);
      if(st!==M.step){M.step=st;if(M.x<100)blip(70,.07,"sine",.05+.07*prog)}
    }
  }else if(M.mode==="lunge"){
    var k=Math.min(1,(now-M.t0)/550),e=k*k*(3-2*k);
    M.x=M.fx+(50-M.fx)*e;
    y=-Math.sin(Math.PI*k)*70;
    sc=1.02+.12*Math.sin(Math.PI*k);
    rot=-8*(1-k);
    if(k>=1){
      M.mode="eat";M.t0=now;$("banana").classList.add("bite");
      [0,300,600,900].forEach(function(t){setTimeout(function(){blip(140+Math.random()*40,.14,"square",.16)},t)});
    }
  }else if(M.mode==="eat"){
    var t=(now-M.t0)/1000;
    sc=1.02;
    y=-Math.abs(Math.sin(t*Math.PI*5))*5;
    sy=1+.03*Math.sin(t*Math.PI*10);
    if(t>1.35&&M.pose!==2)pose(2);
    if(t>3&&!M.done){M.done=true;showLose()}
  }
  mon.style.transform="translate3d("+(M.x/100*W-mon.offsetWidth/2)+"px,"+y+"px,0) rotate("+rot+"deg) scale("+(sx*sc)+","+(sy*sc)+")";
  sh.style.transform="translate3d("+(M.x/100*W-sh.offsetWidth/2)+"px,0,0) scale("+sc+")";
  sh.style.opacity=M.x<108?1:0;
}
requestAnimationFrame(frame);

function setLevel(){
  var L=LV[S.lvl];
  S.prog=0;S.run=false;S.over=false;
  S.total=L.t+S.own.esp*3;S.left=S.total;
  $("lvlname").textContent=L.n;
  $("bimg").src=IMG["b"+S.lvl];
  $("banana").className=S.lvl===4?"cos":"";
  setGbg(S.lvl);
  $("msg").textContent=L.m;$("msg").style.opacity=1;
  resetMonkey();
  render();
}
function startGame(){
  stopCine();$("end").classList.remove("on");show("game");drone(.3);setLevel();
}
function render(){
  var L=LV[S.lvl];
  $("coins").textContent="Bananas: "+Math.floor(S.coins);
  $("plab").textContent=Math.floor(S.prog)+" / "+L.g;
  $("prog").querySelector("i").style.width=Math.min(100,S.prog/L.g*100)+"%";
  $("tlab").textContent=S.left.toFixed(1)+"s";
  var tb=$("time");tb.querySelector("i").style.width=(S.left/S.total*100)+"%";
  tb.classList.toggle("low",S.left/S.total<.4);
  UP.forEach(function(u,i){var b=$("up"+i);b.disabled=S.coins<cost(i);b.querySelector(".c").textContent="Custa "+cost(i)});
}
function buy(i){
  var c=cost(i);if(S.coins<c||S.over)return;
  S.coins-=c;S.own[UP[i].id]++;
  if(UP[i].id==="esp"){S.total+=3;S.left+=3}
  blip(660,.12,"triangle",.12);render();
}
UP.forEach(function(u,i){
  var b=document.createElement("button");b.className="up";b.id="up"+i;
  b.innerHTML='<span class="k">'+(i+1)+'</span>'+u.nome+"<small>"+u.desc+"</small><small class='c'></small>";
  b.addEventListener("click",function(){buy(i);this.blur()});
  $("shop").appendChild(b);
});
function hit(cx,cy){
  if(S.over)return;
  if(!S.run){S.run=true;$("msg").style.opacity=0}
  var p=1+S.own.luva;S.prog+=p;S.coins+=p;pend.c++;pend.b+=p;
  blip(480+Math.random()*220,.07,"triangle",.1);
  var r=$("stage").getBoundingClientRect();
  if(cx==null){var b=$("banana").getBoundingClientRect();cx=b.left+b.width/2;cy=b.top+b.height/2}
  var f=document.createElement("span");f.className="pop";f.textContent="+"+p;
  f.style.left=(cx-r.left)+"px";f.style.top=(cy-r.top)+"px";
  $("stage").appendChild(f);setTimeout(function(){f.remove()},700);
  check();render();
}
$("banana").addEventListener("click",function(e){hit(e.clientX,e.clientY);this.blur()});
document.addEventListener("keydown",function(e){
  if(!$("game").classList.contains("on")||$("end").classList.contains("on")||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  var k=e.key;
  if(k==="1"||k==="2"||k==="3"){e.preventDefault();buy(+k-1)}
  else if(k===" "||k==="Enter"){
    e.preventDefault();var b=$("banana");b.classList.add("press");
    setTimeout(function(){b.classList.remove("press")},80);hit();
  }
});
function check(){
  if(S.over)return;
  if(S.prog>=LV[S.lvl].g){
    if(S.lvl===4){S.over=true;S.run=false;win();return}
    S.lvl++;setLevel();flush();
    $("msg").textContent="Evoluiu! "+LV[S.lvl].n;$("msg").style.opacity=1;
    [523,659,784].forEach(function(f,i){setTimeout(function(){blip(f,.25,"triangle",.14)},i*110)});
  }
}
setInterval(function(){
  if(!S.run||S.over)return;
  S.left-=.1;
  var a=S.own.faz*.1;S.prog+=a;S.coins+=a;pend.b+=a;
  check();if(S.over)return;
  if(S.left<=0){S.left=0;lose()}
  render();
},100);
function endScreen(bg,title,text,btn,fn,img){
  $("end").style.backgroundImage="linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.82)),url("+IMG[bg]+")";
  $("eimg").src=IMG[img];$("etitle").textContent=title;$("etext").textContent=text;$("ebtn").textContent=btn;$("ebtn").onclick=fn;
  $("end").classList.add("on");
  loadRank("rankEnd");
}
function lose(){
  S.over=true;S.run=false;
  M.mode="lunge";M.t0=performance.now();M.fx=M.x;pose(1);
  $("msg").textContent="Bento comeu sua banana…";$("msg").style.opacity=1;
}
function showLose(){
  var drop=S.lvl>0;
  endScreen("s2","Nhac!",drop?"Bento devorou sua "+LV[S.lvl].n+". Você volta uma evolução, mas mantém seus upgrades.":"Bento devorou sua banana. Seus upgrades continuam com você.","Tentar de novo",function(){
    if(drop)S.lvl--;$("end").classList.remove("on");setLevel();
  },"m2");
}
function win(){
  setTimeout(function(){
    [523,659,784,1047].forEach(function(f,i){setTimeout(function(){blip(f,.4,"triangle",.14)},i*150)});
    endScreen("s1","A floresta floresceu","Você entregou a Banana Cósmica. Bento comeu, sorriu, e as árvores voltaram a dar frutos. Ninguém mais passa fome.","Jogar de novo",function(){
      S.lvl=0;S.coins=0;S.own={luva:0,faz:0,esp:0};$("end").classList.remove("on");setLevel();
    },"m3");
  },900);
}
