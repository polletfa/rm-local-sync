import * as fs from 'fs';
import { FileMetadata } from './Application';

/**
 * Path to the cache
 */
const CACHE_PATH="data/.cache";

/**
 * Class to manage the file cache
 */
export class CacheManager {
  /**
   * Initialize the cache manager and create the directory if it doesn't exist
   */
  constructor() {
    fs.mkdirSync(CACHE_PATH, {recursive: true});
  }

  /**
   * Check if a file exists in the cache
   */
  public hasFile(file: FileMetadata): boolean {
    return fs.existsSync(this.getFilePath(file));
  }

  /**
   * Save a file in the cache
   */
  public saveFile(file: FileMetadata, filecontent: string): void {
    fs.writeFileSync(this.getFilePath(file), filecontent);
  }

  /**
   * Get the path to a cached file
   */
  private getFilePath(file: FileMetadata): string {
    return CACHE_PATH + "/" + file.id + "." + file.modified;
  }
}
