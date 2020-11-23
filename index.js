import pg from 'pg';

const { Client } = pg;

// set the way we will connect to the server
const pgConnectionConfigs = {
  user: process.env.USER,
  host: 'localhost',
  database: 'cat_owners',
  port: 5432, // Postgres server always runs on this port
};

// create the var we'll use
const client = new Client(pgConnectionConfigs);

// make the connection to the server
client.connect();

// User Input
const typeOfQuery = process.argv[2];

// create the query done callback
const whenQueryDone = (error, result) => {
  // this error is anything that goes wrong with the query
  if (error) {
    console.log('error', error);
  } else {
    // rows key has the data
    // console.log(result.rows);
  }

  const firstQueryArray = result.rows;
  console.log(result.rows, 'entry');

  firstQueryArray.forEach((entry, index) => {
    let nextSqlQuery;
    if (typeOfQuery === 'cats') {
      nextSqlQuery = {
        text: `SELECT name FROM owners WHERE id=${entry.owner_id}`,
      };
    } else if (typeOfQuery === 'owners') {
      nextSqlQuery = {
        text: `SELECT name FROM cats WHERE owner_id=${entry.id}`,
      };
    }

    client.query(nextSqlQuery, (queryError, queryResult) => {
      if (queryError) {
        console.log('error', queryError);
        return;
      }

      // console.log(queryResult.rows, 'test-2');
      if (typeOfQuery === 'cats') {
        const ownerName = queryResult.rows[0].name;
        if (index === 0) {
          console.log('Cats:');
        }
        console.log(`${index + 1}. ${entry.name} : Owner: ${ownerName}`);
      } else if (typeOfQuery === 'owners') {
        const catName = queryResult.rows[0];
        const catNameArray = queryResult.rows.map((row) => row.name);
        catNameArray.join('\n');

        // console.log(catNameArray.join('\n'), 'catNameArray');
        if (index === 0) {
          console.log('Owners:');
        }
        console.log(`${entry.id}. ${entry.name}\n - Cats:\n -  ${catNameArray.join('\n')}`);
      }

      // close the connection
      if (index === firstQueryArray.length - 1) {
        client.end();
      }
    });
  });
};

// Declare sqlQuery
let sqlQuery;

if (typeOfQuery === 'create-owner') {
  sqlQuery = {
    text: 'INSERT INTO owners(name) VALUES ($1) RETURNING *',
    values: [process.argv[3]],
  };
} else if (typeOfQuery === 'create-cat') {
  sqlQuery = {
    text: 'INSERT INTO cats(owner_id,name) VALUES ($1,$2) RETURNING *',
    values: [process.argv[3], process.argv[4]],
  };
} else if (typeOfQuery === 'cats') {
  sqlQuery = {
    text: 'SELECT * FROM cats',
  };
} else if (typeOfQuery === 'owners') {
  sqlQuery = {
    text: 'SELECT * FROM owners',
  };
}

// run the SQL query
client.query(sqlQuery, whenQueryDone);
