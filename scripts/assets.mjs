import { cp, mkdir } from 'node:fs/promises';
await mkdir('web/public', { recursive: true });
await cp('assets', 'web/public/assets', { recursive: true });
console.log('Copied existing design assets for Cloudflare build.');
