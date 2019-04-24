const request = require('request');
const EOL = require('os').EOL;
const fs = require('fs');
const S3FS = require('s3fs');
const s3fsImpl = new S3FS('mybucketname', {
  accessKeyId: 'XXXXXXXXXXX',
  secretAccessKey: 'XXXXXXXXXXXXXXXXX'
});

exports.handler = (event, context, callback) => {
  const url = event.url || 'https://randomuser.me/api/?format=csv&results=5000';
  request.get(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const csv = body;
      const array = csv
        .split(/[\r\n]+/)
        .filter(Boolean) // clear empty lines
        .map((value) => value.split(','));

      // console.log(array);
      const [columns, ...data] = array;
      columns.shift();

      // console.log(data);
      const newCsvArrays = data.reduce((acc, curr) => {
        const [fileName, ...entries] = curr;
        if (acc.has(fileName)) {
          acc.get(fileName).push(entries);
        } else {
          acc.set(fileName, [columns, entries]) ;
        }
        return acc;
      }, new Map());
      // console.log(newCsvArrays);

      newCsvArrays.forEach((csvArray, key) => {
        const stringifiedCsv = csvArray
          .map((row) => row.join(','))
          .join(EOL);
        // console.log(stringifiedCsv);

        s3fsImpl.create();

        const path = `${key}.csv`;
        fs.writeFile(path, stringifiedCsv, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`${path} successfully created!`);
            const stream = fs.createReadStream(path);
            return s3fsImpl.writeFile(path, stream).then(function () {
              fs.unlink(path, function (err) {
                if (err) {
                  console.error(err);
                }
              });
            });
          }
        });
      });
      // TODO: use promises and Promise.all() to fire callback when files are done uploading
      callback(null, 'Files are being uploaded')
    }
  });
};

