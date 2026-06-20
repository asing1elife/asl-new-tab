"use strict";

/**
 * 自定义新标签页：读取原生书签栏并渲染。
 *  - 左侧：书签栏最顶层的目录
 *  - 右侧：所选目录下的子目录与书签
 *  - 点击书签：在新标签页打开（由 <a target="_blank"> 完成）
 */

// Chrome 固定 ID："1" = 书签栏 (Bookmarks Bar)
const BOOKMARK_BAR_ID = "1";

const els = {
  folderList: document.getElementById("folderList"),
  contentTitle: document.getElementById("contentTitle"),
  contentBody: document.getElementById("contentBody"),
  search: document.getElementById("searchInput"),
  bookmarkTpl: document.getElementById("bookmarkItemTpl"),
  folderCardTpl: document.getElementById("folderCardTpl"),
};

/** id -> node 索引，便于面包屑回溯与目录跳转 */
const nodeIndex = new Map();
let topFolders = [];
let currentFolderId = BOOKMARK_BAR_ID;

init();

async function init() {
  let barNode;
  try {
    [barNode] = await chrome.bookmarks.getSubTree(BOOKMARK_BAR_ID);
  } catch (err) {
    renderError(err);
    return;
  }

  indexTree(barNode);
  topFolders = (barNode.children || []).filter(isFolder);

  renderSidebar(barNode);
  selectFolder(BOOKMARK_BAR_ID);

  els.search.addEventListener("input", onSearch);

  // 书签发生变化时（新增/删除/移动）自动刷新
  for (const ev of ["onCreated", "onRemoved", "onChanged", "onMoved"]) {
    chrome.bookmarks[ev]?.addListener(() => init());
  }
}

/* ------------------------------ 数据 ------------------------------ */

function isFolder(node) {
  return !node.url; // 没有 url 的节点即为目录
}

function indexTree(node) {
  nodeIndex.set(node.id, node);
  (node.children || []).forEach(indexTree);
}

function buildBreadcrumb(folderId) {
  const path = [];
  let node = nodeIndex.get(folderId);
  while (node && node.id !== BOOKMARK_BAR_ID) {
    path.unshift(node.title || "未命名目录");
    node = nodeIndex.get(node.parentId);
  }
  path.unshift("书签栏");
  return path.join("  ›  ");
}

/* ------------------------------ 侧栏 ------------------------------ */

function renderSidebar(barNode) {
  els.folderList.replaceChildren();

  // 书签栏根：用于查看直接放在书签栏上的书签
  els.folderList.appendChild(
    makeSidebarItem({
      id: BOOKMARK_BAR_ID,
      title: "书签栏",
      icon: "📌",
      count: (barNode.children || []).filter((n) => !isFolder(n)).length,
    })
  );

  for (const folder of topFolders) {
    els.folderList.appendChild(
      makeSidebarItem({
        id: folder.id,
        title: folder.title || "未命名目录",
        icon: "📁",
        count: (folder.children || []).length,
      })
    );
  }
}

function makeSidebarItem({ id, title, icon, count }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "folder-list__item";
  btn.dataset.id = id;

  const ic = document.createElement("span");
  ic.className = "folder-list__icon";
  ic.textContent = icon;

  const label = document.createElement("span");
  label.className = "folder-list__label";
  label.textContent = title;

  const cnt = document.createElement("span");
  cnt.className = "folder-list__count";
  cnt.textContent = count > 0 ? String(count) : "";

  btn.append(ic, label, cnt);
  btn.addEventListener("click", () => {
    clearSearch();
    selectFolder(id);
  });
  return btn;
}

function highlightSidebar(folderId) {
  // 高亮当前目录所属的顶层条目（或书签栏根）
  let ancestorId = folderId;
  let node = nodeIndex.get(folderId);
  while (node && node.parentId && node.parentId !== BOOKMARK_BAR_ID) {
    node = nodeIndex.get(node.parentId);
    ancestorId = node?.id ?? ancestorId;
  }

  for (const item of els.folderList.children) {
    item.classList.toggle("is-active", item.dataset.id === ancestorId);
  }
}

