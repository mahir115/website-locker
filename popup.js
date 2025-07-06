const siteList = document.getElementById("site-list");
const addBtn = document.getElementById("addBtn");
const addSection = document.getElementById("add-section");
const urlInput = document.getElementById("urlInput");
const passInput = document.getElementById("passInput");
const confirmInput = document.getElementById("confirmInput");
const lockBtn = document.getElementById("lockSiteBtn");
const message = document.getElementById("message");

const lockUI = document.getElementById("lock-ui");
const setupUI = document.getElementById("setup-ui");
const mainUI = document.getElementById("main-ui");

// Master password handling
const unlockPassword = document.getElementById("unlockPassword");
const unlockBtn = document.getElementById("unlockBtn");
const lockMessage = document.getElementById("lockMessage");

const newMaster = document.getElementById("newMaster");
const confirmMaster = document.getElementById("confirmMaster");
const setMasterBtn = document.getElementById("setMasterBtn");
const setupMessage = document.getElementById("setupMessage");

chrome.storage.local.get("masterPassword", (res) => {
  const saved = res.masterPassword;
  if (!saved) {
    // No master password set yet
    setupUI.style.display = "flex";
  } else {
    lockUI.style.display = "flex";
  }
});

// Setup new master password
setMasterBtn.onclick = () => {
  const p1 = newMaster.value;
  const p2 = confirmMaster.value;
  if (!p1 || !p2) {
    setupMessage.textContent = "Fill both fields.";
    return;
  }
  if (p1 !== p2) {
    setupMessage.textContent = "Passwords do not match.";
    return;
  }
  chrome.storage.local.set({ masterPassword: p1 }, () => {
    setupUI.style.display = "none";
    mainUI.style.display = "block";
    loadLockedSites();
  });
};

// Unlock with existing master password
unlockBtn.onclick = () => {
  const entered = unlockPassword.value;
  chrome.storage.local.get("masterPassword", (res) => {
    if (entered === res.masterPassword) {
      lockUI.style.display = "none";
      mainUI.style.display = "block";
      loadLockedSites();
    } else {
      lockMessage.textContent = "Incorrect password.";
    }
  });
};

// === Website Lock Management ===

function loadLockedSites() {
  siteList.innerHTML = "";
  chrome.storage.local.get("lockedSites", (res) => {
    const sites = res.lockedSites || {};
    for (const domain in sites) {
      const entry = document.createElement("div");
      entry.className = "site-entry";
      entry.innerHTML = `
        <span>${domain}</span>
        <button data-domain="${domain}" class="unlock-btn">remove</button>
      `;
      siteList.appendChild(entry);
    }

    document.querySelectorAll(".unlock-btn").forEach(btn => {
      btn.onclick = () => {
        const domain = btn.getAttribute("data-domain");
        const entered = prompt(`Enter password to remove ${domain}`);
        if (!entered) return;
        chrome.storage.local.get("lockedSites", (res) => {
          const sites = res.lockedSites || {};
          if (sites[domain] === entered) {
            delete sites[domain];
            chrome.storage.local.set({ lockedSites: sites }, loadLockedSites);
          } else {
            alert("Incorrect password.");
          }
        });
      };
    });
  });
}

addBtn.onclick = () => {
  addSection.style.display = addSection.style.display === "flex" ? "none" : "flex";
  message.textContent = "";
};

lockBtn.onclick = () => {
  const url = urlInput.value.trim();
  const pass = passInput.value;
  const confirm = confirmInput.value;

  if (!url || !pass || !confirm) {
    message.textContent = "All fields required.";
    return;
  }
  if (pass !== confirm) {
    message.textContent = "Passwords do not match.";
    return;
  }

  let domain;
  try {
    domain = new URL(url).hostname;
  } catch {
    message.textContent = "Invalid URL.";
    return;
  }

  chrome.storage.local.get("lockedSites", (res) => {
    const sites = res.lockedSites || {};
    sites[domain] = pass;
    chrome.storage.local.set({ lockedSites: sites }, () => {
      urlInput.value = "";
      passInput.value = "";
      confirmInput.value = "";
      addSection.style.display = "none";
      message.textContent = "";
      loadLockedSites();
    });
  });
};
