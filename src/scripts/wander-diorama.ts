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
  const hotspots = [...root.querySelectorAll<HTMLButtonElement>(".room-hotspot")];
  const photo = root.querySelector<HTMLImageElement>("[data-wander-room-photo]");
  const photoNext = root.querySelector<HTMLImageElement>("[data-wander-room-photo-next]");

  // Camera zoom targets keyed by hotspot. transform-origin percentages line up
  // with each hotspot's approximate center on the shared bedroom-*.webp geometry.
  const cameraTargets: Record<string, { x: string; y: string; scale: number }> = {
    center: { x: "50%", y: "50%", scale: 1 },
    anime: { x: "13%", y: "45%", scale: 1.55 },
    notes: { x: "78%", y: "52%", scale: 1.5 },
    photo: { x: "83%", y: "18%", scale: 1.7 },
    memo: { x: "8%", y: "78%", scale: 1.8 },
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

  // ── Time-state: swap the full-screen base photo with a short crossfade ──
  let currentScene = "dusk";
  const updateScene = (scene: string) => {
    const assetScene = scene === "auto" ? "dusk" : scene;
    if (root.dataset.scene !== assetScene) root.dataset.scene = assetScene;
    if (assetScene === currentScene || !photo || !photoNext) return;
    const nextSrc = `/wander/bedroom-${assetScene}.webp`;
    photoNext.src = nextSrc;
    photoNext.dataset.crossfading = "true";
    const onSwap = () => {
      photo.src = nextSrc;
      photoNext.dataset.crossfading = "false";
      photoNext.removeEventListener("transitionend", onSwap);
    };
    // Wait a frame so the browser picks up the opacity transition, then swap the base src after it settles.
    requestAnimationFrame(() => {
      photoNext.addEventListener("transitionend", onSwap, { once: true });
      window.setTimeout(onSwap, 700); // fallback in case transitionend doesn't fire (e.g. reduced motion)
    });
    currentScene = assetScene;
  };

  // ── Camera: CSS transform zoom toward the clicked hotspot ──
  const setCamera = (key: string) => {
    const target = cameraTargets[key] ?? cameraTargets.center;
    art?.style.setProperty("--zoom-x", target.x);
    art?.style.setProperty("--zoom-y", target.y);
    art?.style.setProperty("--zoom-scale", String(target.scale));
  };

  const focus = (key: string, remember = true) => {
    const view = views[key] ?? views.center;
    setCamera(key);
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
    if (key === "center") {
      if (hint) hint.textContent = "把鼠标移到物件上看看 · 点击开始漫游";
      return;
    }
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
  photo?.addEventListener("error", () => {
    if (fallback) fallback.hidden = false;
  }, { once: true });
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

  // ── Subtle idle parallax on pointer move (kept minimal; camera zoom takes priority) ──
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const applyParallax = (x: number, y: number) => {
    if (reduceMotion) return;
    parallaxX = Math.max(-10, Math.min(10, x));
    parallaxY = Math.max(-6, Math.min(6, y));
    art?.style.setProperty("--parallax-x", `${parallaxX}px`);
    art?.style.setProperty("--parallax-y", `${parallaxY}px`);
  };
  stage?.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
    if (!dragging) applyParallax(normalizedX * 10, normalizedY * 6);
    if (dragging) applyParallax(parallaxX + (event.clientX - startX) * 0.02, parallaxY + (event.clientY - startY) * 0.015);
    startX = event.clientX;
    startY = event.clientY;
  });
  stage?.addEventListener("pointerdown", (event) => {
    // Don't capture the pointer when the press starts on an interactive hotspot/control:
    // setPointerCapture would redirect the follow-up pointerup (and its click) away from
    // the button and onto the stage, silently swallowing hotspot clicks.
    if (event.target instanceof Element && event.target.closest("button, a")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    stage.setPointerCapture(event.pointerId);
  });
  stage?.addEventListener("pointerup", () => { dragging = false; });
  stage?.addEventListener("pointerleave", () => { dragging = false; applyParallax(0, 0); });

  const storedScene = readStorageValue(storage, "muxin-wander-scene");
  const preference = normalizeWanderScenePreference(storedScene);
  const initialScene = preference === "auto" || !storedScene ? getWanderTimeScene() : preference;
  currentScene = initialScene;
  root.dataset.scene = initialScene;
  if (photo) photo.src = `/wander/bedroom-${initialScene}.webp`;
  if (photoNext) photoNext.src = `/wander/bedroom-${initialScene}.webp`;
  if (preference === "auto" || !storedScene) window.setInterval(() => updateScene(getWanderTimeScene()), 60_000);
  updateProgress();
  focus("center", false);
  root.dataset.ready = "true";
}
