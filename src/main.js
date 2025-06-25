// 全域變數
let currentFont = null;
let canvas = document.getElementById("previewCanvas");
let ctx = canvas.getContext("2d");
let currentPreviewBg = "checker"; // 預設為灰白相間
let currentMode = "engineer"; // 追蹤當前模式：engineer 或 baby
let currentLanguage = "zh"; // 追蹤當前語言：zh 或 en
let activeToasts = []; // 追蹤當前活躍的 toast 訊息
let translations = {}; // 存放當前語言的翻譯

// 設定預設畫布大小
canvas.width = 400;
canvas.height = 200;

// 確保 canvas 支援透明背景
ctx.globalAlpha = 1.0;

// 初始化
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners();
  updateDownloadButtonText();
  updatePreviewBackground();
  renderPreview();
  preloadButtonFonts();
  updateUILanguage(currentLanguage); // 初始化語言
  updateUIVisibility(currentMode); // 初始化UI
});

function showWelcomeMessage() {
  showMessage(translations.welcomeMessage, "success");
}

// 更新當前字體顯示
function updateCurrentFontDisplay(text, i18nKey = null) {
  const displayEl = document.getElementById("currentFontDisplay");
  displayEl.textContent = text;
  if (i18nKey) {
    displayEl.dataset.i18nKey = i18nKey;
  } else {
    displayEl.removeAttribute("data-i18n-key");
  }
}

// 收起/展開字體設定區域
function toggleFontSection() {
  const content = document.getElementById("fontSectionContent");
  const icon = document.getElementById("fontToggleIcon");
  const isCollapsed = content.style.maxHeight === "0px";

  if (isCollapsed) {
    // 展開
    content.style.maxHeight = content.scrollHeight + "px";
    icon.style.transform = "rotate(0deg)";
  } else {
    // 收起
    content.style.maxHeight = "0px";
    icon.style.transform = "rotate(-90deg)";
  }
}

// 預載入按鈕字體
async function preloadButtonFonts() {
  const fontConfigs = [
    { path: "/fonts/cute.ttf", name: "CuteFont", buttonId: "loadCuteFont" },
    { path: "/fonts/game.ttf", name: "GameFont", buttonId: "loadGameFont" },
    {
      path: "/fonts/hacker.otf",
      name: "HackerFont",
      buttonId: "loadHackerFont",
    },
    { path: "/fonts/magic.ttf", name: "MagicFont", buttonId: "loadMagicFont" },
    { path: "/fonts/noto.ttf", name: "NotoFont", buttonId: "loadNotoFont" },
    {
      path: "/fonts/martial.otf",
      name: "MartialFont",
      buttonId: "loadMartialFont",
    },
    { path: "/fonts/write.ttf", name: "WriteFont", buttonId: "loadWriteFont" },
    {
      path: "/fonts/mordan.otf",
      name: "MordanFont",
      buttonId: "loadMordanFont",
    },
  ];

  console.log("🔄 開始預載入按鈕字體...");

  for (const config of fontConfigs) {
    try {
      const response = await fetch(config.path);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const fontFace = new FontFace(config.name, arrayBuffer);
        await fontFace.load();
        document.fonts.add(fontFace);

        // 字體載入成功後，按鈕會自動應用CSS中定義的字體樣式
        console.log(`✅ ${config.name} 按鈕字體載入成功`);
      } else {
        console.warn(
          `⚠️ ${config.name} 按鈕字體載入失敗: HTTP ${response.status}`
        );
      }
    } catch (error) {
      console.warn(`⚠️ ${config.name} 按鈕字體載入失敗:`, error.message);
      // 載入失敗時會使用CSS中定義的備用字體
    }
  }

  // 如果是透過檔案系統開啟（file://），提供建議
  if (location.protocol === "file:") {
    console.warn("📌 注意：您正在透過檔案系統開啟此頁面。字體可能無法載入。");
    console.warn("💡 建議：使用本地伺服器或上傳到網頁伺服器來執行此應用。");
    showMessage(translations.fontLoadFailHint, "info");
  }
}

