const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { Client } = require('pg');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

const client = new Client({
    user : process.env.POSTGRES_USER,
    host : process.env.POSTGRES_HOST,
    database : 'chess',
    password : process.env.POSTGRES_PASSWORD,
    port : process.env.POSTGRES_PORT
});

client.connect();

app.post('/test', (req, res) => {
    const query = {
        text : 'select * from chessboard where board_num = 1;'
    }
    client.query(query)
        .then((response) => {
            return res.send(response.rows[0])
        })
})

app.post('/moveTest', (req, res) => {
    const query = {
        text : 'update chessboard set ' + req.body.data.target +  '= $1 where board_num = 1',
        values : [req.body.data.end]
    }
    client.query(query)
        .then((response) => {
            return 
        })
})


app.post('/attack', (req, res) => {
    console.log(req.body.data)
    const query = {
        text : 'update chessboard set ' + req.body.data.attacker + '=$1, ' + req.body.data.defender + '=$2 where board_num = 1',
        values : [req.body.data.attackerP, req.body.data.defenderP]
    }
    client.query(query)
        .then((response) => {
            return 
        })
})


app.listen(PORT, ()=>console.log(`${PORT} Listenling!`));