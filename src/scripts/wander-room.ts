import * as THREE from "three";
import { getWanderRoomState, getWanderStorage, getWanderTimeScene, normalizeWanderScene, normalizeWanderScenePreference, readStorageValue, readVisitedProgress, readWanderGameProgress, recordRecentProgress, shouldInitializeWander, writeStorageValue, writeVisitedProgress } from "../utils/wander-storage";

const root = document.querySelector<HTMLElement>("[data-wander-3d]");
if (root && shouldInitializeWander(root.dataset.ready)) {
  root.dataset.ready = "true";
  const canvas = root.querySelector<HTMLCanvasElement>("[data-wander-canvas]");
  const fallback = root.querySelector<HTMLElement>("[data-wander-fallback]");
  const hint = root.querySelector<HTMLElement>("[data-room-hint]");
  const memory = root.querySelector<HTMLElement>("[data-room-memory]");
  const progress = root.querySelector<HTMLElement>("[data-room-progress]");
  const skip = root.querySelector<HTMLButtonElement>("[data-wander-3d-skip]");
  const controls = [...root.querySelectorAll<HTMLButtonElement>("[data-room-camera]")];
  const enter = root.querySelector<HTMLAnchorElement>("[data-room-enter]");

  const storage = getWanderStorage();
  const views: Record<string, { position: [number, number, number]; target: [number, number, number]; href: string; label: string }> = {
    center: { position: [0, 3.3, 7.4], target: [0, 1.2, -1], href: "/wander/", label: "逛一圈" },
    anime: { position: [-3.3, 2.5, 2.4], target: [-2.4, 1.4, -2.2], href: "/wander/anime/", label: "进入番剧书架" },
    photo: { position: [0.4, 2.7, 2.6], target: [0, 1.4, -3], href: "/wander/photos/", label: "进入照片墙" },
    notes: { position: [2.8, 2.2, 2.3], target: [2.1, 1.2, -0.6], href: "/wander/notes/", label: "打开支线随笔" },
    memo: { position: [3.8, 2.4, 3.3], target: [2.5, 1.1, 0.2], href: "/memo/", label: "打开小木电台" },
  };
  const storedScene = readStorageValue(storage, "muxin-wander-scene");
  const initialState = getWanderRoomState(
    storedScene === "auto" ? null : storedScene,
    readStorageValue(storage, "muxin-wander-last-room"),
    Object.keys(views),
  );
  const initialScene = storedScene && storedScene !== "auto" ? initialState.scene : getWanderTimeScene();
  const disable = () => root.classList.add("is-disabled");
  if (readStorageValue(storage, "muxin-wander-3d") === "off") disable();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) disable();
  skip?.addEventListener("click", () => {
    writeStorageValue(storage, "muxin-wander-3d", "off");
    disable();
  });

  if (canvas && !root.classList.contains("is-disabled")) {
    try {
      const cleanupController = new AbortController();
      const cleanupOptions = { signal: cleanupController.signal };
      const scene = new THREE.Scene();
      const sceneColors = {
        dawn: { background: new THREE.Color("#6e7f94"), fog: new THREE.Color("#6e7f94"), hemisphere: new THREE.Color("#d4c5b0"), key: new THREE.Color("#e8e0d5"), dust: new THREE.Color("#d5cbb8"), violet: new THREE.Color("#8b7bb8"), pink: new THREE.Color("#c8797d") },
        day: { background: new THREE.Color("#87aec8"), fog: new THREE.Color("#87aec8"), hemisphere: new THREE.Color("#e8eae4"), key: new THREE.Color("#f5f0e5"), dust: new THREE.Color("#e8e6da"), violet: new THREE.Color("#7f9ea3"), pink: new THREE.Color("#cf9594") },
        dusk: { background: new THREE.Color("#3a2e45"), fog: new THREE.Color("#3a2e45"), hemisphere: new THREE.Color("#fed7aa"), key: new THREE.Color("#ffb347"), dust: new THREE.Color("#ffe2a3"), violet: new THREE.Color("#9b5bb0"), pink: new THREE.Color("#eb766c") },
        night: { background: new THREE.Color("#1c1935"), fog: new THREE.Color("#1c1935"), hemisphere: new THREE.Color("#6b8cce"), key: new THREE.Color("#bcc7e8"), dust: new THREE.Color("#c8cee4"), violet: new THREE.Color("#8b5cf6"), pink: new THREE.Color("#ec4899") },
      };
      const sceneColor = sceneColors[initialScene];
      const background = sceneColor.background.clone();
      scene.background = background;
      scene.fog = new THREE.Fog(sceneColor.fog.clone(), 8, 18);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
      renderer.setPixelRatio(1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      // ── Lights ──
      const ambient = new THREE.AmbientLight("#4a3b5c", 1);
      scene.add(ambient);
      const hemisphereLight = new THREE.HemisphereLight(sceneColor.hemisphere, "#2a1e33", 1.6);
      scene.add(hemisphereLight);
      const keyLight = new THREE.DirectionalLight(sceneColor.key, 3.5);
      keyLight.position.set(1.5, 4.5, 2);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(512, 512);
      scene.add(keyLight);
      const violetGlow = new THREE.PointLight("#8b5cf6", 1.2, 5, 2);
      violetGlow.position.set(-2, 1.2, -2.5);
      scene.add(violetGlow);
      const pinkGlow = new THREE.PointLight("#ec4899", 1, 4, 2);
      pinkGlow.position.set(2.7, 0.8, 0.8);
      scene.add(pinkGlow);

      // ── Materials ──
      const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, flatShading: true });
      const addObj = (name: string, w: number, h: number, d: number, x: number, y: number, z: number, color: string, parent: THREE.Object3D = scene) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
        mesh.name = name;
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      };

      // ── Room structure ──
      addObj("floor", 9, 0.18, 6, 0, -0.09, 0, "#524458");
      addObj("back-wall", 9, 4.5, 0.15, 0, 2.25, -3, "#3a2e45");
      addObj("left-wall", 0.15, 4.5, 6, -4.4, 2.25, 0, "#30273a");
      addObj("right-wall", 0.15, 4.5, 6, 4.4, 2.25, 0, "#30273a");
      // Floor planks
      for (let px = -3; px < 3; px += 1.2) addObj("plank-v", 1.15, 0.02, 5.8, px + 0.6, 0.01, 0.1, "#6a5b78");
      for (let pz = -1.5; pz < 1.5; pz += 1.2) addObj("plank-h", 8.6, 0.02, 1.15, 0, 0.02, pz + 0.7, "#6a5b78");
      // Rug
      addObj("rug", 4.8, 0.03, 2.6, 0, 0.04, 1.2, "#5c3d4a");
      addObj("rug-inlay", 4.2, 0.04, 2, 0, 0.06, 1.2, "#7a5460");
      // Baseboard
      addObj("base-l", 8.6, 0.15, 0.14, 0, -1.05, -2.85, "#2a1e33");
      addObj("base-r", 8.6, 0.15, 0.14, 0, -1.05, 2.85, "#2a1e33");

      // ── Window + outside ──
      const skyGeom = new THREE.PlaneGeometry(3.5, 2.8);
      const skyMat = new THREE.MeshStandardMaterial({ color: "#ffe2a3", side: THREE.DoubleSide, roughness: 1, metalness: 0, flatShading: true });
      const skyPlane = new THREE.Mesh(skyGeom, skyMat);
      skyPlane.position.set(1.1, 2.3, -2.92);
      skyPlane.name = "sky";
      scene.add(skyPlane);
      // Tree silhouettes outside
      [[-0.5, 0.7], [0.8, 0.9], [-1.2, 0.55]].forEach(([tx, th]) => {
        addObj("tree", 0.3, th, 0.25, 1.1 + tx, 2.05 + th / 2, -2.88, "#2a1e33");
        if (th > 0.6) addObj("tree-top", 0.6, 0.25, 0.25, 1.1 + tx, 2.05 + th + 0.12, -2.88, "#2a1e33");
      });
      const wg = new THREE.Group();
      wg.position.set(1.1, 2.3, -2.92);
      addObj("w-top", 2.2, 0.1, 0.14, 0, 0.75, 0, "#6d597a", wg);
      addObj("w-bottom", 2.2, 0.1, 0.14, 0, -0.75, 0, "#6d597a", wg);
      addObj("w-left", 0.1, 1.7, 0.14, -1.05, 0, 0, "#6d597a", wg);
      addObj("w-right", 0.1, 1.7, 0.14, 1.05, 0, 0, "#6d597a", wg);
      addObj("w-cross-h", 2, 0.06, 0.15, 0, 0, 0, "#6d597a", wg);
      addObj("w-cross-v", 0.06, 1.6, 0.15, 0, 0, 0, "#6d597a", wg);
      scene.add(wg);

      // ── Bookshelf (anime) ──
      const shelf = new THREE.Group();
      shelf.userData.roomKey = "anime";
      shelf.position.set(-2.5, 0, -2.3);
      const shelfW = 1.8, shelfH = 3, shelfD = 0.4, shelfX = 0, shelfY = 1.5, shelfZ = 0;
      addObj("sh-left", 0.08, shelfH, shelfD, shelfX - shelfW / 2, shelfY, shelfZ, "#6d597a", shelf);
      addObj("sh-right", 0.08, shelfH, shelfD, shelfX + shelfW / 2, shelfY, shelfZ, "#6d597a", shelf);
      addObj("sh-top", shelfW, 0.08, shelfD, shelfX, shelfY + shelfH / 2, shelfZ, "#6d597a", shelf);
      for (let sy = 0.5; sy < shelfH; sy += 0.75) {
        addObj("sh-shelf", shelfW - 0.2, 0.06, shelfD, shelfX, 0.3 + sy, shelfZ, "#bea879", shelf);
        // Books on this shelf
        const bookColors = [["#e8625c", 0.42], ["#fbb347", 0.55], ["#7ecf9a", 0.32], ["#77aadd", 0.48], ["#c77ddf", 0.38]].slice(0, 3 + (Math.floor(sy / 0.75) % 3));
        bookColors.forEach(([bcol, bh], bi) => {
          addObj("book", 0.14, bh as number, 0.42, -0.65 + bi * 0.32, 0.4 + sy, -0.16, bcol as string, shelf);
        });
      }
      scene.add(shelf);

      // ── Photo wall ──
      const photo = new THREE.Group();
      photo.userData.roomKey = "photo";
      photo.position.set(-0.3, 1.5, -2.92);
      const pf = (px: number, py: number, pw: number, ph: number, frameCol: string, innerCol: string) => {
        addObj("pf", pw + 0.12, ph + 0.12, 0.08, px, py, 0, frameCol, photo);
        addObj("pi", pw, ph, 0.1, px, py, 0.06, innerCol, photo);
      };
      pf(-0.95, 0.15, 0.7, 0.5, "#7a5460", "#c8a8a8");
      pf(0.07, 0.15, 0.7, 0.5, "#6d597a", "#b8a8c8");
      pf(-0.44, -0.42, 1.1, 0.35, "#5c6d7a", "#a8c8d8");
      scene.add(photo);

      // ── Desk (notes) ──
      const desk = new THREE.Group();
      desk.userData.roomKey = "notes";
      desk.position.set(2.4, 0, -0.5);
      const dtW = 2.6, dtD = 1.1, dtH = 1.1, dtY = 0.55;
      addObj("dt-top", dtW, 0.14, dtD, 0, dtH, 0, "#b5845c", desk);
      addObj("dt-leg-fl", 0.12, dtH - 0.07, 0.12, -dtW / 2 + 0.2, dtY - dtH / 2 + 0.04, -dtD / 2 + 0.2, "#7a5240", desk);
      addObj("dt-leg-fr", 0.12, dtH - 0.07, 0.12, dtW / 2 - 0.2, dtY - dtH / 2 + 0.04, -dtD / 2 + 0.2, "#7a5240", desk);
      addObj("dt-leg-bl", 0.12, dtH - 0.07, 0.12, -dtW / 2 + 0.2, dtY - dtH / 2 + 0.04, dtD / 2 - 0.2, "#7a5240", desk);
      addObj("dt-leg-br", 0.12, dtH - 0.07, 0.12, dtW / 2 - 0.2, dtY - dtH / 2 + 0.04, dtD / 2 - 0.2, "#7a5240", desk);
      // Monitor
      const mg = new THREE.Group();
      mg.position.set(-0.3, 0.82, -0.2);
      addObj("m-base", 0.5, 0.1, 0.4, 0, 0, 0, "#3a2e45", mg);
      addObj("m-stand", 0.1, 0.35, 0.1, 0, 0.22, 0, "#3a2e45", mg);
      addObj("m-screen", 1.2, 0.75, 0.1, 0, 0.7, 0, "#2a1e33", mg);
      addObj("m-glow", 1, 0.55, 0.12, 0, 0.7, 0.08, "#5c7dba", mg);
      desk.add(mg);
      // Desk items
      addObj("keyboard", 0.85, 0.06, 0.28, 0.3, 0.62, -0.32, "#7a5460", desk);
      addObj("mug", 0.18, 0.22, 0.18, 0.95, 0.72, 0.15, "#e8625c", desk);
      addObj("notebook", 0.4, 0.04, 0.3, -0.8, 0.63, 0.15, "#e8d8c0", desk);
      // Desk lamp
      const lamp = new THREE.Group();
      lamp.position.set(0.65, 0.68, -0.5);
      addObj("lamp-base", 0.22, 0.08, 0.22, 0, 0, 0, "#6d597a", lamp);
      addObj("lamp-pole", 0.08, 0.45, 0.08, 0, 0.26, 0, "#c8a8a8", lamp);
      addObj("lamp-shade", 0.4, 0.2, 0.3, 0, 0.52, 0, "#ffb347", lamp);
      desk.add(lamp);
      scene.add(desk);

      // ── Radio (memo) ──
      const radio = new THREE.Group();
      radio.userData.roomKey = "memo";
      radio.position.set(2.8, 0.15, 1.8);
      const rg = radio;
      addObj("r-body", 1.1, 0.58, 0.52, 0, 0.39, 0, "#e8625c", rg);
      addObj("r-grille", 0.7, 0.32, 0.06, 0, 0.32, -0.3, "#3a2e45", rg);
      for (let i = 0; i < 5; i++) addObj("r-bar", 0.08, 0.22, 0.08, -0.3 + i * 0.15, 0.32, -0.3, "#524458", rg);
      addObj("r-knob1", 0.15, 0.15, 0.1, -0.35, 0.52, 0.1, "#fbb347", rg);
      addObj("r-knob2", 0.15, 0.15, 0.1, -0.1, 0.52, 0.1, "#fbb347", rg);
      addObj("r-light", 0.12, 0.08, 0.06, 0.25, 0.52, 0.1, "#7ecf9a", rg);
      addObj("r-antenna", 0.05, 0.55, 0.05, -0.45, 0.93, 0.05, "#c8a8a8", rg);
      addObj("r-antenna-tip", 0.08, 0.06, 0.08, -0.45, 1.23, 0.05, "#fbb347", rg);
      scene.add(radio);

      // ── Dust particles ──
      const dustGeometry = new THREE.BufferGeometry();
      const dustPositions = new Float32Array(96 * 3);
      for (let index = 0; index < dustPositions.length; index += 3) {
        dustPositions[index] = (Math.random() - 0.5) * 7;
        dustPositions[index + 1] = Math.random() * 3.5;
        dustPositions[index + 2] = (Math.random() - 0.5) * 5;
      }
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dustMaterial = new THREE.PointsMaterial({ color: sceneColor.dust, size: 0.05, transparent: true, opacity: 0.45 });
      const dust = new THREE.Points(dustGeometry, dustMaterial);
      scene.add(dust);

      let activeScene: keyof typeof sceneColors = initialScene;
      const targetBackground = sceneColor.background.clone();
      const targetFog = sceneColor.fog.clone();
      const targetHemisphere = sceneColor.hemisphere.clone();
      const targetKey = sceneColor.key.clone();
      const targetDust = sceneColor.dust.clone();
      const targetViolet = sceneColor.violet.clone();
      const targetPink = sceneColor.pink.clone();
      let automaticScene = normalizeWanderScenePreference(storedScene) === "auto" || !storedScene;
      const syncScene = (sceneKey: string, immediate = false) => {
        activeScene = normalizeWanderScene(sceneKey);
        const colors = sceneColors[activeScene];
        targetBackground.copy(colors.background);
        targetFog.copy(colors.fog);
        targetHemisphere.copy(colors.hemisphere);
        targetKey.copy(colors.key);
        targetDust.copy(colors.dust);
        targetViolet.copy(colors.violet);
        targetPink.copy(colors.pink);
        if (immediate) {
          background.copy(targetBackground);
          scene.fog?.color.copy(targetFog);
          hemisphereLight.color.copy(targetHemisphere);
          keyLight.color.copy(targetKey);
          dustMaterial.color.copy(targetDust);
          violetGlow.color.copy(targetViolet);
          pinkGlow.color.copy(targetPink);
        }
      };
      syncScene(activeScene, true);
      const handleSceneChange = (event: Event) => {
        const detail = (event as CustomEvent<{ scene?: string; preference?: string }>).detail;
        automaticScene = detail.preference === "auto";
        const sceneKey = detail.scene;
        if (sceneKey) syncScene(sceneKey);
      };
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === "muxin-wander-scene") syncScene(event.newValue ?? "night");
      };
      window.addEventListener("muxin-wander-scene", handleSceneChange, cleanupOptions);
      window.addEventListener("storage", handleStorageChange, cleanupOptions);
      const timeSceneTimer = window.setInterval(() => {
        if (automaticScene) syncScene(getWanderTimeScene());
      }, 60_000);
      cleanupController.signal.addEventListener("abort", () => window.clearInterval(timeSceneTimer), { once: true });

      let current = views.center;
      let cameraTarget = new THREE.Vector3(...current.target);
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const pixelScale = window.matchMedia("(max-width: 639px)").matches ? 1.5 : 2;
        const renderWidth = Math.max(160, Math.round(rect.width / pixelScale));
        const renderHeight = Math.max(120, Math.round(rect.height / pixelScale));
        renderer.setSize(renderWidth, renderHeight, false);
        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
      };
      const choose = (key: string, remember = true) => {
        current = views[key] ?? views.center;
        controls.forEach((button) => {
          const active = button.dataset.roomCamera === key;
          button.dataset.active = active ? "true" : "false";
          button.setAttribute("aria-pressed", String(active));
        });
        if (enter) { enter.href = current.href; enter.textContent = `${current.label} →`; }
        if (remember && key !== "center") {
          writeStorageValue(storage, "muxin-wander-last-room", key);
          const visited = readVisited();
          visited.add(key);
          writeVisitedProgress(storage, visitedStorageKey, visited);
          recordRecentProgress(storage, recentStorageKey, key);
          window.dispatchEvent(new CustomEvent("muxin-wander-progress"));
        }
      };
      controls.forEach((button) => button.addEventListener("click", () => choose(button.dataset.roomCamera ?? "center"), cleanupOptions));
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const orbit = new THREE.Vector2();
      let dragging = false;
      let dragged = false;
      let lastPointer = { x: 0, y: 0 };
      const hotspots = [shelf, photo, desk, radio];
      const findHotspot = (object: THREE.Object3D | undefined) => {
        let currentObject = object;
        while (currentObject) {
          if (typeof currentObject.userData.roomKey === "string") return currentObject.userData.roomKey;
          currentObject = currentObject.parent as THREE.Object3D;
        }
        return undefined;
      };
      const visitedStorageKey = "muxin-wander-visited";
      const recentStorageKey = "muxin-wander-recent";
      const readVisited = () => readVisitedProgress(storage, visitedStorageKey);
      const updateProgress = () => {
        if (progress) progress.textContent = `已探索 ${readVisited().size} / 4`;
      };
      window.addEventListener("muxin-wander-progress", updateProgress, cleanupOptions);
      updateProgress();
      const updatePointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const key = findHotspot(raycaster.intersectObjects(hotspots, true)[0]?.object);
        canvas.style.cursor = key ? "pointer" : "grab";
        if (hint) hint.textContent = key ? `${views[key].label} · 点击进入` : "拖动看看 · 点击物件开始漫游";
      };
      canvas.addEventListener("pointermove", updatePointer, cleanupOptions);
      canvas.addEventListener("pointerdown", (event) => {
        dragging = true;
        dragged = false;
        lastPointer = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      }, cleanupOptions);
      canvas.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        const deltaX = event.clientX - lastPointer.x;
        const deltaY = event.clientY - lastPointer.y;
        if (Math.abs(deltaX) + Math.abs(deltaY) > 2) dragged = true;
        orbit.x = THREE.MathUtils.clamp(orbit.x + deltaX * 0.006, -0.8, 0.8);
        orbit.y = THREE.MathUtils.clamp(orbit.y - deltaY * 0.004, -0.45, 0.45);
        lastPointer = { x: event.clientX, y: event.clientY };
      }, cleanupOptions);
      canvas.addEventListener("pointerleave", () => { canvas.style.cursor = "grab"; if (hint) hint.textContent = "拖动看看 · 点击物件开始漫游"; }, cleanupOptions);
      canvas.addEventListener("pointerup", (event) => {
        dragging = false;
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        const key = findHotspot(raycaster.intersectObjects(hotspots, true)[0]?.object);
        if (key && !dragged) {
          const gameProgress = readWanderGameProgress(storage, "muxin-wander-games");
          if (key === "anime" && !gameProgress.completed.includes("anime")) {
            window.dispatchEvent(new CustomEvent("wander-game-open", { detail: { key: "anime" } }));
            choose("anime");
          } else {
            choose(key);
          }
        }
      }, cleanupOptions);
      const resumeKey = initialState.resumeKey;
      if (resumeKey !== "center") {
        choose(resumeKey, false);
        if (memory) memory.textContent = `上次停在：${views[resumeKey].label.replace(/^进入|^打开/, "")}`;
      } else {
        choose("center");
      }
      resize();
      window.addEventListener("resize", resize, cleanupOptions);
      let animationFrame: number | null = null;
      let isVisible = document.visibilityState !== "hidden";
      const supportsViewportObserver = "IntersectionObserver" in window;
      let isInViewport = !supportsViewportObserver;
      const shouldAnimate = () => isVisible && isInViewport;
      const stopAnimation = () => {
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        animationFrame = null;
      };
      const animate = () => {
        animationFrame = null;
        if (!shouldAnimate()) return;
        const time = performance.now() * 0.001;
        if (!reduce) dust.rotation.y = time * 0.015;
        const blend = reduce ? 1 : 0.035;
        background.lerp(targetBackground, blend);
        scene.fog?.color.lerp(targetFog, blend);
        hemisphereLight.color.lerp(targetHemisphere, blend);
        keyLight.color.lerp(targetKey, blend);
        dustMaterial.color.lerp(targetDust, blend);
        violetGlow.color.lerp(targetViolet, blend);
        pinkGlow.color.lerp(targetPink, blend);
        dustMaterial.opacity = activeScene === "day" ? 0.32 : 0.55;
        radio.position.y = 0.15 + (reduce ? 0 : Math.sin(time * 1.4) * 0.025);
        keyLight.position.x = -4 + (reduce ? 0 : Math.sin(time * 0.35) * 0.35);
        const next = new THREE.Vector3(...current.position);
        next.x += orbit.x;
        next.y += orbit.y;
        camera.position.lerp(next, reduce ? 1 : 0.045);
        cameraTarget.lerp(new THREE.Vector3(...current.target), reduce ? 1 : 0.06);
        camera.lookAt(cameraTarget);
        renderer.render(scene, camera);
        scheduleAnimation();
      };
      const scheduleAnimation = () => {
        if (shouldAnimate() && animationFrame === null) animationFrame = requestAnimationFrame(animate);
      };
      const handleVisibilityChange = () => {
        isVisible = document.visibilityState !== "hidden";
        if (!isVisible) {
          stopAnimation();
          return;
        }
        scheduleAnimation();
      };
      const viewportObserver = supportsViewportObserver
        ? new IntersectionObserver(([entry]) => {
            isInViewport = entry.isIntersecting;
            if (!isInViewport) {
              stopAnimation();
              return;
            }
            scheduleAnimation();
          }, { threshold: 0 })
        : null;
      viewportObserver?.observe(canvas);
      document.addEventListener("visibilitychange", handleVisibilityChange, cleanupOptions);
      let cleanedUp = false;
      const disposeMaterial = (value: THREE.Material) => {
        const textures = new Set<THREE.Texture>();
        Object.values(value).forEach((materialValue) => {
          if (materialValue instanceof THREE.Texture) textures.add(materialValue);
        });
        textures.forEach((texture) => texture.dispose());
        value.dispose();
      };
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        stopAnimation();
        viewportObserver?.disconnect();
        cleanupController.abort();
        scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMaterial);
          else if (mesh.material) disposeMaterial(mesh.material);
        });
        renderer.dispose();
        renderer.forceContextLoss();
      };
      document.addEventListener("astro:before-swap", cleanup, { once: true });
      scheduleAnimation();
    } catch {
      root.classList.add("is-failed");
      if (fallback) fallback.style.display = "grid";
    }
  }
}
