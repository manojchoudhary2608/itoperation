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

const formatNameFromEmail = (email) => {
    if (!email || !email.includes('@')) {
        return email; // Return original string if it's not a valid email
    }
    const namePart = email.split('@')[0];
    const names = namePart.split('.');
    const formattedName = names.map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');
    return formattedName;
};

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
    const { name, address, mobile_number, date_of_joining, status, addedBy } = newHireData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
<html>
<body>
            <div style="font-family: Calibri; font-size: 12pt;">
                <p>Hi Team,</p>
                <p>${formatNameFromEmail(addedBy)} Added the new candidate in the New Hire Application. Below is the details.</p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #007BA7; color: white; font-weight: bold;">
                            <th style="padding: 8px; text-align: center;">Name</th>
                            <th style="padding: 8px; text-align: center;">Address</th>
                            <th style="padding: 8px; text-align: center;">Mobile Number</th>
                            <th style="padding: 8px; text-align: center;">Date of Joining</th>
                            <th style="padding: 8px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; text-align: center;">${name}</td>
                            <td style="padding: 8px; text-align: center;">${address}</td>
                            <td style="padding: 8px; text-align: center;">${mobile_number}</td>
                            <td style="padding: 8px; text-align: center;">${new Date(date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td style="padding: 8px; text-align: center;">${status}</td>
                        </tr>
                    </tbody>
                </table>
                <p>Please take the necessary actions.</p>
                <p><i>* This is an automatically generated email – please do not reply to it. If you have any queries please email to ithelpdesk@exelonglobal.com</i></p>
            </div>
</body>
</html>
        `;

        const emailPayload = {
            message: {
                subject: "New hire candidate added into the application !",
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: [
                    { emailAddress: { address: "ithelpdesk@exelonglobal.com" } }
                ],
                ccRecipients: [
                    { emailAddress: { address: "careers.exelon@exelonglobal.com" } },
                    { emailAddress: { address: "prathap.srinivasa@exelonglobal.com" } }
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

const sendDeliveryConfiguredEmail = async (deliveryData) => {
    const { name, address, asset_type, it_status, mobile_number } = deliveryData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
<html>
<body>
            <div style="font-family: Calibri; font-size: 12pt;">
                <p>Hi Team,</p>
                <p>The Asset is ready for the shipment, Please take the necessary actions. The details are below.</p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #007BA7; color: white; font-weight: bold;">
                            <th style="padding: 8px; text-align: center;">Name</th>
                            <th style="padding: 8px; text-align: center;">Address</th>
                            <th style="padding: 8px; text-align: center;">Asset Type</th>
                            <th style="padding: 8px; text-align: center;">Mobile Number</th>
                            <th style="padding: 8px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; text-align: center;">${name}</td>
                            <td style="padding: 8px; text-align: center;">${address}</td>
                            <td style="padding: 8px; text-align: center;">${asset_type}</td>
                            <td style="padding: 8px; text-align: center;">${mobile_number}</td>
                            <td style="padding: 8px; text-align: center;">${it_status}</td>
                        </tr>
                    </tbody>
                </table>
                <p><i>* This is an automatically generated email – please do not reply to it. If you have any queries please email to ithelpdesk@exelonglobal.com</i></p>
            </div>
</body>
</html>
        `;

        const emailPayload = {
            message: {
                subject: `Asset is ready for shipment | ${name} |`,
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: [
                    { emailAddress: { address: "putta.chennaiah@exelonglobal.com" } }
                ],
                ccRecipients: [
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

        console.log('Delivery configured email sent successfully via Microsoft Graph API');
    } catch (error) {
        console.error('Error sending delivery configured email via Microsoft Graph API:', error.response?.data || error.message);
    }
};


const sendNewHireClosedEmail = async (newHireData) => {
    const { name, address, mobile_number, date_of_joining, status, days, addedBy } = newHireData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
<html>
<body>
            <div style="font-family: Calibri; font-size: 12pt;">
                <p>Hi Team,</p>
                <p>The IT Team has sent the system for the below candidate. Soon you will receive the tracking detail email containing the shipment tracking details.</p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #007BA7; color: white; font-weight: bold;">
                            <th style="padding: 8px; text-align: center;">Name</th>
                            <th style="padding: 8px; text-align: center;">Address</th>
                            <th style="padding: 8px; text-align: center;">Mobile Number</th>
                            <th style="padding: 8px; text-align: center;">Date of Joining</th>
                            <th style="padding: 8px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; text-align: center;">${name}</td>
                            <td style="padding: 8px; text-align: center;">${address}</td>
                            <td style="padding: 8px; text-align: center;">${mobile_number}</td>
                            <td style="padding: 8px; text-align: center;">${new Date(date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td style="padding: 8px; text-align: center;">${status}</td>
                        </tr>
                    </tbody>
                </table>
                <p>We have completed this process in ${days} days.</p>
                <p><i>* This is an automatically generated email – please do not reply to it. If you have any queries please email to ithelpdesk@exelonglobal.com</i></p>
            </div>
</body>
</html>
        `;

        const emailPayload = {
            message: {
                subject: `New hire status has been closed for the ${name}`,
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: [
                    { emailAddress: { address: "careers.exelon@exelonglobal.com" } }
                ],
                ccRecipients: [
                    { emailAddress: { address: "ithelpdesk@exelonglobal.com" } },
                    { emailAddress: { address: "prathap.srinivasa@exelonglobal.com" } }
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

        console.log('New hire closed email sent successfully via Microsoft Graph API');
    } catch (error) {
        console.error('Error sending new hire closed email via Microsoft Graph API:', error.response?.data || error.message);
    }
};


const sendNewHireCalledOffEmail = async (newHireData) => {
    const { name, address, mobile_number, date_of_joining, status, addedBy } = newHireData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
<html>
<body>
            <div style="font-family: Calibri; font-size: 12pt;">
                <p>Hi Team,</p>
                <p>As per the action discussed, please initiate the process to retrieve the system in-case we have sent to the candidate.</p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #007BA7; color: white; font-weight: bold;">
                            <th style="padding: 8px; text-align: center;">Name</th>
                            <th style="padding: 8px; text-align: center;">Address</th>
                            <th style="padding: 8px; text-align: center;">Mobile Number</th>
                            <th style="padding: 8px; text-align: center;">Date of Joining</th>
                            <th style="padding: 8px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; text-align: center;">${name}</td>
                            <td style="padding: 8px; text-align: center;">${address}</td>
                            <td style="padding: 8px; text-align: center;">${mobile_number}</td>
                            <td style="padding: 8px; text-align: center;">${new Date(date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td style="padding: 8px; text-align: center;">${status}</td>
                        </tr>
                    </tbody>
                </table>
                <p><i>* This is an automatically generated email – please do not reply to it. If you have any queries please email to ithelpdesk@exelonglobal.com</i></p>
            </div>
</body>
</html>
        `;

        const emailPayload = {
            message: {
                subject: `Called Off for the candidate ${name}`,
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: [
                    { emailAddress: { address: "ithelpdesk@exelonglobal.com" } }
                ],
                ccRecipients: [
                    { emailAddress: { address: "careers.exelon@exelonglobal.com" } },
                    { emailAddress: { address: "prathap.srinivasa@exelonglobal.com" } }
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

        console.log('New hire called off email sent successfully via Microsoft Graph API');
    } catch (error) {
        console.error('Error sending new hire called off email via Microsoft Graph API:', error.response?.data || error.message);
    }
};


const sendFinalStatusEmail = async (deliveryData, toRecipients, ccRecipients) => {
    const { name, address, asset_type, courier_partner, tracking_number, final_status } = deliveryData;

    try {
        const accessToken = await getAccessToken();
        const graphApiEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_USER}/sendMail`;

        const emailBody = `
<html>
<body>
            <div style="font-family: Calibri; font-size: 12pt;">
                <p>Hi All,</p>
                <p>Here are the final status of the asset delivery, Please find the below tracking details and status.</p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #007BA7; color: white; font-weight: bold;">
                            <th style="padding: 8px; text-align: center;">Name</th>
                            <th style="padding: 8px; text-align: center;">Address</th>
                            <th style="padding: 8px; text-align: center;">Asset Type</th>
                            <th style="padding: 8px; text-align: center;">Courier Partner</th>
                            <th style="padding: 8px; text-align: center;">Tracking Number</th>
                            <th style="padding: 8px; text-align: center;">Final Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; text-align: center;">${name}</td>
                            <td style="padding: 8px; text-align: center;">${address}</td>
                            <td style="padding: 8px; text-align: center;">${asset_type}</td>
                            <td style="padding: 8px; text-align: center;">${courier_partner || 'N/A'}</td>
                            <td style="padding: 8px; text-align: center;">${tracking_number || 'N/A'}</td>
                            <td style="padding: 8px; text-align: center;">${final_status}</td>
                        </tr>
                    </tbody>
                </table>
                <p><i>* This is an automatically generated email – please do not reply to it. If you have any queries please email to ithelpdesk@exelonglobal.com</i></p>
            </div>
</body>
</html>
        `;

        const emailPayload = {
            message: {
                subject: `Asset tracking and final status | ${name} |`,
                body: {
                    contentType: "Html",
                    content: emailBody
                },
                toRecipients: toRecipients.map(email => ({ emailAddress: { address: email } })),
                ccRecipients: ccRecipients.map(email => ({ emailAddress: { address: email } })),
            },
            saveToSentItems: true
        };

        await axios.post(graphApiEndpoint, emailPayload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Final status email sent successfully via Microsoft Graph API');
    } catch (error) {
        console.error('Error sending final status email via Microsoft Graph API:', error.response?.data || error.message);
    }
};

module.exports = { sendNewHireEmail, sendNewHireClosedEmail, sendNewHireCalledOffEmail, sendDeliveryConfiguredEmail, sendFinalStatusEmail };