import tmi from "https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/+esm";

console.log("[chat.js] loaded");

const chatDisplay = document.getElementById("chatDisplay");
const tokenBtn = document.getElementById("importTokenBtn");
const tokenFileInput = document.getElementById("tokenFile");

const emotes = {
  ":D": "354",
  "Kappa": "25",
  "<3": "9"
};

function parseEmotes(text) {
  return text.replace(/(:D|Kappa|<3)/g, match => {
    const id = emotes[match];
    return `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0" height="24">`;
  });
}

function addMessage(user, message) {
  const formatted = parseEmotes(message);
    const html = `<div class="message animate-in">
    <span class="username">${user}:</span>
    <span class="content">${formatted}</span>
    </div>`;
  chatDisplay.insertAdjacentHTML("beforeend", html);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;

  const msgEl = chatDisplay.lastElementChild;
  msgEl.addEventListener("animationend", () => {
    msgEl.classList.remove("animate-in");
  });
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
