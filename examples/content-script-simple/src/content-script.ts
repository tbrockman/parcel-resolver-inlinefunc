import * as _ from 'lodash/string'

// IMPORTANT: function must be the default export
export default async function main(extensionId: string) {
    const example = `hey there extension: ${extensionId}!`
    console.log(_.kebabCase(example))
}