// An example dependency we'd want bundled with our function
import { getQuickJS } from "quickjs-emscripten" // put a VM in your VM

// IMPORTANT: function must be the default export
export default async function main(extensionId: string) {
    console.log('executing content script fn')

    const QuickJS = await getQuickJS()

    console.log('awaited QuickJS')
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