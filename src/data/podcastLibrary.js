import { podcastRowsA } from './podcastRowsA';
import { podcastRowsB } from './podcastRowsB';
import { podcastRowsC } from './podcastRowsC';

const slug=(v='')=>v.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96);
const rows=[...podcastRowsA,...podcastRowsB,...podcastRowsC];
export const podcastLibrary=rows.map(([title,host,language,appleCountry,market,description,sourceUrl,appleSearchTerm,focus,lgbtq,appleId,episodes,hostImageUrl,hostImageAlt,hostImageCredit,hostImageCreditUrl])=>({id:slug(title),title,host,language,appleCountry,market,description,sourceUrl,appleSearchTerm,focus,lgbtq,episodes:episodes.map(([title,date,mature])=>({id:slug(title),title,date,...(typeof mature==='boolean'?{mature}:{})})),...(appleId?{appleId}:{}),...(hostImageUrl?{hostImageUrl,hostImageAlt,hostImageCredit,hostImageCreditUrl}:{})}));
export const podcastLanguages=['English','Spanish','French','Italian','German','Dutch'];
