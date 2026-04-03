const ADMIN_PASSWORD_HASH = '37a31372023fde4f1b5994decd7491fcd18c5064f3ce7c22bf8703698fd070df';
const COMMUNITY_PASSWORD_HASH = 'c0218b24549fb5c2bdd1390fb8d73051bce7c91c5c67a4656d0e387a22348e50';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return (await sha256(password)) === ADMIN_PASSWORD_HASH;
}

export async function verifyCommunityPassword(password: string): Promise<boolean> {
  return (await sha256(password)) === COMMUNITY_PASSWORD_HASH;
}
