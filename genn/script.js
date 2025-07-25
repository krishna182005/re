// Certificate Generator (Open Source, All Features Free)
// Modular, localStorage, responsive, drag+resize, dark mode

(() => {
  // ----------- State and Constants -----------
  const TEMPLATES = {
     custom: {
      bg: "#f0f4ff",
      accent: "#2563eb",
      img: "",
      font: "serif"
    },
    classic: { bg: "#f9f3e6", accent: "#4a6fa5", img: "templates/classic.png", font: "serif" },
    modern: { bg: "#e6f3f9", accent: "#166088", img: "templates/modern.png", font: "sans-serif" },
    elegant: { bg: "#f9e6f3", accent: "#a65aa5", img: "templates/elegant.png", font: "'Garamond', serif" },
    premium1: { bg: "#e6f9e8", accent: "#14b89c", img: "templates/premium1.png", font: "Georgia,serif" },
    premium2: { bg: "#f3e6f9", accent: "#a05ad3", img: "templates/premium2.png", font: "Arial,sans-serif" },
  };
  const DEFAULTS = {
    name: "your name!",
    course: "for successfully completing the Web Development Course or do nothing!",
    org: "Your Institute Name",
    date: (new Date()).toISOString().split("T")[0],
    certid: "",
    font: "serif",
    fontSize: 26,
    accent: "#4a6fa5",
    template: "classic",
    sig1: "Tony Stark",
    sig1title: "Course Instructor",
    sig2: "Thor",
    sig2title: "Head of Department",
    watermarkOn: true,
    qr: false,
    branding: true,
    positions: {}
  };
  let state = {};
  let dragMode = false;
  let dragging = null;
  let dragOffset = [0, 0];
  let logoDataURL = "";
  let sig1URL = "";
  let sig2URL = "";
  let customTemplateURL = localStorage.getItem("customTemplateURL") || "";

  // ----------- DOM Utility -----------
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // ----------- Local Storage -----------
  function saveSettings() {
    localStorage.setItem("certgen_settings", JSON.stringify({
      ...state,
      logoDataURL, sig1URL, sig2URL
    }));
  }
  function loadSettings() {
    let s = {};
    try {
      s = JSON.parse(localStorage.getItem("certgen_settings") || "{}");
    } catch {}
    if (!s || typeof s !== "object") s = {};
    Object.assign(state, DEFAULTS, s);
    logoDataURL = s.logoDataURL || "";
    sig1URL = s.sig1URL || "";
    sig2URL = s.sig2URL || "";
  }

  // ----------- Certificate ID Logic -----------
  function generateCertID() {
    const dt = new Date(state.date || new Date());
    const y = dt.getFullYear();
    let base = `CERT${y}-`;
    let n = Math.floor(Math.random() * 9000 + 1000);
    return base + n;
  }

  // ----------- UI: Tabs and Mode -----------
  function setupTabs() {
    $$('.tablink').forEach(tab => {
      tab.addEventListener("click", () => {
        $$('.tablink').forEach(t => t.classList.remove("border-b-2", "border-blue-500", "text-blue-600"));
        tab.classList.add("border-b-2", "border-blue-500", "text-blue-600");
        $$('.tab-content').forEach(tc => tc.classList.add("hidden"));
        $(`#tab-${tab.dataset.tab}`).classList.remove("hidden");
      });
    });
  }
  function setupModeToggle() {
    const btn = $("#modeToggle");
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      if(document.body.classList.contains("dark")) {
        btn.querySelector(".fa-moon").classList.remove("hidden");
        btn.querySelector(".fa-sun").classList.add("hidden");
        $("#modeLabel").textContent = "Dark";
      } else {
        btn.querySelector(".fa-moon").classList.add("hidden");
        btn.querySelector(".fa-sun").classList.remove("hidden");
        $("#modeLabel").textContent = "Light";
      }
      saveSettings();
      renderCertificate();
    });
    // Init
    if (state.darkMode || window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add("dark");
      $("#modeLabel").textContent = "Dark";
      btn.querySelector(".fa-moon").classList.remove("hidden");
      btn.querySelector(".fa-sun").classList.add("hidden");
    }
  }

  // ----------- UI: Inputs & Events -----------
  function setupInputs() {
    // Template thumbs
    $$('.template-thumb').forEach(btn => {
      btn.addEventListener("click", () => {
        let tmpl = btn.dataset.template;
        $$('.template-thumb').forEach(b => b.classList.remove("border-blue-500", "ring-2", "ring-blue-400"));
        btn.classList.add("border-blue-500", "ring-2", "ring-blue-400");
        state.template = tmpl;
        state.accent = TEMPLATES[tmpl].accent;
        state.font = TEMPLATES[tmpl].font;
        $("#accentColor").value = state.accent;
        $("#fontFamily").value = state.font;
        saveSettings();
        renderCertificate();
      });
    });

    // Main inputs
    $("#inputName").addEventListener("input", e => { state.name = e.target.value; saveSettings(); renderCertificate(); });
    $("#inputCourse").addEventListener("input", e => { state.course = e.target.value; saveSettings(); renderCertificate(); });
    $("#inputOrg").addEventListener("input", e => { state.org = e.target.value; saveSettings(); renderCertificate(); });
    $("#inputDate").addEventListener("input", e => { state.date = e.target.value; saveSettings(); renderCertificate(); });
    $("#inputCertID").addEventListener("input", e => { state.certid = e.target.value; saveSettings(); renderCertificate(); });

    // Design
    $("#fontFamily").addEventListener("change", e => { state.font = e.target.value; saveSettings(); renderCertificate(); });
    $("#fontSize").addEventListener("input", e => { state.fontSize = +e.target.value; saveSettings(); renderCertificate(); });
    $("#accentColor").addEventListener("input", e => { state.accent = e.target.value; saveSettings(); renderCertificate(); });
    $("#toggleWatermark").addEventListener("change", e => { state.watermarkOn = !e.target.checked; saveSettings(); renderCertificate(); });
    $("#toggleQR").addEventListener("change", e => { state.qr = e.target.checked; saveSettings(); renderCertificate(); });

    // Advanced
    $("#sig1Name").addEventListener("input", e => { state.sig1 = e.target.value; saveSettings(); renderCertificate(); });
    $("#sig1Title").addEventListener("input", e => { state.sig1title = e.target.value; saveSettings(); renderCertificate(); });
    $("#sig2Name").addEventListener("input", e => { state.sig2 = e.target.value; saveSettings(); renderCertificate(); });
    $("#sig2Title").addEventListener("input", e => { state.sig2title = e.target.value; saveSettings(); renderCertificate(); });

    // Logo and signatures
    $("#logoUpload").addEventListener("change", e => { handleImageUpload(e.target.files[0], "logo"); });
    $("#sigUpload1").addEventListener("change", e => { handleImageUpload(e.target.files[0], "sig1"); });
    $("#sigUpload2").addEventListener("change", e => { handleImageUpload(e.target.files[0], "sig2"); });

    // CSV bulk
    $("#csvUpload").addEventListener("change", handleCSVUpload);

    // Reset/Drag
    $("#btnReset").addEventListener("click", () => { if(confirm("Reset form and all settings?")) { resetForm(); } });
    $("#btnResetPos").addEventListener("click", resetPositions);
    $("#btnDragToggle").addEventListener("click", toggleDragMode);

    // Export
    $("#btnDownloadPNG").addEventListener("click", () => { exportPNG(); });
    $("#btnDownloadPDF").addEventListener("click", () => { exportPDF(); });
    $("#btnDownloadZIP").addEventListener("click", () => { bulkExportZIP(); });
    $("#btnEmail").addEventListener("click", () => { mockEmail(); });
    $("#btnPrint").addEventListener("click", () => { window.print(); });

    // Custom template upload
    $("#customTemplateBtn").addEventListener("click", () => {
      $("#customTemplateUpload").click();
    });
    $("#customTemplateUpload").addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        customTemplateURL = evt.target.result;
        localStorage.setItem("customTemplateURL", customTemplateURL);
        state.template = "custom";
        saveSettings();
        renderCertificate();
        document.querySelectorAll(".template-thumb").forEach(b => b.classList.remove("border-blue-500", "ring-2", "ring-blue-400"));
        document.getElementById("customTemplateBtn").classList.add("border-blue-500", "ring-2", "ring-blue-400");
      };
      reader.readAsDataURL(file);
    });
  }

  // ----------- UI: Drag & Drop -----------
  function toggleDragMode() {
    dragMode = !dragMode;
    $("#btnDragToggle").classList.toggle("bg-indigo-700", dragMode);
    renderCertificate();
  }
  function makeDraggable(el, fieldKey) {
    el.style.position = "absolute";
    let pos = (state.positions[state.template] || {})[fieldKey];
    if (!pos) pos = getDefaultPos(fieldKey);
    el.style.left = pos[0] + "px";
    el.style.top = pos[1] + "px";
    el.draggable = false;
    let handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.innerHTML = "<i class='fa-solid fa-up-down-left-right'></i>";
    el.appendChild(handle);
    handle.addEventListener("mousedown", evt => {
      dragging = { el, fieldKey };
      dragOffset = [evt.offsetX, evt.offsetY];
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag);
      evt.stopPropagation();
      evt.preventDefault();
    });
  }
  function onDrag(evt) {
    if (!dragging) return;
    let el = dragging.el;
    let x = evt.clientX - $("#certificateCanvas").getBoundingClientRect().left - dragOffset[0];
    let y = evt.clientY - $("#certificateCanvas").getBoundingClientRect().top - dragOffset[1];
    x = Math.max(0, Math.min(x, $("#certificateCanvas").offsetWidth - el.offsetWidth));
    y = Math.max(0, Math.min(y, $("#certificateCanvas").offsetHeight - el.offsetHeight));
    el.style.left = x + "px";
    el.style.top = y + "px";
  }
  function stopDrag(evt) {
    if (!dragging) return;
    let el = dragging.el, fieldKey = dragging.fieldKey;
    let x = parseInt(el.style.left), y = parseInt(el.style.top);
    if (!state.positions[state.template]) state.positions[state.template] = {};
    state.positions[state.template][fieldKey] = [x, y];
    dragging = null;
    saveSettings();
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }
  function resetPositions() {
    if(confirm("Reset all text positions?")) {
      state.positions = {};
      saveSettings();
      renderCertificate();
    }
  }
  function getDefaultPos(fieldKey) {
    const W = 850, H = 600;
    switch(fieldKey) {
      case "title": return [W/2-200,80];
      case "name": return [W/2-180,180];
      case "course": return [W/2-200,230];
      case "org": return [W/2-120,320];
      case "date": return [W/2-250,370];
      case "certid": return [W/2+100,370];
      case "sig1block": return [W/2-280,480];
      case "sig2block": return [W/2+60,480];
      default: return [W/2-100, H/2];
    }
  }

  // ----------- Certificate Rendering -----------
  function renderCertificate() {
    const c = document.getElementById("certificateCanvas");
    c.innerHTML = "";
    let tmpl = TEMPLATES[state.template] || TEMPLATES.classic;
    c.style.background = tmpl.bg;
    let bgimg = document.createElement("img");
    bgimg.className = "absolute w-full h-full object-cover top-0 left-0 pointer-events-none select-none opacity-20";
    if (state.template === "custom" && customTemplateURL) {
      bgimg.src = customTemplateURL;
    } else if (TEMPLATES[state.template] && TEMPLATES[state.template].img) {
      bgimg.src = TEMPLATES[state.template].img;
    } else {
      bgimg = null;
    }
    if(bgimg) c.appendChild(bgimg);
    if(logoDataURL) {
      let logo = document.createElement("img");
      logo.src = logoDataURL;
      logo.className = "absolute left-8 top-8 w-28 h-28 object-contain pointer-events-none select-none";
      c.appendChild(logo);
    }
    let title = mkField("title", state.course ? "Certificate of Achievement" : "Certificate", "font-bold", state.fontSize + 10, state.accent);
    let name = mkField("name", state.name || DEFAULTS.name, "font-bold", state.fontSize + 6, "#222");
    let course = mkField("course", state.course || DEFAULTS.course, "", state.fontSize, "#444");
    let org = mkField("org", state.org || DEFAULTS.org, "italic", state.fontSize, state.accent);
    let date = mkField("date", "Date: " + (state.date || DEFAULTS.date), "", state.fontSize-2, "#666");
    let certid = mkField("certid", "ID: " + (state.certid ? state.certid : (state.certid = generateCertID())), "", state.fontSize-2, "#666");
    let sig1Block = document.createElement("div");
    sig1Block.className = "text-center";
    sig1Block.style.width = "220px";
    sig1Block.innerHTML = `
      <div style="height:36px">${sig1URL ? `<img src="${sig1URL}" class="h-8 mx-auto" />` : ""}</div>
      <div class="font-semibold">${state.sig1 || DEFAULTS.sig1}</div>
      <div class="text-xs text-gray-500">${state.sig1title || DEFAULTS.sig1title}</div>
    `;
    let sig2Block = document.createElement("div");
    sig2Block.className = "text-center";
    sig2Block.style.width = "220px";
    sig2Block.innerHTML = `
      <div style="height:36px">${sig2URL ? `<img src="${sig2URL}" class="h-8 mx-auto" />` : ""}</div>
      <div class="font-semibold">${state.sig2 || DEFAULTS.sig2}</div>
      <div class="text-xs text-gray-500">${state.sig2title || DEFAULTS.sig2title}</div>
    `;
    if(state.watermarkOn) {
      let wmark = document.createElement("div");
      wmark.className = "certificate-watermark";
      wmark.textContent = "Verified Certificate";
      c.appendChild(wmark);
    }
    // Branding REMOVED
    if(state.qr) {
      let qrdiv = document.createElement("div");
      qrdiv.id = "qrDiv";
      qrdiv.className = "absolute right-10 bottom-10 bg-white/80 rounded shadow p-2";
      c.appendChild(qrdiv);
      let url = `https://certgen.app/verify?certid=${encodeURIComponent(state.certid)}&name=${encodeURIComponent(state.name)}`;
      QRCode.toCanvas(qrdiv, url, { width: 80, margin: 1 }, err=>{});
    }
    if(dragMode) {
      makeDraggable(title, "title");
      makeDraggable(name, "name");
      makeDraggable(course, "course");
      makeDraggable(org, "org");
      makeDraggable(date, "date");
      makeDraggable(certid, "certid");
      makeDraggable(sig1Block, "sig1block");
      makeDraggable(sig2Block, "sig2block");
    } else {
      setStaticPos(title, "title");
      setStaticPos(name, "name");
      setStaticPos(course, "course");
      setStaticPos(org, "org");
      setStaticPos(date, "date");
      setStaticPos(certid, "certid");
      setStaticPos(sig1Block, "sig1block");
      setStaticPos(sig2Block, "sig2block");
    }
    c.appendChild(title);
    c.appendChild(name);
    c.appendChild(course);
    c.appendChild(org);
    c.appendChild(date);
    c.appendChild(certid);
    c.appendChild(sig1Block);
    c.appendChild(sig2Block);
  }
  function mkField(field, val, extraCls, fsize, color) {
    let el = document.createElement("div");
    el.className = `select-none absolute ${extraCls||""}`;
    el.style.fontFamily = state.font;
    el.style.fontSize = (fsize || state.fontSize) + "px";
    el.style.color = color || "#222";
    el.textContent = val;
    return el;
  }
  function setStaticPos(el, field) {
    let pos = (state.positions[state.template]||{})[field] || getDefaultPos(field);
    el.style.position = "absolute";
    el.style.left = pos[0] + "px";
    el.style.top = pos[1] + "px";
  }

  // ----------- Image Uploads -----------
  function handleImageUpload(file, type) {
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
      if (type === "logo") logoDataURL = e.target.result;
      if (type === "sig1") sig1URL = e.target.result;
      if (type === "sig2") sig2URL = e.target.result;
      saveSettings();
      renderCertificate();
    };
    reader.readAsDataURL(file);
  }

  // ----------- CSV Bulk Generation/ZIP -----------
  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: function(results) {
        let rows = results.data.filter(r=>r[0]);
        if(rows.length < 1) return alert("No valid data in CSV.");
        bulkGenerateCerts(rows);
      }
    });
  }
  async function bulkGenerateCerts(rows) {
    let zip = new JSZip();
    let orgBak = state.org;
    for (let i=0;i<rows.length;i++) {
      let [name, course, date, org] = rows[i];
      state.name = name;
      state.course = course || "";
      state.date = date || DEFAULTS.date;
      state.org = org || orgBak;
      state.certid = generateCertID();
      renderCertificate();
      await new Promise(r=>setTimeout(r, 250));
      let blob = await exportPNGBlob();
      zip.file(`${state.name.replace(/\s/g,"_")}_certificate.png`, blob);
    }
    let content = await zip.generateAsync({type:"blob"});
    let a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "certificates.zip";
    a.click();
    saveSettings();
    state.org = orgBak;
    renderCertificate();
  }

  // ----------- Exporting -----------
  function exportPNG() {
    exportPNGBlob().then(blob => {
      let a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${state.name.replace(/\s/g,"_")}_certificate.png`;
      a.click();
    });
  }
  async function exportPNGBlob() {
    let canvas = await html2canvas($("#certificateCanvas"), {backgroundColor: null, scale: 2});
    return await new Promise(resolve => canvas.toBlob(blob => resolve(blob), "image/png", 1.0));
  }
  function exportPDF() {
    html2canvas($("#certificateCanvas"), {backgroundColor: null, scale: 2}).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new window.jspdf.jsPDF('landscape', undefined, [canvas.width/2.6,canvas.height/2.6]);
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`${state.name.replace(/\s/g,"_")}_certificate.pdf`);
    });
  }

  // ----------- Email (mock) -----------
  function mockEmail() {
    alert("Mock: Certificate sent to recipient's email address! (No actual email sent in open source mode.)");
  }

  // ----------- Reset Form -----------
  function resetForm() {
    state = {...DEFAULTS};
    logoDataURL = "";
    sig1URL = "";
    sig2URL = "";
    saveSettings();
    renderCertificate();
    $("#inputName").value = "";
    $("#inputCourse").value = "";
    $("#inputOrg").value = "";
    $("#inputDate").value = state.date;
    $("#inputCertID").value = "";
    $("#sig1Name").value = "";
    $("#sig1Title").value = "";
    $("#sig2Name").value = "";
    $("#sig2Title").value = "";
    $("#logoUpload").value = "";
    $("#sigUpload1").value = "";
    $("#sigUpload2").value = "";
    $("#toggleWatermark").checked = false;
    $("#toggleQR").checked = false;
    $("#fontFamily").value = state.font;
    $("#fontSize").value = state.fontSize;
    $("#accentColor").value = state.accent;
  }

  // ----------- Init -----------
  function init() {
    state = {...DEFAULTS};
    loadSettings();
    setupTabs();
    setupModeToggle();
    setupInputs();
    $("#inputName").value = state.name;
    $("#inputCourse").value = state.course;
    $("#inputOrg").value = state.org;
    $("#inputDate").value = state.date;
    $("#inputCertID").value = state.certid;
    $("#sig1Name").value = state.sig1;
    $("#sig1Title").value = state.sig1title;
    $("#sig2Name").value = state.sig2;
    $("#sig2Title").value = state.sig2title;
    $("#fontFamily").value = state.font;
    $("#fontSize").value = state.fontSize;
    $("#accentColor").value = state.accent;
    $("#toggleWatermark").checked = !state.watermarkOn;
    $("#toggleQR").checked = !!state.qr;
    renderCertificate();
  }

  window.addEventListener("DOMContentLoaded", init);

})();
