// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Resume Generator installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLocalMode') {
    chrome.storage.local.get(['localMode'], (result) => {
      sendResponse({ localMode: result.localMode || false });
    });
    return true;
  }
});

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('careers.google.com')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  }
}); 