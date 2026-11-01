// Owner-controlled invite rewards, disabled until an independently reviewed grant implementation ships.
export const INVITE_REWARD_CONFIG=Object.freeze({
 enabled:false, kind:'none', featureCode:null, creditCents:0,grantTo:'both',maxRewardsPerInviterPerMonth:20,
});
export async function grantInviteReward(db,referral,config=INVITE_REWARD_CONFIG){
 if(!referral?.id||!db)throw new Error('invalid_referral');
 if(!config?.enabled||config.kind==='none')return {granted:false,reason:'disabled'};
 // Fail closed: never mint credits or entitlements from an unreviewed invite setting.
 // Implement approved, idempotent grants through existing wallet/unlock services before enabling.
 throw new Error('invite_rewards_require_owner_approved_grant_service');
}
