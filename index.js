const commander = require('commander');
const EOL = require('os').EOL;
const fs = require('fs');

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-p, --path <name>', 'csv file path')
  .parse(process.argv);

const {
  path,
} = commander;

if (!path) {
  console.log('--path is required!');
  process.exit(1);
}

fs.readFile(path,'utf8', (err, contents) => {
  const array = contents
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
    const path = `${key}.csv`;
    fs.writeFile(path, stringifiedCsv, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`${path} successfully created!`)
      }
    });
  })
});
