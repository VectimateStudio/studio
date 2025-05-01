import { getWebcamStream, getScreenStream } from "./capture.js";

const sceneArea = document.getElementById("sceneArea");
const sceneFileInput = document.getElementById("sceneFile");
const sources = {};

let selectedSource = null;
const sourceTitleBar = document.getElementById("sourceTitleBar");
const sourceNameInput = document.getElementById("sourceName");

sourceNameInput.addEventListener("change", () => {
  const name = sourceNameInput.value.trim();
  if (sources[name]) {
    if (selectedSource) selectedSource.classList.remove("selected");
    selectedSource = sources[name];
    selectedSource.classList.add("selected");
    updateTitle(name);
  } else {
    alert("Source not found: " + name);
  }
});
sourceNameInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") sourceNameInput.dispatchEvent(new Event("change"));
});

function updateTitle(name) {
  if (name) {
    sourceTitleBar.textContent = name;
    sourceTitleBar.style.opacity = "1";
  } else {
    sourceTitleBar.style.opacity = "0";
  }
}

function createSource(name, stream, pos = { x: 50, y: 50 }, size = { w: 320, h: 240 }, visible = true) {
  const container = document.createElement("div");
  container.className = "source resizable-corner";
  container.style.left = pos.x + "px";
  container.style.top = pos.y + "px";
  container.style.width = size.w + "px";
  container.style.height = size.h + "px";
  container.style.display = visible ? "block" : "none";

  sources[name] = container;

  makeDraggable(container);
  setupSelection(container);

  sceneArea.appendChild(container);
  return container;
}
function stopMediaStream(el) {
  const video = el.querySelector("video");
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
}


function setupVRMCanvas(container, stream) {
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.display = "none";
  
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  
    container.appendChild(video);
    container.appendChild(canvas);
  
    const ctx = canvas.getContext("2d");
  
    video.addEventListener("loadedmetadata", () => {
      const cropY = 40;
      const checker1 = [170, 170, 170];
      const checker2 = [85, 85, 85];
      const tolerance = 18;
  
      function isCheckerPixel(r, g, b) {
        const close = (a, b) => Math.abs(a - b) < tolerance;
        const match1 = close(r, checker1[0]) && close(g, checker1[1]) && close(b, checker1[2]);
        const match2 = close(r, checker2[0]) && close(g, checker2[1]) && close(b, checker2[2]);
        return match1 || match2;
      }
  
      function loop() {
        if (video.paused || video.ended) return;
      
        const cropX = 300;
        const cropY = 40;
      
        const vw = video.videoWidth;
        const vh = video.videoHeight;
      
        const visibleW = vw - cropX * 2;
        const visibleH = vh - cropY;
      
        const offscreen = document.createElement("canvas");
        offscreen.width = visibleW;
        offscreen.height = visibleH;
        const offCtx = offscreen.getContext("2d");
      
        offCtx.drawImage(video, cropX, cropY, visibleW, visibleH, 0, 0, visibleW, visibleH);
      
        const imageData = offCtx.getImageData(0, 0, visibleW, visibleH);
        const data = imageData.data;
      
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (isCheckerPixel(r, g, b)) data[i + 3] = 0;
        }
      
        offCtx.putImageData(imageData, 0, 0);
      
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
      
        canvas.width = containerW;
        canvas.height = containerH;
      
        ctx.clearRect(0, 0, containerW, containerH);
        ctx.drawImage(offscreen, 0, 0, containerW, containerH);
      
        requestAnimationFrame(loop);
      }
      
  
      loop();
    });
  }
  
