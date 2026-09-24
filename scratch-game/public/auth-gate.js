(() => {
  const state = { user:null, gameSessionId:null };

  const css = `
  .o2ol-auth-overlay{position:fixed;inset:0;z-index:10000;background:linear-gradient(145deg,#bcded7,#f0cbd5);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}
  .o2ol-auth-card{width:min(520px,96vw);background:#fff;border-radius:28px;padding:26px;box-shadow:0 18px 50px rgba(15,38,55,.22);font-family:Arial,Helvetica,sans-serif;color:#183047}
  .o2ol-auth-card h1{font-size:30px;margin:0 0 8px;text-align:center;color:#0a3f72}
  .o2ol-auth-card .beta{text-align:center;font-weight:800;color:#d61f32;margin-bottom:8px}
  .o2ol-auth-card .lead{text-align:center;color:#617281;line-height:1.45;margin-bottom:18px}
  .o2ol-auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:#eef3f6;border-radius:999px;padding:4px;margin-bottom:18px}
  .o2ol-auth-tabs button{border:0;border-radius:999px;padding:10px;font-weight:800;background:transparent;color:#4f6472;cursor:pointer}
  .o2ol-auth-tabs button.active{background:#0a3f72;color:#fff}
  .o2ol-auth-form{display:grid;gap:12px}
  .o2ol-auth-form label{font-weight:800;font-size:13px;color:#304b5e}
  .o2ol-auth-form input[type=email],.o2ol-auth-form input[type=text],.o2ol-auth-form input[type=password]{width:100%;margin-top:5px;border:1px solid #cbd6dc;border-radius:14px;padding:13px 14px;font-size:16px;outline:none}
  .o2ol-auth-form input:focus{border-color:#3a86c8;box-shadow:0 0 0 3px rgba(58,134,200,.14)}
  .o2ol-check{display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.4;color:#506471}
  .o2ol-check input{margin-top:2px}
  .o2ol-auth-submit{border:0;border-radius:999px;padding:14px 18px;font-weight:900;font-size:16px;background:#0a3f72;color:white;cursor:pointer}
  .o2ol-auth-submit:disabled{opacity:.55;cursor:wait}
  .o2ol-auth-error{min-height:20px;color:#b4232d;font-size:13px;font-weight:700;text-align:center}
  .o2ol-password-help{font-size:12px;color:#6d7c87;margin-top:-7px;line-height:1.35}.o2ol-auth-foot{text-align:center;margin-top:12px;font-size:12px;color:#6d7c87}
  .o2ol-auth-foot a{color:#0a3f72}
  .o2ol-account-pill{position:fixed;right:12px;top:12px;z-index:9500;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.95);box-shadow:0 5px 18px #0002;border-radius:999px;padding:7px 8px 7px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#0a3f72}
  .o2ol-account-pill strong{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .o2ol-account-pill button{border:0;background:#eef3f6;color:#0a3f72;border-radius:999px;padding:7px 10px;font-weight:800;cursor:pointer}
  @media(max-width:600px){.o2ol-auth-card{padding:20px 16px}.o2ol-account-pill{top:6px;right:6px}}
  `;
  const style=document.createElement("style"); style.textContent=css; document.head.appendChild(style);

  function htmlEscape(s){
    return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  async function api(path, options={}){
    const res=await fetch(path,{credentials:"same-origin",...options});
    let data={};
    try{data=await res.json();}catch{}
    if(!res.ok) throw new Error(data.error||"Request failed");
    return data;
  }

  function buildOverlay(){
    const wrap=document.createElement("div");
    wrap.className="o2ol-auth-overlay";
    wrap.id="o2olAuthOverlay";
    wrap.innerHTML=`
      <div class="o2ol-auth-card">
        <h1>One2OneLove</h1>
        <div class="beta">Public Beta — Free for a Limited Time</div>
        <p class="lead">Create a free account to play, save your access, and help us learn which Relationship Games people use most.</p>
        <div class="o2ol-auth-tabs">
          <button id="o2olCreateTab" class="active" type="button">Create Account</button>
          <button id="o2olLoginTab" type="button">Sign In</button>
        </div>
        <form id="o2olCreateForm" class="o2ol-auth-form">
          <label>Username
            <input name="username" type="text" autocomplete="username" minlength="3" maxlength="24" required placeholder="Choose a username">
          </label>
          <label>Email
            <input name="email" type="email" autocomplete="email" required placeholder="you@example.com">
          </label>
          <label>Password
            <input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required placeholder="8–128 characters" aria-describedby="o2olPasswordHelp">
          </label>
          <div id="o2olPasswordHelp" class="o2ol-password-help">Use 8–128 characters. Long passwords, spaces, and symbols are supported.</div>
          <label class="o2ol-check"><input name="marketing" type="checkbox"> <span>Send me One2OneLove updates, new games, and special offers. I can unsubscribe later.</span></label>
          <label class="o2ol-check"><input name="terms" type="checkbox" required> <span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms of Service</a> and acknowledge the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>
          <div id="o2olCreateError" class="o2ol-auth-error"></div>
          <button class="o2ol-auth-submit" type="submit">Create Free Account & Play</button>
        </form>
        <form id="o2olLoginForm" class="o2ol-auth-form" hidden>
          <label>Email
            <input name="email" type="email" autocomplete="email" required placeholder="you@example.com">
          </label>
          <label>Password
            <input name="password" type="password" autocomplete="current-password" required placeholder="Your password">
          </label>
          <div id="o2olLoginError" class="o2ol-auth-error"></div>
          <button class="o2ol-auth-submit" type="submit">Sign In & Play</button>
          <div class="o2ol-auth-foot">Forgot your password? Email <a href="mailto:support@one2onelove.com">support@one2onelove.com</a>.</div>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    const createTab=wrap.querySelector("#o2olCreateTab");
    const loginTab=wrap.querySelector("#o2olLoginTab");
    const createForm=wrap.querySelector("#o2olCreateForm");
    const loginForm=wrap.querySelector("#o2olLoginForm");

    createTab.onclick=()=>{
      createTab.classList.add("active"); loginTab.classList.remove("active");
      createForm.hidden=false; loginForm.hidden=true;
    };
    loginTab.onclick=()=>{
      loginTab.classList.add("active"); createTab.classList.remove("active");
      loginForm.hidden=false; createForm.hidden=true;
    };

    createForm.addEventListener("submit",async e=>{
      e.preventDefault();
      const fd=new FormData(createForm);
      const error=wrap.querySelector("#o2olCreateError");
      const btn=createForm.querySelector("button[type=submit]");
      error.textContent=""; btn.disabled=true;
      try{
        const data=await api("/api/auth/signup",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({
            username:fd.get("username"),
            email:fd.get("email"),
            password:fd.get("password"),
            marketingOptIn:fd.get("marketing")==="on",
            acceptTerms:fd.get("terms")==="on"
          })
        });
        state.user=data.user; finishAuth();
      }catch(err){error.textContent=err.message||"Could not create account.";}
      finally{btn.disabled=false;}
    });

    loginForm.addEventListener("submit",async e=>{
      e.preventDefault();
      const fd=new FormData(loginForm);
      const error=wrap.querySelector("#o2olLoginError");
      const btn=loginForm.querySelector("button[type=submit]");
      error.textContent=""; btn.disabled=true;
      try{
        const data=await api("/api/auth/login",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({email:fd.get("email"),password:fd.get("password")})
        });
        state.user=data.user; finishAuth();
      }catch(err){error.textContent=err.message||"Could not sign in.";}
      finally{btn.disabled=false;}
    });
  }

  function addAccountPill(){
    document.getElementById("o2olAccountPill")?.remove();
    if(!state.user) return;
    const pill=document.createElement("div");
    pill.id="o2olAccountPill";
    pill.className="o2ol-account-pill";
    pill.innerHTML=`<span>Signed in as <strong>${htmlEscape(state.user.username)}</strong></span><button type="button">Log out</button>`;
    pill.querySelector("button").onclick=async()=>{
      try{await api("/api/auth/logout",{method:"POST"});}catch{}
      state.user=null;
      location.reload();
    };
    document.body.appendChild(pill);
  }

  function finishAuth(){
    document.getElementById("o2olAuthOverlay")?.remove();
    addAccountPill();
    const home=document.getElementById("home");
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    if(home) home.classList.add("active");
  }

  async function boot(){
    try{
      const data=await api("/api/auth/me");
      if(data.authenticated && data.user){state.user=data.user;finishAuth();}
      else buildOverlay();
    }catch{buildOverlay();}
  }

  window.O2OLAnalytics={
    startGame({playerCount,relationship,category}){
      state.gameSessionId=(crypto.randomUUID?crypto.randomUUID():(Date.now()+"-"+Math.random().toString(36).slice(2)));
      this.track("game_started",{playerCount,relationship,category});
      return state.gameSessionId;
    },
    track(eventType,fields={}){
      if(!state.user) return;
      const payload={eventType,gameSessionId:state.gameSessionId,...fields};
      fetch("/api/analytics/event",{
        method:"POST",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(payload),
        keepalive:true
      }).catch(()=>{});
    },
    getGameSessionId(){return state.gameSessionId;}
  };

  window.addEventListener("appinstalled",()=>window.O2OLAnalytics?.track("app_installed"));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();