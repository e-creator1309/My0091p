---
name: Cloudflare Worker deployment
description: How to upload the aspu-api worker to Cloudflare via API using Node.js https module
---

Account ID: `a93fdb523060001b2fc39c0372c3307c`
Worker name: `aspu-api`
Auth email: `Were.aksle08@outlook.com`
API key secret name in Replit: `Cloudflare`

**Why not curl -F:** curl's multipart upload doesn't produce the exact part-name format Cloudflare expects for the module name. The form field name must exactly match the `main_module` value in metadata.

**How to apply:** Use Node.js `https.request` to build the multipart body manually:
```js
const boundary = '----formdata-' + Date.now();
const body = [
  '--' + boundary,
  'Content-Disposition: form-data; name="metadata"',
  'Content-Type: application/json',
  '',
  JSON.stringify({ main_module: 'worker.js' }),
  '--' + boundary,
  'Content-Disposition: form-data; name="worker.js"; filename="worker.js"',
  'Content-Type: application/javascript+module',
  '',
  scriptContent,
  '--' + boundary + '--',
  ''
].join('\r\n');
// PUT to https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/aspu-api
```
A `success: true` response confirms deployment. Check `modified_on` field.
