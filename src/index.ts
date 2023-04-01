import * as http from 'http';
import { FileMetadata, rmDownloader } from './rmDownloader';
import { CacheManager } from './CacheManager';

const downloader = new rmDownloader();
downloader.retrieveAllFiles()
  .then(async res => {
    if(res) {
      const cache = new CacheManager();
      const files = downloader.getFiles();
      try {
        for(const file of files) {
          if(cache.hasFile(file)) {
            console.log("Skipping " + file.path);
          } else {
            console.log("Downloading " + file.path);
            const fileContent = await downloader.downloadFile(file.id)
              .catch(() => console.log("Unable to download "+file.path));
            if(fileContent) {
              cache.saveFile(file, fileContent);
            }
          }
        }
      } catch(err) {
        console.log("Error: "+(err instanceof Error ? err.message : err));
      }
    }
  });