function setupEventListeners() {
  // 字體區域收起/展開按鈕
  document
    .getElementById("fontSectionToggle")
    .addEventListener("click", toggleFontSection);

  // 自訂檔案上傳按鈕
  document
    .getElementById("customFileBtn")
    .addEventListener("click", () =>
      document.getElementById("fontFile").click()
    );

  // 字體檔案上傳
  document
    .getElementById("fontFile")
    .addEventListener("change", handleFontUpload);

  // 預設字體按鈕
  document
    .getElementById("loadCuteFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/cute.ttf", "fontNameCute", event)
    );
  document
    .getElementById("loadGameFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/game.ttf", "fontNameGame", event)
    );
  document
    .getElementById("loadHackerFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/hacker.otf", "fontNameHacker", event)
    );
  document
    .getElementById("loadMagicFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/magic.ttf", "fontNameMagic", event)
    );
  document
    .getElementById("loadNotoFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/noto.ttf", "fontNameNoto", event)
    );
  document
    .getElementById("loadMartialFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/martial.otf", "fontNameMartial", event)
    );
  document
    .getElementById("loadWriteFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/write.ttf", "fontNameWrite", event)
    );
  document
    .getElementById("loadMordanFont")
    .addEventListener("click", (event) =>
      loadPresetFont("/fonts/mordan.otf", "fontNameModern", event)
    );

  // 文字輸入
  document.getElementById("textInput").addEventListener("input", renderPreview);

  // 字體大小滑桿
  document
    .getElementById("fontSizeSlider")
    .addEventListener("input", function () {
      document.getElementById("fontSizeDisplay").textContent = this.value;
      renderPreview();
    });

  // 文字顏色選擇
  document.querySelectorAll('input[name="text_color"]').forEach((radio) => {
    radio.addEventListener("change", renderPreview);
  });

  // 自訂顏色
  document.getElementById("customColor").addEventListener("input", function () {
    // 自動選中自訂顏色選項
    document.querySelector(
      'input[name="text_color"][value="custom"]'
    ).checked = true;
    renderPreview();
  });

  // 外框選項
  document.getElementById("addOutline").addEventListener("change", function () {
    document
      .getElementById("outlineOptions")
      .classList.toggle("hidden", !this.checked);
    renderPreview();
  });

  // 外框寬度
  document
    .getElementById("outlineWidthSlider")
    .addEventListener("input", function () {
      document.getElementById("outlineWidthDisplay").textContent = this.value;
      renderPreview();
    });

  // 外框顏色選擇
  document.querySelectorAll('input[name="outline_color"]').forEach((radio) => {
    radio.addEventListener("change", renderPreview);
  });

  // 自訂外框顏色
  document
    .getElementById("customOutlineColor")
    .addEventListener("input", function () {
      // 自動選中自訂外框顏色選項
      document.querySelector(
        'input[name="outline_color"][value="custom"]'
      ).checked = true;
      renderPreview();
    });

  // 預覽背景控制按鈕
  document
    .getElementById("previewBgChecker")
    .addEventListener("click", () => setPreviewBackground("checker"));
  document
    .getElementById("previewBgBlack")
    .addEventListener("click", () => setPreviewBackground("black"));
  document
    .getElementById("previewBgWhite")
    .addEventListener("click", () => setPreviewBackground("white"));

  // 輸出格式選項
  document
    .getElementById("usePngOutput")
    .addEventListener("change", updateDownloadButtonText);

  // 按鈕事件
  document
    .getElementById("downloadBtn")
    .addEventListener("click", downloadImage);
  document.getElementById("copyBtn").addEventListener("click", copyToClipboard);
  document.getElementById("resetBtn").addEventListener("click", resetSettings);

  // 浮動按鈕事件
  document
    .getElementById("modeToggleBtn")
    .addEventListener("click", toggleMode);
  document
    .getElementById("languageToggleBtn")
    .addEventListener("click", toggleLanguage);
}

async function handleFontUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById("fontStatus");
  statusEl.className = "text-xs mt-1 text-blue-600";
  statusEl.textContent = translations.fontLoading;
  statusEl.classList.remove("hidden");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const fontFace = new FontFace("CustomFont", arrayBuffer);
    await fontFace.load();

    document.fonts.add(fontFace);
    currentFont = "CustomFont";

    statusEl.className = "text-xs text-green-600";
    statusEl.textContent = translations.fontLoadSuccess.replace(
      "{fileName}",
      file.name
    );

    document.getElementById("fileNameDisplay").textContent = file.name;

    // 更新當前字體顯示（去掉副檔名）
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    updateCurrentFontDisplay(fileName);

    renderPreview();
    showMessage(
      translations.fontLoadSuccess.replace("{fileName}", file.name),
      "success"
    );
  } catch (error) {
    console.error("字體載入失敗:", error);
    statusEl.className = "text-xs text-red-600";
    statusEl.textContent = translations.fontLoadFail;
    showMessage(translations.fontLoadFail, "error");
  }
}

