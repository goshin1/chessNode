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
    console.log('체스판 불러오기')
    const query = {
        text : `select * from ${req.body.data.viewname};`
    }
    client.query(query)
        .then((response) => {
            return res.send(response.rows[0])
        })
})

app.post('/moveTest', (req, res) => {   // 이동하려는 구역에 아무것도 없을 때
    console.log('체스말 이동하기')
    // 'update chessboard set ' + req.body.data.target +  '= $1 where board_num = $2;'
    let query = {
        text : 'update ' + req.body.data.viewname + ' set ' + req.body.data.target + ' = \'' + req.body.data.end + '\''
    }
    console.log(query)
    client.query(query)
    query = {
        text : 'update chessgame set turn = $1, first_time = $2, second_time = $3 where roomid = $4',
        values : [req.body.data.turn, req.body.data.first_time, req.body.data.second_time, req.body.data.roomid]
    }
    console.log('이동 마무리')
    console.log(query)
    client.query(query)
        .then((response) => {
            return res.send()
        })
})


app.post('/attack', (req, res) => { // 이동하려는 구역에 상대 말이 있을 경우
    console.log('상대방 말 공격하기')
    let query = {
        text : 'update ' + req.body.data.viewname +' set ' + req.body.data.attacker + '=$1, ' + req.body.data.defender + '=$2;',
        values : [req.body.data.attackerP, req.body.data.defenderP]
    }
    console.log(query)
    client.query(query)
    query = {
        text : 'update chessgame set turn = $1, first_time = $2, second_time = $3 where roomid = $4',
        values : [req.body.data.turn, req.body.data.first_time, req.body.data.second_time, req.body.data.roomid]
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
    
})

app.post('/turnChange', (req, res) => {
    console.log('턴 교대하기')
    let query = {
        text : 'update chessgame set turn = $1, first_time = $2, second_time = $3 where roomid = $4',
        values : [req.body.data.turn, String(req.body.data.first_time), String(req.body.data.second_time), req.body.data.roomid]
    };

    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/timeUpdate', (req, res) => {
    console.log('시간 수정하기')
    let query = {
        text : '',
        values : []
    }
    if(req.body.data.who === 1){
        query = {
            text : 'update chessgame set first_time=$1 where roomid=$2',
            values : [req.body.data.endTime, req.body.data.roomid]
        };
    }else if(req.body.data.who === 2){
        query = {
            text : 'update chessgame set second_time=$1 where roomid=$2',
            values : [req.body.data.endTime, req.body.data.roomid]
        }
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/banCheck', (req, res) => {
    console.log('탈주 또는 패스')
    let query = {
        text : '',
        values : []
    }
    if(req.body.data.who === 1){ // 1 번이 탈주 시
        query = {
            text : 'update chessgame set ready_first = $1 where roomid = $2',
            values : [req.body.data.ready, req.body.data.roomid]
        }
    }else if(req.body.data.who === 2){
        query = {
            text : 'update chessgame set ready_second = $1 where roomid = $2',
            values : [req.body.data.ready, req.body.data.roomid]
        }
    }
    client.query(query)
        .then((response) => {
            return res.send(String(req.body.data.ready + 1))
        })
})

app.post('/gameSet', (req, res) => {
    let query = {
        text : '',
        values : []
    }

    if(req.body.data.res === 1){
        query = {
            text : 'update chessmember set lose = lose + 1 where id = $1',
            values : [req.body.data.id]
        };
    }else{
        query = {
            text : 'update chessmember set wins = wins + 1 where id = $1',
            values : [req.body.data.id]
        };
    }
    client.query(query)
        .then((response) => {
            res.send()
        })

    
})

app.post('/surrender', (req, res) => {
    let query = {
        text : '',
        values : []
    }
    if(req.body.data.color === 'white'){
        query = {
            text : 'update chessboard set white_king = $1 where board_num = $2;',
            values : ['0-0', req.body.data.board_num]
        }
    }else{
        query = {
            text : 'update chessboard set black_king = $1 where board_num = $2;',
            values : ['0-0', req.body.data.board_num]
        }
    }
    console.log(query)
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/updateGame', (req, res) => {
    const query = {
        text : 'select * from chessgame where roomid = $1',
        values : [req.body.data.roomid]
    };
    client.query(query)
        .then((response) => {
            return res.send(response.rows[0])
        })

})

app.post('/clearRoom', (req, res) => {
    let query = {
        text : 'delete from chessgame where roomid = $1',
        values : [req.body.data.roomid]
    }
    client.query(query)

    query = {
        text : "SELECT table_schema, table_name AS view_name FROM information_schema.VIEWS WHERE table_schema NOT IN ('pg_catalog', 'information_schema') and table_name = '"+ req.body.data.viewname +"' ORDER BY table_schema, table_name;"
    };
    client.query(query)
        .then((response) => {
            if(response.rowCount > 0){
                query = {
                    text : 'drop view '+req.body.data.viewname
                };
                client.query(query)
            }
        });
    query = {
        text : 'delete from chessboard where board_num = $1',
        values : [req.body.data.board_num]
    };
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/promotion', (req, res) => {
    let query = {
        text : 'alter view ' + req.body.data.viewname + ' rename column '+ req.body.data.target +' to ' + req.body.data.selection + ';'
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

// 온라인

app.post('/login', (req, res) => {
    let query = {
        text : 'select id, levels, lose, wins from chessmember where id=$1 and password=$2 and login=0;',
        values : [req.body.data.id, req.body.data.pwd]
    };
    client.query(query)
        .then((response) => {
            if(response.rowCount === 1){
                query = {
                    text : 'update chessmember set login = 1 where id = $1',
                    values : [req.body.data.id]
                }
                client.query(query)
                return res.send({
                    login : true,
                    info : response.rows[0]
                })
            }
            return res.send({
                login : false,
                info : null
            })
        })
})



app.post('/loginenforce', (req, res) => {
    let query = {
        text : 'update chessmember set login = 0 where id = $1',
        values : [req.body.data.id]
    }
    client.query(query)
    query = {
        text : 'select id, levels, lose, wins from chessmember where id=$1 and password=$2;',
        values : [req.body.data.id, req.body.data.pwd]
    };
    client.query(query)
        .then((response) => {
            return res.send({
                login : true,
                info : response.rows[0]
            })
        })
})

app.post('/logout', (req, res) => {
    const query = {
        text : 'update chessmember set login = 0 where id = $1',
        values : [req.body.data.id]
    };
    client.query(query)
        .then((response) => {
            return res.send()
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
        text : 'insert into chessmember values($1, $2, $3, 1, 0, 0, 0)',
        values : [req.body.data.id, req.body.data.pwd, req.body.data.email]
    }
    client.query(query)
        .then((response) => {
            return 
        })
})

app.post('/pwdcheck', (req, res) => {
    const query = {
        text : 'select * from chessmember where id = $1 and password = $2',
        values : [req.body.data.id, req.body.data.pwd]
    };
    client.query(query)
        .then((response) => {
            if(response.rowCount === 1){
                return res.send({chk : 1})
            }
            return res.send({chk : 0})
        })
})

app.post('/update', (req, res) => {
    const query = {
        text : 'update chessmember set password = $1, email = $2 where id = $3',
        values : [req.body.data.pwdch, req.body.data.email, req.body.data.id]
    }
    client.query(query)
        .then((response) => {
            return res.send({chk : 0})
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
        text : 'insert into chesschat values(default, $1, $2, $3, $4);',
        values : [req.body.data.id, req.body.data.chatgroup, req.body.data.commend, req.body.data.time]
    };
    console.log(query)
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
        text : "select * from chessboard where board_num != ANY($1)",
        values : [req.body.data.board]
    }
    client.query(query)
        .then((response) => {
            if(response.rowCount >= 1){
                let num = response.rows[0].board_num === null ? 0 : response.rows[0].board_num;
                let viewname =  'game' + String(num)
                query = {
                    text : 'create view "' + viewname + '" as select * from chessboard where board_num = ' + String(num),
                }
                console.log(query)
                client.query(query)

                query = {
                    text : 'insert into chessgame values (default, $1, $2, \'none\', $3, \'none\', 0, 0, $4, $5, $6, $7, $8)',
                    values : [req.body.data.roomName, req.body.data.id, req.body.data.id, req.body.data.id, num, req.body.data.time, req.body.data.time, viewname]
                }
                client.query(query)

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
    const query = {
        text : 'select * from chessgame where roomid=$1',
        values : [req.body.data.roomid]
    };
    client.query(query)
        .then((response) => {
            return res.send(response.rows[0])
        })
})

app.post('/exitRoom', (req, res) => {
    let query = {
        text : '',
        values : []
    }
    if(req.body.data.player_first === 'none' && req.body.data.player_second === 'none'){  // 한 명밖에 없는데 나갈 경우 // board는 나중에 삭제 다중 쿼리문은 오류
        query.text = 'drop view '+ req.body.data.viewname + '';
        query.values = [];
        client.query(query)
    }
    if(req.body.data.player_first === 'none' && req.body.data.player_second !== 'none'){  // first플레이어가 나갈 때
        query.text = 'update chessgame set player_first=$1, player_second=\'none\', black=$2, white=\'none\', turn=$3 where roomid=$3'
        query.values = [req.body.data.player_second, req.body.data.player_second, req.body.data.player_second, req.body.data.roomid]
    }else if(req.body.data.player_first !== 'none' && req.body.data.player_second === 'none'){  // second플레이어가 나갈 때
        query.text = 'update chessgame set player_second=\'none\', white = \'none\' where roomid=$1'
        query.values = [req.body.data.roomid]
    }else if(req.body.data.player_first === 'none' && req.body.data.player_second === 'none'){  // 한 명밖에 없는데 나갈 경우 // board는 나중에 삭제 다중 쿼리문은 오류
        query.text ='delete from chessgame where roomid=$1'
        query.values = [req.body.data.roomid]
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/match', (req, res) => {
    const query = {
        text : 'select * from chessgame where player_second = \'none\''
    }
    client.query(query)
        .then((response) => {
            return res.send(response.rows)
        })
})

app.post('/ban', (req, res) => {
    const query = {
        text : 'update chessgame set player_second = \'none\', white = \'none\' where roomid = $1',
        values : [req.body.data.roomid]
    };
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/ready', (req, res) => {
    let query = {
        text : '',
        values : []
    };
    if(req.body.data.who === 1){
        query.text = 'update chessgame set ready_first = $1 where roomid = $2';
        query.values = [req.body.data.ready, req.body.data.roomid];
    }else if(req.body.data.who === 2){
        query.text = 'update chessgame set ready_second = $1 where roomid = $2';
        query.values = [req.body.data.ready, req.body.data.roomid];
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.post('/colorChange', (req, res) => {
    const query = {
        text : 'update chessgame set black=$1, white=$2 where roomid=$3',
        values : [req.body.data.black, req.body.data.white, req.body.data.roomid]
    };
    client.query(query)
        .then((response) => {
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

app.post('/insertBot', (req, res) => {
    const query = {
        text : "update chessgame set player_second = 'Aibot', white = 'Aibot', ready_second = 1 where roomid = $1",
        values : [req.body.data.roomid]
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

// 해당 숫자가 있는지 없는지 조회
app.post('/testArr', (req, res) => {
    const query = {
        text : 'select * from chessboard where board_num != ANY($1)',
        values : ['{1}']
    }
    client.query(query)
        .then((response) => {
            console.log(response.rows)
            return res.send()
        })
})


app.post('/createview',(req, res) => {
    console.log('check')
    let query = {
        text : 'create view game22 as select * from chessboard where board_num = 23'
    }
    client.query(query)
        .then((response) => {
            return res.send()
        })
})

app.listen(PORT, ()=>console.log(`${PORT} Listenling!`));

// const test = [[1,3],[2,2],[3,1]]
// test.sort((a, b) => a[1] - b[1])
// test.sort()
// console.log(test)

// const test = {
//     'a' : [3,2,1],
//     'b' : 2,
//     'c' : 3
// }
// test['a'].sort()
// console.log(Object.values(test))