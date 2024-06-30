import { build } from 'esbuild';
import { match } from 'ts-pattern';
import nodeExternals from 'webpack-node-externals';
import { BuildMode } from './types.js';

const bundle = async (inputFile: string) => {
  const esbuildResult = await build({
    entryPoints: [inputFile],
    external: [nodeExternals()],
    format: 'esm',
    platform: 'browser',
    bundle: true,
    write: false
  });

  const esbuildFile = esbuildResult.outputFiles[0];
  const bundlesJs = esbuildFile.text;
  return bundlesJs;
};

export const createBundle = async ({
  mode,
  inputFile,
  scopePrefix
}: {
  mode: BuildMode;
  inputFile: string;
  scopePrefix: string;
}) => {
  const bundledJsWithExportBlock = await bundle(inputFile);
  const bundledJs = bundledJsWithExportBlock.replace(/export\s*{[^}]*};/gs, '');

  const modeAdjustedBundledJs = match(mode)
    .with('inline', () => bundledJs)
    .with('start_proc', () =>
      // Remove var from var plv8ify to make it attach to the global scope in start_proc mode
      bundledJs.replace(`var ${scopePrefix} =`, `this.${scopePrefix} =`)
    )
    .with('bundle', () => bundledJs)
    .exhaustive();

  return modeAdjustedBundledJs;
};
