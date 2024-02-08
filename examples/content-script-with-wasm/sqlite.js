import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

const start = function (sqlite3) {
    log('Running SQLite3 version', sqlite3.version.libVersion);
    const db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
    // Your SQLite code here.
};

export default function init() {
    log('Loading and initializing SQLite3 module...');
    sqlite3InitModule({
        print: log,
        printErr: error,
    }).then((sqlite3) => {
        try {
            log('Done initializing. Running demo...');
            start(sqlite3);
        } catch (err) {
            error(err.name, err.message);
        }
    });
}