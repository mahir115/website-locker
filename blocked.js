(() => {
  const urlParams = new URLSearchParams(location.search);
  const realSite = urlParams.get("site");
  if (!realSite) {
    document.body.innerHTML = "<h2>Error: No site specified</h2>";
    return;
  }
  const domain = new URL(realSite).hostname;

  document.getElementById("unlock").onclick = () => {
    const entered = document.getElementById("password").value;

    chrome.storage.local.get("lockedSites", (res) => {
      const locked = res.lockedSites || {};
      const correct = locked[domain];

      if (entered === correct) {
        chrome.runtime.sendMessage({ type: "unlockTab", url: realSite }, (resp) => {
          if (resp.success) {
            // Redirect to real site after successful unlock
            location.href = realSite;
          }
        });
      } else {
        document.getElementById("error").textContent = "Incorrect password.";
      }
    });
  };
})();
