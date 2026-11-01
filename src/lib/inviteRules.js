export const INVITE_CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_PATTERN=/^[A-HJ-NP-Z2-9]{6,8}$/;
export function generateInviteCode(bytes){
 if(!bytes||bytes.length<7)throw new Error('seven_random_bytes_required');
 return Array.from(bytes).slice(0,7).map(b=>INVITE_CODE_ALPHABET[b%INVITE_CODE_ALPHABET.length]).join('');
}
export function chooseInviteAttribution(existing,next){
 if(existing&&(existing.code||!next?.code))return existing;
 return next||existing||null;
}
export function reasonForRejectedInvite({inviterId,inviteeId,inviterEmail,inviteeEmail,disabled=false,excluded=false,samePhone=false}={}){
 if(disabled)return 'disabled_code';
 if(excluded)return 'excluded_identity';
 if(samePhone||(inviterId&&inviteeId&&inviterId===inviteeId)||
  (inviterEmail&&inviteeEmail&&String(inviterEmail).toLowerCase()===String(inviteeEmail).toLowerCase()))return 'self_invite';
 return null;
}
