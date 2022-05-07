// https://www.kindacode.com/article/how-to-easily-generate-a-random-string-in-node-js/
import crypto from 'crypto';
function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex');
}

import { promises as fs } from "fs"; 

// https://sabe.io/blog/node-check-file-exists-async-await
async function checkFileExists(file){
    return !!(await fs.stat(file).catch((e) => false));
}

export default {
    generateRandomString,
    checkFileExists
}