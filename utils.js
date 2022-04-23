// https://www.kindacode.com/article/how-to-easily-generate-a-random-string-in-node-js/
const generateRandomString = (myLength) => {
    const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    const randomArray = Array.from({ length: myLength }, (v, k) => chars[Math.floor(Math.random() * chars.length)]);
    const randomString = randomArray.join("");
    return randomString;
};

const { promises: fs } = require("fs");

// https://sabe.io/blog/node-check-file-exists-async-await
async function checkFileExists(file){
    return !!(await fs.stat(file).catch(e => false))
}

module.exports = {
    generateRandomString: generateRandomString,
    checkFileExists: checkFileExists
};