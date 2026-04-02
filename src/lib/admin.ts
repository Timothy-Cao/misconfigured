const ADMIN_PASSWORD_HASH = 'c11b328fc4309ef6478beb387eb5c8348661075ccdffda64d6e9627788f2171c';

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
