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
    const query = {
        text : 'update chessboard set ' + req.body.data.attacker + '=$1, ' + req.body.data.defender + '=$2 where board_num = 1',
        values : [req.body.data.attackerP, req.body.data.defenderP]
    }
    client.query(query)
        .then((response) => {
            return 
        })
})


// 온라인

app.post('/login', (req, res) => {
    const query = {
        text : 'select id, nickname, levels, lose, wins from chessmember where id=$1 and password=$2',
        values : [req.body.data.id, req.body.data.pwd]
    };
    client.query(query)
        .then((response) => {
            if(response.rowCount === 1){
                return res.send(response.rows[0])
            }ㅊ
            return res.send('fail')
        })
})

app.post('/duplic', (req, res) => {
    const query = {
        text : 'select * from chessmember where id=$1',
        values : [req.body.data.id]
    }
    client.query(query)
        .then((response) => {
            if(response.rowCount !== 0){
                return res.send('fail')
            }
            return res.send('sucess')
        })
})

app.post('/sign', (req, res) => {
    const query = {
        text : 'insert into chessmember values($1, $2, $3, $4, 1, 0, 0)',
        values : [req.body.data.id, req.body.data.pwd, req.body.data.email, req.body.data.nickname]
    }
    client.query(query)
        .then((response) => {
            return 
        })
})

app.post('/roomlist', (req, res) => {
    const query = {
        text : 'select * from chessgame'
    };
    client.query(query)
        .then((response) => {
            return res.send(response.rows)
        })
})

app.post('/lobbychat', (req, res) => {
    const query = {
        text : 'select * from chesschat where chatgroup = 0'
    };
    client.query(query)
        .then((response) => {
            return res.send(response.rows)
        })
})

app.post('/chat', (req, res) => {
    const query = {
        text : 'insert into chesschat values(default, $1, $2, $3, $4, $5);',
        values : [req.body.data.id, req.body.data.chatgroup, req.body.data.nickname, req.body.data.commend, req.body.data.time]
    };
    client.query(query)
        .then((response) => {
            return res.send()
        })

})

app.listen(PORT, ()=>console.log(`${PORT} Listenling!`));