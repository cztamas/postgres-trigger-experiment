import { build } from 'esbuild';
import { FunctionDeclaration, Project } from 'ts-morph';
import nodeExternals from 'webpack-node-externals';
import { TSFunction } from './types';

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

export const getFunctionsInFile = (inputFilePath: string): TSFunction[] => {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(inputFilePath);

  const functions = sourceFile.getFunctions();
  return functions.map(fn => {
    return {
      name: fn.getName(),
      isExported: fn.isExported(),
      parameters: getFunctionParameters(fn),
      comments: getFunctionComments(fn),
      returnType: fn.getReturnType().getText(),
      jsdocTags: getFunctionJsdocTags(fn)
    };
  });
};

const getFunctionParameters = (fn: FunctionDeclaration) => {
  const parameters = fn.getParameters();
  return parameters.map(parameter => {
    return {
      name: parameter.getName(),
      type: parameter.getType().getText()
    };
  });
};

const getFunctionComments = (fn: FunctionDeclaration) => {
  return fn.getLeadingCommentRanges().map(commentRange => commentRange.getText());
};

const getFunctionJsdocTags = (fn: FunctionDeclaration): TSFunction['jsdocTags'] => {
  const jsdocTags = fn.getJsDocs().flatMap(jsdoc => jsdoc.getTags());
  return jsdocTags.map(tag => ({
    name: tag.getTagName(),
    commentText: tag.getCommentText() || ''
  }));
};
