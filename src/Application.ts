import * as http from 'http';
import { rmDownloader } from './rmDownloader';
import { CacheManager } from './CacheManager';

/**
 * Type describing a file or folder
 */
export type FileMetadata = {
  path: string,
  type: "file"|"folder",
  id: string,
  modified: string,
  size?: number
};

/**
 * Main class of the application
 */
export class Application {
  private downloader = new rmDownloader();
  private cache = new CacheManager();

  public async run(): Promise<void> {
    try {
      await this.syncCache();
    } catch(err) {
      console.log("Error: "+(err instanceof Error ? err.message : err));
    }
  }

  private async syncCache(): Promise<void> {
    new Promise<void>((resolve, reject) => {
      this.downloader.retrieveAllFiles()
        .then(async () => {
          const files = this.downloader.getFiles();
          try {
            for(const file of files) {
              if(this.cache.hasFile(file)) {
                console.log("Skipping " + file.path);
              } else {
                console.log("Downloading " + file.path);
                const fileContent = await this.downloader.downloadFile(file)
                  .catch(() => undefined);
                if(fileContent) {
                  this.cache.saveFile(file, fileContent);
                } else {
                  reject(new Error("Unable to download "+file.path));
                }
              }
            }
          } catch(err) {
            reject(err);
          }
          resolve();
        })
        .catch(err => reject(err));
    });
  }
}
