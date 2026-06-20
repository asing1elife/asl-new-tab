"use strict";

/**
 * 自定义新标签页：读取原生书签栏并渲染。
 *  - 左侧：书签栏直属书签（“书签栏”入口）+ 顶层目录
 *  - 右侧：所选目录下的子目录递归平铺为「分区 + 书签网格」
 *  - 点击书签：在新标签页打开（由 <a target="_blank"> 完成）
 */

// Chrome 固定 ID："1" = 书签栏 (Bookmarks Bar)
const BOOKMARK_BAR_ID = "1";

/* ---------- Lucide 图标（MIT, lucide.dev） ---------- */
const ICONS = {
  compass:
    '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderOpen:
    '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  squarePen:
    '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  folderPlus:
    '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  circlePlus:
    '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  refreshCw:
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
};

function icon(name, cls) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  if (cls) svg.setAttribute("class", cls);
  svg.innerHTML = ICONS[name];
  return svg;
}

const els = {
  searchIcon: document.getElementById("searchIcon"),
  folderList: document.getElementById("folderList"),
  addFolderBtn: document.getElementById("addFolderBtn"),
  addFolderIcon: document.getElementById("addFolderIcon"),
  contentTitle: document.getElementById("contentTitle"),
  contentActions: document.getElementById("contentActions"),
  contentBody: document.getElementById("contentBody"),
  search: document.getElementById("searchInput"),
  refreshWallpaperBtn: document.getElementById("refreshWallpaperBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
};

// 模块级状态，每次 init 重建
const state = {
  topChildren: [], // 书签栏顶层条目（散装书签 + 目录），保持原始顺序
  topFolders: [], // 其中的目录
  allBookmarks: [], // 扁平化全部书签（搜索用）
  nodeById: Object.create(null), // id -> 节点（整棵书签栏子树），排序换算用
  currentEntryId: null,
};

// 侧栏拖拽排序状态
const drag = { el: null, id: null, fromIndex: -1 };
// 内容区拖拽排序状态（卡片 / 分区）
const cdrag = {
  type: null, // "card" | "section"
  el: null,
  grid: null,
  group: null,
  id: null,
  parentId: null,
  fromIndex: -1,
  fromPrev: null,
  fromNext: null,
};
// 由本扩展自己发起的 move，其 onMoved 回调应跳过整页刷新（避免闪烁/打断）
const selfMoves = new Set();
let dropTargetGroup = null; // 跨容器拖拽时高亮的目标分组

init();
setupSidebarDnd();
setupContentDnd();
setupBookmarkListeners();

async function init() {
  els.refreshWallpaperBtn.replaceChildren(icon("refreshCw"));
  els.refreshWallpaperBtn.onclick = refreshWallpaper;
  els.settingsBtn.replaceChildren(icon("settings"));
  els.settingsBtn.onclick = openSettingsModal;
  els.searchIcon.replaceChildren(icon("search"));
  els.addFolderIcon.replaceChildren(icon("folderPlus"));
  els.addFolderBtn.onclick = () => openCreateDialog();

  loadWallpaper(); // fire-and-forget — loads in parallel with bookmark tree

  let barNode;
  try {
    [barNode] = await chrome.bookmarks.getSubTree(BOOKMARK_BAR_ID);
  } catch (err) {
    renderError(err);
    return;
  }

  state.topChildren = barNode.children || []; // 顶层条目（散装书签 + 目录），保持原始顺序
  state.topFolders = state.topChildren.filter(isFolder);
  state.allBookmarks = flattenBookmarks(barNode);
  state.nodeById = Object.create(null);
  indexNodes(barNode);

  renderSidebar();

  // 保持当前选中目录（刷新后不跳回第一个）；否则默认第一个目录
  const target =
    state.topFolders.find((f) => f.id === state.currentEntryId) ||
    state.topFolders[0];
  if (target) {
    selectEntry(target.id);
  } else {
    state.currentEntryId = null;
    els.contentTitle.textContent = "";
    els.contentActions.replaceChildren();
    els.contentBody.replaceChildren(
      makeEmpty("Click a bookmark on the left to open it in a new tab")
    );
  }

  els.search.oninput = onSearch;
}

/** 书签变化时（新增/删除/移动）自动刷新；只注册一次 */
function setupBookmarkListeners() {
  const onChange = (id) => {
    // 跳过本扩展自己刚发起的 move —— 侧栏 DOM 已乐观更新，无需整页重渲染
    if (id != null && selfMoves.delete(id)) return;
    init();
  };
  for (const ev of ["onCreated", "onRemoved", "onChanged", "onMoved"]) {
    chrome.bookmarks[ev]?.addListener(onChange);
  }
}

/* ------------------------------ 数据 ------------------------------ */

const isFolder = (node) => !node.url;
const isBookmark = (node) => !!node.url;

function flattenBookmarks(node, out = []) {
  for (const child of node.children || []) {
    if (isBookmark(child)) out.push(child);
    else flattenBookmarks(child, out);
  }
  return out;
}

function indexNodes(node) {
  state.nodeById[node.id] = node;
  for (const child of node.children || []) indexNodes(child);
}

/**
 * 把一个目录递归展开成多个分区：
 *  - 目录自身的直属书签为一个分区（path 为空，folderId 即该目录）
 *  - 每个含书签的子目录为一个分区（path 记录相对层级，parentId 为其父目录）
 */
function buildSections(folder) {
  const sections = [];

  // 顶层目录不允许直接加书签，故仅在已有直属书签时渲染根分区
  const direct = (folder.children || []).filter(isBookmark);
  if (direct.length)
    sections.push({
      folderId: folder.id,
      parentId: folder.parentId,
      path: [],
      bookmarks: direct,
    });

  const walk = (node, path) => {
    for (const child of node.children || []) {
      if (!isFolder(child)) continue;
      const childPath = [...path, child.title || "Untitled folder"];
      // 空子目录也作为分区显示，便于新建后立即可见
      sections.push({
        folderId: child.id,
        parentId: node.id,
        path: childPath,
        bookmarks: (child.children || []).filter(isBookmark),
      });
      walk(child, childPath);
    }
  };
  walk(folder, []);

  return sections;
}

/* ------------------------------ 侧栏 ------------------------------ */

function renderSidebar() {
  els.folderList.replaceChildren();

  // 顶层条目按书签栏原始顺序混排：散装书签 = 直接打开的链接；目录 = 可选中
  for (const node of state.topChildren) {
    els.folderList.appendChild(
      isFolder(node) ? makeSidebarFolder(node) : makeSidebarBookmark(node)
    );
  }
}

function makeSidebarFolder(folder) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "folder-list__item";
  btn.dataset.id = folder.id;
  btn.draggable = true;

  const label = document.createElement("span");
  label.className = "folder-list__label";
  label.textContent = folder.title || "Untitled folder";

  const cnt = document.createElement("span");
  cnt.className = "folder-list__count";
  const count = (folder.children || []).length;
  cnt.textContent = count > 0 ? String(count) : "";

  btn.append(icon("folder", "folder-list__icon"), label, cnt);
  btn.addEventListener("click", () => selectEntry(folder.id));
  return btn;
}

