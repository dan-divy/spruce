import {name, apiEndpoint} from '../../config.json';
import {Context} from './context';
import * as Auth from './authentication';
import * as Http from './http';


interface File {
  _id: string;
  name: string;
  type: string;
};

export interface FileResponse extends Response {
  error?: string;
  encrypted?: boolean;
  fileName?: string;
  fileType?: string;
  length?: number;
  parsedBody?: {};
};

/**
 * Upload files
 *
 * @param   {Context} context, page context variable
 * @param   {FileList} files, files to upload
 * @param   {string} encrypt, string defaults to 'false'
 * @return  {File} file[], an array of file objects
 */
export const UploadFilesToCollection = async (context:Context, files:FileList, encrypt:string = 'false') => {
  const token = context.token;
  const collectionId = context.collectionId;

  if (!token || !collectionId) return { error: 'Token/collection ID not found in page context.' };
  if (!files || !files.length) return { error: 'No files presented.' };

  var formData = new FormData();
  formData.append('encrypt', encrypt);
  for (var i = 0; i < files.length; i++ ) {
    formData.append(name, files.item(i))
  }

  try {
    const res = await Http.postFile<File[]>(`${apiEndpoint}/file/collection/${collectionId}`, new Headers(Http.authFileHeader(token)), formData);
    return res.parsedBody;
  } catch (err) {
    return err.parsedBody || { error: err };
  }
  
};

/**
 * Get a file
 *
 * @param   {Context} context, page context variable
 * @return  {FileResponse} File request response
 */
export const GetFile = async (context:Context) => {
  return new Promise<FileResponse>((resolve, reject) => {
    const token = context.token;
    const collectionId = context.collectionId;
    const fileId = context.fileId;

    let response:FileResponse;

    if (!token || !collectionId) {
      response.error = 'Token not found in page context.';
      reject(response);
    }
    if (!collectionId || !fileId) {
      response.error = 'Collection ID and/or file ID in page context.';
      reject(response);
    }

    const path = `${apiEndpoint}/file/${collectionId}/${fileId}`;
    const headers = new Headers(Http.authMixHeader(token));
    const args = { method: "get", headers: headers };
    fetch(new Request(path, args))
    .then(res => {
      response = res;
      response.fileName = response.headers.get('File-Name');
      response.length = Number(response.headers.get('Content-Length'));
      response.fileType = response.headers.get('Content-Type');
      
      if (response.ok) {
        if (response.fileType == 'application/json') {
          const parsedBody = res.json();
          response.parsedBody = parsedBody;
          resolve(response);
        }

        if (!response.headers.get('Encrypted')) {
          response.encrypted = false;
        } else {
          response.encrypted = response.headers.get('Encrypted') != 'false';
        }
        resolve(response);
      }
      reject(response);
    });
  });
};