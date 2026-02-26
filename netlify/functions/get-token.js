exports.handler = async function () {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("scope", "roles");
    params.append("client_id", process.env.VIDA_CLIENT_ID);
    params.append("client_secret", process.env.VIDA_CLIENT_SECRET);

    const response = await fetch(
      "https://qa-sso.vida.id/auth/realms/vida/protocol/openid-connect/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
