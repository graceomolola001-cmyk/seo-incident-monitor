'use strict';
// Independent portfolio implementation. Pure functions, no network or credentials.
const rules = {
 HTTP: ['P0','Restore the affected page or approve a replacement. Never redirect to a broken destination.','HTTP 200 on the approved destination','Web development'],
 NOINDEX: ['P0','Confirm indexing intent; remove accidental noindex from public page and purge cache.','Public page returns 200 without noindex','Web development'],
 REDIRECT: ['P1','Configure a direct permanent redirect to the approved live target.','First response 301; exact target returns 200','Web development'],
 BROKEN_LINK: ['P1','Replace the broken internal link with a verified live destination.','Linked URL returns 200','Web development'],
 CANONICAL: ['P1','Confirm intended canonical and correct inconsistent markup.','Canonical equals approved indexable URL','SEO / web development'],
 INDEX: ['P1','Investigate coverage reason and inspect after fixing; indexing is not guaranteed.','Google inspection reports indexed','SEO'],
 LCP: ['P1','Inspect LCP element, image delivery and render-blocking resources. Preserve consent and analytics.','URL-level field LCP at or below 2500 ms','Web development'],
 INP: ['P1','Profile long main-thread tasks and reduce unnecessary JavaScript.','URL-level field INP at or below 200 ms','Web development'],
 CLS: ['P1','Reserve media dimensions and investigate layout shifts.','URL-level field CLS at or below 0.10','Web development'],
 SSL: ['P0','Renew the served TLS certificate and verify the chain.','Valid certificate with more than 14 days remaining','Infrastructure'],
 ROBOTS: ['P0','Review intended crawl policy and restore access for public key pages if accidentally blocked.','Public key page is allowed for Googlebot','SEO / web development'],
 SCHEMA: ['P2','Review JSON-LD against visible content and eligibility; optional markup is not mandatory.','Valid intended schema or approved exemption','SEO'],
 INTEGRITY: ['P1','Compare with approved prior content and restore unintended losses.','Expected headings, links and content retained','Content / web development'],
 METADATA: ['P2','Review missing title and description; restore if appropriate.','Title and description present','SEO']
};
function evaluate(snapshot) {
 const checks=[];
 function check(type,url,pass,evidence,discriminator='') { checks.push({key:[type,url,discriminator].join('|'),type,url,pass,evidence}); }
 for(const p of snapshot.pages){
  const url=p.url;
  check('HTTP',url,p.http==null?null:p.http===200,`HTTP ${p.http??'unknown'}`);
  // A failed fetch cannot resolve independent content checks.
  const ok=p.http===200;
  check('NOINDEX',url,ok&&typeof p.noindex==='boolean'?!p.noindex:null,`noindex=${p.noindex??'unknown'}`);
  check('CANONICAL',url,ok&&p.canonical!==undefined?p.canonical===url:null,`canonical=${p.canonical??'unknown'}`);
  check('METADATA',url,ok&&p.title!==undefined&&p.description!==undefined?Boolean(p.title&&p.description):null,'Title and description presence');
  check('SCHEMA',url,ok&&typeof p.schemaValid==='boolean'?p.schemaValid:null,'Intended structured data validity');
  check('INTEGRITY',url,ok&&typeof p.integrity==='boolean'?p.integrity:null,'Approved content baseline comparison');
  check('ROBOTS',url,typeof p.googlebotAllowed==='boolean'?p.googlebotAllowed:null,'Googlebot public URL policy');
  check('INDEX',url,p.indexed===true?true:p.indexed===false&&p.ageDays>=7?false:null,`Indexed=${p.indexed??'unknown'}; age=${p.ageDays??'unknown'} days`);
  for(const [type,field,limit] of [['LCP','lcp',2500],['INP','inp',200],['CLS','cls',0.1]]){
   const v=p.field?.[field];check(type,url,typeof v==='number'&&Number.isFinite(v)?v<=limit:null,`URL field ${field}=${v??'unavailable'}`);
  }
  for(const l of p.links??[])check('BROKEN_LINK',url,l.status==null?null:l.status===200,`${l.url}: HTTP ${l.status??'unknown'}`,l.url);
 }
 for(const r of snapshot.redirects??[])check('REDIRECT',r.url,r.first==null||r.final==null?null:r.first===301&&r.target===r.expected&&r.final===200,`${r.first??'?'} -> ${r.target??'?'} -> ${r.final??'?'}`);
 const ssl=snapshot.ssl; if(ssl)check('SSL',ssl.url,typeof ssl.days==='number'&&typeof ssl.valid==='boolean'?ssl.valid&&ssl.days>14:null,`valid=${ssl.valid}; days=${ssl.days}`);
 return checks;
}
function reconcile(previous,checks,at){
 const tasks=structuredClone(previous??{}),newKeys=[],resolvedKeys=[];const keys=new Set();
 for(const c of checks){if(keys.has(c.key))throw Error('Duplicate check key: '+c.key);keys.add(c.key);const old=tasks[c.key];
  if(c.pass===false){const [priority,fix,verify,owner]=rules[c.type];const reopening=!old||old.status==='RESOLVED';if(reopening)newKeys.push(c.key);tasks[c.key]={...old,...c,priority,fix,verify,owner,status:'OPEN',firstSeen:reopening?at:old.firstSeen,lastChecked:at,done:reopening?false:old.done,assignedTo:old?.assignedTo??'',notes:old?.notes??'',alertSent:reopening?false:old.alertSent};}
  else if(c.pass===true&&old?.status==='OPEN'){tasks[c.key]={...old,status:'RESOLVED',resolvedAt:at,lastChecked:at,evidence:c.evidence};resolvedKeys.push(c.key);}
  else if(c.pass===null&&old?.status==='OPEN'){tasks[c.key]={...old,lastChecked:at,monitorNote:'Unknown; previous issue remains open'};}
 }
 const open=Object.values(tasks).filter(t=>t.status==='OPEN').sort((a,b)=>a.priority.localeCompare(b.priority)||a.key.localeCompare(b.key));const known=checks.filter(c=>c.pass!==null);const coverage=checks.length?Math.round(known.length/checks.length*100):0;let health=coverage>=70&&known.length?Math.round(100*known.filter(c=>c.pass===true).length/known.length):null;if(health!==null&&open.some(t=>t.priority==='P0'))health=Math.min(69,health);
 return {tasks,newKeys,resolvedKeys,open,coverage,health,pending:open.filter(t=>!t.alertSent),checks:checks.length,known:known.length};
}
function acknowledge(result,keys){for(const key of keys){if(!result.tasks[key])throw Error('Unknown task key');result.tasks[key].alertSent=true;}return result.tasks;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(result,checklist='checklist.csv'){const counts=['P0','P1','P2'].map(p=>`${p}: ${result.open.filter(t=>t.priority===p).length}`).join(' | ');return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Technical SEO brief</title><body style="font-family:Arial;max-width:620px;margin:24px auto;color:#253340"><header style="background:#263746;color:white;padding:20px"><small>FICTIONAL DEMO</small><h1>Technical SEO action brief</h1></header><p><strong>${result.open.length} open flags</strong> | ${result.newKeys.length} new | ${result.resolvedKeys.length} verified fixed</p><p>${counts}</p><p>Health: ${result.health??'unavailable'}/100 | Coverage: ${result.coverage}%</p><h2>Top actions</h2><ol>${result.open.slice(0,3).map(t=>`<li><b>${esc(t.priority)} ${esc(t.type)}</b><br>${esc(t.url)}<br>${esc(t.fix)}</li>`).join('')}</ol><p><a href="${esc(checklist)}">Open full designer checklist</a></p><small>Read-only monitoring. Unknown measurements remain unknown. Schema findings require review.</small></body></html>`;}
function csv(tasks){const cols=['priority','type','url','evidence','fix','verify','owner','status','firstSeen','lastChecked','done','assignedTo','notes','key'];const safe=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return [cols.join(','),...Object.values(tasks).sort((a,b)=>a.priority.localeCompare(b.priority)||a.key.localeCompare(b.key)).map(t=>cols.map(k=>safe(t[k])).join(','))].join('\n')+'\n';}
module.exports={evaluate,reconcile,acknowledge,html,csv};
