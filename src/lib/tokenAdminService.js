async function parseJson(response){
  const payload=await response.json().catch(()=>null);
  if(!response.ok){
    const message=payload?.error?.message||payload?.message||`Request failed with HTTP ${response.status}`;
    const error=new Error(message);
    error.status=response.status;
    error.code=payload?.error?.code||payload?.code||'request_failed';
    throw error;
  }
  return payload;
}

export async function getTokenSystemDashboard(){
  const response=await fetch('/api/token-admin/dashboard',{
    method:'GET',
    credentials:'include',
    headers:{accept:'application/json'},
    cache:'no-store',
  });
  return parseJson(response);
}

export async function adjustTokenWallet(userId,delta,reason){
  const response=await fetch(`/api/token-admin/wallets/${encodeURIComponent(userId)}/adjust`,{
    method:'POST',
    credentials:'include',
    headers:{accept:'application/json','content-type':'application/json'},
    body:JSON.stringify({delta,reason}),
  });
  return parseJson(response);
}


export async function startTokenCalibration({userId,featureCode='all',packageCode=null,notes=''}) {
  const response=await fetch('/api/token-admin/calibrations/start',{
    method:'POST',
    credentials:'include',
    headers:{accept:'application/json','content-type':'application/json'},
    body:JSON.stringify({userId,featureCode,packageCode,notes}),
  });
  return parseJson(response);
}

export async function endTokenCalibration(sessionId,notes='') {
  const response=await fetch(`/api/token-admin/calibrations/${encodeURIComponent(sessionId)}/end`,{
    method:'POST',
    credentials:'include',
    headers:{accept:'application/json','content-type':'application/json'},
    body:JSON.stringify({notes}),
  });
  return parseJson(response);
}
