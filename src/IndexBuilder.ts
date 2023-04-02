import * as fs from 'fs';
import { FileMetadata } from './types';
import { CacheManager } from './CacheManager';

/**
 * IndexBuilder
 */
export class IndexBuilder {
  constructor(private cache: CacheManager, private DATA_PATH: string) {}

  /**
   * Build the index for a list of files
   */
  public buildIndex(files: FileMetadata[]): void {
    console.log("Rebuilding index...");
    const basePath = [this.DATA_PATH, new Date().toISOString()].join("/");
    const basePathTmp = basePath + ".tmp";
    const currentPath = [this.DATA_PATH, "current"].join("/");

    try {
      for(const file of files) {
        fs.mkdirSync([basePathTmp, ...file.path.split("/").slice(0,-1)].join("/"), {recursive: true});
        fs.linkSync(this.cache.getFilePath(file), [basePathTmp, file.path].join("/"));
      }

      fs.renameSync(basePathTmp, basePath);
      if(fs.existsSync(currentPath)) {
        fs.unlinkSync(currentPath);
      }
      fs.symlinkSync(basePath.substr(this.DATA_PATH.length+1), currentPath);
    } catch(err) {
      if(fs.existsSync(basePathTmp)) {
        fs.rmSync(basePathTmp, { recursive: true, force: true }); // cleanup
      }
      console.error("Error: Could not build index.");
      throw err;
    }
  }
}
