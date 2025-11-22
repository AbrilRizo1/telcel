(function(){
  'use strict';
  
  let LIFE_COUNT=10, START_TIME=20, COOKIE_SPEED=1.0, WIN_SCORE=200, MAX_COOKIES=6;
  const POINTS_PER_COOKIE=10;
  
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  let W=0,H=0;
  
  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();
    W=canvas.width=Math.floor(rect.width);
    H=canvas.height=Math.floor(rect.height);
    adjustBasketSize();
  }
  window.addEventListener('resize',resize);
  
  let score=0, lives=LIFE_COUNT, timeLeft=START_TIME, running=false, lastTime=0;
  const cookies=[];
  const basket={x:100,y:0,w:160,h:90,speed:12};

  // 6 imágenes de galletas
  const imgSources = ['basket.png','cookie1.png','cookie2.png','cookie3.png','cookie4.png','cookie5.png','cookie6.png'];
  const images={};
  imgSources.forEach(src=>{ const img=new Image(); img.src=src; images[src]=img; });
  
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function spawnCookie(){ 
    if(W<=0) return; 
    const size=Math.round(rand(36,78)); 
    const x=rand(size/2,W-size/2); 
    const speed=rand(1.2,4.5)*COOKIE_SPEED; 
    const which=Math.floor(rand(1,7)); // 1 a 6
    const img=images['cookie'+which+'.png']; 
    cookies.push({x,y:-size,vy:speed,size,img}); 
  }
  
  let pointerX=null,left=false,right=false, tiltX=null;
  
  window.addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); pointerX=e.clientX-r.left; });
  canvas.addEventListener('mouseleave', ()=>{ pointerX=null; });
  window.addEventListener('touchmove', e=>{ const t=e.touches[0]; const r=canvas.getBoundingClientRect(); if(t) pointerX=t.clientX-r.left; }, {passive:false});
  window.addEventListener('touchstart', e=>{ const t=e.touches[0]; const r=canvas.getBoundingClientRect(); if(t) pointerX=t.clientX-r.left; }, {passive:false});
  window.addEventListener('touchend', ()=>{ pointerX=null; });
  window.addEventListener('touchcancel', ()=>{ pointerX=null; });
  window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft') left=true; if(e.key==='ArrowRight') right=true; });
  window.addEventListener('keyup', e=>{ if(e.key==='ArrowLeft') left=false; if(e.key==='ArrowRight') right=false; });
  window.addEventListener('deviceorientation', e=>{ if(e.gamma!==null){ const sensitivity=0.7; tiltX = W/2 + (e.gamma/45)*(W/2)*sensitivity; } });
  
  const scoreEl=document.getElementById('score'), livesEl=document.getElementById('lives'), timeEl=document.getElementById('time');
  function updateHUD(){ if(scoreEl) scoreEl.textContent=score; if(livesEl) livesEl.textContent=lives; if(timeEl) timeEl.textContent=Math.ceil(timeLeft); }
  
  const startBtn=document.getElementById('startBtn'), resetBtn=document.getElementById('resetBtn');
  if(startBtn) startBtn.addEventListener('click',()=>{
    if(levelModal.style.display !== 'none'){
      levelModal.style.display='flex'; // mostrar modal si no se eligió nivel
    } else if(!running){
      startGame();
    }
  });
  if(resetBtn) resetBtn.addEventListener('click', resetGame);
  
  function startGame(){ 
    if(running) return; 
    score=0;lives=LIFE_COUNT;timeLeft=START_TIME;cookies.length=0;
    running=true;lastTime=performance.now();resize();adjustBasketSize(); 
    for(let i=0;i<3;i++) spawnCookie(); 
    requestAnimationFrame(loop); 
  }
  
  function resetGame(){ 
    running=false; score=0; lives=LIFE_COUNT; timeLeft=START_TIME; cookies.length=0; 
    updateHUD(); clearScreen(); 
  }
  
  function clearScreen(){ ctx.clearRect(0,0,W,H); }
  
  function adjustBasketSize(){
    basket.w=Math.max(110,Math.min(220,W*0.18));
    if(W<500) basket.w=Math.max(80,W*0.25);
    basket.h=Math.max(60,basket.w*0.55);
    basket.y=H-basket.h-12;
    basket.x=Math.max(8,Math.min(W-basket.w-8,basket.x));
  }
  
  function loop(ts){
    if(!running) return;
    const dt=Math.min(0.05,(ts-lastTime)/1000); lastTime=ts; timeLeft-=dt;
  
    if(score>=WIN_SCORE){ running=false; showEnd('¡Ganaste!'); return; }
    if(timeLeft<=0){ running=false; showEnd('Tiempo terminado'); return; }
  
    const progress=Math.max(0,(START_TIME-timeLeft)/START_TIME);
    const spawnProb=0.02+Math.min(0.06,progress*0.06);
    if(cookies.length<MAX_COOKIES && Math.random()<spawnProb) spawnCookie();
  
    basket.y=H-basket.h-12;
    if(tiltX!==null) pointerX += (tiltX-(basket.x+basket.w/2))*0.1;
    if(pointerX!==null){ basket.x+=(pointerX-(basket.x+basket.w/2))*0.25; } else { if(left) basket.x-=basket.speed; if(right) basket.x+=basket.speed; }
    basket.x=Math.max(8,Math.min(W-basket.w-8,basket.x));
  
    for(let i=cookies.length-1;i>=0;i--){
      const c=cookies[i]; c.y+=c.vy+dt*60*c.vy*0.12;
      if(c.y+c.size/2>=basket.y){ 
        const cx=c.x; 
        if(cx>basket.x && cx<basket.x+basket.w){ score+=POINTS_PER_COOKIE; } else { lives-=1; } 
        cookies.splice(i,1); 
        if(lives<=0){ running=false; showEnd('Juego terminado'); return; } 
        continue; 
      }
      if(c.y>H+200) cookies.splice(i,1);
    }
  
    ctx.clearRect(0,0,W,H);
    for(const c of cookies){ 
      if(c.img && c.img.complete){ ctx.drawImage(c.img,c.x-c.size/2,c.y-c.size/2,c.size,c.size); } 
      else { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(c.x,c.y,c.size/2,0,Math.PI*2); ctx.fill(); } 
    }
    const basketImg=images['basket.png']; 
    if(basketImg && basketImg.complete){ ctx.drawImage(basketImg,basket.x,basket.y,basket.w,basket.h); } 
    else { ctx.fillStyle='#5a2'; ctx.fillRect(basket.x,basket.y,basket.w,basket.h); }
  
    updateHUD();
    requestAnimationFrame(loop);
  }
  
  function showEnd(text){
    updateHUD();
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.font='28px sans-serif'; ctx.textAlign='center';
    ctx.fillText(text,W/2,H/2-16);
    ctx.font='22px sans-serif'; ctx.fillText('Puntuación: '+score,W/2,H/2+20);
  }
  
  function init(){ resize(); updateHUD(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  
  // Modal niveles
  const levelModal=document.getElementById('levelModal');
  levelModal.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      COOKIE_SPEED=parseFloat(btn.dataset.speed);
      MAX_COOKIES = 6; // siempre 6 galletas
      WIN_SCORE=parseInt(btn.dataset.win);
      levelModal.style.display='none';
      startGame(); // inicia automáticamente al elegir nivel
    });
  });
})();
