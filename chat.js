import tmi from "https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/+esm";

console.log("[chat.js] loaded");

const chatDisplay = document.getElementById("chatDisplay");
const tokenBtn = document.getElementById("importTokenBtn");
const tokenFileInput = document.getElementById("tokenFile");

const defaultEmotes = {
  ":D": "354",
  "Kappa": "25",
  "<3": "9",
  "CoolStoryBob": "123171",
  "PogChamp": "305954156",
  "LUL": "425618",
  "4Head": "354",
  "FailFish": "360",
  "Kreygasm": "41",
  "ResidentSleeper": "245",
  "VoHiYo": "81273",
  "HeyGuys": "30259",
  "SeemsGood": "64138",
  "NotLikeThis": "58765",
  "TwitchRPG": "1220085",
  "BloodTrail": "69",
  "PJSalt": "36",
  "SwiftRage": "34",
  "Keepo": "1902",
  "KappaPride": "55338",
  "OSfrog": "81249",
  "WutFace": "28087",
  "MVGame": "142140",
  "KAPOW": "980879",
  "PogBones": "899249",
  "RuleFive": "107030",
  "TriHard": "171",
  "FrankerZ": "65"
};

const emotes = { ...defaultEmotes };

function parseEmotes(message) {
  const keys = Object.keys(emotes)
    .sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const pattern = new RegExp("(" + keys.join("|") + ")", "g");

  return message.replace(pattern, match => {
    const id = emotes[match];
    return `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0" height="24" alt="${match}">`;
  });
}

function addMessage(userHtml, messageText) {
  const parsed = parseEmotes(messageText);
  const html = `<div class="message">
    ${userHtml}
    <span class="content">${parsed}</span>
  </div>`;
  chatDisplay.insertAdjacentHTML("beforeend", html);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

let overrideAddMessage = null;

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
    if (self) return;
    const user = tags["display-name"] || tags["username"];
    const userHtml = `<span class="username">${user}:</span>`;
    if (overrideAddMessage) {
      overrideAddMessage(userHtml, message, tags);
    } else {
      addMessage(userHtml, message);
    }
  });

  if (typeof VectimateChatAPI.onConnected === "function") {
    VectimateChatAPI.onConnected(client);
  }

  return client;
}


window.VectimateChatAPI = {
  addMessage,
  parseEmotes,
  emotes,
  registerEmotes: (newSet) => Object.assign(emotes, newSet),
  overrideAddMessage: (fn) => overrideAddMessage = fn,
  onConnected: null,
  connectToTwitch,
  getChatDisplay: () => chatDisplay
};


if (tokenBtn && tokenFileInput) {
  tokenBtn.onclick = () => tokenFileInput.click();

  tokenFileInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

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