function makeSidebarBookmark(bookmark) {
  const a = document.createElement("a");
  a.className = "folder-list__item folder-list__item--link";
  a.dataset.id = bookmark.id;
  a.draggable = true;
  a.href = bookmark.url;
  a.target = "_blank";
  a.rel = "noopener";
  a.title = `${bookmark.title || bookmark.url}\n${bookmark.url}`;

  const ic = makeFavicon(bookmark.url, "folder-list__icon");

  const label = document.createElement("span");
  label.className = "folder-list__label";
  label.textContent = bookmark.title || bookmark.url;

  // 悬浮时在右侧显示编辑/删除按钮（用 span 避免在 <a> 内嵌套交互元素并阻止跳转）
  const actions = document.createElement("span");
  actions.className = "folder-list__actions";
  actions.append(
    makeActionButton("squarePen", "Edit bookmark", "edit", () =>
      openBookmarkEditDialog(bookmark)
    ),
    makeActionButton("trash", "Delete bookmark", "danger", () =>
      openBookmarkDeleteDialog(bookmark)
    )
  );

  a.append(ic, label, actions);
  return a;
}

function highlightSidebar(entryId) {
  for (const item of els.folderList.children) {
    item.classList.toggle("is-active", item.dataset.id === entryId);
  }
}

/* ------------------------------ 拖拽排序 ------------------------------ */

/**
 * 左侧列表拖拽排序，直接写回原生书签。
 * 左侧列表 = 书签栏顶层子节点的有序映射，所以 DOM 下标 == 书签栏内 index，
 * 拖完取新下标调用 chrome.bookmarks.move 即可。事件委托在容器上注册一次。
 */
