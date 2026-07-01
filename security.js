import crypto from 'crypto';

export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}

export const ROLES = ['admin','direction','responsable_agence','vendeur','comptable'];

export function isValidRole(role) {
  return ROLES.includes(role);
}

export function prefixFor(role, agencyName = '') {
  const agency = String(agencyName || '').toLowerCase();
  if (role === 'admin') return 'ADM';
  if (role === 'direction') return 'DIR';
  if (role === 'comptable') return 'CPT';
  if (role === 'responsable_agence') {
    if (agency.includes('dori')) return 'RDA-DOR';
    if (agency.includes('kaya')) return 'RDA-KAY';
    if (agency.includes('bobo')) return 'RDA-BOB';
    if (agency.includes('banfora')) return 'RDA-BAN';
    if (agency.includes('som')) return 'RDA-SOM';
    if (agency.includes('kam')) return 'RDA-KAM';
    if (agency.includes('teng')) return 'RDA-TNG';
    if (agency.includes('goung')) return 'RDA-GOU';
    return 'RDA';
  }
  if (agency.includes('dori')) return 'DOR';
  if (agency.includes('kaya')) return 'KAY';
  if (agency.includes('bobo')) return 'BOB';
  if (agency.includes('banfora')) return 'BAN';
  if (agency.includes('som')) return 'SOM';
  if (agency.includes('kam')) return 'KAM';
  if (agency.includes('teng')) return 'TNG';
  if (agency.includes('goung')) return 'GOU';
  return 'USR';
}
