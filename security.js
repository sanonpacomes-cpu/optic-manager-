import crypto from 'crypto';
export function hashPassword(password){return crypto.createHash('sha256').update(String(password||'')).digest('hex')}
export const ROLES=['admin','direction','responsable_agence','vendeur','comptable'];
export function prefixFor(role,agencyName=''){const a=String(agencyName||'').toLowerCase();if(role==='admin')return'ADM';if(role==='direction')return'DIR';if(role==='comptable')return'CPT';let p='DOR';if(a.includes('kaya'))p='KAY';else if(a.includes('bobo'))p='BOB';else if(a.includes('ban'))p='BAN';else if(a.includes('som'))p='SOM';else if(a.includes('kam'))p='KAM';else if(a.includes('teng'))p='TNG';else if(a.includes('gou'))p='GOU';return role==='responsable_agence'?'RDA-'+p:p}
