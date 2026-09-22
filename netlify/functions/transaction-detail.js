// Netlify function: transaction-detail.js
// Calls VIDA Transaction Detail API using verificationId

async function getToken() {
  const res = await fetch(
    "https://qa-sso.vida.id/auth/realms/vida/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.VIDA_CLIENT_ID,
        client_secret: process.env.VIDA_CLIENT_SECRET,
        scope: "roles",
      }),
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Token fetch failed");
  return data.access_token;
}

exports.handler = async function (event) {
  const verificationId = event.queryStringParameters?.verificationId;

  if (!verificationId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing verificationId parameter" }),
    };
  }

  try {
    const token = await getToken();

    const res = await fetch(
      `https://qa-api.vida.id/api/v2/verify/transaction?verificationId=${encodeURIComponent(verificationId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
