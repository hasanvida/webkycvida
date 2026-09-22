// Netlify function: transaction-detail.js
// Docs: GET /biometrics/api/v2/transaction?transactionId={UUID}

exports.handler = async function (event) {
  const log = [];
  const transactionId = event.queryStringParameters && event.queryStringParameters.verificationId;

  log.push({ step: '1_params', transactionId, hasClientId: !!process.env.VIDA_CLIENT_ID, hasClientSecret: !!process.env.VIDA_CLIENT_SECRET });

  if (!transactionId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing verificationId/transactionId parameter', log }),
    };
  }

  try {
    log.push({ step: '2_token_start' });
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
    log.push({ step: '3_token_response', status: tokenRes.status });

    const tokenData = await tokenRes.json();
    log.push({ step: '4_token_parsed', hasAccessToken: !!tokenData.access_token });

    if (!tokenData.access_token) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Token error', tokenData, log }),
      };
    }

    // Transaction Details API — /biometrics/api/v2/transaction?transactionId={UUID}
    const apiUrl = `https://services-sandbox.vida.id/biometrics/api/v2/transaction?transactionId=${encodeURIComponent(transactionId)}`;
    log.push({ step: '5_api_call', url: apiUrl });

    const res = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    log.push({ step: '6_api_response', status: res.status, ok: res.ok });

    const body = await res.text();
    log.push({ step: '7_done', bodyLength: body.length });

    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ...parsed, _debug: log }),
    };

  } catch (error) {
    log.push({ step: 'error', message: error.message, cause: error.cause?.message || null, stack: error.stack?.split('\n').slice(0,3) });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message, cause: error.cause?.message || null, log }),
    };
  }
};
