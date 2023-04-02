import { rmDownloader } from './rmDownloader';
import { CacheManager } from './CacheManager';
import { IndexBuilder } from './IndexBuilder';

const DATA_PATH = process.argv[2] ? process.argv[2] : "data";
const downloader = new rmDownloader();
const cache = new CacheManager(downloader, DATA_PATH);
const index = new IndexBuilder(cache, DATA_PATH);

(async() => {
  try {
    await downloader.retrieveAllFiles();
    await cache.synchronize();
    if(cache.hasNewFiles()) {
      index.buildIndex(downloader.getFiles());
    }
    console.log("Done.");
  } catch(err) {
    console.error("Failed.");
    console.error();
    console.error("Full error:");
    console.error(err);
  }
})();

