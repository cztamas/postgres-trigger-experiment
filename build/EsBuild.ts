import { build } from 'esbuild';
import nodeExternals from 'webpack-node-externals';

export const bundle = async (inputFile: string) => {
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