function setupSidebarDnd() {
  const list = els.folderList;

  list.addEventListener("dragstart", (e) => {
    const item = e.target.closest?.(".folder-list__item");
    if (!item) return;
    drag.el = item;
    drag.id = item.dataset.id;
    drag.fromIndex = indexInList(item);
    item.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", drag.id); // 抑制 <a> 默认的链接拖拽
    e.dataTransfer.setData("application/x-sidebar-item", drag.id);
  });

  list.addEventListener("dragover", (e) => {
    if (!drag.el) {
      // 内容区条目拖入侧栏：允许放置并高亮
      if (cdrag.type) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        list.classList.add("is-drop-target");
      }
      return;
    }
    list.classList.remove("is-drop-target");
    e.preventDefault(); // 允许放置
    e.dataTransfer.dropEffect = "move";
    const candidates = list.querySelectorAll(
      ".folder-list__item:not(.is-dragging)"
    );
    const after = elementAfter(candidates, e.clientY);
    if (after == null) list.appendChild(drag.el);
    else list.insertBefore(drag.el, after);
  });

  list.addEventListener("drop", (e) => {
    if (drag.el) {
      e.preventDefault(); // 阻止 <a> 默认导航
      return;
    }
    // 内容区条目拖放到侧栏：移动到书签栏根目录
    if (cdrag.type && cdrag.id) {
      e.preventDefault();
      list.classList.remove("is-drop-target");
      if (cdrag.el) cdrag.el.classList.remove("is-dragging");
      chrome.bookmarks.move(cdrag.id, { parentId: BOOKMARK_BAR_ID });
      // 重置内容区拖拽状态，避免其 dragend 再做排序
      cdrag.type = null;
      cdrag.el = null;
      cdrag.id = null;
    }
  });

  list.addEventListener("dragleave", (e) => {
    // 拖拽离开侧栏时清理高亮
    if (!list.contains(e.relatedTarget)) {
      list.classList.remove("is-drop-target");
    }
  });

  list.addEventListener("dragend", () => {
    // 清理跨容器拖拽的高亮
    if (dropTargetGroup) {
      dropTargetGroup.classList.remove("is-drop-target");
      dropTargetGroup = null;
    }
    list.classList.remove("is-drop-target");
    if (!drag.el) return;
    drag.el.classList.remove("is-dragging");

    const toIndex = indexInList(drag.el); // 拖拽后的最终可视下标
    const fromIndex = drag.fromIndex;
    const id = drag.id;
    drag.el = drag.id = null;
    drag.fromIndex = -1;
    if (toIndex < 0 || toIndex === fromIndex) return;

    // 同父目录内，Chrome 的 BookmarkModel::Move 在“向下移动”时会对 index 自减，
    // 即它按移除前的数组解释 index，所以向下移动需 +1 才能落到目标可视位置。
    const moveIndex = fromIndex < toIndex ? toIndex + 1 : toIndex;

    selfMoves.add(id); // 跳过这次自发 move 的整页刷新
    chrome.bookmarks.move(id, { parentId: BOOKMARK_BAR_ID, index: moveIndex });
  });
}

function indexInList(item) {
  return Array.prototype.indexOf.call(els.folderList.children, item);
}

/** 单列竖排：给定候选元素和指针 Y，返回应插入到其之前的元素（null 表示末尾） */
function elementAfter(candidates, y) {
  let closest = { offset: -Infinity, el: null };
  for (const child of candidates) {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) closest = { offset, el: child };
  }
  return closest.el;
}

/**
 * 多列网格：找到离指针中心最近的卡片，再按指针在其左/右半区决定插到它之前还是之后。
 * 返回应插入到其之前的元素（null 表示放到末尾）。单纯比较 Y 在多列网格里无法区分同行各列。
 */
function gridElementAfter(candidates, x, y) {
  let nearest = null;
  let min = Infinity;
  for (const child of candidates) {
    const box = child.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < min) {
      min = dist;
      nearest = { el: child, after: x > cx };
    }
  }
  if (!nearest) return null;
  return nearest.after ? nearest.el.nextElementSibling : nearest.el;
}

/**
 * 内容区拖拽排序（事件委托，注册一次）：
 *  - 卡片：在所属网格内（同目录）排序，不跨目录
 *  - 分区标题：在同父目录的子目录之间排序
 * 二者都通过 chrome.bookmarks.move 写回原生书签。
 */
