import contentScript from 'inlinefunc:./sqlite';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    console.log('onUpdated', tabId, changeInfo, tab)

    if (changeInfo.status === "complete") {
        console.log('injecting content script')
        chrome.scripting.executeScript({
            // use the function as normal
            func: contentScript,
            args: [
                chrome.runtime.id,
                // ...any other args
            ],
            target: { tabId, allFrames: true },
            injectImmediately: true,
            world: "MAIN"
        })
    }
})