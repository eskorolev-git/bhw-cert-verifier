(function () {
  // Generate random background squares mapped to 40px grid
  function generateGridSquares() {
    const squareCount = 25; // Small amount of random squares
    const gridSize = 40;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const cols = Math.floor(screenWidth / gridSize);
    const rows = Math.floor(screenHeight / gridSize);

    for (let i = 0; i < squareCount; i++) {
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      
      const square = document.createElement("div");
      square.className = "bg-square";
      square.style.left = (col * gridSize) + "px";
      square.style.top = (row * gridSize) + "px";
      
      document.body.appendChild(square);
    }
  }

  generateGridSquares();
  window.addEventListener('resize', () => {
    document.querySelectorAll('.bg-square').forEach(el => el.remove());
    generateGridSquares();
  });

  // Verification Logic
  var mainContent = document.getElementById("mainContent");
  var topBar = document.getElementById("topBar");
  var headerContainer = document.getElementById("headerContainer");
  var ID_RE = /^[A-Z0-9-]{6,40}$/;
  var id = (new URLSearchParams(location.search).get("id") || "").trim().toUpperCase();

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var CHECK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  var CROSS = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';

  function lookupForm() {
    var container = el("div", "lookup-container");
    var p = el("p", "", "Enter a control number or scan the qr code");
    var f = el("form");
    var i = el("input");
    i.placeholder = "CPEWR-2026-001-NNNN";
    i.setAttribute("aria-label", "Control number");
    i.autocomplete = "off";
    i.value = id;

    var b = el("button", "", "Verify");
    b.type = "submit";

    f.append(i, b);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      location.search = "?id=" + encodeURIComponent(i.value.trim());
    });

    container.append(p, f);
    return container;
  }

  function status(ok, text) {
    var s = el("div", "status " + (ok ? "ok" : "bad"));
    s.innerHTML = ok ? CHECK : CROSS;
    s.appendChild(el("span", "", text));
    return s;
  }

  function notFound(msg) {
    var panel = el("div", "details-panel");
    panel.style.margin = "0 auto";
    var body = el("div", "details-body");
    body.append(
      status(false, msg),
      el("p", "verification-note", "Check the control number printed on the certificate, or scan its QR code again."),
      lookupForm()
    );
    panel.appendChild(body);
    mainContent.replaceChildren(panel);
  }

  if (!id) {
    mainContent.replaceChildren(lookupForm());
    return;
  }

  if (!ID_RE.test(id)) {
    notFound("Not a valid control number");
    return;
  }

  fetch("records/" + id + ".json", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("nf");
      return r.json();
    })
    .then(function (d) {
      topBar.style.display = "block";
      headerContainer.style.transform = "scale(0.8)";
      headerContainer.style.marginBottom = "10px";

      var resultContainer = el("div", "result-container");
      
      // Left side: Preview Wrapper
      var previewWrapper = el("div", "preview-wrapper");
      var previewPanel = el("div", "preview-panel");
      
      // Preview Image
      var previewImg = el("img", "cert-preview-img");
      // Fallback to a placeholder if d.image is not defined in your json
      previewImg.src = d.image || "preview-placeholder.jpg"; 
      previewImg.alt = "Certificate Preview";
      
      previewPanel.appendChild(previewImg);

      if (d.pdf) {
        var a = el("a", "view-btn", "View Digital Copy");
        a.href = d.pdf;
        a.target = "_blank";
        a.rel = "noopener";
        previewPanel.appendChild(a);
      }

      var note = el("p", "preview-note", "Lost your certificate? You can view and save the digital copy of your certificate here. It is unsigned. The printed copy carries the handwritten signature of the subject adviser.");
      
      previewWrapper.append(previewPanel, note);

      // Right side: Details
      var detailsPanel = el("div", "details-panel");
      
      // Header for the Details panel (Thick upper border area)
      var detailsHeader = el("div", "details-header");
      detailsHeader.appendChild(status(true, "Valid Certificate"));
      
      // Body for Details
      var detailsBody = el("div", "details-body");
      var dl = el("dl");
      [
        ["Event", d.event],
        ["Date", d.date],
        ["Control no.", d.id]
      ].forEach(function (p) {
        dl.append(el("dt", "", p[0]), el("dd", "", p[1]));
      });

      var verificationNote = el(
        "p",
        "verification-note",
        "This certificate verifies that " + d.name + " participated in the stated event, organized as part of the RTU Boni CpE Seminars and Field Trips subject."
      );

      detailsBody.append(
        el("div", "award-label", "Awarded to"),
        el("h2", "name", d.name),
        verificationNote,
        dl
      );

      detailsPanel.append(detailsHeader, detailsBody);
      resultContainer.append(previewWrapper, detailsPanel);
      mainContent.replaceChildren(resultContainer);
    })
    .catch(function () {
      notFound("No certificate found for " + id);
    });
})();
