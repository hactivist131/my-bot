import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs-extra";
import moment from "moment";

const prefix = ".";

// 🔹 Startup log
console.log("🚀 Starting WhatsApp Bot...");

// Feature settings
let settings = {
  autoreact: false,
  autoread: false,
  autotyping: false,
  antidelete: false,
  welcome: false
};

// Command categories for .menu
const commands = {
  General: [".menu", ".ping", ".owner", ".info", ".help"],
  Fun: [
    ".joke", ".quote", ".meme", ".8ball", ".trivia", ".rps", ".coinflip", ".dice",
    ".roll", ".fortune", ".story", ".compliment", ".insult", ".randomfact",
    ".challenge", ".mathgame", ".hangman", ".quiz", ".truth", ".dare"
  ],
  Media: [
    ".sticker", ".tts", ".ytmp3", ".ytmp4", ".tiktok", ".igdownload", ".play",
    ".video2audio", ".image", ".gif", ".convert", ".resize", ".compress",
    ".filter", ".rembg", ".ocr"
  ],
  Group: [
    ".kick", ".add", ".promote", ".demote", ".mute", ".unmute", ".warn", ".setdesc",
    ".setwelcome", ".seticon", ".tagall", ".groupinfo", ".open", ".close", ".inviteinfo"
  ],
  Utility: [
    ".time", ".weather", ".translate", ".calc", ".shorturl", ".reminder", ".note",
    ".qr", ".barcode", ".covid", ".search", ".lyrics", ".define", ".currency", ".todo",
    ".poll", ".remindme", ".alarm", ".dictionary"
  ],
  AI: [
    ".chatgpt", ".askai", ".imgai", ".storyai", ".jokeai", ".poemai",
    ".adviceai", ".summarizeai", ".translateai"
  ],
  Settings: [
    ".autoreact on/off", ".autoread on/off", ".autotyping on/off",
    ".antidelete on/off", ".welcome on/off"
  ]
};

const allCommands = Object.values(commands).flat();

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    // 🔹 Connection updates + QR code
    sock.ev.on("connection.update", update => {
      console.log("Connection update:", update);
      if (update.connection === "open") console.log("✅ Bot Connected");
      if (update.connection === "close") console.log("❌ Bot Disconnected");
    });

    // 🔹 Message handler
    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      const args = messageText.trim().split(" ");
      const command = args[0].toLowerCase();

      // Auto read & typing
      if (settings.autoread) await sock.readMessages([msg.key]);
      if (settings.autotyping) await sock.sendPresenceUpdate("composing", from);

      // 🔹 .menu command
      if (command === ".menu") {
        let menuText = `🤖 *WHATSAPP BOT MENU* (${allCommands.length} Commands)\n\n`;
        for (let category in commands) {
          menuText += `📌 *${category}*\n`;
          menuText += commands[category].join(" | ") + "\n\n";
        }
        menuText += `⚙️ Use commands to toggle features (Settings)\n`;
        await sock.sendMessage(from, { text: menuText });
      }

      // 🔹 Toggle feature commands
      if (command.startsWith(".autoreact")) toggleFeature("autoreact", args[1], from);
      if (command.startsWith(".autoread")) toggleFeature("autoread", args[1], from);
      if (command.startsWith(".autotyping")) toggleFeature("autotyping", args[1], from);
      if (command.startsWith(".antidelete")) toggleFeature("antidelete", args[1], from);
      if (command.startsWith(".welcome")) toggleFeature("welcome", args[1], from);

      // 🔹 Placeholder for all other commands
      if (allCommands.includes(command) && !command.startsWith(".menu") && !command.startsWith(".auto")) {
        await sock.sendMessage(from, { text: `✅ Command "${command}" received! (Work in progress)` });
      }
    });

    async function toggleFeature(feature, value, from) {
      if (!["on", "off"].includes(value)) {
        await sock.sendMessage(from, { text: `❌ Usage: .${feature} on/off` });
        return;
      }
      settings[feature] = value === "on";
      await sock.sendMessage(from, { text: `${settings[feature] ? "✅ Enabled" : "❌ Disabled"} ${feature}` });
    }

  } catch (err) {
    console.error("❌ Error starting bot:", err);
  }
}

startBot();
