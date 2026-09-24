(() => {
  const app=document.getElementById("app");
  let key=sessionStorage.getItem("o2ol_admin_key")||"";

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function get(path){
    const r=await fetch(path,{headers:{"x-o2ol-admin-key":key}});
    if(!r.ok) throw new Error(r.status===401?"Invalid admin key":"Could not load analytics");
    return r;
  }
  function askKey(msg=""){
    app.innerHTML=`<div class="card keybox"><h1>Game Analytics</h1><p class="muted">Enter the private owner analytics key.</p><input id="k" type="password" autocomplete="off" placeholder="Admin analytics key"><div class="error">${esc(msg)}</div><button id="go">Open Dashboard</button></div>`;
    app.querySelector("#go").onclick=()=>{key=app.querySelector("#k").value.trim();sessionStorage.setItem("o2ol_admin_key",key);load();};
  }
  const metric=(v,l)=>`<div class="card metric"><b>${esc(v)}</b><span>${esc(l)}</span></div>`;
  const table=(rows,cols)=>`<table><thead><tr>${cols.map(c=>`<th>${esc(c[1])}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c[0]])}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${cols.length}" class="muted">No data yet</td></tr>`}</tbody></table>`;

  async function load(){
    try{
      const r=await get("/api/admin/analytics");
      const d=await r.json(), s=d.summary||{};
      app.innerHTML=`
      <div class="top"><div><h1>One2OneLove Game Analytics</h1><div class="muted">Public beta usage • test accounts excluded</div></div>
      <div><button id="refresh">Refresh</button> <button id="csv">Download Marketing Emails</button></div></div>
      <div class="grid" style="margin-top:16px">
        ${metric(s.registered_users||0,"Registered users")}
        ${metric(s.marketing_opt_ins||0,"Marketing opt-ins")}
        ${metric(s.new_users_7d||0,"New users • 7 days")}
        ${metric(s.games_7d||0,"Games started • 7 days")}
        ${metric(s.games_30d||0,"Games started • 30 days")}
        ${metric(s.cards_30d||0,"Cards revealed • 30 days")}
        ${metric(s.active_players_30d||0,"Active players • 30 days")}
        ${metric(s.returning_players||0,"Returning players")}
        ${metric(s.avg_cards_per_game||0,"Avg cards per game • 30 days")}
      </div>
      <div class="two">
        <div class="card"><h2>Categories • 30 days</h2>${table(d.categories||[],[["category","Category"],["games","Games"]])}</div>
        <div class="card"><h2>Relationship types • 30 days</h2>${table(d.relationships||[],[["relationship","Relationship"],["games","Games"]])}</div>
        <div class="card"><h2>Player counts • 30 days</h2>${table(d.playerCounts||[],[["player_count","Players"],["games","Games"]])}</div>
        <div class="card"><h2>Daily game starts • 30 days</h2>${table(d.daily||[],[["day","Date"],["games","Games"]])}</div>
      </div>`;
      app.querySelector("#refresh").onclick=load;
      app.querySelector("#csv").onclick=async()=>{
        try{
          const rr=await get("/api/admin/marketing.csv");
          const blob=await rr.blob(), url=URL.createObjectURL(blob);
          const a=document.createElement("a");a.href=url;a.download="one2onelove-marketing-opt-ins.csv";a.click();URL.revokeObjectURL(url);
        }catch(e){alert(e.message);}
      };
    }catch(e){sessionStorage.removeItem("o2ol_admin_key");askKey(e.message);}
  }
  if(key) load(); else askKey();
})();