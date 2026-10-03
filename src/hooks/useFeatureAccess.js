import {useAuth} from '@/contexts/AuthContext';

function verifiedFreeMember(user){
  if(!user?.id)return false;
  if(String(user?.role||'').toLowerCase()==='admin')return true;
  // Email verification is guaranteed by the authenticated member session.
  // When phone state is present, honor it; otherwise the server identity gate
  // remains authoritative for protected actions.
  return user?.phone_number_verified === false ? false : true;
}

export const useFeatureAccess=(feature)=>{
  const {user}=useAuth();
  return {
    hasAccess:verifiedFreeMember(user),
    accessModel:'free_tokens',
    feature,
    user,
  };
};

// Compatibility alias for legacy callers. A recurring paid plan is no longer
// an access prerequisite; this now means a signed-in verified member session.
export const useHasPaidPlan=()=>{
  const {user}=useAuth();
  return verifiedFreeMember(user);
};

export const useCanUpgrade=()=>false;

export const useFeatureLimits=()=>({
  accessModel:'free_tokens',
  tokenMetered:true,
  loveNoteSms:'tokens',
  aiResponses:'tokens',
  premiumGames:'tokens',
  freeSharing:true,
});

export default useFeatureAccess;