function setupContentDnd() {
  const body = els.contentBody;

  body.addEventListener("dragstart", (e) => {
    const card = e.target.closest?.(".card--draggable");
    if (card) {
      cdrag.type = "card";
      cdrag.el = card;
      cdrag.grid = card.parentElement;
      cdrag.id = card.dataset.id;
      cdrag.fromIndex = childIndex(cdrag.grid, card);
      card.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cdrag.id);
      return;
    }
    const heading = e.target.closest?.(".group__title.is-draggable");
    if (heading) {
      const group = heading.closest(".group");
      cdrag.type = "section";
      cdrag.group = group;
      cdrag.id = group.dataset.folderId;
      cdrag.parentId = group.dataset.parentId;
      [cdrag.fromPrev, cdrag.fromNext] = siblingSections(group);
      group.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cdrag.id);
    }
  });

  body.addEventListener("dragover", (e) => {
    if (cdrag.type === "card") {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      // 仅可拖拽的书签卡参与排序，排除末尾的「新增书签」并让其始终保持在最后
      const cards = cdrag.grid.querySelectorAll(
        ".card--draggable:not(.is-dragging)"
      );
      const addCard = cdrag.grid.querySelector(".card--add");
      const after = gridElementAfter(cards, e.clientX, e.clientY);
      if (after == null) cdrag.grid.insertBefore(cdrag.el, addCard);
      else if (after !== cdrag.el) cdrag.grid.insertBefore(cdrag.el, after);
    } else if (cdrag.type === "section") {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const sibs = sameParentGroups(cdrag.parentId).filter(
        (g) => g !== cdrag.group
      );
      const after = elementAfter(sibs, e.clientY);
      if (after) body.insertBefore(cdrag.group, after);
      else if (sibs.length)
        body.insertBefore(cdrag.group, sibs[sibs.length - 1].nextElementSibling);
    } else if (!cdrag.type && drag.id) {
      // 侧栏条目拖入内容区：高亮目标分组（仅限有 folderId 的分组）
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const group = e.target.closest?.(".group");
      const target = group?.dataset.folderId ? group : null;
      if (dropTargetGroup && dropTargetGroup !== target) {
        dropTargetGroup.classList.remove("is-drop-target");
      }
      if (target && target !== dropTargetGroup) {
        target.classList.add("is-drop-target");
      }
      dropTargetGroup = target;
    }
  });

  body.addEventListener("drop", (e) => {
    if (cdrag.type) {
      e.preventDefault();
      return;
    }
    // 侧栏条目拖放到内容区分组：移动到该目录下
    if (drag.id && dropTargetGroup) {
      e.preventDefault();
      const targetFolderId = dropTargetGroup.dataset.folderId;
      if (targetFolderId) {
        chrome.bookmarks.move(drag.id, { parentId: targetFolderId });
      }
      dropTargetGroup.classList.remove("is-drop-target");
      dropTargetGroup = null;
      // 重置侧栏拖拽状态，避免其 dragend 再做原地排序
      drag.el = null;
      drag.id = null;
      drag.fromIndex = -1;
    }
  });

  body.addEventListener("dragend", () => {
    // 清理跨容器拖拽高亮
    if (dropTargetGroup) {
      dropTargetGroup.classList.remove("is-drop-target");
      dropTargetGroup = null;
    }
    els.folderList.classList.remove("is-drop-target");
    if (cdrag.type === "card") {
      cdrag.el.classList.remove("is-dragging");
      if (childIndex(cdrag.grid, cdrag.el) !== cdrag.fromIndex) {
        const next = cdrag.el.nextElementSibling;
        const prev = cdrag.el.previousElementSibling;
        selfMoves.add(cdrag.id); // 网格 DOM 已更新，跳过整页刷新
        reorderWithinParent(
          cdrag.grid.dataset.folderId,
          cdrag.id,
          next?.dataset.id ?? null,
          prev?.dataset.id ?? null,
          true // 同步内存模型，便于连续拖拽
        );
      }
    } else if (cdrag.type === "section") {
      cdrag.group.classList.remove("is-dragging");
      const [prev, next] = siblingSections(cdrag.group);
      if (prev !== cdrag.fromPrev || next !== cdrag.fromNext) {
        // 不跳过刷新：move 后整页重渲染，修正嵌套子分区的归位
        reorderWithinParent(
          cdrag.parentId,
          cdrag.id,
          next?.dataset.folderId ?? null,
          prev?.dataset.folderId ?? null,
          false
        );
      }
    }
    resetContentDrag();
  });
}

function resetContentDrag() {
  cdrag.type = cdrag.el = cdrag.grid = cdrag.group = null;
  cdrag.id = cdrag.parentId = null;
  cdrag.fromIndex = -1;
  cdrag.fromPrev = cdrag.fromNext = null;
}

function childIndex(parent, el) {
  return Array.prototype.indexOf.call(parent.children, el);
}

/** 内容区内所有属于 parentId 的分区 group（按 DOM 顺序） */
function sameParentGroups(parentId) {
  return [...els.contentBody.children].filter(
    (g) => g.classList?.contains("group") && g.dataset.parentId === parentId
  );
}

/** 返回 group 在“同父分区”里前后相邻的兄弟分区 [prev, next] */
function siblingSections(group) {
  const parentId = group.dataset.parentId;
  const match = (el, dir) => {
    let n = el[dir];
    while (n) {
      if (n.classList?.contains("group") && n.dataset.parentId === parentId)
        return n;
      n = n[dir];
    }
    return null;
  };
  return [
    match(group, "previousElementSibling"),
    match(group, "nextElementSibling"),
  ];
}

/**
 * 把 movedId 在同一父目录 parentId 内移动到「nextId 之前」或「prevId 之后」。
 * Chrome 把书签与目录存在同一 children 数组里，故按相邻同类项的绝对下标计算 index，
 * 经 BookmarkModel::Move 的同父自减后正好落到目标位置（向上/向下均已验证）。
 * optimisticLocal=true 时同步更新内存模型，便于连续拖拽而无需重渲染。
 */
function reorderWithinParent(parentId, movedId, nextId, prevId, optimisticLocal) {
  const parent = state.nodeById[parentId];
  if (!parent || !parent.children) return;
  const children = parent.children;
  const absOf = (id) => children.findIndex((c) => c.id === id);

  let index;
  if (nextId != null) index = absOf(nextId);
  else if (prevId != null) index = absOf(prevId) + 1;
  else return;
  if (index < 0) return;

  chrome.bookmarks.move(movedId, { parentId, index });

  if (optimisticLocal) {
    const from = absOf(movedId);
    if (from < 0) return;
    const [node] = children.splice(from, 1);
    let to;
    if (nextId != null) to = children.findIndex((c) => c.id === nextId);
    else to = children.findIndex((c) => c.id === prevId) + 1;
    if (to < 0) to = children.length;
    children.splice(to, 0, node);
  }
}

/* ------------------------------ 内容区 ------------------------------ */

