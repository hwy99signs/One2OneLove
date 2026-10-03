// @ts-nocheck

// Legacy compatibility only. One2OneLove-delivered Love Note SMS is now
// metered by the O2OL Token engine in love-note-entitlements.ts.
export const CUSTOM_LOVE_NOTE_MAX_CHARACTERS=171;
export const LOVE_NOTE_SEND_PRICE_CENTS=0;

function retired(){
  const error=new Error('Legacy per-send subscription billing is retired. Love Note SMS uses O2OL Tokens.');
  error.status=410;
  error.code='legacy_love_note_billing_retired';
  throw error;
}

export async function loveNoteSendAccess(db,userId){
  const [wallet,price]=await Promise.all([
    db.query('SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',[userId]),
    db.query(`SELECT token_cost FROM public.o2ol_token_feature_prices WHERE feature_code='love_note_send' AND active=true LIMIT 1`),
  ]);
  return {
    allowed:true,
    accessModel:'free_tokens',
    tokenMode:true,
    tokenBalance:Number(wallet.rows[0]?.balance||0),
    tokenCost:Number(price.rows[0]?.token_cost||0),
    firstMembershipSendFree:false,
    firstSendFree:false,
    firstFreeAvailable:false,
    sendPriceCents:0,
  };
}

export async function loveNoteUsageSummary(db,userId){
  const access=await loveNoteSendAccess(db,userId);
  return {...access,customNoteMaxCharacters:CUSTOM_LOVE_NOTE_MAX_CHARACTERS};
}

export async function reserveLoveNoteSend(){return retired();}
export async function consumeLoveNoteReservation(){return retired();}
export async function releaseLoveNoteReservation(){return retired();}
export async function billReservedLoveNoteSend(){return retired();}
