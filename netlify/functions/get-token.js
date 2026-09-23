// Netlify function: get-token.js
// Fetches a VIDA SSO token server-side (SSO has CORS restrictions).
// Returns access_token + signing_key so the browser can:
//   1. Init the VIDA Web SDK  (needs both)
//   2. Call VIDA APIs directly with Bearer auth  (needs access_token)

exports.handler = async function () {
  try {
    const tokenRes = await fetch(
      'https://qa-sso.vida.id/auth/realms/vida/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'client_credentials',
          client_id:     process.env.VIDA_CLIENT_ID,
          client_secret: process.env.VIDA_CLIENT_SECRET,
          scope:         'roles',
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Token fetch failed', detail: tokenData }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        access_token:           tokenData.access_token,
        signing_key:            process.env.VIDA_SIGNING_KEY || null,
        fraud_shield_client_id: process.env.VIDA_FRAUD_SHIELD_CLIENT_ID || null,
        expires_in:             tokenData.expires_in || null,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
