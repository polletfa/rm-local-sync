import * as http from 'http';

/**
 * Base URL for all requests
 */
const BASE_URL = 'http://10.11.99.1';

/**
 * Method for requesting the manifest of a collection
 */
const MANIFEST = 'documents';

/**
 * Method for downloading a file
 */
const DOWNLOAD = 'download';

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
 * Type describing a file or folder
 */
export type FileMetadata = {
  path: string,
  type: "file"|"folder",
  id: string,
  modified: string
};

/**
 * Class for downloading manifests and documents from the device
 */
export class rmDownloader {
  private files: FileMetadata[] = [];  /**< Metadata for all files found on the device (after retrieveAllFiles has been called) */

  /**
   * Retrieve metadata for all files on the device
   */
  public async retrieveAllFiles(): Promise<boolean> {
    return this.getAllFilesFromCollection("/","")
      .then((res) => {
        this.files = res;
        return true;
      })
      .catch((err) => {
        console.log("An error occurred: " + (err instanceof Error ? err.message : err));
        return false;
      });
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
    return files;
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
      http.get([BASE_URL, MANIFEST, id].join("/"), {method: "POST"}, async res => {
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
            reject(err);
          }
        });
      }).on('error', err => {
        reject(err);
      });
    });
  }
}
