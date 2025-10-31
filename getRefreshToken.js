require('dotenv').config({ path: './.env' });
const { ConfidentialClientApplication } = require('@azure/msal-node');
const http = require('http');
const url = require('url');

const config = {
    auth: {
        clientId: process.env.EMAIL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.EMAIL_TENANT_ID}`,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
    }
};

const cca = new ConfidentialClientApplication(config);

const msalConfig = {
    scopes: ["https://graph.microsoft.com/Mail.Send", "offline_access"],
    redirectUri: "http://localhost",
};

async function getRefreshToken() {
    const authCodeUrlParameters = {
        scopes: msalConfig.scopes,
        redirectUri: msalConfig.redirectUri,
        prompt: "consent", // Add this line
    };

    const authCodeUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
    console.log("Please navigate to this URL in your browser:");
    console.log(authCodeUrl);

    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            const parsedUrl = url.parse(req.url, true);
            if (parsedUrl.pathname === '/' && parsedUrl.query.code) {
                const tokenRequest = {
                    code: parsedUrl.query.code,
                    scopes: msalConfig.scopes,
                    redirectUri: msalConfig.redirectUri,
                };

                try {
                    const response = await cca.acquireTokenByCode(tokenRequest);
                    console.log("\nAuthentication successful!");
                    console.log("--------------------------------------------------");
                    console.log("FULL TOKEN RESPONSE:");
                    console.log(JSON.stringify(response, null, 2)); // Log full response
                    console.log("--------------------------------------------------");
                    console.log("YOUR REFRESH TOKEN:");
                    console.log(response.refreshToken);
                    console.log("--------------------------------------------------");
                    console.log("Please copy the above token and paste it into your .env file as EMAIL_REFRESH_TOKEN.");
                    console.log("Then, you can delete this getRefreshToken.js script.");

                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end("Authentication successful! You can close this window. Check your console for the refresh token.");
                    server.close();
                    resolve(response.refreshToken);
                } catch (error) {
                    console.error("Error acquiring token:", error);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("Authentication failed. Check console for errors.");
                    server.close();
                    reject(error);
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("Not Found");
            }
        });

        server.listen(80, () => {
            console.log("Local server listening on port 80 for redirect...");
        });
    });
}

getRefreshToken().catch(console.error);