// 載入預設字體函數
async function loadPresetFont(fontPath, fontKey, event) {
  const fontName = translations[fontKey] || fontKey;
  const statusEl = document.getElementById("fontStatus");
  statusEl.className = "text-xs text-blue-600";
  statusEl.textContent = translations.fontPresetLoading.replace(
    "{fontName}",
    fontName
  );
  statusEl.classList.remove("hidden");

  // 重設所有按鈕狀態
  document.querySelectorAll(".preset-font-btn").forEach((btn) => {
    btn.classList.remove("ring-2", "ring-blue-500", "bg-blue-100");
  });

  try {
    // 嘗試載入字體檔案
    const response = await fetch(fontPath);
    if (!response.ok) {
      throw new Error(
        `無法載入字體檔案: ${response.status} - ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const fontFace = new FontFace("PresetFont", arrayBuffer);
    await fontFace.load();

    // 移除之前的預設字體（如果存在）
    for (const font of document.fonts) {
      if (font.family === "PresetFont") {
        document.fonts.delete(font);
      }
    }

    document.fonts.add(fontFace);
    currentFont = "PresetFont";

    // 高亮選中的按鈕
    if (event && event.target) {
      const clickedBtn = event.target.closest(".preset-font-btn");
      if (clickedBtn) {
        clickedBtn.classList.add("ring-2", "ring-blue-500");
      }
    }

    statusEl.className = "text-xs text-green-600";
    statusEl.textContent = translations.fontPresetLoadSuccess.replace(
      "{fontName}",
      fontName
    );

    // 更新當前字體顯示
    updateCurrentFontDisplay(fontName, fontKey);

    // 清除檔案輸入
    document.getElementById("fontFile").value = "";

    renderPreview();
    showMessage(
      translations.fontPresetLoadSuccess.replace("{fontName}", fontName),
      "success"
    );
  } catch (error) {
    console.error("預設字體載入失敗:", error);
    statusEl.className = "text-xs text-red-600";
    statusEl.textContent = translations.fontPresetLoadFail
      .replace("{fontName}", fontName)
      .replace("{errorMessage}", error.message);

    // 提供解決方案提示
    showMessage(
      translations.fontLoadFailHint2.replace("{fontName}", fontName),
      "error"
    );

    // 建議使用者手動上傳字體
    setTimeout(() => {
      showMessage(translations.fontLoadFailHint3, "info");
    }, 3000);
  }
}

function getTextColor() {
  const colorType = document.querySelector(
    'input[name="text_color"]:checked'
  ).value;
  switch (colorType) {
    case "black":
      return "#000000";
    case "white":
      return "#ffffff";
    case "custom":
      return document.getElementById("customColor").value;
    default:
      return "#000000";
  }
}

function getOutlineColor(textColor) {
  const outlineColorType = document.querySelector(
    'input[name="outline_color"]:checked'
  ).value;

  if (outlineColorType === "custom") {
    return document.getElementById("customOutlineColor").value;
  }

  // 智慧配色邏輯
  if (textColor === "#ffffff") return "#000000";
  if (textColor === "#000000") return "#ffffff";

  const hex = textColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "#000000" : "#ffffff";
}

function setPreviewBackground(bgType) {
  currentPreviewBg = bgType;

  // 更新按鈕狀態
  document.querySelectorAll(".preview-bg-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  switch (bgType) {
    case "checker":
      document.getElementById("previewBgChecker").classList.add("active");
      break;
    case "black":
      document.getElementById("previewBgBlack").classList.add("active");
      break;
    case "white":
      document.getElementById("previewBgWhite").classList.add("active");
      break;
  }

  updatePreviewBackground();
}

function updatePreviewBackground() {
  const canvasContainer =
    document.querySelector("#previewCanvas").parentElement;

  switch (currentPreviewBg) {
    case "checker":
      canvasContainer.style.background =
        "repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/20px 20px";
      break;
    case "black":
      canvasContainer.style.background = "#000000";
      break;
    case "white":
      canvasContainer.style.background = "#ffffff";
      break;
  }
}

function renderPreview() {
  const textInput = document.getElementById("textInput");
  const text = textInput.value || textInput.placeholder;
  const fontSize = parseInt(document.getElementById("fontSizeSlider").value);
  const textColor = getTextColor();
  const addOutline = document.getElementById("addOutline").checked;
  const outlineWidth = parseInt(
    document.getElementById("outlineWidthSlider").value
  );

  // 處理多行文字
  const lines = text.split("\n");

  // 設定字體
  let fontFamily = currentFont || "Arial, sans-serif";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 計算所有行的尺寸
  let maxWidth = 0;
  const lineMetrics = lines.map((line) => {
    const metrics = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
    return metrics;
  });

  const lineHeight = fontSize * 1.4;
  const totalHeight = lines.length * lineHeight;

  // 計算畫布尺寸
  const padding = 60;
  const extraSpace = addOutline ? outlineWidth * 2 : 0;
  const canvasWidth = Math.max(400, maxWidth + padding + extraSpace);
  const canvasHeight = Math.max(200, totalHeight + padding + extraSpace);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // 重新設定字體
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 清除畫布，確保透明背景
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 確保畫布完全透明
  ctx.globalCompositeOperation = "source-over";

  // 背景永遠保持透明

  // 計算起始Y位置（置中）
  const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;
  const centerX = canvas.width / 2;

  // 繪製每一行
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;

    // 繪製外框
    if (addOutline && line.trim()) {
      const outlineColor = getOutlineColor(textColor);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth;
      ctx.lineJoin = "round";
      ctx.strokeText(line, centerX, y);
    }

    // 繪製文字
    if (line.trim()) {
      ctx.fillStyle = textColor;
      ctx.fillText(line, centerX, y);
    }
  });

  // 更新圖片資訊
  updateImageInfo();
}

function updateImageInfo() {
  const dimensions = `${canvas.width} × ${canvas.height}`;
  document.getElementById("imageDimensions").textContent = dimensions;

  const usePng = document.getElementById("usePngOutput").checked;

  if (usePng) {
    // PNG檔案大小估算
    const dataURL = canvas.toDataURL();
    const base64Length = dataURL.split(",")[1].length;
    const sizeInBytes = (base64Length * 3) / 4;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    document.getElementById(
      "fileSize"
    ).textContent = `${translations.fileSizeApprox} ${sizeInKB} KB (PNG)`;
  } else {
    // SVG檔案大小估算
    try {
      const svgContent = generateSVG();
      const sizeInBytes = new Blob([svgContent]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(1);
      document.getElementById(
        "fileSize"
      ).textContent = `${translations.fileSizeApprox} ${sizeInKB} KB (SVG)`;
    } catch (error) {
      // 如果SVG生成失敗（例如外框選項還未載入），顯示預估大小
      document.getElementById(
        "fileSize"
      ).textContent = `${translations.fileSizeApprox} 2-5 KB (SVG)`;
    }
  }

  document.getElementById("imageInfo").classList.remove("hidden");
}

function updateDownloadButtonText() {
  const usePng = document.getElementById("usePngOutput").checked;
  const btnTextEl = document.getElementById("downloadBtnText");
  const key = usePng ? "downloadBtnPNG" : "downloadBtnSVG";
  btnTextEl.textContent = translations[key];
  btnTextEl.dataset.i18n = key;
}

function generateSVG() {
  const textInput = document.getElementById("textInput");
  const text = textInput.value || textInput.placeholder;
  const fontSize = parseInt(document.getElementById("fontSizeSlider").value);
  const textColor = getTextColor();
  const addOutline = document.getElementById("addOutline").checked;
  const outlineWidth = parseInt(
    document.getElementById("outlineWidthSlider").value
  );

  // 處理多行文字
  const lines = text.split("\n");

  // 設定字體
  let fontFamily = currentFont || "Arial, sans-serif";

  // 創建臨時canvas來測量文字尺寸
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.font = `${fontSize}px ${fontFamily}`;

  // 計算所有行的尺寸
  let maxWidth = 0;
  lines.forEach((line) => {
    const metrics = tempCtx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  });

  const lineHeight = fontSize * 1.4;
  const totalHeight = lines.length * lineHeight;

  // 計算SVG尺寸
  const padding = 60;
  const extraSpace = addOutline ? outlineWidth * 2 : 0;
  const svgWidth = Math.max(400, maxWidth + padding + extraSpace);
  const svgHeight = Math.max(200, totalHeight + padding + extraSpace);

  // 開始構建SVG
  let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

  // 添加字體定義（如果有自訂字體）
  if (currentFont) {
    svgContent += `<defs>
      <style>
        @font-face {
          font-family: '${currentFont}';
          /* 註：SVG中的字體需要在CSS中定義或使用Web字體 */
        }
      </style>
    </defs>`;
  }

  // SVG 背景永遠保持透明

  // 計算起始位置
  const startY = (svgHeight - totalHeight) / 2 + fontSize * 0.8;
  const centerX = svgWidth / 2;

  // 繪製每一行文字
  lines.forEach((line, index) => {
    if (line.trim()) {
      const y = startY + index * lineHeight;

      // 文字外框
      if (addOutline) {
        const outlineColor = getOutlineColor(textColor);
        svgContent += `<text x="${centerX}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="middle" fill="none" stroke="${outlineColor}" stroke-width="${outlineWidth}" stroke-linejoin="round">${escapeXml(
          line
        )}</text>`;
      }

      // 主要文字
      svgContent += `<text x="${centerX}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="middle" fill="${textColor}">${escapeXml(
        line
      )}</text>`;
    }
  });

  svgContent += "</svg>";
  return svgContent;
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadImage() {
  const usePng = document.getElementById("usePngOutput").checked;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const link = document.createElement("a");

  if (usePng) {
    // PNG輸出 - 支援透明背景
    link.download = `font-image_${timestamp}.png`;
    link.href = canvas.toDataURL("image/png");
    showMessage(translations.downloadSuccessPNG, "success");
  } else {
    // SVG輸出
    const svgContent = generateSVG();
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    link.download = `font-image_${timestamp}.svg`;
    link.href = URL.createObjectURL(blob);
    showMessage(translations.downloadSuccessSVG, "success");
  }

  link.click();

  // 清理URL物件
  if (!usePng) {
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
}

async function copyToClipboard() {
  try {
    const usePng = document.getElementById("usePngOutput").checked;

    if (usePng) {
      // 複製PNG圖片 - 支援透明背景
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      showMessage(translations.copySuccessPNG, "success");
    } else {
      // 複製SVG文字內容
      const svgContent = generateSVG();
      await navigator.clipboard.writeText(svgContent);
      showMessage(translations.copySuccessSVG, "success");
    }

    const btn = document.getElementById("copyBtn");
    const originalContent = btn.innerHTML;
    btn.querySelector("span").textContent = translations.copySuccessGeneric;

    setTimeout(() => {
      btn.innerHTML = originalContent;
      // Re-add the key for future language switches
      btn.querySelector("span").dataset.i18n = "copyBtn";
    }, 2000);
  } catch (error) {
    console.error("複製失敗:", error);
    showMessage(translations.copyFail, "error");
  }
}

function resetSettings() {
  if (confirm(translations.resetConfirm)) {
    // 重設表單
    document.getElementById("fontFile").value = "";
    document.getElementById("fileNameDisplay").textContent =
      translations.noFileChosen;
    document.getElementById("fileNameDisplay").dataset.i18n = "noFileChosen";

    const textInput = document.getElementById("textInput");
    textInput.value = translations.textInputDefault;
    textInput.placeholder = translations.textInputPlaceholder;

    document.getElementById("fontSizeSlider").value = "72";
    document.getElementById("fontSizeDisplay").textContent = "72";
    document.querySelector(
      'input[name="text_color"][value="black"]'
    ).checked = true;
    document.getElementById("addOutline").checked = false;
    document.getElementById("outlineOptions").classList.add("hidden");
    document.getElementById("outlineWidthSlider").value = "3";
    document.getElementById("outlineWidthDisplay").textContent = "3";
    document.querySelector(
      'input[name="outline_color"][value="auto"]'
    ).checked = true;
    document.getElementById("customOutlineColor").value = "#000000";
    document.getElementById("customColor").value = "#ff0000";
    document.getElementById("usePngOutput").checked = false;

    // 重設字體
    currentFont = null;
    document.getElementById("fontStatus").classList.add("hidden");
    updateCurrentFontDisplay(translations.defaultFont, "defaultFont");

    // 重設預設字體按鈕狀態
    document.querySelectorAll(".preset-font-btn").forEach((btn) => {
      btn.classList.remove("ring-2", "ring-blue-500", "bg-blue-100");
    });

    // 重設預覽背景
    currentPreviewBg = "checker";
    setPreviewBackground("checker");

    // 更新下載按鈕文字
    updateDownloadButtonText();

    // 重新渲染
    renderPreview();
    showMessage(translations.settingsReset, "success");
  }
}

function showMessage(message, type = "info") {
  const messageEl = document.createElement("div");
  const baseTopOffset = 80; // 基礎頂部偏移量 (5rem = 80px)
  const toastHeight = 45; // 每個 toast 的高度 (包含間距)

  // 計算當前 toast 的位置
  const topPosition = baseTopOffset + activeToasts.length * toastHeight;

  messageEl.className = `toast-message fixed right-4 px-4 py-2 rounded-md text-white z-40 shadow-lg ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;

  messageEl.style.top = `${topPosition}px`;
  messageEl.style.transform = "translateX(100%)";
  messageEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

  // 創建訊息內容容器
  const messageContent = document.createElement("div");
  messageContent.className = "flex items-center justify-between gap-3";

  const messageText = document.createElement("span");
  messageText.textContent = message;
  messageText.className = "flex-1";

  // 創建關閉按鈕
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.className =
    "text-white hover:text-gray-200 font-bold text-xl leading-none focus:outline-none transition-colors duration-200";
  closeButton.style.width = "20px";
  closeButton.style.height = "20px";
  closeButton.title = translations.closeBtn;

  closeButton.addEventListener("click", () => {
    removeToast(messageEl);
  });

  messageContent.appendChild(messageText);
  messageContent.appendChild(closeButton);
  messageEl.appendChild(messageContent);

  // 添加到活躍 toast 列表
  activeToasts.push(messageEl);
  document.body.appendChild(messageEl);

  // 滑入動畫
  setTimeout(() => {
    messageEl.style.transform = "translateX(0)";
  }, 50);

  // 自動移除 toast
  setTimeout(() => {
    removeToast(messageEl);
  }, 3000);
}

