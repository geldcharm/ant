import { v4 as uuidv4 } from 'uuid';
import { FILES } from '../config/business';

export class FileTooLargeError extends Error {
  constructor(fileName, maxBytesLabel) {
    super(`${fileName} exceeds the ${maxBytesLabel} limit.`);
    this.name = 'FileTooLargeError';
  }
}

export function readFileAsDataURL(file) {
  if (file.size > FILES.maxBytes) {
    return Promise.reject(new FileTooLargeError(file.name, FILES.maxBytesLabel));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      id: uuidv4(),
      name: file.name,
      url: reader.result,
      size: file.size,
      type: file.type,
    });
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function readFilesAsDataURLs(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(readFileAsDataURL));
}