function selectEntry(entryId) {
  state.currentEntryId = entryId;
  highlightSidebar(entryId);
  clearSearch();

  const folder = state.topFolders.find((f) => f.id === entryId);
  if (!folder) return;
  const label = folder.title || "Untitled folder";
  els.contentTitle.textContent = label;
  // 顶部目录名后常驻显示编辑/删除，作用于当前选中目录
  els.contentActions.replaceChildren(
    makeFolderActions(folder, "content__actions-row", true)
  );
  renderSections(buildSections(folder), label, "folder");
}

function renderSections(sections, rootLabel, rootIcon) {
  els.contentBody.replaceChildren();

  if (sections.length === 0) {
    els.contentBody.appendChild(makeEmpty("No bookmarks in this folder"));
    return;
  }

  for (const section of sections) {
    const depth = section.path.length;
    const isSub = depth > 0;
    els.contentBody.appendChild(
      makeGroup({
        // 标题只显示当前目录名，完整路径放进 tooltip；层级靠缩进体现
        title: isSub ? section.path[depth - 1] : rootLabel,
        tooltip: isSub ? section.path.join(" / ") : rootLabel,
        iconName: isSub ? "folderOpen" : rootIcon,
        depth,
        cards: section.bookmarks.map((b) => makeBookmarkCard(b, true)),
        meta: {
          folderId: section.folderId,
          parentId: section.parentId,
          draggableHeading: isSub, // 仅子目录分区可整段拖动排序；根分区即当前目录本身
          withAdd: isSub, // 子目录支持继续新增子目录（根分区的新增在顶部）
          canAddBookmark: isSub, // 仅子目录可加书签；顶层目录禁止
        },
      })
    );
  }
}

function makeGroup({ title, tooltip, iconName, depth = 0, cards, meta }) {
  const group = document.createElement("div");
  group.className = "group";
  if (depth > 0) {
    group.classList.add("is-nested");
    group.style.setProperty("--depth", String(depth - 1));
  }

  const heading = document.createElement("div");
  heading.className = "group__title";
  if (tooltip) heading.title = tooltip;
  const text = document.createElement("span");
  text.textContent = title;
  heading.append(icon(iconName, "group__icon"), text);

  // 该分区对应一个真实目录时，悬浮标题显示新增/编辑/删除（搜索结果分区无 folderId，跳过）
  if (meta?.folderId) {
    heading.append(
      makeFolderActions(
        { id: meta.folderId, title },
        "group__actions",
        meta.withAdd
      )
    );
  }

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.append(...cards);
  // 子目录网格末尾追加「新增书签」入口；顶层目录不允许直接加书签
  if (meta?.canAddBookmark) grid.append(makeAddBookmarkCard(meta.folderId));

  if (meta) {
    group.dataset.folderId = meta.folderId;
    group.dataset.parentId = meta.parentId ?? "";
    grid.dataset.folderId = meta.folderId; // 网格内书签都属于该目录
    if (meta.draggableHeading) {
      heading.draggable = true;
      heading.classList.add("is-draggable");
    }
  }

  group.append(heading, grid);
  return group;
}

function makeBookmarkCard(bookmark, draggable = false) {
  const card = document.createElement("a");
  card.className = draggable ? "card card--draggable" : "card";
  card.dataset.id = bookmark.id;
  if (draggable) card.draggable = true;
  card.href = bookmark.url;
  card.target = "_blank";
  card.rel = "noopener";
  card.title = `${bookmark.title || bookmark.url}\n${bookmark.url}`;

  const label = document.createElement("span");
  label.className = "card__label";
  label.textContent = bookmark.title || bookmark.url;

  // 悬浮卡片时右上角显示编辑/删除（用 span 避免在 <a> 内嵌套交互元素并阻止跳转）
  const actions = document.createElement("span");
  actions.className = "card__actions";
  actions.append(
    makeActionButton("squarePen", "Edit bookmark", "edit", () =>
      openBookmarkEditDialog(bookmark)
    ),
    makeActionButton("trash", "Delete bookmark", "danger", () =>
      openBookmarkDeleteDialog(bookmark)
    )
  );

  card.append(makeFavicon(bookmark.url, "card__icon"), label, actions);
  return card;
}

/** 网格末尾的「新增书签」入口，作用于指定目录 */
function makeAddBookmarkCard(folderId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "card card--add";

  // 与真实书签卡保持一致的「图标 + 文字」左对齐布局
  const iconWrap = document.createElement("span");
  iconWrap.className = "card__icon";
  iconWrap.append(icon("plus", "card__add-icon"));

  const label = document.createElement("span");
  label.className = "card__label";
  label.textContent = "Add bookmark";

  btn.append(iconWrap, label);
  btn.addEventListener("click", () => openBookmarkCreateDialog(folderId));
  return btn;
}

/** 构造一个 favicon 容器：加载失败时回退为 Lucide globe 图标 */
function makeFavicon(pageUrl, wrapClass) {
  const wrap = document.createElement("span");
  wrap.className = wrapClass;

  const img = document.createElement("img");
  img.width = 20;
  img.height = 20;
  img.alt = "";
  img.src = faviconUrl(pageUrl);
  img.addEventListener("error", () => {
    wrap.replaceChildren(icon("globe", "favicon-fallback"));
  });

  wrap.appendChild(img);
  return wrap;
}

function faviconUrl(pageUrl) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "32");
  return url.toString();
}

