export function adminAccessActive(user){
  return String(user?.role||'').toLowerCase()==='admin';
}

export function hasFullMemberAccess(user){
  if(!user?.id)return false;
  if(String(user?.role||'').toLowerCase()==='admin')return true;
  return user?.phone_number_verified === false ? false : true;
}

export function openHouseProtectedDestination(user,feature='feature'){
  const encoded=encodeURIComponent(feature);
  if(!user?.id)return `/SignUp?source=open-house&feature=${encoded}&type=individual`;
  if(user?.phone_number_verified===false)return `/VerifyPhone?source=open-house&feature=${encoded}`;
  return `/Credit?source=open-house&feature=${encoded}`;
}
