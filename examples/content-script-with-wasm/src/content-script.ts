import { newQuickJSWASMModule, newVariant } from 'quickjs-emscripten';
import wasmModule from './src/quick-js-debug-sync.wasm'
import wasmSourceMapData from './src/quick-js-debug-sync.wasm.map.txt'

// IMPORTANT: function must be the default export
export default async function main(extensionId: string) {
    console.log('executing content script fn')

    const variant = newVariant(baseVariant, {
        wasmModule,
        wasmSourceMapData,
    })

    console.log('creating quickjs vm')
    const QuickJS = await newQuickJSWASMModule(variant);

    console.log('creating quickjs context')
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