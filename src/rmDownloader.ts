import * as http from 'http';
import { FileMetadata } from './types';

/**
 * Base URL for all requests
 */
const BASE_URL = 'http://10.11.99.1';

/**
 * Method for requesting the manifest of a collection
 */
const REQUEST_MANIFEST = {url: BASE_URL+'/documents/${ID}', method: "POST"};

/**
 * Method for downloading a file
 */
const REQUEST_DOWNLOAD = {url: BASE_URL+'/download/${ID}/placeholder', method: "GET"};

/**
 * Partial type of a manifest item as provided by the reMarkable device
 */
type rmFileMetadata = {
  VissibleName: string,
  Type: "DocumentType"|"CollectionType",
  ID: string,
  ModifiedClient: string
};

/**
 * Class for downloading manifests and documents from the device
 */
export class rmDownloader {
  private files: FileMetadata[] = [];  /**< Metadata for all files found on the device (after retrieveAllFiles has been called) */

  /**
   * Retrieve metadata for all files on the device
   */
  public async retrieveAllFiles(): Promise<void> {
    try {
      this.files = await this.getAllFilesFromCollection("/","");
    } catch(err) {
      console.error("Error: Could not retrieve file list from device");
      throw err;
    }
  }

  /**
   * Returns metadata retrieved from the device (after retrieveAllFiles has been called)
   */
  public getFiles(): FileMetadata[] {
    return this.files;
  }

  /**
   * Encode file names to replace / with - (beside \0 the only forbidden character on unix filesystems)
   */
  private encodeName(name: string): string {
    return name.replace(/\//g, '-');
  }

  /**
   * Get metadata for all files from a collection (including subfolders).
   * The result will contains files only.
   *
   * @param path Path to the collection. Will be prepended to file and folder names in the results
   * @param id UUID of the collection
   */
  private async getAllFilesFromCollection(path: string, id: string): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    let collections: FileMetadata[] = [{path: path, type: "folder", id: id, modified: ""}];

    try {
      while(collections.length > 0) {
        const newCollections: FileMetadata[] = [];
        for(const collection of collections) {
          const manifest = await this.getCollectionManifest(collection.path, collection.id);
          for(const item of manifest) {
            if(item.type == "file") {
              files.push(item);
            } else {
              newCollections.push(item);
            }
          }
        }
        collections = newCollections;
      }
    } catch(err) {
      console.error("Error: Could not read collection "+path);
      throw err;
    }
    return files.sort((a,b) => a.path < b.path ? -1 : 1);
  }

  /**
   * Get metadata for the direct children of a collection
   * The result may contains files and collections.
   *
   * @param path Path to the collection. Will be prepended to file and folder names in the results
   * @param id UUID of the collection
   */
  private async getCollectionManifest(path: string, id: string): Promise<FileMetadata[]> {
    return new Promise((resolve, reject) => {
      http.get(REQUEST_MANIFEST.url.replace("${ID}", id), {method: REQUEST_MANIFEST.method}, async res => {
        let data = "";
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', async () => {
          try {
            resolve(JSON.parse(data).map((i: rmFileMetadata) => {
              return {
                path: path + this.encodeName(i.VissibleName) + (i.Type == "DocumentType" ? ".pdf" : "/"),
                type: i.Type == "DocumentType" ? "file" : "folder",
                id: i.ID,
                modified: i.ModifiedClient
              };
            }));
          } catch(err) {
            console.error("Error: Invalid response (could not parse JSON). Response starts with: "+data.substr(0,10));
            reject(err);
          }
        });
      }).on('error', (err) => {
        console.error("Error: Could not establish a connection to the device.");
        reject(err);
      });
    });
  }

  /**
   * Download a file from the device
   */
  public async downloadFile(file: FileMetadata): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      http.get(REQUEST_DOWNLOAD.url.replace("${ID}", file.id), {method: REQUEST_DOWNLOAD.method}, async res => {
        let data: Buffer[] = [];
        res.on('data', chunk => {
          data.push(chunk);
        });
        
        res.on('end', async () => {
          const buffer = Buffer.concat(data);
          if(data.length == 0) {
            console.error(`Error: No data received`);
            reject(new Error("No data received"));
          } else if(!data[0].toString().startsWith("%PDF")) {
            console.error(`Error: Received invalid data from device. Data starts with: ${data[0].toString().substr(0,10)}`);
            reject(new Error("Invalid data: not a PDF"));
          } else {
            resolve(buffer);
          }
        });
      }).on('error', err => {
        console.log("Error: could not establish a connection to the device.");
        reject(err);
      });
    });
  }
}
