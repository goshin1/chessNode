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

app.post('/roomchat', (req, res) => {
    const query = {
        text : 'select * from chesschat where chatgroup = $1',
        values : [req.body.data.chatgroup]
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

app.post('/reportchat', (req, res) => {
    const query = {
        text : 'insert into chessreport values(default, $1, $2, $3)',
        values : [req.body.data.choice, req.body.data.reason, req.body.data.report]
    };
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/createRoom', (req, res) => {
    let query = {
        text : "insert into chessboard values(default,'2-1','2-2','2-3','2-4','2-5','2-6','2-7','2-8','1-1','1-8','1-2','1-7','1-3','1-6','1-5','1-4','7-1','7-2','7-3','7-4','7-5','7-6','7-7','7-8','8-1','8-8','8-2','8-7','8-3','8-6','8-5','8-4')"
    };
    client.query(query)
        .then((response) => {});
    query = {
        text : "select min(board_num) as board_num from chessboard as b join chessgame as g on b.board_num != g.board_num"
    }
    client.query(query)
        .then((response) => {
            if(response.rowCount >= 1){
                //insert into chessgame values (default, '테스트방', 'manager', 'none', 1);
                let num = response.rows[0].board_num;
                console.log(num)
                console.log(num === null)
                if(num === null){
                    num = 1;
                }
                query = {
                    text : 'insert into chessgame values (default, $1, $2, \'none\', $3, \'none\', $4)',
                    values : [req.body.data.roomName, req.body.data.id, req.body.data.id, num]
                }
                client.query(query)
                    .then((response) => {})
                query = {
                    text : 'select * from chessgame where player_first=$1',
                    values : [req.body.data.id]
                }
                // 수정 해야 될 것. 방을 만들 때 해당 유저가 이미 방을 만들었다면 리턴 시키도록 변경할 것

                client.query(query)
                    .then((response) => {
                        if(response.rowCount === 1){
                            return res.send(response.rows[0])
                        } else if (response.rowCount > 1){
                            return res.send('fail');
                        } else {
                            return res.send('fail')
                        }
                    })
            }
            return;
        })
});

app.post('/enterRoom', (req, res) => {
    const query = {
        text : 'update chessgame set player_second=$1, white=$2 where roomid=$3',
        values : [req.body.data.player_second, req.body.data.white, req.body.data.roomid]
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/checkRoom', (req, res) => {
    console.log(req.body.data)
    const query = {
        text : 'select * from chessgame where roomid=$1',
        values : [req.body.data.roomid]
    };
    client.query(query)
        .then((response) => {
            return res.send(response.rows[0])
        })
})

app.post('/deleteRoom', (req, res) => {
    let query = {
        text : 'select * from chessgame where player_first=$1; delete from chessgame where player_first=$2',
        values : [req.body.data.player_first, req.body.data.player_first]
    }
    client.query(query)
        then((response) => {
            let arr = response[0].rows;
            for(let i = 0; i < arr.length; i++){
                query = {
                    text : 'delete from chessboard where board_num=$1',
                    values : [arr[i].board_num]
                }
                client.query(query)
            }
            return res.send()
        })
})

app.post('/exitRoom', (req, res) => {
    const query = {
        text : '',
        values : []
    }
    if(req.body.data.player_first === 'none' || req.body.player_second !== 'none'){  // first플레이어가 나갈 때
        query.text = 'update chessgame set player_first=$1, player_second=\'none\' where roomid=$2'
        query.values = [req.body.data.player_second, req.body.data.roomid]
    }else if(req.body.player_first !== 'none' || req.body.player_second === 'none'){  // second플레이어가 나갈 때
        query.text = 'update chessgame set player_second=\'none\' where roomid=$1'
        query.values = [req.body.data.roomid]
    }else if(req.body.player_first === 'none' || req.body.player_second === 'none'){  // 한 명밖에 없는데 나갈 경우
        query.text ='delete from chessgame where roomid=$1; delete from chessboard where board_num=$2'
        query.values = [req.body.data.roomid, req.body.data.board_num]
    }
    client.query(query)
        then((response) => {
            return res.send()
        })
})


// 두 가지 쿼리 테스트 -> 배열 형태로 결과값이 반환되며 입력한 쿼리문 순서대로 반환된다.
app.post('/testDouble', (req, res)=>{
    const query = {
        text : 'insert into chessmember values(\'ab2c\', \'1111\', \'naver@naver.com\', \'ab2c\', 0, 0, 0); select * from chessmember'
    }
    client.query(query)
        .then((response) => {
            console.log(response[1])
            return res.send(response.rows)
        })
})


app.listen(PORT, ()=>console.log(`${PORT} Listenling!`));