/* --------------------------- 目录编辑 / 删除 --------------------------- */

/** 一个图标动作按钮（用 span 而非 button，避免嵌套在侧栏 <button> 内的非法结构） */
function makeActionButton(iconName, label, variant, onClick) {
  const btn = document.createElement("span");
  btn.className = `action-btn action-btn--${variant}`;
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.append(icon(iconName));

  const fire = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 不触发所在条目的选中 / 拖拽
    onClick();
  };
  btn.addEventListener("click", fire);
  // 阻止从按钮处发起父元素的拖拽
  btn.addEventListener("mousedown", (e) => e.stopPropagation());
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fire(e);
  });
  return btn;
}

/**
 * 一组目录操作按钮，作用于指定目录 {id, title}。
 * withAdd=true 时在最前追加「新增子目录」。
 */
function makeFolderActions(folder, className, withAdd) {
  const wrap = document.createElement("span");
  wrap.className = className;
  const title = folder.title || "Untitled folder";
  if (withAdd) {
    wrap.append(
      makeActionButton("circlePlus", "Add subfolder", "add", () =>
        openCreateDialog(folder.id, title)
      )
    );
  }
  wrap.append(
    makeActionButton("squarePen", "Rename folder", "edit", () =>
      openRenameDialog(folder.id, folder.title || "")
    ),
    makeActionButton("trash", "Delete folder", "danger", () =>
      openDeleteDialog(folder.id, title)
    )
  );
  return wrap;
}

/**
 * 通用模态弹窗。buildBody(body, ctx) 填充内容；onConfirm(ctx) 返回 false 可阻止关闭。
 * 支持 ESC 取消、Enter 确认、点击遮罩取消。
 */
function showModal({ title, confirmText, confirmClass, buildBody, onConfirm }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  const header = document.createElement("div");
  header.className = "modal__header";
  header.textContent = title;

  const body = document.createElement("div");
  body.className = "modal__body";

  const footer = document.createElement("div");
  footer.className = "modal__footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "modal__btn";
  cancelBtn.textContent = "Cancel";

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = `modal__btn ${confirmClass || "modal__btn--primary"}`;
  confirmBtn.textContent = confirmText || "OK";

  footer.append(cancelBtn, confirmBtn);
  modal.append(header, body, footer);
  overlay.append(modal);
  document.body.append(overlay);

  const ctx = { confirmBtn, footer, close };
  buildBody(body, ctx);

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  }
  function confirm() {
    if (onConfirm(ctx) !== false) close();
  }
  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "Enter") confirm();
  }

  cancelBtn.addEventListener("click", close);
  confirmBtn.addEventListener("click", confirm);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKey);
}

function openRenameDialog(folderId, currentTitle) {
  showModal({
    title: "Rename folder",
    confirmText: "Save",
    buildBody(body, ctx) {
      const input = document.createElement("input");
      input.className = "modal__input";
      input.type = "text";
      input.value = currentTitle;
      input.maxLength = 200;
      body.append(input);
      ctx.input = input;
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    },
    onConfirm(ctx) {
      const name = ctx.input.value.trim();
      if (!name) {
        ctx.input.focus();
        return false; // 空名称不允许，保持弹窗打开
      }
      if (name !== currentTitle) chrome.bookmarks.update(folderId, { title: name });
      // 变更经 onChanged 监听触发整页重渲染
    },
  });
}

/** 在 parentId 下新建目录；不传 parentId 时默认在书签栏下建顶层目录 */
function openCreateDialog(parentId = BOOKMARK_BAR_ID, parentTitle) {
  const isTopLevel = parentId === BOOKMARK_BAR_ID;
  showModal({
    title: isTopLevel ? "New Folder" : `New subfolder in "${parentTitle}"`,
    confirmText: "Create",
    buildBody(body, ctx) {
      const input = document.createElement("input");
      input.className = "modal__input";
      input.type = "text";
      input.placeholder = "Folder name";
      input.maxLength = 200;
      body.append(input);
      ctx.input = input;
      requestAnimationFrame(() => input.focus());
    },
    onConfirm(ctx) {
      const name = ctx.input.value.trim();
      if (!name) {
        ctx.input.focus();
        return false; // 空名称不允许，保持弹窗打开
      }
      chrome.bookmarks.create({ parentId, title: name }).then((node) => {
        if (isTopLevel) state.currentEntryId = node.id; // 顶层目录新建后自动选中
        init();
      });
    },
  });
}

function openDeleteDialog(folderId, title) {
  showModal({
    title: "Delete folder",
    confirmText: "Delete",
    confirmClass: "modal__btn--danger",
    buildBody(body) {
      const p = document.createElement("p");
      p.className = "modal__hint";
      const strong = document.createElement("strong");
      strong.textContent = title;
      p.append(
        "Are you sure you want to delete ",
        strong,
        "? All bookmarks and subfolders inside will also be deleted. This action cannot be undone."
      );
      body.append(p);
    },
    onConfirm() {
      chrome.bookmarks.removeTree(folderId); // 经 onRemoved 监听触发整页重渲染
    },
  });
}

