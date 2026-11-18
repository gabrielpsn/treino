#!/usr/bin/env node
/**
 * Gera o par de chaves VAPID (P-256) dos lembretes por Web Push.
 *
 *   node scripts/generate-vapid.mjs
 *
 * Imprime a chave pública (vai em "vars" do wrangler.jsonc) e o JWK privado
 * (vai como secret: `npx wrangler secret put VAPID_PRIVATE_JWK`). A chave
 * privada só aparece no terminal: não salve em arquivo do repositório.
 */
import { webcrypto as crypto } from 'node:crypto';

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
const publicKey = Buffer.from(raw).toString('base64url');

console.log('VAPID_PUBLIC_KEY (vars do wrangler.jsonc):');
console.log(publicKey);
console.log('\nVAPID_PRIVATE_JWK (cole quando o `wrangler secret put VAPID_PRIVATE_JWK` pedir):');
console.log(JSON.stringify({ kty: jwk.kty, crv: jwk.crv, d: jwk.d, x: jwk.x, y: jwk.y }));
