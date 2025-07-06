const unlockedTabs = new Map();

chrome.webNavigation.onBeforeNavigate.addListener(({ tabId, url, frameId }) => {
  if (frameId !== 0) return; // Only top frame

  try {
    const domain = new URL(url).hostname;
    if (unlockedTabs.has(`${tabId}:${domain}`)) return;

    chrome.storage.local.get("lockedSites", (res) => {
      const locked = res.lockedSites || {};
      if (locked[domain]) {
        // Redirect tab to blocked.html with original url as param
        const redirectUrl = chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(url);
        chrome.tabs.update(tabId, { url: redirectUrl });
      }
    });
  } catch {
    // Invalid URL, ignore
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!sender.tab) return;

  if (msg.type === "unlockTab") {
    const domain = new URL(msg.url).hostname;
    unlockedTabs.set(`${sender.tab.id}:${domain}`, true);
    sendResponse({ success: true });
  }

  if (msg.type === "checkUnlocked") {
    const domain = new URL(msg.url).hostname;
    const key = `${sender.tab.id}:${domain}`;
    sendResponse({ unlocked: unlockedTabs.has(key) });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  for (const key of unlockedTabs.keys()) {
    if (key.startsWith(tabId + ":")) {
      unlockedTabs.delete(key);
    }
  }
});
