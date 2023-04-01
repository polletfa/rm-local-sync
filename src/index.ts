import * as http from 'http';
import { FileMetadata, rmDownloader } from './rmDownloader';

const downloader = new rmDownloader();
downloader.retrieveAllFiles()
  .then(res => {
    if(res) {
      downloader.getFiles().map(i => console.log(i.path));
    }
  });