/** 构造一个「标签 + 输入框」字段，返回 { wrap, input } */
function makeField(labelText, value, placeholder) {
  const wrap = document.createElement("label");
  wrap.className = "modal__field";
  const span = document.createElement("span");
  span.className = "modal__label";
  span.textContent = labelText;
  const input = document.createElement("input");
  input.className = "modal__input";
  input.type = "text";
  input.value = value;
  input.placeholder = placeholder;
  input.maxLength = 2000;
  wrap.append(span, input);
  return { wrap, input };
}

function openBookmarkEditDialog(bookmark) {
  showModal({
    title: "Edit bookmark",
    confirmText: "Save",
    buildBody(body, ctx) {
      const name = makeField("Name", bookmark.title || "", "Bookmark name");
      const url = makeField("URL", bookmark.url || "", "https://");
      body.append(name.wrap, url.wrap);
      ctx.nameInput = name.input;
      ctx.urlInput = url.input;
      requestAnimationFrame(() => {
        name.input.focus();
        name.input.select();
      });
    },
    onConfirm(ctx) {
      const title = ctx.nameInput.value.trim();
      const url = ctx.urlInput.value.trim();
      if (!url) {
        ctx.urlInput.focus();
        return false; // 链接不能为空，保持弹窗打开
      }
      chrome.bookmarks.update(bookmark.id, { title, url }); // 经 onChanged 触发重渲染
    },
  });
}

function openBookmarkCreateDialog(folderId) {
  showModal({
    title: "Add bookmark",
    confirmText: "Create",
    buildBody(body, ctx) {
      const name = makeField("Name", "", "Bookmark name");
      const url = makeField("URL", "", "https://");
      body.append(name.wrap, url.wrap);
      ctx.nameInput = name.input;
      ctx.urlInput = url.input;
      requestAnimationFrame(() => name.input.focus());
    },
    onConfirm(ctx) {
      const title = ctx.nameInput.value.trim();
      const url = ctx.urlInput.value.trim();
      if (!url) {
        ctx.urlInput.focus();
        return false; // 链接不能为空，保持弹窗打开
      }
      chrome.bookmarks.create({ parentId: folderId, title, url }); // 经 onCreated 触发重渲染
    },
  });
}

function openBookmarkDeleteDialog(bookmark) {
  showModal({
    title: "Delete bookmark",
    confirmText: "Delete",
    confirmClass: "modal__btn--danger",
    buildBody(body) {
      const p = document.createElement("p");
      p.className = "modal__hint";
      const strong = document.createElement("strong");
      strong.textContent = bookmark.title || bookmark.url;
      p.append("Are you sure you want to delete ", strong, "? This action cannot be undone.");
      body.append(p);
    },
    onConfirm() {
      chrome.bookmarks.remove(bookmark.id); // 经 onRemoved 触发重渲染
    },
  });
}

/* ------------------------------ 搜索 ------------------------------ */

function onSearch() {
  const raw = els.search.value.trim();
  const query = raw.toLowerCase();

  if (!query) {
    selectEntry(state.currentEntryId); // 恢复当前目录视图
    return;
  }

  const matches = state.allBookmarks.filter((b) =>
    `${b.title || ""} ${b.url || ""}`.toLowerCase().includes(query)
  );

  highlightSidebar(null);
  els.contentTitle.textContent = `Search “${raw}”`;
  els.contentActions.replaceChildren(); // 搜索视图无目录操作
  els.contentBody.replaceChildren();

  if (matches.length === 0) {
    els.contentBody.appendChild(makeEmpty("No matching bookmarks"));
    return;
  }
  // 搜索结果跨目录，不可排序
  const cards = matches.map((b) => makeBookmarkCard(b, false));
  els.contentBody.appendChild(
    makeGroup({ title: `Results (${matches.length})`, iconName: "search", cards })
  );
}

function clearSearch() {
  if (els.search.value) els.search.value = "";
}

/* ------------------------------ 状态 ------------------------------ */

function makeEmpty(text) {
  const wrap = document.createElement("div");
  wrap.className = "empty";
  wrap.append(icon("bookmark", "empty__icon"));
  const t = document.createElement("div");
  t.textContent = text;
  wrap.append(t);
  return wrap;
}

/* ------------------------------ Unsplash 壁纸 ------------------------------ */

const WP = {
  API_KEY: "wallpaper_key",
  CACHE_DATA: "wallpaper_cache_data", // 图片本体的 base64 data URL，刷新时离线恢复
  CACHE_TS: "wallpaper_cache_ts",
  ENDPOINT: "https://api.unsplash.com/photos/random",
  QUERY: "orientation=landscape&query=landscape",
};

/**
 * 页面加载：仅从缓存恢复壁纸，不做网络请求。
 * 手动刷新请点刷新按钮；保存 Key 时才会拉取新图并缓存。
 */
async function loadWallpaper() {
  const cached = await getCachedWallpaper();
  if (cached) {
    applyWallpaper(cached);
  }
}

/** 刷新按钮：清缓存 → 拉新图 → 缓存。无 Key 时跳转设置。 */
async function refreshWallpaper() {
  const key = await getApiKey();
  if (!key) {
    openSettingsModal();
    return;
  }
  await clearWallpaperCache();
  await fetchAndCache(key);
}

