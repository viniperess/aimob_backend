import * as multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({ storage });
