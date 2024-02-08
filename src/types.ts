// @ts-ignore
import NodeResolver from '@parcel/node-resolver-core';
import type { PackageJSON } from "@parcel/types"

export type InlinefuncResolverConfig = {
    resolver: NodeResolver,
    config?: InlineFuncConfig
}

export type InlineFuncConfig = {
    options: string
}

export type InlinefuncPackageJSONConfig = {
    "parcel-resolver-inlinefunc": InlineFuncConfig
}

export type InlinefuncExtendedPackageJSON = PackageJSON & InlinefuncPackageJSONConfig
