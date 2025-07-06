(async () => {
  const currentURL = location.href;
  const currentDomain = location.hostname;

  const unlocked = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "checkUnlocked", url: currentURL }, resolve);
  });

  if (unlocked.unlocked) {
    // Already unlocked this tab+domain, do nothing
    return;
  }

  chrome.storage.local.get("lockedSites", (res) => {
    const locked = res.lockedSites || {};
    if (!locked[currentDomain]) {
      // Not locked, do nothing
      return;
    }

    // Inject password overlay iframe or div and block interaction
    const overlay = document.createElement("iframe");
    overlay.src = chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(currentURL);
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      border: "none",
      zIndex: "9999999",
      backgroundColor: "rgba(0,0,0,0.9)",
    });
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.appendChild(overlay);
  });
})();
