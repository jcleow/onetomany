import pg from 'pg';

const { Client } = pg;

const connectionConfigs = {
  user: process.env.USER,
  host: 'localhost',
  database: 'vet',
  port: 5432,
};

const client = new Client(connectionConfigs);

client.connect();

// gloabl query mode either 'cats' or 'owners'
const queryMode = process.argv[2];
let sqlQuery;

const whenQueryDone = (error, result) => {
  if (error) {
    console.log('error', error);
    return;
  }
  result.rows.forEach((row) => {
  // nested query
    let nextSqlQuery;
    if (queryMode === 'cats') {
      nextSqlQuery = {
        text: `SELECT name FROM owners WHERE id=${row.owner_id}`,
      };
    } else if (queryMode === 'owners') {
      nextSqlQuery = {
        text: `SELECT name FROM cats WHERE id=${row.id}`,
      };
    }
    client.query(nextSqlQuery, (nextError, nextResult) => {
      if (nextError) {
        console.log('error2', error);
        return;
      }
      if (queryMode === 'cats') {
        const catId = row.id;
        const catName = row.name;
        const ownerName = nextResult.rows[0].name;
        console.log(`${catId} ${catName}: Owner: ${ownerName}`);
      } else {
        const ownerId = row.id;
        const ownerName = row.name;
        const catName = nextResult.rows[0].name;
        console.log(`${ownerId} ${ownerName}\n-Cats: \n  -${catName}`);
      }

      // Once the iteration reaches the final row, end connection
      if (row.id === result.rows.length) {
        client.end();
      }
    });
  });
};

if (queryMode === 'create-owner') {
  sqlQuery = {
    text: `INSERT INTO owners(name) VALUES('${process.argv[3]}') RETURNING *`,
  };
} else if (queryMode === 'create-cat') {
  sqlQuery = {
    text: `INSERT INTO cats(owner_id,name) VALUES('${process.argv[3]}','${process.argv[4]}') RETURNING *`,
  };
} else if (queryMode === 'cats') {
  sqlQuery = {
    text: 'SELECT * FROM cats;',
    rowMode: 'Array',
  };
} else if (queryMode === 'owners') {
  sqlQuery = {
    text: 'SELECT * FROM owners;',
    rowMode: 'Array',
  };
}

client.query(sqlQuery, whenQueryDone);
