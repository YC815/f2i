// 全域變數
let currentFont = null;
let currentFontBuffer = null; // 新增：儲存字體 ArrayBuffer
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
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // 1. 先載入翻譯
    await loadTranslations(currentLanguage);

    // 2. 預載入所有按鈕字體
    await preloadButtonFonts();

    // 3. 設定預設文字（但先不要渲染）
    const textInput = document.getElementById("textInput");
    textInput.value = translations.textInputDefault || "範例文字";

    // 4. 自動載入第一個預設字體（可愛字體）並等待完成
    const firstPresetFont = document.getElementById("loadCuteFont");
    if (firstPresetFont) {
      await loadPresetFont("public/fonts/cute.ttf", "fontNameCute");
      // 不使用 click() 因為我們要確保字體載入完成
    }

    // 5. 設定預設背景
    setPreviewBackground("checker");

    // 6. 初始化其他設定
    setupEventListeners();
    updateDownloadButtonText();

    // 7. 更新UI語言和可見性
    updateUILanguage(currentLanguage);
    updateUIVisibility(currentMode);

    // 8. 最後渲染預覽（此時字體應該已經載入完成）
    renderPreview();
  } catch (error) {
    console.error("初始化失敗:", error);
    showMessage("初始化時發生錯誤，請重新整理頁面", "error");
  }
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
    {
      path: "public/fonts/cute.ttf",
      name: "CuteFont",
      buttonId: "loadCuteFont",
      displayName: "可愛的",
    },
    {
      path: "public/fonts/game.ttf",
      name: "GameFont",
      buttonId: "loadGameFont",
      displayName: "遊戲風",
    },
    {
      path: "public/fonts/hacker.otf",
      name: "HackerFont",
      buttonId: "loadHackerFont",
      displayName: "駭客感",
    },
    {
      path: "public/fonts/magic.ttf",
      name: "MagicFont",
      buttonId: "loadMagicFont",
      displayName: "魔法風",
    },
    {
      path: "public/fonts/martial.otf",
      name: "MartialFont",
      buttonId: "loadMartialFont",
      displayName: "工整的",
    },
    {
      path: "public/fonts/mordan.otf",
      name: "MordanFont",
      buttonId: "loadMordanFont",
      displayName: "武俠感",
    },
    {
      path: "public/fonts/noto.ttf",
      name: "NotoFont",
      buttonId: "loadNotoFont",
      displayName: "日記感",
    },
    {
      path: "public/fonts/write.ttf",
      name: "WriteFont",
      buttonId: "loadWriteFont",
      displayName: "現代感",
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

        // 設定按鈕使用對應的字體
        const button = document.getElementById(config.buttonId);
        if (button) {
          button.style.fontFamily = config.name;
          // 更新按鈕文字
          const textSpan = button.querySelector("span") || button;
          if (textSpan) {
            textSpan.textContent = config.displayName;
          }
        }

        console.log(`✅ ${config.name} 按鈕字體載入成功`);
      } else {
        console.warn(
          `⚠️ ${config.name} 按鈕字體載入失敗: HTTP ${response.status}`
        );
      }
    } catch (error) {
      console.warn(`⚠️ ${config.name} 按鈕字體載入失敗:`, error.message);
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
  const fontSectionToggle = document.getElementById("fontSectionToggle");
  if (fontSectionToggle) {
    fontSectionToggle.addEventListener("click", toggleFontSection);
  }

  // 自訂檔案上傳按鈕
  const customFileBtn = document.getElementById("customFileBtn");
  const fontFileInput = document.getElementById("fontFile");
  if (customFileBtn && fontFileInput) {
    customFileBtn.addEventListener("click", () => fontFileInput.click());
  }

  // 字體檔案上傳
  if (fontFileInput) {
    fontFileInput.addEventListener("change", handleFontUpload);
  }

  // 預設字體按鈕
  const fontButtons = [
    { id: "loadCuteFont", path: "public/fonts/cute.ttf", key: "fontNameCute" },
    { id: "loadGameFont", path: "public/fonts/game.ttf", key: "fontNameGame" },
    {
      id: "loadHackerFont",
      path: "public/fonts/hacker.otf",
      key: "fontNameHacker",
    },
    {
      id: "loadMagicFont",
      path: "public/fonts/magic.ttf",
      key: "fontNameMagic",
    },
    { id: "loadNotoFont", path: "public/fonts/noto.ttf", key: "fontNameNoto" },
    {
      id: "loadMartialFont",
      path: "public/fonts/martial.otf",
      key: "fontNameMartial",
    },
    {
      id: "loadWriteFont",
      path: "public/fonts/write.ttf",
      key: "fontNameWrite",
    },
    {
      id: "loadMordanFont",
      path: "public/fonts/mordan.otf",
      key: "fontNameModern",
    },
  ];

  fontButtons.forEach(({ id, path, key }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", async (event) => {
        await loadPresetFont(path, key, event);
        renderPreview(); // 確保字體載入後更新預覽
      });
    }
  });

  // 文字輸入 - 使用 input 和 change 事件
  const textInput = document.getElementById("textInput");
  if (textInput) {
    textInput.addEventListener("input", () => {
      requestAnimationFrame(renderPreview); // 使用 requestAnimationFrame 優化效能
    });
    textInput.addEventListener("change", renderPreview);
  }

  // 字體大小滑桿 - 使用 input 事件實現即時更新
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", function () {
      const fontSizeDisplay = document.getElementById("fontSizeDisplay");
      if (fontSizeDisplay) {
        fontSizeDisplay.textContent = this.value;
      }
      requestAnimationFrame(renderPreview);
    });
  }

  // 文字顏色選擇 - 所有顏色相關的變更都即時更新
  document.querySelectorAll('input[name="text_color"]').forEach((radio) => {
    radio.addEventListener("change", () =>
      requestAnimationFrame(renderPreview)
    );
  });

  // 自訂顏色 - 使用 input 事件實現即時更新
  const customColor = document.getElementById("customColor");
  if (customColor) {
    customColor.addEventListener("input", function () {
      const customColorRadio = document.querySelector(
        'input[name="text_color"][value="custom"]'
      );
      if (customColorRadio) {
        customColorRadio.checked = true;
      }
      requestAnimationFrame(renderPreview);
    });
  }

  // 外框選項
  const addOutline = document.getElementById("addOutline");
  const outlineOptions = document.getElementById("outlineOptions");
  if (addOutline && outlineOptions) {
    addOutline.addEventListener("change", function () {
      outlineOptions.classList.toggle("hidden", !this.checked);
      requestAnimationFrame(renderPreview);
    });
  }

  // 外框寬度 - 使用 input 事件實現即時更新
  const outlineWidthSlider = document.getElementById("outlineWidthSlider");
  if (outlineWidthSlider) {
    outlineWidthSlider.addEventListener("input", function () {
      const outlineWidthDisplay = document.getElementById(
        "outlineWidthDisplay"
      );
      if (outlineWidthDisplay) {
        outlineWidthDisplay.textContent = this.value;
      }
      requestAnimationFrame(renderPreview);
    });
  }

  // 外框顏色選擇
  document.querySelectorAll('input[name="outline_color"]').forEach((radio) => {
    radio.addEventListener("change", () =>
      requestAnimationFrame(renderPreview)
    );
  });

  // 自訂外框顏色 - 使用 input 事件實現即時更新
  const customOutlineColor = document.getElementById("customOutlineColor");
  if (customOutlineColor) {
    customOutlineColor.addEventListener("input", function () {
      const customOutlineColorRadio = document.querySelector(
        'input[name="outline_color"][value="custom"]'
      );
      if (customOutlineColorRadio) {
        customOutlineColorRadio.checked = true;
      }
      requestAnimationFrame(renderPreview);
    });
  }

  // 預覽背景控制按鈕
  const previewBgChecker = document.getElementById("previewBgChecker");
  const previewBgBlack = document.getElementById("previewBgBlack");
  const previewBgWhite = document.getElementById("previewBgWhite");

  if (previewBgChecker) {
    previewBgChecker.addEventListener("click", () => {
      setPreviewBackground("checker");
      requestAnimationFrame(renderPreview);
    });
  }
  if (previewBgBlack) {
    previewBgBlack.addEventListener("click", () => {
      setPreviewBackground("black");
      requestAnimationFrame(renderPreview);
    });
  }
  if (previewBgWhite) {
    previewBgWhite.addEventListener("click", () => {
      setPreviewBackground("white");
      requestAnimationFrame(renderPreview);
    });
  }

  // 輸出格式選項
  const usePngOutput = document.getElementById("usePngOutput");
  if (usePngOutput) {
    usePngOutput.addEventListener("change", updateDownloadButtonText);
  }

  // 按鈕事件
  const downloadBtn = document.getElementById("downloadBtn");
  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadImage);
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", copyToClipboard);
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", resetSettings);
  }

  // 浮動按鈕事件
  const modeToggleBtn = document.getElementById("modeToggleBtn");
  const languageToggleBtn = document.getElementById("languageToggleBtn");

  if (modeToggleBtn) {
    modeToggleBtn.addEventListener("click", toggleMode);
  }
  if (languageToggleBtn) {
    languageToggleBtn.addEventListener("click", toggleLanguage);
  }
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
    const fontName = "CustomFont_" + Math.random().toString(36).substr(2, 9);
    const fontFace = new FontFace(fontName, arrayBuffer);
    await fontFace.load();

    document.fonts.forEach((font) => {
      if (font.family.startsWith("CustomFont_")) {
        document.fonts.delete(font);
      }
    });

    document.fonts.add(fontFace);
    currentFont = fontName;
    currentFontBuffer = arrayBuffer;

    statusEl.className = "text-xs text-green-600";
    statusEl.textContent = translations.fontLoadSuccess.replace(
      "{fileName}",
      file.name
    );

    document.getElementById("fileNameDisplay").textContent = file.name;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    updateCurrentFontDisplay(fileName);
    renderPreview();
  } catch (error) {
    console.error("字體載入失敗:", error);
    statusEl.className = "text-xs text-red-600";
    statusEl.textContent = translations.fontLoadFail;
    showMessage(translations.fontLoadFail, "error");
  }
}

