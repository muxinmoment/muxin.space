import { completeWanderGame, getWanderStorage, readWanderGameProgress } from "../utils/wander-storage";

interface Book {
  label: string;
  color: string;
  correctIndex: number;
}

const SHELF_BOOKS: Book[] = [
  { label: "EVA", color: "#a78bfa", correctIndex: 0 },
  { label: "日常", color: "#34d399", correctIndex: 1 },
  { label: "86", color: "#f472b6", correctIndex: 2 },
];

const GAME_STORAGE_KEY = "muxin-wander-games";

function initShelfGame() {
  const root = document.querySelector<HTMLElement>("[data-wander-3d]");
  if (!root || root.dataset.gameReady === "true") return;

  const panel = root.querySelector<HTMLElement>("[data-wander-game-panel]");
  const slotsContainer = root.querySelector<HTMLElement>("[data-wander-book-slots]");
  const trayContainer = root.querySelector<HTMLElement>("[data-wander-book-tray]");
  const statusEl = root.querySelector<HTMLElement>("[data-wander-game-status]");
  const resetBtn = root.querySelector<HTMLButtonElement>("[data-wander-game-reset]");
  const closeBtn = root.querySelector<HTMLButtonElement>("[data-wander-game-close]");
  const completeEl = root.querySelector<HTMLElement>("[data-wander-game-complete]");

  if (!panel || !slotsContainer || !trayContainer || !statusEl || !resetBtn || !closeBtn || !completeEl) return;

  const storage = getWanderStorage();
  const isAlreadyCompleted = () => {
    const progress = readWanderGameProgress(storage, GAME_STORAGE_KEY);
    return progress.completed.includes("anime");
  };

  let slots: Array<Book | null> = [null, null, null];
  let tray: Book[] = [];
  let selectedBookIndex: number | null = null;

  const syncButtons = () => {
    const books = trayContainer.querySelectorAll<HTMLButtonElement>("[data-tray-index]");
    books.forEach((button) => {
      const index = Number(button.dataset.trayIndex);
      const active = selectedBookIndex === index;
      button.dataset.selected = active ? "true" : "false";
    });
  };

  const syncSlots = () => {
    const slotEls = slotsContainer.querySelectorAll<HTMLButtonElement>("[data-slot-index]");
    slotEls.forEach((slotEl) => {
      const index = Number(slotEl.dataset.slotIndex);
      const book = slots[index];
      slotEl.textContent = book ? `${book.label}` : `空位 ${index + 1}`;
      slotEl.dataset.selected = "false";
      slotEl.style.color = book ? book.color : "";
    });
  };

  const showStatus = (text: string) => {
    if (statusEl) statusEl.textContent = text;
  };

  const shuffle = (arr: Book[]): Book[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const checkCompletion = () => {
    if (slots.every((book, index) => book?.correctIndex === index)) {
      completeEl.hidden = false;
      showStatus("全部放对了！书架亮起来了。");
      if (!isAlreadyCompleted()) {
        completeWanderGame(storage, GAME_STORAGE_KEY, "anime");
        window.dispatchEvent(new CustomEvent("wander-game-complete", { detail: { key: "anime" } }));
      }
    } else {
      completeEl.hidden = true;
      showStatus("顺序还不太对，继续试试。");
    }
  };

  const render = () => {
    slotsContainer.innerHTML = "";
    slots.forEach((book, index) => {
      const button = document.createElement("button");
      button.className = "wander-book-slot";
      button.dataset.slotIndex = String(index);
      button.textContent = book ? `${book.label}` : `空位 ${index + 1}`;
      if (book) button.style.color = book.color;
      button.addEventListener("click", () => {
        if (completeEl.hidden === false) return;
        if (selectedBookIndex === null) {
          showStatus("先选一本书。");
          return;
        }
        if (slots[index] !== null) {
          showStatus("这个位置已经有书了，选另一个空位。");
          return;
        }
        slots[index] = tray[selectedBookIndex];
        tray.splice(selectedBookIndex, 1);
        selectedBookIndex = null;
        syncSlots();
        renderTray();
        syncButtons();
        checkCompletion();
      });
      slotsContainer.appendChild(button);
    });
    syncSlots();
  };

  const renderTray = () => {
    trayContainer.innerHTML = "";
    tray.forEach((book, index) => {
      const button = document.createElement("button");
      button.className = "wander-book";
      button.dataset.trayIndex = String(index);
      button.textContent = book.label;
      button.style.color = book.color;
      button.addEventListener("click", () => {
        if (completeEl.hidden === false) return;
        if (selectedBookIndex === index) {
          selectedBookIndex = null;
          showStatus("已取消选择，再选一本书。");
        } else {
          selectedBookIndex = index;
          showStatus(`已选中《${book.label}》，点一个空位放进去。`);
        }
        syncButtons();
      });
      trayContainer.appendChild(button);
    });
    syncButtons();
  };

  const reset = () => {
    slots = [null, null, null];
    tray = shuffle(SHELF_BOOKS);
    selectedBookIndex = null;
    completeEl.hidden = true;
    showStatus("先选一本书。");
    render();
    renderTray();
  };

  const open = () => {
    if (panel.hidden) {
      panel.hidden = false;
      reset();
    }
  };

  const closePanel = () => {
    panel.hidden = true;
  };

  resetBtn.addEventListener("click", reset);
  closeBtn.addEventListener("click", closePanel);

  // Open the game when the anime shelf hotspot is triggered
  window.addEventListener("wander-game-open", ((event: CustomEvent<{ key: string }>) => {
    if (event.detail.key === "anime") open();
  }) as EventListener);

  root.dataset.gameReady = "true";
}

initShelfGame();
document.addEventListener("astro:page-load", initShelfGame);
