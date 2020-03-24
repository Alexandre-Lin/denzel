const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {PORT} = require('./constants');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
});
//create table
db.run('CREATE TABLE IF NOT EXISTS movie(id TEXT,link TEXT,metascore INTEGER,' +
    'poster TEXT,rating INTEGER ,synopsis TEXT,title TEXT,votes REAL,year INTEGER );', function (err) {
  if (err) {
    return console.log(err.message)
  }
  console.log('Table created')
});

const constants = require('constants');
const app = express();

const imdb = require('./imdb');


module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
    response.send({'ack': true});
});


app.get('/movies/populate/:id', async function (req, res) {
    //retrieve movies
    const movies = await imdb(req.params.id);
    //filtering to collect all master pieces
    const awesome = movies.filter(movie => movie.metascore >= 70);
    JSON.stringify(movies, null, 2);
    JSON.stringify(awesome, null, 2);
    //inserting to the database
    for (let i = 0; i < movies.length; i++) {
        db.run('INSERT INTO movie(id,link,metascore,poster,rating,synopsis,title,votes,year) VALUES (?,?,?,?,?,?,?,?,?)', [movies[i].id,
            movies[i].link, movies[i].metascore, movies[i].poster, movies[i].rating, movies[i].synopsis, movies[i].title, movies[i].votes, movies[i].year], function (err) {
            if (err) {
                return console.log(err.message);
            }
            return console.log("Inserted");
        })
    }
    //sending response
    res.send("Movies found :" + movies.length + " in which " + awesome.length + " are master pieces");
})

app.get('/movies',function (req,res) {
    //retrieve master pieces movies
    db.all('SELECT * FROM movie where metascore > 69',[],(err,rows) => {
        if (err){
            throw err;
        }
        //select random one
        let row = rows[Math.floor(Math.random() * Math.floor(rows.length))];
        //send response
        res.send(row);
    })

})

app.get('/movies/:id',function (req,res) {
    //retrieve
    db.get('SELECT * FROM movie where id = (?)',[req.params.id],(err,row)=>{
        if (err)
        {
            throw err;
        }
        res.send(row);
    })
})


app.listen(PORT);
console.log(`📡 Running on port ${PORT}`);
