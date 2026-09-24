(() => {
  'use strict';
  const q = new URLSearchParams(location.search);
  let room = (q.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
  let player = Number(q.get('player') || sessionStorage.getItem('o2olRemotePlayer') || 0);
  let ws = null, state = null, pendingRemoteDraw = null, suppress = false;
  const nativeFetch = window.fetch.bind(window);

  const css = document.createElement('style');
  css.textContent = `#o2olRemote{position:fixed;right:12px;bottom:12px;z-index:99999;font-family:system-ui,sans-serif}#o2olRemote button{border:0;border-radius:999px;padding:11px 15px;font-weight:800;background:#8b1d4b;color:#fff;box-shadow:0 5px 18px #0003}#o2olRemotePanel{display:none;width:min(92vw,350px);background:#fff;color:#242424;border:1px solid #ddd;border-radius:18px;padding:16px;box-shadow:0 12px 35px #0004;margin-bottom:8px}#o2olRemotePanel.open{display:block}#o2olRemotePanel input,#o2olRemotePanel select{width:100%;box-sizing:border-box;padding:10px;margin:5px 0 10px;border:1px solid #bbb;border-radius:9px;font-size:16px}#o2olRemotePanel .row{display:flex;gap:8px}#o2olRemotePanel .row button{flex:1;border-radius:10px}.o2ol-status{font-size:13px;margin:8px 0}.o2ol-code{font-size:22px;font-weight:900;letter-spacing:2px}.o2ol-turn{font-weight:900;color:#8b1d4b}`;
  document.head.appendChild(css);

  const root = document.createElement('div'); root.id='o2olRemote';
  root.innerHTML=`<div id="o2olRemotePanel"><div style="font-size:19px;font-weight:900">Play Together by Phone</div><p style="font-size:13px;margin:6px 0 12px">Stay on your normal phone call while the game keeps every device on the same turn and card.</p><div id="o2olSetup"><label>Players</label><select id="o2olCount"><option>2</option><option>3</option><option>4</option></select><div class="row"><button id="o2olCreate">Create Game</button><button id="o2olJoinShow">Join Game</button></div><div id="o2olJoinBox" style="display:none;margin-top:8px"><input id="o2olCodeInput" maxlength="8" placeholder="Game code"><button id="o2olJoin">Join</button></div></div><div id="o2olLive" style="display:none"><div>Game code</div><div class="o2ol-code" id="o2olCode"></div><div class="o2ol-status" id="o2olStatus"></div><label>I am</label><select id="o2olPlayer"></select><button id="o2olShare" style="width:100%;border-radius:10px">Share Invite</button><div class="o2ol-status">Current turn: <span class="o2ol-turn" id="o2olTurn">—</span></div></div></div><button id="o2olToggle">☎ Play by Phone</button>`;
  document.body.appendChild(root);
  const $=id=>document.getElementById(id);
  $('o2olToggle').onclick=()=>$('o2olRemotePanel').classList.toggle('open');
  $('o2olJoinShow').onclick=()=>{$('o2olJoinBox').style.display='block'};

  function setLive(code,count){room=code;$('o2olSetup').style.display='none';$('o2olLive').style.display='block';$('o2olCode').textContent=room;const s=$('o2olPlayer');s.innerHTML='';for(let i=1;i<=count;i++){const o=document.createElement('option');o.value=i;o.textContent='Player '+i;s.appendChild(o)};if(!player)player=1;s.value=String(Math.min(player,count));player=Number(s.value);sessionStorage.setItem('o2olRemotePlayer',String(player));s.onchange=()=>{player=Number(s.value);sessionStorage.setItem('o2olRemotePlayer',String(player));send({type:'claim',player})};connect();}
  async function create(){const count=Number($('o2olCount').value);const r=await nativeFetch('/api/room/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({playerCount:count})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not create game');player=1;history.replaceState(null,'',location.pathname+'?room='+d.code+'&player=1');setLive(d.code,count)}
  async function join(){const code=$('o2olCodeInput').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(!code)return;const r=await nativeFetch('/api/room/'+code);const d=await r.json();if(!r.ok)throw new Error(d.error||'Game not found');player=1;history.replaceState(null,'',location.pathname+'?room='+code+'&player=1');setLive(code,d.playerCount||2)}
  $('o2olCreate').onclick=()=>create().catch(e=>alert(e.message));$('o2olJoin').onclick=()=>join().catch(e=>alert(e.message));
  $('o2olShare').onclick=async()=>{const url=location.origin+location.pathname+'?room='+room;const data={title:'One2OneLove Relationship Game',text:'Join my One2OneLove game. Code: '+room,url};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(url);alert('Invite link copied.')}}catch{}};

  function connect(){if(!room)return;const proto=location.protocol==='https:'?'wss:':'ws:';ws=new WebSocket(proto+'//'+location.host+'/api/room/'+room+'/ws?player='+player);ws.onopen=()=>{status('Connected');send({type:'claim',player})};ws.onclose=()=>{status('Reconnecting…');setTimeout(connect,1500)};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='state'){state=m.state;renderState();if(pendingRemoteDraw&&state.card){pendingRemoteDraw(state.card);pendingRemoteDraw=null}}if(m.type==='advance'&&m.by!==player){autoAdvance()}}}
  function send(x){if(ws&&ws.readyState===1)ws.send(JSON.stringify(x))}
  function status(x){$('o2olStatus').textContent=x}
  function renderState(){if(!state)return;$('o2olTurn').textContent='Player '+(state.turn||1);status((state.connected||0)+' connected • '+(state.playerCount||2)+' players')}
  function autoAdvance(){const deck=document.getElementById('deck');if(deck){suppress=true;deck.click();setTimeout(()=>suppress=false,200)}}

  // Intercept question draws before the main game receives them. The active player draws from Neon;
  // other players receive that exact payload from the room, so every phone shows the same card.
  window.fetch=async function(input,init){const url=typeof input==='string'?input:(input&&input.url)||'';if(room&&url.includes('/api/draw')){if(state&&state.turn&&state.turn!==player){return new Promise(resolve=>{pendingRemoteDraw=card=>resolve(new Response(JSON.stringify(card),{status:200,headers:{'content-type':'application/json'}}));send({type:'request-card',player})})}const r=await nativeFetch(input,init);const clone=r.clone();if(r.ok)clone.json().then(card=>send({type:'card',player,card})).catch(()=>{});return r}return nativeFetch(input,init)};

  // Existing game uses deck clicks for Next Card. Observe clicks and tell the room to advance turns.
  document.addEventListener('click',e=>{if(!room||suppress)return;const deck=e.target&&e.target.closest&&e.target.closest('#deck');if(deck&&state&&state.turn===player)setTimeout(()=>send({type:'advance',player}),50)},true);

  if(room){nativeFetch('/api/room/'+room).then(r=>r.json().then(d=>{if(r.ok){player=player||1;setLive(room,d.playerCount||2)}else{room=''}})).catch(()=>{});}
})();