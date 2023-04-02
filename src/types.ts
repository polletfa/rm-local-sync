/**
 * Type describing a file or folder
 */
export type FileMetadata = {
  path: string,
  type: "file"|"folder",
  id: string,
  modified: string
};
