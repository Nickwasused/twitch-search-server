// https://www.kindacode.com/article/how-to-easily-generate-a-random-string-in-node-js/
const crypto = require('crypto');
function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex');
}

const { promises: fs } = require("fs");

// https://sabe.io/blog/node-check-file-exists-async-await
async function checkFileExists(file){
    return !!(await fs.stat(file).catch(e => false))
}

module.exports = {
    generateRandomString,
    checkFileExists
};