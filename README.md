# parcel-resolver-inlinefunc

A Parcel resolver that allows you to compile an imported default function into an IIFE (using [`esbuild`](https://esbuild.github.io/)) and wrap it in a function accepting variadic args, which forwards them to the original function when executed.

This allows you to create a serializable function (bundling all necessary dependencies within itself) that can be deserialized and executed in a different context, such as a Chrome content script, a web worker, or a Javascript VM.

You can see a real example of this being used in [opentelemetry-browser-extension](https://github.com/tbrockman/opentelemetry-browser-extension).

## Installation

```bash
pnpm i -D parcel-resolver-inlinefunc
```

```bash
yarn add -D parcel-resolver-inlinefunc
```

## Usage

`background.js`:
```javascript
// import a default function from a file
import contentScript from 'inlinefunc:./content-script';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.scripting.executeScript({
            // use the function as normal
            func: injectContentScript,
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
```

`content-script.js`:
```javascript
import * as _ from 'lodash/string'

// IMPORTANT: function must be the default export
export default async function main(extensionId: string) {
    const example = `hey there extension: ${extensionId}!`
    console.log(_.kebabCase(example))
}
```

## Customization

If you'd like to pass anything else to `esbuild` (see the [default parameters here](./src/index.ts#L73)), for example if your function requires any polyfills, you can do so by creating an `inlinefunc.config.mjs` file (or whatever you'd like to name it) which exports a default object of the top-level configuration options you'd like to override:

`inlinefunc.config.mjs`
```javascript
import { polyfillNode } from "esbuild-plugin-polyfill-node";

export default {
    plugins: [
        polyfillNode({
            path: true,
        })
    ]
};
```

You can then use this file by referencing it in your `package.json`:

`package.json`
```json
{
  "name": "my-package",
  "version": "1.0.0",
  ...
  "devDependencies": {
    "parcel-resolver-inlinefunc": "^1.0.0"
  },
  "parcel-resolver-inlinefunc": {
    "options": "inlinefunc.config.mjs"
  }
}
```

## Known issues

### `Uncaught TypeError: Failed to construct 'URL': Invalid URL`

If you're attempting to use a library that imports WebAssembly (resulting in a call like `new URL("*.wasm", import_meta.url).href;`), this is currently unsupported, but likely fixable.

### `Cannot find module 'inlinefunc:*' or its corresponding type declarations.`

If you're using TypeScript, you'll need to declare the module in a `.d.ts` file:

```typescript
declare module "inlinefunc:*" {
    const inlinefunc: (...args: any[]) => void;
    export default inlinefunc;
}
```