function removeToast(toastElement) {
  // 滑出動畫
  toastElement.style.transform = "translateX(100%)";
  toastElement.style.opacity = "0";

  setTimeout(() => {
    // 從活躍列表中移除
    const index = activeToasts.indexOf(toastElement);
    if (index > -1) {
      activeToasts.splice(index, 1);
    }

    // 從 DOM 中移除
    if (toastElement.parentNode) {
      document.body.removeChild(toastElement);
    }

    // 重新排列剩餘的 toast
    repositionToasts();
  }, 300);
}

function repositionToasts() {
  const baseTopOffset = 80;
  const toastHeight = 45;

  activeToasts.forEach((toast, index) => {
    const newTopPosition = baseTopOffset + index * toastHeight;
    toast.style.top = `${newTopPosition}px`;
  });
}

// 模式切換功能
function toggleMode() {
  currentMode = currentMode === "engineer" ? "baby" : "engineer";

  const engineerIcon = document.getElementById("engineerIcon");
  const babyIcon = document.getElementById("babyIcon");
  const modeToggleBtn = document.getElementById("modeToggleBtn");

  if (currentMode === "baby") {
    // 切換到嬰兒模式
    engineerIcon.classList.add("hidden");
    babyIcon.classList.remove("hidden");
    modeToggleBtn.classList.remove("hover:border-blue-300");
    modeToggleBtn.classList.add("hover:border-pink-300");
    modeToggleBtn.title = translations.modeToggleTitleCustom;
    showMessage(translations.switchToBabyMode, "success");
  } else {
    // 切換到工程師模式
    babyIcon.classList.add("hidden");
    engineerIcon.classList.remove("hidden");
    modeToggleBtn.classList.remove("hover:border-pink-300");
    modeToggleBtn.classList.add("hover:border-blue-300");
    modeToggleBtn.title = translations.modeToggleTitle;
    showMessage(translations.switchToEngineerMode, "success");
  }

  // 更新UI顯示
  updateUIVisibility(currentMode);

  // 添加按鈕點擊動畫效果
  modeToggleBtn.style.transform = "scale(0.95)";
  setTimeout(() => {
    modeToggleBtn.style.transform = "";
  }, 150);
}

