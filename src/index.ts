import { Resolver } from "@parcel/plugin"
// @ts-ignore
import NodeResolver from '@parcel/node-resolver-core';
import type { ResolveResult } from "@parcel/types"
import { build, type BuildOptions } from 'esbuild'
import { join } from "path"
import type { InlinefuncResolverConfig, InlinefuncExtendedPackageJSON } from "./types";

const prefix = 'inlinefunc:'

export default new Resolver({
  async loadConfig({ config, options, logger }) {
    let conf = await config.getConfig([], {
      packageKey: '@parcel/resolver-default',
    });
    const packageJSON = await config.getPackage() as InlinefuncExtendedPackageJSON
    const resolver = new NodeResolver({
      fs: options.inputFS,
      projectRoot: options.projectRoot,
      packageManager: options.packageManager,
      shouldAutoInstall: options.shouldAutoInstall,
      mode: options.mode,
      logger,
      // @ts-ignore
      packageExports: conf?.contents?.packageExports ?? false,
    })
    return { resolver, config: packageJSON["parcel-resolver-inlinefunc"] } as InlinefuncResolverConfig;
  },
  async resolve({ specifier, dependency, options, logger, config: { resolver, config } }) {
    logger.verbose({ message: "[parcel-resolver-inlinefunc]" })

    if (!specifier.startsWith(prefix)) {
      return null
    }

    logger.verbose({ message: `found matching specifier: ${specifier}` })
    const without = specifier.slice(prefix.length)
    const result: ResolveResult = await resolver.resolve({
      filename: without,
      specifierType: dependency.specifierType,
      range: dependency.range,
      parent: dependency.resolveFrom,
      env: dependency.env,
      sourcePath: dependency.sourcePath,
      loc: dependency.loc,
      packageConditions: dependency.packageConditions,
    });

    if (!result || !result.filePath) {
      logger.error({ message: `failed to resolve: ${specifier}` })
      return null
    }

    let overrides = {}

    try {
      if (config) {
        logger.verbose({ message: `inlinefunc configuration detected:\n${JSON.stringify(config, null, 2)}` })
        const optionsFile = join('file://', options.projectRoot, config.options)
        const exported = await import(optionsFile)
        overrides = { ...exported.default }
        logger.verbose({ message: `loaded esbuild config overrides:\n${JSON.stringify(overrides, null, 2)}` })
      }
    } catch (e) {
      logger.error({ message: `error with dynamic import:\n${e}` })
    }

    logger.verbose({ message: `reading code from resolved filepath: ${result.filePath}` })
    const code = await options.inputFS.readFile(result.filePath, 'utf8')

    let out

    try {
      const args = {
        bundle: true,
        format: 'iife',
        write: false,
        stdin: {
          contents: code,
          resolveDir: options.projectRoot,
          sourcefile: result.filePath,
          loader: 'default'
        },
        banner: {
          js: 'module.exports = (...args) => {'
        },
        footer: {
          js: 'return __parcel_resolver_inlinefunc.default(...args); }'
        },
        globalName: '__parcel_resolver_inlinefunc',
        preserveSymlinks: false,
        platform: 'browser',
        absWorkingDir: options.projectRoot,
        treeShaking: true,
        minify: true,
        ...overrides
      } as BuildOptions
      logger.verbose({ message: `starting esbuild with arguments: ${JSON.stringify(args, null, 2)}` })
      out = await build(args)
    } catch (e) {
      logger.error({ message: `error with esbuild: ${e}` })
      return null
    }

    if (!out || !out.outputFiles || out.outputFiles.length === 0) {
      logger.warn({ message: 'esbuild failed to product any output files' })
      return null
    }

    return {
      filePath: result.filePath,
      code: out.outputFiles[0].text,
      sideEffects: true,
      invalidateOnEnvChange: result.invalidateOnEnvChange,
      invalidateOnFileCreate: result.invalidateOnFileCreate,
      invalidateOnFileChange: result.invalidateOnFileChange
    }
  }
})
