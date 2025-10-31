require('dotenv').config({ path: './.env' });
const axios = require('axios');
const { ConfidentialClientApplication } = require('@azure/msal-node');

// MSAL configuration for Client Credentials Flow
const msalConfig = {
    auth: {
        clientId: process.env.EMAIL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.EMAIL_TENANT_ID}`,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
    }
};

const cca = new ConfidentialClientApplication(msalConfig);

// Function to get an access token
const getAccessToken = async () => {
    const clientCredentialRequest = {
        scopes: ["https://graph.microsoft.com/.default"]
    };
    try {
        const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
        return response.accessToken;
    } catch (error) {
        console.error("Error acquiring access token:", error);
        throw new Error("Failed to acquire access token for Microsoft Graph API.");
    }
};

const sendNewHireEmail = async (newHireData) => {
    const { name, address, mobile_number, date_of_joining, status } = newHireData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
            <p>A new hire record has been created/updated:</p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr>
                    <td style="padding: 8px;"><strong>Name:</strong></td>
                    <td style="padding: 8px;">${name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>Address:</strong></td>
                    <td style="padding: 8px;">${address}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>Mobile Number:</strong></td>
                    <td style="padding: 8px;">${mobile_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>Date of Joining:</strong></td>
                    <td style="padding: 8px;">${new Date(date_of_joining).toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>Status:</strong></td>
                    <td style="padding: 8px;">${status}</td>
                </tr>
            </table>
            <p>Please take the necessary actions.</p>
        `;

        const emailPayload = {
            message: {
                subject: `New Hire Notification: ${name}`,
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: [
                    { emailAddress: { address: "ithelpdesk@exelonglobal.com" } }
                ],
                ccRecipients: [
                    { emailAddress: { address: "hrhelpdesk@exelonglobal.com" } },
                    { emailAddress: { address: "careers.exelon@exelonglobal.com" } }
                ],
            },
            saveToSentItems: true
        };

        await axios.post(graphApiEndpoint, emailPayload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('New hire email sent successfully via Microsoft Graph API');
    } catch (error) {
        console.error('Error sending new hire email via Microsoft Graph API:', error.response?.data || error.message);
    }
};

const sendDeliveryTrackerEmail = async (deliveryData) => {
    const { name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner } = deliveryData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
            <p>A delivery tracker record has been created/updated:</p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 8px;"><strong>Name:</strong></td><td style="padding: 8px;">${name}</td></tr>
                <tr><td style="padding: 8px;"><strong>Address:</strong></td><td style="padding: 8px;">${address}</td></tr>
                <tr><td style="padding: 8px;"><strong>Asset Type:</strong></td><td style="padding: 8px;">${asset_type}</td></tr>
                <tr><td style="padding: 8px;"><strong>Mobile Number:</strong></td><td style="padding: 8px;">${mobile_number}</td></tr>
                <tr><td style="padding: 8px;"><strong>Courier Partner:</strong></td><td style="padding: 8px;">${courier_partner}</td></tr>
                <tr><td style="padding: 8px;"><strong>Tracking Number:</strong></td><td style="padding: 8px;">${tracking_number}</td></tr>
                <tr><td style="padding: 8px;"><strong>Courier Date:</strong></td><td style="padding: 8px;">${courier_date}</td></tr>
                <tr><td style="padding: 8px;"><strong>IT Status:</strong></td><td style="padding: 8px;">${it_status}</td></tr>
                <tr><td style="padding: 8px;"><strong>Final Status:</strong></td><td style="padding: 8px;">${final_status}</td></tr>
                <tr><td style="padding: 8px;"><strong>Delivery Date:</strong></td><td style="padding: 8px;">${delivery_date}</td></tr>
                <tr><td style="padding: 8px;"><strong>New Joiner:</strong></td><td style="padding: 8px;">${new_joiner}</td></tr>
            </table>
            <p>Please take the necessary actions.</p>
        `;

        const emailPayload = {
            message: {
                subject: `Delivery Tracker Notification: ${name}`,
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: [
                    { emailAddress: { address: "ithelpdesk@exelonglobal.com" } }
                ],
            },
            saveToSentItems: true
        };

        await axios.post(graphApiEndpoint, emailPayload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Delivery tracker email sent successfully via Microsoft Graph API');
    } catch (error) {
        console.error('Error sending delivery tracker email via Microsoft Graph API:', error.response?.data || error.message);
    }
};

module.exports = { sendNewHireEmail, sendDeliveryTrackerEmail };