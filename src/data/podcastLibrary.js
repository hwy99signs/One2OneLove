import { podcastRowsA } from './podcastRowsA';
import { podcastRowsB } from './podcastRowsB';
import { podcastRowsC } from './podcastRowsC';

const slug=(v='')=>v.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96);
// Owner directive, 2026-10-10: ALL podcast episodes are billable. Every
// episode is tokenLocked at the podcast_episode_unlock price ($1.99, pay
// once per episode, listen anytime); there are no free episodes.
const rows=[...podcastRowsA,...podcastRowsB,...podcastRowsC];
export const podcastLibrary=rows.map(([title,host,language,appleCountry,market,description,sourceUrl,appleSearchTerm,focus,lgbtq,appleId,episodes,hostImageUrl,hostImageAlt,hostImageCredit,hostImageCreditUrl])=>({id:slug(title),title,host,language,appleCountry,market,description,sourceUrl,appleSearchTerm,focus,lgbtq,episodes:episodes.map(([title,date,mature])=>({id:slug(title),title,date,...(typeof mature==='boolean'?{mature}:{}),tokenLocked:true})),...(appleId?{appleId}:{}),...(hostImageUrl?{hostImageUrl,hostImageAlt,hostImageCredit,hostImageCreditUrl}:{})}));
export const podcastLanguages=['English','Spanish','French','Italian','German'];
export const podcastLanguageByUiLanguage={en:'English',es:'Spanish',fr:'French',it:'Italian',de:'German'};
export const podcastUiLanguageByPodcastLanguage={English:'en',Spanish:'es',French:'fr',Italian:'it',German:'de'};
export const launchPodcastLibrary=podcastLibrary.filter((podcast)=>podcastLanguages.includes(podcast.language));
