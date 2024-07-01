import { build } from 'esbuild';
import nodeExternals from 'webpack-node-externals';

export const bundle = async (inputFilePath: string) => {
  const esbuildResult = await build({
    entryPoints: [inputFilePath],
    external: [nodeExternals()],
    format: 'esm',
    platform: 'browser',
    bundle: true,
    write: false
  });

  const esbuildFile = esbuildResult.outputFiles[0];
  const bundledJs = esbuildFile.text.replace(/export\s*{[^}]*};/gs, '');

  return bundledJs;
};
