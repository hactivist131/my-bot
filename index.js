const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth() // saves session locally for reuse
});

// Display QR code in terminal
client.on('qr', (qr) => {
    console.log('Scan this QR code to log in:');
    qrcode.generate(qr, { small: true });
});

// Bot ready
client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
});

// Show 15-second typing on every incoming message
client.on('message', async message => {
    const chat = await message.getChat();

    // Start typing
    await chat.sendStateTyping();

    // Wait 15 seconds
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Stop typing
    await chat.clearState();
});

// Optional: log contact statuses every 5 minutes
async function checkStatuses() {
    const contacts = await client.getContacts();
    for (const contact of contacts) {
        const status = await contact.getStatus();
        if (status) {
            console.log(`${contact.pushname || contact.number}: ${status.body}`);
        }
    }
}

// Run status check every 5 minutes
setInterval(() => {
    checkStatuses().catch(console.error);
}, 5 * 60 * 1000);

// Initialize the client
client.initialize();