function makeDraggable(el) {
  let offsetX, offsetY, dragging = false, resizing = false;

  el.addEventListener("mousedown", e => {
    const isCorner = e.offsetX > el.clientWidth - 20 && e.offsetY > el.clientHeight - 20;
    resizing = isCorner;
    dragging = !isCorner;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (dragging) {
      el.style.left = e.pageX - offsetX + "px";
      el.style.top = e.pageY - offsetY + "px";
    } else if (resizing) {
      el.style.width = e.pageX - el.offsetLeft + "px";
      el.style.height = e.pageY - el.offsetTop + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    resizing = false;
  });
}

function setupSelection(el) {
  el.addEventListener("click", e => {
    e.stopPropagation();
    if (selectedSource) selectedSource.classList.remove("selected");
    selectedSource = el;
    el.classList.add("selected");
    updateTitle(getSourceName(el));
  });
}

document.addEventListener("click", () => {
  if (selectedSource) {
    selectedSource.classList.remove("selected");
    selectedSource = null;
    updateTitle(null);
  }
});

document.addEventListener("keydown", e => {
  if (!selectedSource) return;
  const step = 1;
  const left = parseInt(selectedSource.style.left);
  const top = parseInt(selectedSource.style.top);
  if (e.key === "ArrowLeft") selectedSource.style.left = left - step + "px";
  if (e.key === "ArrowRight") selectedSource.style.left = left + step + "px";
  if (e.key === "ArrowUp") selectedSource.style.top = top - step + "px";
  if (e.key === "ArrowDown") selectedSource.style.top = top + step + "px";
});

(function enableChatDragResize() {
  const chatPanel = document.getElementById("chatPanel");
  let offsetX, offsetY;
  let dragging = false, resizing = false;

  chatPanel.addEventListener("mousedown", e => {
    const rect = chatPanel.getBoundingClientRect();
    const isCorner = e.offsetX > rect.width - 20 && e.offsetY > rect.height - 20;
    resizing = isCorner;
    dragging = !isCorner;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (dragging) {
      chatPanel.style.left = e.clientX - offsetX + "px";
      chatPanel.style.top = e.clientY - offsetY + "px";
      chatPanel.style.right = "auto";
      chatPanel.style.bottom = "auto";
    } else if (resizing) {
      const newWidth = e.clientX - chatPanel.getBoundingClientRect().left;
      const newHeight = e.clientY - chatPanel.getBoundingClientRect().top;
      chatPanel.style.width = newWidth + "px";
      chatPanel.style.height = newHeight + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    resizing = false;
  });
})();

function getSourceName(el) {
  return Object.keys(sources).find(name => sources[name] === el);
}

document.getElementById("addWebcam").onclick = async () => {
  const name = "webcam" + Object.keys(sources).filter(n => n.startsWith("webcam")).length;
  const stream = await getWebcamStream();
  if (stream) {
    const el = createSource(name, stream);
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    el.appendChild(video);
  }
};

document.getElementById("addScreen").onclick = async () => {
  const name = "screen" + Object.keys(sources).filter(n => n.startsWith("screen")).length;
  const stream = await getScreenStream();
  if (stream) {
    const el = createSource(name, stream);
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    el.appendChild(video);
  }
};

let toggleKey = null;

const toggleInput = document.getElementById("toggleKeyInput");
toggleInput.addEventListener("input", () => {
  const val = toggleInput.value.trim().toLowerCase();
  toggleKey = val.length === 1 ? val : null;
});

function getSourceByNameOrSelection() {
  if (selectedSource) return selectedSource;
  const name = sourceNameInput.value.trim();
  if (name && sources[name]) return sources[name];
  return null;
}

document.getElementById("addVRMScreen").onclick = async () => {
  const name = "vrm" + Object.keys(sources).filter(n => n.startsWith("vrm")).length;
  const stream = await getScreenStream();
  if (stream) {
    const el = createSource(name, stream);
    el.classList.add("vrm-screen");
    setupVRMCanvas(el, stream);
  }
};

document.getElementById("removeSource").onclick = () => {
  if (selectedSource) {
    stopMediaStream(selectedSource);
    selectedSource.remove();
    delete sources[getSourceName(selectedSource)];
    selectedSource = null;
    updateTitle(null);
  }
};

document.getElementById("hideSource").onclick = () => {
  const name = sourceNameInput.value.trim();
  const source = name && sources[name];
  if (selectedSource) {
    selectedSource.style.display = "none";
    updateTitle(getSourceName(selectedSource));
  } else if (source) {
    source.style.display = "none";
    selectedSource = source;
    source.classList.add("selected");
    updateTitle(name);
  } else {
    alert("No source selected or found.");
  }
};

document.getElementById("showSource").onclick = () => {
  const name = sourceNameInput.value.trim();
  const source = name && sources[name];
  if (selectedSource) {
    selectedSource.style.display = "block";
    updateTitle(getSourceName(selectedSource));
  } else if (source) {
    source.style.display = "block";
    selectedSource = source;
    source.classList.add("selected");
    updateTitle(name);
  } else {
    alert("No source selected or found.");
  }
};


document.getElementById("saveScene").onclick = () => {
  const layout = Object.entries(sources).map(([name, el]) => ({
    name,
    x: parseInt(el.style.left),
    y: parseInt(el.style.top),
    w: parseInt(el.style.width),
    h: parseInt(el.style.height),
    visible: el.style.display !== "none"
  }));

  const chatPanel = document.getElementById("chatPanel");
  const chatRect = chatPanel.getBoundingClientRect();
  const chatStyle = window.getComputedStyle(chatPanel);
  const chatData = {
    x: parseInt(chatPanel.style.left || chatRect.left),
    y: parseInt(chatPanel.style.top || chatRect.top),
    w: parseInt(chatPanel.style.width || chatRect.width),
    h: parseInt(chatPanel.style.height || chatRect.height)
  };

  const sceneData = { sources: layout, chat: chatData };

  const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "scene.json";
  a.click();
};

const loadedScenes = [];
let currentScene = null;

function clearScene() {
  Object.values(sources).forEach(el => {
    stopMediaStream(el);
    el.remove();
  });
  Object.keys(sources).forEach(k => delete sources[k]);
}

function animateIn(el) {
  el.style.opacity = "0";
  el.style.transition = "opacity 0.5s ease";
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });
}

