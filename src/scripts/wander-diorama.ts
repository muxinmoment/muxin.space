import { getWanderStorage, getWanderTimeScene, normalizeWanderScenePreference, readStorageValue, readVisitedProgress, readWanderGameProgress, recordRecentProgress, writeStorageValue } from "../utils/wander-storage";

const root = document.querySelector<HTMLElement>("[data-wander-3d]");
if (root && root.dataset.dioramaReady !== "true") {
  root.dataset.dioramaReady = "true";
  const storage = getWanderStorage();
  const art = root.querySelector<HTMLElement>("[data-diorama-art]");
  const stage = root.querySelector<HTMLElement>("[data-diorama-stage]");
  const hint = root.querySelector<HTMLElement>("[data-room-hint]");
  const memory = root.querySelector<HTMLElement>("[data-room-memory]");
  const progress = root.querySelector<HTMLElement>("[data-room-progress]");
  const enter = root.querySelector<HTMLAnchorElement>("[data-room-enter]");
  const skip = root.querySelector<HTMLButtonElement>("[data-wander-3d-skip]");
  const easterEgg = root.querySelector<HTMLButtonElement>("[data-wander-easter-egg]");
  const fallback = root.querySelector<HTMLElement>("[data-wander-art-fallback]");
  const finale = root.querySelector<HTMLElement>("[data-wander-room-finale]");
  const controls = [...root.querySelectorAll<HTMLButtonElement>("[data-room-camera]")];
  const hotspots = [...root.querySelectorAll<HTMLButtonElement>(".diorama-hotspot")];
  const pixelLayers = [...root.querySelectorAll<HTMLImageElement>("[data-wander-art]")];
  const focusOffsets: Record<string, [number, number]> = {
    center: [0, 0],
    anime: [12, -4],
    photo: [-2, -5],
    notes: [-10, 4],
    memo: [-16, 8],
  };
  const views: Record<string, { href: string; label: string }> = {
    center: { href: "/wander/", label: "逛一圈" },
    anime: { href: "/wander/anime/", label: "进入番剧书架" },
    photo: { href: "/wander/photos/", label: "进入照片墙" },
    notes: { href: "/wander/notes/", label: "打开支线随笔" },
    memo: { href: "/memo/", label: "打开小木电台" },
  };
  const labels: Record<string, string> = { anime: "番剧书架", photo: "照片墙", notes: "支线随笔", memo: "小木电台" };
  const visitedKey = "muxin-wander-visited";
  const recentKey = "muxin-wander-recent";
  const gameKey = "muxin-wander-games";

  const updateProgress = () => {
    const visited = readVisitedProgress(storage, visitedKey);
    if (progress) progress.textContent = `已探索 ${visited.size} / 4`;
    root.dataset.revealed = [...visited].join(" ");
    if (finale) finale.hidden = visited.size < 4;
  };

  const updateScene = (scene: string) => {
    if (root.dataset.scene !== scene) root.dataset.scene = scene;
    const assetScene = scene === "auto" ? "dusk" : scene;
    pixelLayers.forEach((layer) => {
      const asset = layer.dataset.wanderArt;
      if (asset) layer.src = `/wander/${assetScene}/${asset}.webp`;
    });
  };

  const focus = (key: string, remember = true) => {
    const view = views[key] ?? views.center;
    const [focusX, focusY] = focusOffsets[key] ?? focusOffsets.center;
    art?.style.setProperty("--focus-x", `${focusX}px`);
    art?.style.setProperty("--focus-y", `${focusY}px`);
    art?.setAttribute("data-focus", key === "center" ? "" : key);
    controls.forEach((button) => {
      const active = button.dataset.roomCamera === key;
      button.dataset.active = active ? "true" : "false";
      button.setAttribute("aria-pressed", String(active));
    });
    hotspots.forEach((button) => {
      button.dataset.active = button.dataset.roomCamera === key ? "true" : "false";
    });
    if (enter) {
      enter.href = view.href;
      enter.textContent = `${view.label} →`;
    }
    if (key !== "center" && remember) {
      const visited = readVisitedProgress(storage, visitedKey);
      visited.add(key);
      writeStorageValue(storage, visitedKey, JSON.stringify([...visited]));
      recordRecentProgress(storage, recentKey, key);
      if (memory) memory.textContent = `当前区域：${labels[key]}`;
      updateProgress();
      window.dispatchEvent(new CustomEvent("muxin-wander-progress"));
    }
  };

  const openHotspot = (key: string) => {
    focus(key);
    if (key === "anime" && !readWanderGameProgress(storage, gameKey).completed.includes("anime")) {
      window.dispatchEvent(new CustomEvent("wander-game-open", { detail: { key } }));
      if (hint) hint.textContent = "书架整理 · 把三本书放回正确顺序";
    } else if (hint) {
      hint.textContent = `${labels[key]} · 点击下方入口进入`;
    }
  };

  controls.forEach((button) => button.addEventListener("click", () => openHotspot(button.dataset.roomCamera ?? "center")));
  hotspots.forEach((button) => button.addEventListener("click", () => openHotspot(button.dataset.roomCamera ?? "center")));
  skip?.addEventListener("click", () => {
    writeStorageValue(storage, "muxin-wander-3d", "off");
    root.classList.add("is-disabled");
  });
  window.addEventListener("wander-game-complete", () => {
    if (hint) hint.textContent = "书架已点亮 · 继续发现下一条支线";
    updateProgress();
  });
  easterEgg?.addEventListener("click", () => {
    easterEgg.dataset.found = "true";
    if (memory) memory.textContent = "窗边彩蛋：今天的光刚好落在这里";
    if (hint) hint.textContent = "你发现了一枚藏在窗边的小星星";
  });
  pixelLayers.forEach((layer) => layer.addEventListener("error", () => {
    if (fallback) fallback.hidden = false;
  }, { once: true }));
  window.addEventListener("muxin-wander-scene", (event) => {
    const detail = (event as CustomEvent<{ scene?: string }>).detail;
    if (detail.scene) updateScene(detail.scene);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "muxin-wander-scene") {
      const preference = normalizeWanderScenePreference(event.newValue);
      updateScene(preference === "auto" ? getWanderTimeScene() : preference);
    }
    if (event.key === visitedKey) updateProgress();
  });

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  const applyParallax = (x: number, y: number) => {
    parallaxX = Math.max(-8, Math.min(8, x));
    parallaxY = Math.max(-5, Math.min(5, y));
    art?.style.setProperty("--parallax-x", `${parallaxX}px`);
    art?.style.setProperty("--parallax-y", `${parallaxY}px`);
  };
  stage?.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
    if (!dragging) applyParallax(normalizedX * 12, normalizedY * 8);
    if (dragging) applyParallax(parallaxX + (event.clientX - startX) * 0.025, parallaxY + (event.clientY - startY) * 0.02);
    startX = event.clientX;
    startY = event.clientY;
  });
  stage?.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    stage.setPointerCapture(event.pointerId);
  });
  stage?.addEventListener("pointerup", () => { dragging = false; });
  stage?.addEventListener("pointerleave", () => { dragging = false; applyParallax(0, 0); });

  const storedScene = readStorageValue(storage, "muxin-wander-scene");
  const preference = normalizeWanderScenePreference(storedScene);
  updateScene(preference === "auto" || !storedScene ? getWanderTimeScene() : preference);
  if (preference === "auto" || !storedScene) window.setInterval(() => updateScene(getWanderTimeScene()), 60_000);
  updateProgress();
  focus("center", false);
  root.dataset.ready = "true";
}