/* ------------------------------ 内容区 ------------------------------ */

function selectFolder(folderId) {
  const folder = nodeIndex.get(folderId);
  if (!folder) return;

  currentFolderId = folderId;
  els.contentTitle.textContent = buildBreadcrumb(folderId);
  highlightSidebar(folderId);
  renderFolderContents(folder);
}

function renderFolderContents(folder) {
  els.contentBody.replaceChildren();

  const children = folder.children || [];
  const folders = children.filter(isFolder);
  const bookmarks = children.filter((n) => !isFolder(n));

  if (folders.length === 0 && bookmarks.length === 0) {
    els.contentBody.appendChild(makeEmpty("📭", "这个目录是空的"));
    return;
  }

  if (folders.length > 0) {
    els.contentBody.appendChild(
      makeGroup(`目录 (${folders.length})`, folders.map(makeFolderCard))
    );
  }

  if (bookmarks.length > 0) {
    els.contentBody.appendChild(
      makeGroup(`书签 (${bookmarks.length})`, bookmarks.map(makeBookmarkCard))
    );
  }
}

function makeGroup(title, cards) {
  const group = document.createElement("div");
  group.className = "group";

  const heading = document.createElement("div");
  heading.className = "group__title";
  heading.textContent = title;

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.append(...cards);

  group.append(heading, grid);
  return group;
}

function makeFolderCard(folder) {
  const card = els.folderCardTpl.content.firstElementChild.cloneNode(true);
  card.querySelector(".card__label").textContent = folder.title || "未命名目录";
  const count = (folder.children || []).length;
  card.querySelector(".card__count").textContent = count > 0 ? String(count) : "";
  card.addEventListener("click", () => selectFolder(folder.id));
  return card;
}

function makeBookmarkCard(bookmark) {
  const card = els.bookmarkTpl.content.firstElementChild.cloneNode(true);
  card.href = bookmark.url;
  card.title = `${bookmark.title || bookmark.url}\n${bookmark.url}`;
  card.querySelector(".card__label").textContent =
    bookmark.title || bookmark.url;

  const icon = card.querySelector(".card__icon");
  icon.src = faviconUrl(bookmark.url);
  icon.addEventListener("error", () => {
    icon.replaceWith(makeTextIcon("🔖"));
  });
  return card;
}

function makeTextIcon(emoji) {
  const span = document.createElement("span");
  span.className = "card__icon";
  span.textContent = emoji;
  return span;
}

function faviconUrl(pageUrl) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "32");
  return url.toString();
}

/* ------------------------------ 搜索 ------------------------------ */

function onSearch() {
  const query = els.search.value.trim().toLowerCase();
  if (!query) {
    selectFolder(currentFolderId);
    return;
  }

  const matches = [];
  for (const node of nodeIndex.values()) {
    if (isFolder(node)) continue;
    const haystack = `${node.title || ""} ${node.url || ""}`.toLowerCase();
    if (haystack.includes(query)) matches.push(node);
  }

  els.contentTitle.textContent = `搜索 “${els.search.value.trim()}”`;
  els.contentBody.replaceChildren();

  if (matches.length === 0) {
    els.contentBody.appendChild(makeEmpty("🔍", "没有匹配的书签"));
    return;
  }

  els.contentBody.appendChild(
    makeGroup(`结果 (${matches.length})`, matches.map(makeBookmarkCard))
  );
}

function clearSearch() {
  els.search.value = "";
}

/* ------------------------------ 状态 ------------------------------ */

function makeEmpty(emoji, text) {
  const wrap = document.createElement("div");
  wrap.className = "empty";

  const e = document.createElement("div");
  e.className = "empty__emoji";
  e.textContent = emoji;

  const t = document.createElement("div");
  t.textContent = text;

  wrap.append(e, t);
  return wrap;
}

function renderError(err) {
  els.contentBody.replaceChildren(
    makeEmpty("⚠️", `无法读取书签：${err?.message || err}`)
  );
}
