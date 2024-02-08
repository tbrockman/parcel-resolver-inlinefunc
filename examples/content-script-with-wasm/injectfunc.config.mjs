import { polyfillNode } from "esbuild-plugin-polyfill-node";

const plugins = [
    polyfillNode({
        // Options (optional)
        process
    }),
]

export {
    plugins
}