// 語言切換功能
async function toggleLanguage() {
  currentLanguage = currentLanguage === "zh" ? "en" : "zh";

  await updateUILanguage(currentLanguage);

  // Show confirmation message using the new language
  const messageKey =
    currentLanguage === "en" ? "langSwitchedToEN" : "langSwitchedToZH";
  showMessage(translations[messageKey], "success");

  const languageIndicator = document.getElementById("languageIndicator");
  const languageToggleBtn = document.getElementById("languageToggleBtn");

  if (currentLanguage === "en") {
    languageIndicator.classList.remove("bg-green-500");
    languageIndicator.classList.add("bg-blue-500");
  } else {
    languageIndicator.classList.remove("bg-blue-500");
    languageIndicator.classList.add("bg-green-500");
  }

  // 添加按鈕點擊動畫效果
  languageToggleBtn.style.transform = "scale(0.95)";
  setTimeout(() => {
    languageToggleBtn.style.transform = "";
  }, 150);
}

// ** I18n 功能 **

// 載入翻譯檔案
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Could not load ${lang}.json`);
    }
    translations = await response.json();
    console.log(`${lang} translations loaded.`);
  } catch (error) {
    console.error("Failed to load translations:", error);
  }
}

// 工具函數：更新UI語言
async function updateUILanguage(language) {
  await loadTranslations(language);

  // Set HTML lang attribute
  document.documentElement.lang = language === "zh" ? "zh-TW" : "en";

  // Update all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (translations[key]) {
      // Preserve icons/child elements that should not be overwritten
      const childNodes = Array.from(el.childNodes);
      const textNode = childNodes.find(
        (node) =>
          node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
      );
      const newText = translations[key];

      if (textNode) {
        textNode.textContent = ` ${newText} `;
      } else {
        // Fallback for elements with only text
        el.textContent = newText;
      }
    }
  });

  // Update attributes
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = translations[el.dataset.i18nTitle];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = translations[el.dataset.i18nPlaceholder];
  });

  // Special handling for dynamic elements
  // - Filename display (only update if no file is selected)
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  if (fileNameDisplay.dataset.i18n === "noFileChosen") {
    fileNameDisplay.textContent = translations.noFileChosen;
  }

  // - Font display
  const fontDisplay = document.getElementById("currentFontDisplay");
  const fontKey = fontDisplay.dataset.i18nKey;
  if (fontKey && translations[fontKey]) {
    fontDisplay.textContent = translations[fontKey];
  }

  // Update initial text value only if it's still the default
  const textInput = document.getElementById("textInput");
  const defaultZh = "範例文字";
  const defaultEn = "Sample Text";
  if (textInput.value === defaultZh || textInput.value === defaultEn) {
    textInput.value = translations.textInputDefault;
  }

  // Update components
  updateDownloadButtonText();

  // Render canvas with potentially new default text
  renderPreview();

  // Show welcome message on first load
  const isFirstLoad = !document.body.querySelector(".toast-message");
  if (isFirstLoad) {
    showWelcomeMessage();
  }
}

// 工具函數：根據模式更新UI
function updateUIVisibility(mode) {
  const isBabyMode = mode === "baby";

  const elementsToToggle = [
    "pageHeader",
    "fontUploadGroup",
    "fontSectionToggle",
    "fontSizeSection",
    "outputFormatSection",
    "copyBtn",
    "imageInfo",
    "fontStatus",
    "presetFontsLabel",
    "previewBgLabel",
  ];

  elementsToToggle.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("hidden", isBabyMode);
    }
  });

  // 處理字體設定區的收合狀態
  const fontSectionContent = document.getElementById("fontSectionContent");
  if (isBabyMode) {
    // 嬰兒模式下，強制展開且不可收合
    fontSectionContent.style.maxHeight = fontSectionContent.scrollHeight + "px";
  }
  // 工程師模式則恢復正常，由 toggleFontSection 函式控制
}

// 工具函數：根據模式更新UI（預留給未來擴展）
function updateUIMode(mode) {
  // 這個函數可以用來根據模式調整UI樣式
  // 例如在嬰兒模式下使用更柔和的顏色
  console.log(`UI模式已切換到：${mode}`);
}
