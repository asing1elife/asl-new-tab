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
  bar: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>',
  folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderOpen:
    '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
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
  brandIcon: document.getElementById("brandIcon"),
  searchIcon: document.getElementById("searchIcon"),
  folderList: document.getElementById("folderList"),
  contentTitle: document.getElementById("contentTitle"),
  contentBody: document.getElementById("contentBody"),
  search: document.getElementById("searchInput"),
};

// 模块级状态，每次 init 重建
const state = {
  looseBookmarks: [], // 书签栏直属书签
  topFolders: [], // 书签栏顶层目录
  allBookmarks: [], // 扁平化全部书签（搜索用）
  currentEntryId: null,
};

init();

async function init() {
  els.brandIcon.replaceChildren(icon("bar"));
  els.searchIcon.replaceChildren(icon("search"));

  let barNode;
  try {
    [barNode] = await chrome.bookmarks.getSubTree(BOOKMARK_BAR_ID);
  } catch (err) {
    renderError(err);
    return;
  }

  const children = barNode.children || [];
  state.looseBookmarks = children.filter(isBookmark);
  state.topFolders = children.filter(isFolder);
  state.allBookmarks = flattenBookmarks(barNode);

  renderSidebar();

  // 默认选中：书签栏有直属书签则进“书签栏”，否则进第一个目录
  const defaultId =
    state.looseBookmarks.length > 0
      ? BOOKMARK_BAR_ID
      : state.topFolders[0]?.id ?? BOOKMARK_BAR_ID;
  selectEntry(defaultId);

  els.search.oninput = onSearch;

  // 书签变化时（新增/删除/移动）自动刷新
  for (const ev of ["onCreated", "onRemoved", "onChanged", "onMoved"]) {
    chrome.bookmarks[ev]?.addListener(() => init());
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

/**
 * 把一个目录递归展开成多个分区：
 *  - 目录自身的直属书签为一个分区（path 为空）
 *  - 每个含书签的子目录为一个分区（path 记录相对层级，用于分区标题）
 */
function buildSections(folder) {
  const sections = [];

  const direct = (folder.children || []).filter(isBookmark);
  if (direct.length) sections.push({ path: [], bookmarks: direct });

  const walk = (node, path) => {
    for (const child of node.children || []) {
      if (!isFolder(child)) continue;
      const childPath = [...path, child.title || "未命名目录"];
      const bms = (child.children || []).filter(isBookmark);
      if (bms.length) sections.push({ path: childPath, bookmarks: bms });
      walk(child, childPath);
    }
  };
  walk(folder, []);

  return sections;
}

/* ------------------------------ 侧栏 ------------------------------ */

function renderSidebar() {
  els.folderList.replaceChildren();

  if (state.looseBookmarks.length > 0) {
    els.folderList.appendChild(
      makeSidebarItem({
        id: BOOKMARK_BAR_ID,
        title: "书签栏",
        iconName: "bar",
        count: state.looseBookmarks.length,
      })
    );
  }

  for (const folder of state.topFolders) {
    els.folderList.appendChild(
      makeSidebarItem({
        id: folder.id,
        title: folder.title || "未命名目录",
        iconName: "folder",
        count: (folder.children || []).length,
      })
    );
  }
}

function makeSidebarItem({ id, title, iconName, count }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "folder-list__item";
  btn.dataset.id = id;

  const label = document.createElement("span");
  label.className = "folder-list__label";
  label.textContent = title;

  const cnt = document.createElement("span");
  cnt.className = "folder-list__count";
  cnt.textContent = count > 0 ? String(count) : "";

  btn.append(icon(iconName, "folder-list__icon"), label, cnt);
  btn.addEventListener("click", () => selectEntry(id));
  return btn;
}

function highlightSidebar(entryId) {
  for (const item of els.folderList.children) {
    item.classList.toggle("is-active", item.dataset.id === entryId);
  }
}

/* ------------------------------ 内容区 ------------------------------ */

function selectEntry(entryId) {
  state.currentEntryId = entryId;
  highlightSidebar(entryId);
  clearSearch();

  if (entryId === BOOKMARK_BAR_ID) {
    els.contentTitle.textContent = "书签栏";
    renderSections(
      [{ path: [], bookmarks: state.looseBookmarks }],
      "书签栏",
      "bar"
    );
    return;
  }

  const folder = state.topFolders.find((f) => f.id === entryId);
  if (!folder) return;
  const label = folder.title || "未命名目录";
  els.contentTitle.textContent = label;
  renderSections(buildSections(folder), label, "folder");
}

function renderSections(sections, rootLabel, rootIcon) {
  els.contentBody.replaceChildren();

  const usable = sections.filter((s) => s.bookmarks.length > 0);
  if (usable.length === 0) {
    els.contentBody.appendChild(makeEmpty("这个目录还没有书签"));
    return;
  }

  for (const section of usable) {
    const isSub = section.path.length > 0;
    const title = isSub ? section.path.join("  /  ") : rootLabel;
    const iconName = isSub ? "folderOpen" : rootIcon; // 子目录用“打开”图标
    els.contentBody.appendChild(
      makeGroup(title, iconName, section.bookmarks.map(makeBookmarkCard))
    );
  }
}

function makeGroup(title, iconName, cards) {
  const group = document.createElement("div");
  group.className = "group";

  const heading = document.createElement("div");
  heading.className = "group__title";
  const text = document.createElement("span");
  text.textContent = title;
  heading.append(icon(iconName, "group__icon"), text);

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.append(...cards);

  group.append(heading, grid);
  return group;
}

function makeBookmarkCard(bookmark) {
  const card = document.createElement("a");
  card.className = "card";
  card.href = bookmark.url;
  card.target = "_blank";
  card.rel = "noopener";
  card.title = `${bookmark.title || bookmark.url}\n${bookmark.url}`;

  const iconWrap = document.createElement("span");
  iconWrap.className = "card__icon";
  const img = document.createElement("img");
  img.width = 20;
  img.height = 20;
  img.alt = "";
  img.src = faviconUrl(bookmark.url);
  img.addEventListener("error", () => {
    iconWrap.replaceChildren(icon("globe", "card__fallback"));
  });
  iconWrap.appendChild(img);

  const label = document.createElement("span");
  label.className = "card__label";
  label.textContent = bookmark.title || bookmark.url;

  card.append(iconWrap, label);
  return card;
}

function faviconUrl(pageUrl) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "32");
  return url.toString();
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
  els.contentTitle.textContent = `搜索 “${raw}”`;
  els.contentBody.replaceChildren();

  if (matches.length === 0) {
    els.contentBody.appendChild(makeEmpty("没有匹配的书签"));
    return;
  }
  els.contentBody.appendChild(
    makeGroup(`结果 (${matches.length})`, "search", matches.map(makeBookmarkCard))
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

function renderError(err) {
  els.contentBody.replaceChildren(
    makeEmpty(`无法读取书签：${err?.message || err}`)
  );
}
