// @ts-nocheck

// Legacy compatibility only. One2OneLove-delivered Love Note SMS is paid
// from the member's Credit balance (regional pricing in credit-config.ts),
// metered by the Credit engine in love-note-entitlements.ts.
export const CUSTOM_LOVE_NOTE_MAX_CHARACTERS=171;
// No single global send price exists anymore: the price depends on the
// recipient's region (USA & Canada $0.29 up to Middle East $0.99).
export const LOVE_NOTE_SEND_PRICE_CENTS=0;

function retired(){
  const error=new Error('Legacy per-send subscription billing is retired. Love Note SMS uses One2OneLove Credit.');
  error.status=410;
  error.code='legacy_love_note_billing_retired';
  throw error;
}

export async function loveNoteSendAccess(db,userId){
  const [wallet]=await Promise.all([
    db.query('SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',[userId]),
  ]);
  const balance=Number(wallet.rows[0]?.balance||0);
  return {
    allowed:true,
    accessModel:'credit',
    creditMode:true,
    creditBalance:balance,
    tokenMode:true,
    tokenBalance:balance,
    tokenCost:29,
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
