const Papa = require("papaparse")

const readUploadedFileAsText = (inputFile) => {
    const temporaryFileReader = new FileReader();
  
    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
  
      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result);
      };
      temporaryFileReader.readAsText(inputFile);
    });
  };
  
  async function readFile(file){  
    try {
      const fileContents = await readUploadedFileAsText(file);
      return Papa.parse(fileContents, { header: true }).data
    } catch (e) {
      console.log(e.message)
    }
  }

module.exports = {
    readFile
}