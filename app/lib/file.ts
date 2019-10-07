import {name, apiEndpoint} from '../../config.json';
import {Context} from './context';
import * as Auth from './authentication';
import * as Http from './http';


interface File {
  _id: string;
  name: string;
  type: string;
}

export interface FileResponse {
  files: File[];
  message: string;
  errpr: string;
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
