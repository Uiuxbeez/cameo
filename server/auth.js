import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const tokenHash = value => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
export async function hashPassword(password) { const salt=randomBytes(16).toString('hex'); const hash=await scrypt(password,salt,64); return `${salt}:${hash.toString('hex')}`; }
export async function checkPassword(password, stored) { const [salt,hash] = stored.split(':'); const actual=await scrypt(password,salt,64); return timingSafeEqual(actual,Buffer.from(hash,'hex')); }
