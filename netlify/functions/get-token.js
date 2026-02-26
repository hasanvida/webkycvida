exports.handler = async function () {
  try {
    const response = await fetch("https://qa-sso.vida.id/auth/realms/vida/protocol/openid-connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.VIDA_CLIENT_ID,
        client_secret: process.env.VIDA_CLIENT_SECRET,
        scope: "roles"
      })
    });

    const data = await response.json();

    if (!data.access_token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to obtain token", details: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: data.access_token,
        signing_key: process.env.VIDA_SIGNING_KEY
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
