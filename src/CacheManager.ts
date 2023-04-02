import * as fs from 'fs';
import { FileMetadata } from './types';
import { rmDownloader } from './rmDownloader';

/**
 * Class to manage the file cache
 */
export class CacheManager {
  private CACHE_PATH = ".cache"; /**< Path to the cache relative to the data path */
  private newFiles = false;      /**< Flag set to true when files have been saved to the cache */

  constructor(private downloader: rmDownloader, private DATA_PATH: string) {}
  
  /**
   * Synchronize the cache with the device
   */
  public async synchronize(): Promise<void> {
    try {
      const files = this.downloader.getFiles();
      let skipped = 0;
      for(const file of files) {
        if(this.hasFile(file)) {
          skipped++;
        } else {
          if(skipped > 0) {
            console.log(`Skipped ${skipped} file${skipped > 1 ? 's' : ''} (up to date)`);
            skipped = 0;
          }
          console.log("Downloading " + file.path);
          const fileContent = await this.downloader.downloadFile(file);
          this.saveFile(file, fileContent);
        }
      }
      if(skipped > 0) {
        console.log(`Skipped ${skipped} file${skipped > 1 ? 's' : ''} (up to date)`);
        skipped = 0;
      }
    } catch(err) {
      console.error("Error: Could not synchronize cache");
      throw err;
    }
  }

  /**
   * Returns true if at least one file has been saved in the cache
   */
  public hasNewFiles(): boolean {
    return this.newFiles;
  }

  /**
   * Get the path to a cached file
   */
  public getFilePath(file: FileMetadata): string {
    return [this.DATA_PATH, this.CACHE_PATH, file.id + "." + file.modified+".pdf"].join("/");
  }

  /**
   * Check if a file exists in the cache
   */
  private hasFile(file: FileMetadata): boolean {
    return fs.existsSync(this.getFilePath(file));
  }

  /**
   * Save a file in the cache
   */
  private saveFile(file: FileMetadata, filecontent: Buffer): void {
    try {
      fs.mkdirSync([this.DATA_PATH, this.CACHE_PATH].join("/"), {recursive: true});
      fs.writeFileSync(this.getFilePath(file), filecontent);
      this.newFiles = true;
    } catch(err) {
      console.error("Error: Could not save file " + file.path);
      throw err;
    }
  }
}