/** 从 Unsplash 拉取一张新壁纸 → 下载本体转 data URL → 渲染 → 缓存 */
async function fetchAndCache(apiKey) {
  try {
    const data = await fetchWallpaper(apiKey);
    if (!data) return;
    const dataUrl = await urlToDataUrl(data.urls.regular);
    applyWallpaper(dataUrl);
    await cacheWallpaper(dataUrl);
  } catch (err) {
    console.warn("[wallpaper] fetchAndCache failed:", err);
  }
}

/* ---------- chrome.storage.local 读写 ---------- */

async function getApiKey() {
  try {
    const r = await chrome.storage.local.get(WP.API_KEY);
    return r[WP.API_KEY] || "";
  } catch {
    return "";
  }
}

async function setApiKey(key) {
  try {
    await chrome.storage.local.set({ [WP.API_KEY]: key.trim() });
  } catch {
    /* ignore */
  }
}

async function clearApiKey() {
  try {
    await chrome.storage.local.remove(WP.API_KEY);
  } catch {
    /* ignore */
  }
}

async function getCachedWallpaper() {
  try {
    const all = await chrome.storage.local.get(null);
    return all[WP.CACHE_DATA] || "";
  } catch {
    return "";
  }
}

async function cacheWallpaper(dataUrl) {
  try {
    await chrome.storage.local.set({
      [WP.CACHE_DATA]: dataUrl,
      [WP.CACHE_TS]: Date.now(),
    });
  } catch {
    /* ignore */
  }
}

async function clearWallpaperCache() {
  try {
    await chrome.storage.local.remove([WP.CACHE_DATA, WP.CACHE_TS]);
  } catch {
    /* ignore */
  }
}

/* ---------- Unsplash API ---------- */

async function fetchWallpaper(apiKey) {
  const url = `${WP.ENDPOINT}?${WP.QUERY}`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${apiKey}` },
  });
  if (!res.ok) {
    const msg =
      res.status === 403 || res.status === 401
        ? "Invalid API key. Please check your Unsplash Access Key."
        : `Unsplash API error (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

/** 下载图片本体并编码为 base64 data URL，用于离线缓存与瞬时恢复 */
async function urlToDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const blob = await res.blob();
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image encode failed"));
    reader.readAsDataURL(blob);
  });
}

/* ---------- 渲染 ---------- */

function applyWallpaper(url) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const overlay = dark ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.08)";
  document.body.style.backgroundImage = `linear-gradient(${overlay}, ${overlay}), url("${url}")`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundAttachment = "fixed";
}

function clearWallpaper() {
  document.body.style.backgroundImage = "";
  document.body.style.backgroundSize = "";
  document.body.style.backgroundPosition = "";
  document.body.style.backgroundRepeat = "";
  document.body.style.backgroundAttachment = "";
}

/* ------------------------------ 设置弹窗 ------------------------------ */

async function openSettingsModal() {
  const hasKey = !!(await getApiKey());

  showModal({
    title: "Settings",
    confirmText: "Save",
    async buildBody(body, ctx) {
      const key = await getApiKey();

      const status = document.createElement("p");
      status.className = "modal__hint";
      status.style.marginBottom = "14px";
      status.textContent = hasKey
        ? "Unsplash API key is configured. Use the refresh button ↻ to update the wallpaper."
        : "Enter your Unsplash Access Key to enable landscape wallpapers.";
      body.appendChild(status);

      const input = document.createElement("input");
      input.className = "modal__input";
      input.type = "password";
      input.value = key;
      input.placeholder = "Paste your Unsplash Access Key";
      input.spellcheck = false;
      input.autocomplete = "off";
      body.appendChild(input);
      ctx.input = input;

      const help = document.createElement("p");
      help.style.marginTop = "10px";
      help.style.fontSize = "12px";
      help.style.color = "var(--text-muted)";
      help.innerHTML =
        'Get a free key at <a href="https://unsplash.com/developers" target="_blank" rel="noopener" style="color:var(--accent)">unsplash.com/developers</a>';
      body.appendChild(help);

      if (hasKey) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "modal__btn modal__btn--danger";
        remove.textContent = "Remove Key";
        remove.addEventListener("click", async () => {
          await clearApiKey();
          await clearWallpaperCache();
          clearWallpaper();
          ctx.close();
        });
        ctx.footer.insertBefore(remove, ctx.confirmBtn);
      }

      requestAnimationFrame(() => input.focus());
    },
    async onConfirm(ctx) {
      const key = ctx.input.value.trim();
      if (key) {
        await setApiKey(key);
        await clearWallpaperCache(); // 清除旧缓存，强制拉新图
        await fetchAndCache(key);
      } else if (hasKey) {
        await clearApiKey();
        await clearWallpaperCache();
        clearWallpaper();
      }
    },
  });
}

/* ------------------------------ 错误 ------------------------------ */

function renderError(err) {
  els.contentBody.replaceChildren(
    makeEmpty(`Failed to read bookmarks: ${err?.message || err}`)
  );
}
