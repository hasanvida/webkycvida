// Netlify function: fraud-shield.js
// Docs: GET /api/v1/evaluation/{clientTransactionId}
// clientTransactionId = same as verificationId / groupId from SDK response

exports.handler = async function (event) {
  const verificationId = event.queryStringParameters && event.queryStringParameters.verificationId;

  if (!verificationId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing verificationId parameter' }),
    };
  }

  try {
    // Get token
    const tokenRes = await fetch('https://qa-sso.vida.id/auth/realms/vida/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.VIDA_CLIENT_ID,
        client_secret: process.env.VIDA_CLIENT_SECRET,
        scope: 'roles',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token error: ' + JSON.stringify(tokenData));

    // Fraud Shield API — clientTransactionId in the PATH (same as verificationId)
    const res = await fetch(
      `https://sandbox-device-fraud-service.np.vida.id/api/v1/evaluation/${encodeURIComponent(verificationId)}`,
      { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
    );
    const body = await res.text();

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
