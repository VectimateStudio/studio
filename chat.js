import tmi from "https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/+esm";

console.log("[chat.js] loaded");

const chatDisplay = document.getElementById("chatDisplay");
const tokenBtn = document.getElementById("importTokenBtn");
const tokenFileInput = document.getElementById("tokenFile");

function addMessage(user, message) {
  // Placeholder — actual implementation replaced by mod
  const html = `<div class="message">
    <span class="username">${user}:</span>
    <span class="content">${message}</span>
  </div>`;
  chatDisplay.insertAdjacentHTML("beforeend", html);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function connectToTwitch(token, username) {
  console.log(`[chat.js] Connecting as ${username}`);

  const client = new tmi.Client({
    identity: {
      username,
      password: token
    },
    channels: [username]
  });

  client.connect().catch(err => console.error("Failed to connect:", err));

  client.on("message", (channel, tags, message, self) => {
    if (!self) {
      addMessage(tags["display-name"] || tags["username"], message);
    }
  });
}

if (tokenBtn && tokenFileInput) {
  tokenBtn.onclick = () => {
    console.log("[chat.js] Import button clicked");
    tokenFileInput.click();
  };

  tokenFileInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    console.log(`[chat.js] Reading file: ${file.name}`);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const token = data.token;
      const username = data.username;

      if (token && username) {
        connectToTwitch(token, username);
      } else {
        alert("token.json is missing 'token' or 'username'.");
      }
    } catch (err) {
      alert("Failed to parse token.json: " + err.message);
    }
  };
} else {
  console.error("[chat.js] Could not find import button or file input.");
}