// 載入預設字體函數
async function loadPresetFont(fontPath, fontKey, event = null) {
  const fontName = translations[fontKey] || fontKey;
  const statusEl = document.getElementById("fontStatus");
  statusEl.className = "text-xs text-blue-600";
  statusEl.textContent =
    translations.fontPresetLoading?.replace("{fontName}", fontName) ||
    `正在載入字體：${fontName}...`;
  statusEl.classList.remove("hidden");

  document.querySelectorAll(".preset-font-btn").forEach((btn) => {
    btn.classList.remove("ring-2", "ring-blue-500", "bg-blue-100");
  });

  try {
    const response = await fetch(
      fontPath.startsWith("public/") ? fontPath : "public" + fontPath
    );
    if (!response.ok) {
      throw new Error(
        `無法載入字體檔案: ${response.status} - ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const uniqueFontName =
      "PresetFont_" + Math.random().toString(36).substr(2, 9);
    const fontFace = new FontFace(uniqueFontName, arrayBuffer);
    await fontFace.load();

    document.fonts.forEach((font) => {
      if (font.family.startsWith("PresetFont_")) {
        document.fonts.delete(font);
      }
    });

    document.fonts.add(fontFace);
    currentFont = uniqueFontName;
    currentFontBuffer = arrayBuffer;

    if (event && event.target) {
      const clickedBtn = event.target.closest(".preset-font-btn");
      if (clickedBtn) {
        clickedBtn.classList.add("ring-2", "ring-blue-500");
      }
    }

    statusEl.className = "text-xs text-green-600";
    statusEl.textContent =
      translations.fontPresetLoadSuccess?.replace("{fontName}", fontName) ||
      `${fontName} 載入成功！`;

    updateCurrentFontDisplay(fontName, fontKey);
    document.getElementById("fontFile").value = "";

    return true;
  } catch (error) {
    console.error("預設字體載入失敗:", error);
    statusEl.className = "text-xs text-red-600";
    statusEl.textContent =
      translations.fontPresetLoadFail
        ?.replace("{fontName}", fontName)
        ?.replace("{errorMessage}", error.message) ||
      `${fontName} 載入失敗：${error.message}`;

    if (event) {
      showMessage(
        translations.fontLoadFailHint2?.replace("{fontName}", fontName) ||
          `${fontName} 載入失敗，請檢查網路連線`,
        "error"
      );

      setTimeout(() => {
        showMessage(
          translations.fontLoadFailHint3 || "建議手動上傳字體",
          "info"
        );
      }, 3000);
    }

    return false;
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

  // 只顯示 PNG 檔案大小
  const dataURL = canvas.toDataURL();
  const base64Length = dataURL.split(",")[1].length;
  const sizeInBytes = (base64Length * 3) / 4;
  const sizeInKB = (sizeInBytes / 1024).toFixed(1);
  document.getElementById(
    "fileSize"
  ).textContent = `${translations.fileSizeApprox} ${sizeInKB} KB (PNG)`;

  document.getElementById("imageInfo").classList.remove("hidden");
}

function updateDownloadButtonText() {
  // 只顯示 PNG
  const btnTextEl = document.getElementById("downloadBtnText");
  btnTextEl.textContent = translations["downloadBtnPNG"];
  btnTextEl.dataset.i18n = "downloadBtnPNG";
}

function downloadImage() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const link = document.createElement("a");
  link.download = `font-image_${timestamp}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function copyToClipboard() {
  try {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

    const btn = document.getElementById("copyBtn");
    const originalContent = btn.innerHTML;
    btn.querySelector("span").textContent = translations.copySuccessGeneric;

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.querySelector("span").dataset.i18n = "copyBtn";
    }, 2000);
  } catch (error) {
    console.error("複製失敗:", error);
    showMessage(translations.copyFail, "error");
  }
}

function resetSettings() {
  if (confirm(translations.resetConfirm)) {
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

    currentFont = null;
    document.getElementById("fontStatus").classList.add("hidden");
    updateCurrentFontDisplay(translations.defaultFont, "defaultFont");

    document.querySelectorAll(".preset-font-btn").forEach((btn) => {
      btn.classList.remove("ring-2", "ring-blue-500", "bg-blue-100");
    });

    currentPreviewBg = "checker";
    setPreviewBackground("checker");
    updateDownloadButtonText();
    renderPreview();
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
    engineerIcon.classList.add("hidden");
    babyIcon.classList.remove("hidden");
    modeToggleBtn.classList.remove("hover:border-blue-300");
    modeToggleBtn.classList.add("hover:border-pink-300");
    modeToggleBtn.title = translations.modeToggleTitleCustom;
  } else {
    babyIcon.classList.add("hidden");
    engineerIcon.classList.remove("hidden");
    modeToggleBtn.classList.remove("hover:border-pink-300");
    modeToggleBtn.classList.add("hover:border-blue-300");
    modeToggleBtn.title = translations.modeToggleTitle;
  }

  updateUIVisibility(currentMode);

  modeToggleBtn.style.transform = "scale(0.95)";
  setTimeout(() => {
    modeToggleBtn.style.transform = "";
  }, 150);
}

// 語言切換功能
async function toggleLanguage() {
  currentLanguage = currentLanguage === "zh" ? "en" : "zh";
  await updateUILanguage(currentLanguage);

  const languageIndicator = document.getElementById("languageIndicator");
  const languageToggleBtn = document.getElementById("languageToggleBtn");

  if (currentLanguage === "en") {
    languageIndicator.classList.remove("bg-green-500");
    languageIndicator.classList.add("bg-blue-500");
  } else {
    languageIndicator.classList.remove("bg-blue-500");
    languageIndicator.classList.add("bg-green-500");
  }

  languageToggleBtn.style.transform = "scale(0.95)";
  setTimeout(() => {
    languageToggleBtn.style.transform = "";
  }, 150);
}

// ** I18n 功能 **

// 載入翻譯檔案
async function loadTranslations(lang) {
  try {
    const response = await fetch(`public/locales/${lang}.json`);
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