function renderScene(data) {
  clearScene();

  const { sources: layout = [], chat } = data;

  layout.forEach(async (src) => {
    const stream = src.name.startsWith("webcam")
      ? await getWebcamStream()
      : await getScreenStream();
    if (!stream) return;

    const el = createSource(src.name, stream, { x: src.x, y: src.y }, { w: src.w, h: src.h }, src.visible);
    animateIn(el);

    if (src.name.startsWith("vrm")) {
      el.classList.add("vrm-screen");
      setupVRMCanvas(el, stream);
    } else {
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = stream;
      el.appendChild(video);
    }
  });

  if (chat) {
    const chatPanel = document.getElementById("chatPanel");
    chatPanel.style.left = chat.x + "px";
    chatPanel.style.top = chat.y + "px";
    chatPanel.style.width = chat.w + "px";
    chatPanel.style.height = chat.h + "px";
    chatPanel.style.right = "auto";
    chatPanel.style.bottom = "auto";
  }
}

function updateSceneListUI() {
  const list = document.getElementById("sceneList");
  list.innerHTML = "";
  loadedScenes.forEach((scene, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "6px";

    div.innerHTML = `
      <input type="text" value="${scene.name}" style="width: 80px" />
      <input type="text" value="${scene.key || ''}" maxlength="1" style="width: 24px; text-align: center" />
      <button style="margin-left: 4px">▶</button>
    `;

    const [nameInput, keyInput, playBtn] = div.querySelectorAll("input, button");

    nameInput.addEventListener("input", () => scene.name = nameInput.value);
    keyInput.addEventListener("input", () => scene.key = keyInput.value.toLowerCase());
    playBtn.addEventListener("click", () => {
      currentScene = scene;
      renderScene(scene.data);
    });

    list.appendChild(div);
  });
}

document.getElementById("loadScene").onclick = () => sceneFileInput.click();
sceneFileInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const json = JSON.parse(await file.text());
  const data = Array.isArray(json) ? { sources: json } : json;

  const name = "Scene " + (loadedScenes.length + 1);
  loadedScenes.push({ name, data });
  updateSceneListUI();

  if (loadedScenes.length === 1) {
    currentScene = loadedScenes[0];
    renderScene(currentScene.data);
  }
});

document.addEventListener("keydown", (e) => {
  if (document.activeElement.tagName === "INPUT") return;
  if (!toggleKey) return;

  if (e.key.toLowerCase() === toggleKey) {
    const menu = document.getElementById("topControls");
    const sceneManager = document.getElementById("sceneManager");

    const visible = menu.style.display !== "none";
    menu.style.display = visible ? "none" : "flex";
    sceneManager.style.display = visible ? "none" : "block";
  }

  const key = e.key.toLowerCase();
  const match = loadedScenes.find(scene => scene.key === key);
  if (match) {
    currentScene = match;
    renderScene(match.data);
  }
});
