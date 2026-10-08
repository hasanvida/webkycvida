// Netlify function: transaction-detail.js (Liveness Transaction Details)
// GET https://services-sandbox.vida.id/biometrics/v3/services/face/liveliness?transactionId={UUID}
// Uses the liveness transactionId from the KYC flow (livenessDetails.transactionId).

exports.handler = async function (event) {
  const transactionId = event.queryStringParameters && event.queryStringParameters.transactionId;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!transactionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing transactionId parameter' }),
    };
  }

  try {
    // Get token
    const tokenRes = await fetch('https://qa-sso.vida.id/auth/realms/vida/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     process.env.VIDA_CLIENT_ID,
        client_secret: process.env.VIDA_CLIENT_SECRET,
        scope:         'roles',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token error: ' + JSON.stringify(tokenData));

    // Liveness Transaction Details API (v3)
    const apiUrl = `https://services-sandbox.vida.id/biometrics/v3/services/face/liveliness?transactionId=${encodeURIComponent(transactionId)}`;
    const res = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const body = await res.text();

    return {
      statusCode: res.status,
      headers,
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
