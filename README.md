# parcel-resolver-inlinefunc

This resolver is a plugin for Parcel that allows you to compile an imported default function into an IIFE (using [`esbuild`](https://esbuild.github.io/)) and wrap it in a function accepting variadic args, which forwards them to the original function when executed.

This allows you to create a serializable function (bundling all necessary dependencies within itself) that can be executed in a different context, such as a Chrome content script.

You can see a real example of this being used in [opentelemetry-browser-extension](https://github.com/tbrockman/opentelemetry-browser-extension).

## Usage

`background.js`:
```javascript
import contentScript from 'inlinefunc:./content-script';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.scripting.executeScript({
            func: injectContentScript,
            target: { tabId, allFrames: true },
            args: [
                chrome.runtime.id,
                // ...any other args
            ],
            injectImmediately: true,
            world: "MAIN"
        })
    }
})
```

`content-script.js`:
```javascript
// An example dependency we'd want bundled with our function
import { getQuickJS } from "quickjs-emscripten" // put a VM in your VM

async function main(extensionId) {
    const QuickJS = await getQuickJS()
    const vm = QuickJS.newContext()

    const world = vm.newString(extensionId)
    vm.setProp(vm.global, "NAME", world)
    world.dispose()

    const result = vm.evalCode(`"Hello " + NAME + "!"`)
    if (result.error) {
        console.log("Execution failed:", vm.dump(result.error))
        result.error.dispose()
    } else {
        console.log("Success:", vm.dump(result.value))
        result.value.dispose()
    }

    vm.dispose()
}

// IMPORTANT: function must be the default export
export default main
```

## Customization

If you'd like to pass anything else to `esbuild` (see the [default parameters here](./src/index.ts#L73)), for example if your function requires any polyfills, you can do so by creating an `inlinefunc-config.mjs` file (or whatever you'd like to name it) which exports the top-level configuration options you'd like to override:

`package.json`
```json
{
  "name": "my-package",
  "version": "1.0.0",
  
  ...,

  "parcel-resolver-inlinefunc": {
    "options": "inlinefunc-config.mjs"
  }
}
```

`inlinefunc-config.mjs`
```javascript
import { polyfillNode } from "esbuild-plugin-polyfill-node";

const plugins = [
    polyfillNode({
        path: true,
    })
];

export {
    plugins
};
```