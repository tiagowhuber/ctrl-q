/**
 * Ctrl-Q — swap back to the tab you were just on.
 *
 * Chrome gives tabs a `lastAccessed` timestamp, but it only moves when a tab
 * becomes active *inside its own window* — switching between windows leaves it
 * untouched. So we keep our own timestamps in session storage and rank each tab
 * by whichever signal is newer. Session storage survives the service worker
 * being torn down and never touches disk.
 */

const KEY = 'lastUsed';

async function readOrder() {
  const { [KEY]: order = {} } = await chrome.storage.session.get(KEY);
  return order;
}

async function bump(tabId) {
  if (typeof tabId !== 'number' || tabId < 0) return;
  const order = await readOrder();
  order[tabId] = Date.now();
  await chrome.storage.session.set({ [KEY]: order });
}

async function forget(tabId) {
  const order = await readOrder();
  if (delete order[tabId]) await chrome.storage.session.set({ [KEY]: order });
}

/** Give the tabs that are already open a sane order the first time we wake up. */
async function seed() {
  const order = await readOrder();
  const tabs = await chrome.tabs.query({});
  let stamp = Date.now() - tabs.length;
  for (const tab of tabs) {
    if (order[tab.id] == null) order[tab.id] = tab.active ? Date.now() : stamp++;
  }
  await chrome.storage.session.set({ [KEY]: order });
}

async function switchToLastTab() {
  const [tabs, order] = await Promise.all([chrome.tabs.query({}), readOrder()]);
  if (tabs.length < 2) return;

  const rank = (tab) => Math.max(order[tab.id] ?? 0, tab.lastAccessed ?? 0);
  const [, previous] = tabs.sort((a, b) => rank(b) - rank(a));
  if (!previous) return;

  await chrome.tabs.update(previous.id, { active: true });
  try {
    await chrome.windows.update(previous.windowId, { focused: true });
  } catch {
    /* the window may have closed in the meantime */
  }
}

chrome.tabs.onActivated.addListener(({ tabId }) => bump(tabId));
chrome.tabs.onRemoved.addListener((tabId) => forget(tabId));

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [active] = await chrome.tabs.query({ active: true, windowId });
  if (active) await bump(active.id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'switch-last-tab') switchToLastTab();
});

chrome.runtime.onStartup.addListener(seed);
chrome.runtime.onInstalled.addListener(seed);
seed();
