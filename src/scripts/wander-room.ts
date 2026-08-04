import * as THREE from "three";

const root = document.querySelector<HTMLElement>("[data-wander-3d]");
if (root && root.dataset.ready !== "true") {
  root.dataset.ready = "true";
  const canvas = root.querySelector<HTMLCanvasElement>("[data-wander-canvas]");
  const fallback = root.querySelector<HTMLElement>("[data-wander-fallback]");
  const hint = root.querySelector<HTMLElement>("[data-room-hint]");
  const memory = root.querySelector<HTMLElement>("[data-room-memory]");
  const skip = root.querySelector<HTMLButtonElement>("[data-wander-3d-skip]");
  const controls = [...root.querySelectorAll<HTMLButtonElement>("[data-room-camera]")];
  const enter = root.querySelector<HTMLAnchorElement>("[data-room-enter]");

  const disable = () => root.classList.add("is-disabled");
  if (localStorage.getItem("muxin-wander-3d") === "off") disable();
  skip?.addEventListener("click", () => {
    localStorage.setItem("muxin-wander-3d", "off");
    disable();
  });

  if (canvas && !root.classList.contains("is-disabled")) {
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#120e19");
      scene.fog = new THREE.Fog("#120e19", 8, 18);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene.add(new THREE.HemisphereLight("#c4b5fd", "#21152e", 2.2));
      const keyLight = new THREE.DirectionalLight("#fde68a", 3.2);
      keyLight.position.set(-4, 7, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05 });
      const addBox = (name: string, size: [number, number, number], position: [number, number, number], color: string, parent: THREE.Object3D = scene) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
        mesh.name = name;
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      };

      addBox("floor", [10, 0.2, 8], [0, -0.2, 0], "#292037");
      addBox("back-wall", [10, 5, 0.2], [0, 2.4, -3.8], "#20182b");
      addBox("left-wall", [0.2, 5, 8], [-4.8, 2.4, 0], "#20182b");

      const shelf = new THREE.Group();
      shelf.userData.roomKey = "anime";
      shelf.position.set(-2.5, 0, -2.8);
      scene.add(shelf);
      addBox("shelf-frame", [2.1, 3.2, 0.45], [0, 1.5, 0], "#4c1d95", shelf);
      for (let y = 0.45; y < 3; y += 0.72) addBox("shelf-line", [1.75, 0.12, 0.6], [0, y, -0.32], "#a78bfa", shelf);
      [[-0.55, 0.75, "#fb7185"], [0.05, 0.75, "#fbbf24"], [0.58, 0.75, "#34d399"], [-0.45, 1.48, "#60a5fa"], [0.38, 1.48, "#f472b6"]].forEach(([x, y, color]) => addBox("book", [0.28, 0.48, 0.5], [x as number, y as number, -0.38], color as string, shelf));

      const photo = new THREE.Group();
      photo.userData.roomKey = "photo";
      photo.position.set(0, 1.5, -3.62);
      scene.add(photo);
      addBox("photo-frame", [2.4, 1.55, 0.12], [0, 0, 0], "#be185d", photo);
      addBox("photo-inner", [2.02, 1.17, 0.14], [0, 0, 0.08], "#fbcfe8", photo);
      addBox("photo-sun", [0.5, 0.5, 0.16], [0.45, 0.24, 0.16], "#f59e0b", photo);
      addBox("photo-ground", [1.8, 0.25, 0.16], [0, -0.4, 0.16], "#7c3aed", photo);

      const desk = new THREE.Group();
      desk.userData.roomKey = "notes";
      desk.position.set(2.2, 0, -0.7);
      scene.add(desk);
      addBox("desk-top", [2.8, 0.22, 1.25], [0, 1.25, 0], "#7c3aed", desk);
      addBox("desk-leg", [0.2, 1.25, 0.2], [-1.05, 0.55, 0], "#4c1d95", desk);
      addBox("desk-leg", [0.2, 1.25, 0.2], [1.05, 0.55, 0], "#4c1d95", desk);
      addBox("screen", [1.25, 0.8, 0.12], [0, 2.05, -0.18], "#312e81", desk);
      addBox("screen-glow", [0.98, 0.52, 0.13], [0, 2.05, -0.25], "#c4b5fd", desk);

      const radio = new THREE.Group();
      radio.userData.roomKey = "memo";
      radio.position.set(2.8, 0.15, 1.5);
      scene.add(radio);
      addBox("radio-body", [1.15, 0.7, 0.6], [0, 0.45, 0], "#be185d", radio);
      addBox("radio-panel", [0.72, 0.2, 0.08], [0, 0.62, -0.32], "#fbcfe8", radio);
      addBox("radio-knob", [0.14, 0.14, 0.08], [0.36, 0.25, -0.34], "#fbbf24", radio);

      const dustGeometry = new THREE.BufferGeometry();
      const dustPositions = new Float32Array(72 * 3);
      for (let index = 0; index < dustPositions.length; index += 3) {
        dustPositions[index] = (Math.random() - 0.5) * 8;
        dustPositions[index + 1] = Math.random() * 4;
        dustPositions[index + 2] = (Math.random() - 0.5) * 6;
      }
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: "#fef3c7", size: 0.035, transparent: true, opacity: 0.55 }));
      scene.add(dust);

      const views: Record<string, { position: [number, number, number]; target: [number, number, number]; href: string; label: string }> = {
        center: { position: [0, 3.3, 7.4], target: [0, 1.2, -1], href: "/wander/", label: "逛一圈" },
        anime: { position: [-3.3, 2.5, 2.4], target: [-2.4, 1.4, -2.2], href: "/wander/anime/", label: "进入番剧书架" },
        photo: { position: [0.4, 2.7, 2.6], target: [0, 1.4, -3], href: "/wander/photos/", label: "进入照片墙" },
        notes: { position: [2.8, 2.2, 2.3], target: [2.1, 1.2, -0.6], href: "/wander/notes/", label: "打开支线随笔" },
        memo: { position: [3.8, 2.4, 3.3], target: [2.5, 1.1, 0.2], href: "/memo/", label: "打开小木电台" },
      };
      let current = views.center;
      let cameraTarget = new THREE.Vector3(...current.target);
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      };
      const choose = (key: string, remember = true) => {
        current = views[key] ?? views.center;
        controls.forEach((button) => { button.dataset.active = button.dataset.roomCamera === key ? "true" : "false"; });
        if (enter) { enter.href = current.href; enter.textContent = `${current.label} →`; }
        if (remember && key !== "center") localStorage.setItem("muxin-wander-last-room", key);
      };
      controls.forEach((button) => button.addEventListener("click", () => choose(button.dataset.roomCamera ?? "center")));
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
      const updatePointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const key = findHotspot(raycaster.intersectObjects(hotspots, true)[0]?.object);
        canvas.style.cursor = key ? "pointer" : "grab";
        if (hint) hint.textContent = key ? `${views[key].label} · 点击进入` : "点击房间里的物件探索";
      };
      canvas.addEventListener("pointermove", updatePointer);
      canvas.addEventListener("pointerdown", (event) => {
        dragging = true;
        dragged = false;
        lastPointer = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      });
      canvas.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        const deltaX = event.clientX - lastPointer.x;
        const deltaY = event.clientY - lastPointer.y;
        if (Math.abs(deltaX) + Math.abs(deltaY) > 2) dragged = true;
        orbit.x = THREE.MathUtils.clamp(orbit.x + deltaX * 0.006, -0.8, 0.8);
        orbit.y = THREE.MathUtils.clamp(orbit.y - deltaY * 0.004, -0.45, 0.45);
        lastPointer = { x: event.clientX, y: event.clientY };
      });
      canvas.addEventListener("pointerleave", () => { canvas.style.cursor = "grab"; if (hint) hint.textContent = "点击房间里的物件探索"; });
      canvas.addEventListener("pointerup", (event) => {
        dragging = false;
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        const key = findHotspot(raycaster.intersectObjects(hotspots, true)[0]?.object);
        if (key && !dragged) choose(key);
      });
      const rememberedKey = localStorage.getItem("muxin-wander-last-room");
      if (rememberedKey && views[rememberedKey]) {
        choose(rememberedKey, false);
        if (memory) memory.textContent = `上次停在：${views[rememberedKey].label.replace(/^进入|^打开/, "")}`;
      } else {
        choose("center");
      }
      resize();
      window.addEventListener("resize", resize);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const animate = () => {
        requestAnimationFrame(animate);
        const time = performance.now() * 0.001;
        dust.rotation.y = time * 0.015;
        radio.position.y = 0.15 + Math.sin(time * 1.4) * 0.025;
        keyLight.position.x = -4 + Math.sin(time * 0.35) * 0.35;
        const next = new THREE.Vector3(...current.position);
        next.x += orbit.x;
        next.y += orbit.y;
        camera.position.lerp(next, reduce ? 1 : 0.045);
        cameraTarget.lerp(new THREE.Vector3(...current.target), reduce ? 1 : 0.06);
        camera.lookAt(cameraTarget);
        renderer.render(scene, camera);
      };
      animate();
    } catch {
      root.classList.add("is-failed");
      if (fallback) fallback.style.display = "grid";
    }
  }
}
