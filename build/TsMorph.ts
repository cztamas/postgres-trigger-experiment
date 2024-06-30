import { FunctionDeclaration, Project, SourceFile } from 'ts-morph';
import { TSCompiler, TSFunction } from './types';

export class TsMorph implements TSCompiler {
  private sourceFile: SourceFile;

  createSourceFile(inputFilePath: string) {
    const project = new Project();
    this.sourceFile = project.addSourceFileAtPath(inputFilePath);
  }

  private getFunctionReturnType(fn: FunctionDeclaration) {
    return fn.getReturnType().getText();
  }

  private getFunctionParameters(fn: FunctionDeclaration) {
    const params = fn.getParameters();
    return params.map(p => {
      return {
        name: p.getName(),
        type: p.getType().getText()
      };
    });
  }

  private getFunctionComments(fn: FunctionDeclaration) {
    const comments = fn.getLeadingCommentRanges().map(cr => cr.getText());
    return comments;
  }

  private getFunctionJsdocTags(fn: FunctionDeclaration): TSFunction['jsdocTags'] {
    const jsdocTags = fn.getJsDocs().flatMap(jsdoc => jsdoc.getTags());
    return jsdocTags.map(tag => ({
      name: tag.getTagName(),
      commentText: tag.getCommentText() || ''
    }));
  }

  getFunctions() {
    const fns = this.sourceFile.getFunctions();
    return fns.map(fn => {
      return {
        name: fn.getName(),
        isExported: fn.isExported(),
        parameters: this.getFunctionParameters(fn),
        comments: this.getFunctionComments(fn),
        returnType: this.getFunctionReturnType(fn),
        jsdocTags: this.getFunctionJsdocTags(fn)
      };
    });
  }
}
