(() => {
  const state = { user:null, gameSessionId:null };

  async function api(path, options={}) {
    const res = await fetch(path, {
      credentials:"same-origin",
      headers:{ "content-type":"application/json", ...(options.headers||{}) },
      ...options,
    });
    let data={};
    try { data=await res.json(); } catch {}
    if (!res.ok) throw new Error(data?.error || data?.message || "Request failed");
    return data;
  }

  function accessRequired(message) {
    document.getElementById("o2olAccessOverlay")?.remove();
    const wrap=document.createElement("div");
    wrap.id="o2olAccessOverlay";
    wrap.style.cssText="position:fixed;inset:0;z-index:10000;background:linear-gradient(145deg,#bcded7,#f0cbd5);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,Helvetica,sans-serif";
    wrap.innerHTML=`
      <div style="width:min(520px,96vw);background:white;border-radius:28px;padding:28px;box-shadow:0 18px 50px rgba(15,38,55,.22);text-align:center;color:#183047">
        <h1 style="margin:0 0 10px;color:#0a3f72">One2OneLove Scratch Game</h1>
        <p style="line-height:1.5;color:#617281">${message || "Open this game from your signed-in One2OneLove account."}</p>
        <a href="https://www.one2onelove.com/ScratchGame" style="display:inline-block;margin-top:8px;border-radius:999px;padding:14px 20px;background:#0a3f72;color:white;text-decoration:none;font-weight:900">Return to One2OneLove</a>
      </div>`;
    document.body.appendChild(wrap);
  }

  function finishAuth() {
    document.getElementById("o2olAccessOverlay")?.remove();
    const home=document.getElementById("home");
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    if (home) home.classList.add("active");
  }

  async function boot() {
    const url=new URL(window.location.href);
    const ticket=url.searchParams.get("ticket");

    if (ticket) {
      try {
        const data=await api("/api/o2ol/launch", {
          method:"POST",
          body:JSON.stringify({ ticket }),
        });
        state.user=data.user || null;
        url.searchParams.delete("ticket");
        history.replaceState(null,"",url.pathname + (url.search ? url.search : "") + url.hash);
        finishAuth();
        return;
      } catch (error) {
        accessRequired(error?.message || "Your One2OneLove game access could not be verified.");
        return;
      }
    }

    try {
      const data=await api("/api/auth/me", { method:"GET", headers:{} });
      if (data.authenticated && data.user) {
        state.user=data.user;
        finishAuth();
        return;
      }
    } catch {}

    accessRequired("Please open the Scratch Game from your signed-in One2OneLove account. You do not need a separate game account.");
  }

  window.O2OLAnalytics={
    startGame({playerCount,relationship,category}) {
      state.gameSessionId=(crypto.randomUUID?crypto.randomUUID():(Date.now()+"-"+Math.random().toString(36).slice(2)));
      this.track("game_started",{playerCount,relationship,category});
      return state.gameSessionId;
    },
    track(eventType,fields={}) {
      if(!state.user) return;
      const payload={eventType,gameSessionId:state.gameSessionId,...fields};
      fetch("/api/analytics/event",{
        method:"POST",
        credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(payload),
        keepalive:true
      }).catch(()=>{});
    },
    getGameSessionId(){ return state.gameSessionId; }
  };

  window.addEventListener("appinstalled",()=>window.O2OLAnalytics?.track("app_installed"));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
