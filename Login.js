const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();  

const mysql = require('mysql');


//npm해야될거 , init -y, install express, install package.json, i jsonwebtoken, 모듈 업데이트는 npm update
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

const secretkey = '231014';

function verifyToken(req, res, next){
    const token = req.headers.authorization;

    if(!token){
        return res.status(403).json({message : 'no token provided'});
    }

    jwt.verify(token, secretkey, (err,decode) =>{
        if(err){
            return res.status(401).json({message: 'failed to authenticate token'});
        }
        req.decode == decode;
        next();
    })
}

app.post('/LeeHan/login', (req, res) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    
    connection.connect((err) => {
        if(err){
            console.error("MYSQL 연결 오류 : " + err.stack);
            return;
        }
    
        console.log("연결되었슴다. 연결 ID : " + connection.threadId);
    
    });
    const { id, password } = req.body;
    connection.query('SELECT id, password, name FROM leehan_account WHERE id = ?', [id], (err, results, fields) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: '서버 오류' });
        }
        if(results[0] !== undefined){
            console.log(results);   //[]
            console.log(results[0]);//undefined
            const dataArray = results[0];
            console.log(dataArray.password);
        
            if (dataArray.password !== password){
                console.log('비번');
                return res.status(403).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
            else{
                const token = jwt.sign({ dataArray }, secretkey, { expiresIn: '1h' });
                res.status(200).json({ token });
            }
            connection.end((err) => {
                if (err) {
                    console.error('MYSQL 연결 종료 오류: ' + err.stack);
                    return;
                }
                console.log('MySQL 연결이 성공적으로 종료되었습니다.');
            });
        }
        else{
            console.log('아이디');
            console.log(results.length);
            console.log(results);
            console.log(results.id);
            return res.status(401).json({ message: '없는 계정입니다.' });
        }
        
    });
});

app.get('/LeeHan/protected', verifyToken, (req, res) =>{
    res.status(200).json({message: 'This is a protected endpoint', user: req.decode});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT , ()=>{
    console.log(PORT);
    console.log('server is running on port 3000');
});

app.post('/LeeHan/sign_up', (req, res) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    
    connection.connect((err) => {
        if(err){
            console.error("MYSQL 연결 오류 : " + err.stack);
            return;
        }
    
        console.log("연결되었슴다. 연결 ID : " + connection.threadId);
    
    });
    const { id, password } = req.body;
    console.log(id, password);
    connection.query('INSERT INTO leehan_account (id, password) VALUES (?, ?)', [id, password], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: '이미 존재하는 계정입니다.' });
        }
        res.status(200).json({ message: '회원가입에 성공하였습니다.' });
    });

    connection.end((err) => {
        if(err){
            console.error('MYSQL 연결 종료 오류 : ' + err.stack);
            return;
        }
        console.log('MySQL 연결이 성공적으로 종료되었습니다.');
    });
});

//여기서부터 웹소켓
const WebSocket = require('ws');
var CREATE = require('./create.js');    //방이 만들어졌을 때 호출하는 클래스

const wss = new WebSocket.Server({port:8000}, () =>{            //소캣을 포트 8000번에 시작 시킨다.
    console.log('서버 시작');
});

const userList = [];
const maxClients = 5; //최대 접속 인원수
let rooms = {};         //룸 배열
let joinuserTemp = 1;   //유저 구분 인자

wss.on('connection', function connections(ws){                  //커넥션이 됐을 때
    userList = ws.clientID;
    
    var create = new CREATE();

    ws.on('message', (data) =>{
        const jsonData = JSON.parse(data);

        let requestType = jsonData.requestType;      //리퀘스트 타입으로 결정
        let params = jsonData.message;              //파라미터 추가

        console.log('받은 데이터:' , jsonData, requestType, params);

        if(requestType == 10){       //유저 리스트
            ws.send(JSON.stringify(userList));
        }

        if(requestType == 100)       //방생성
        {       
            create.createRoom(params, rooms, ws);
        }
        if(requestType == 200)       //방입장
        {       
            joinRoom(params, ws);
        }
        if(requestType == 300)       //방퇴실
        {       
            leaveRoom(params);
        }

        if(requestType == 0){        //전체 에코
            wss.clients.forEach((client) =>
            {
                client.send(data);//받은 데이터를 모든 클라이언트에게 전송
            });
        }

            
    });

    ws.on('close', ()=>{
        const index = userList.indexOf(ws.clientID);
        if(index !== -1){
            console.log('클라이언트가 해제됨 - ID :' , ws.clientID);
            userList.splice(index, 1);      //배열에서 해당 클라이언트 제거
        }
    })
    //새로 연결된 클라이언트를 유저 리스트에 추가
    userList.push(ws.clientID);
    //클라이언트에게 임시 유저 이름 전송
    ws.send(JSON.stringify({clientID : ws.clientID}));
    //연결된 클라이언트 유저 이름 로그 출력
    console.log('클라이언트 연결 - ID : ', ws.clientID);
});

function generalInformation(ws){
    let obj;

    if(ws['room' != undefined])
    {
        obj = {
            "type" : "info",
            "params" : {
                "room" : ws["room"],
                "no-clients" : rooms[ws["room"]].length,
            }
        }
    }
    else
    {
        obj = {
            "type" : "info",
            "params" : {
                "room" : "no room",
            }
        }
    }

    ws.send(JSON.stringify(obj));
}

function joinRoom(params, ws)
{
    const room = params;
    if(!Object.keys(rooms).includes(room))
    {
        console.warn(room + 'does net exist');  //룸이 없다는 경고 콘솔
        return;
    }

    if(rooms[room].length >= maxClients){           //5명 이상 못들어가게 막는 라인
        console.warn(room + ' is full');    //룸이 없다는 경고 콘솔
        return;
    }

    rooms[room].push(ws);
    ws["room"] = room;

    generalInformation(ws);

    var UserList = "";

    for(let i = 0; i < rooms[room].length; i++)
    {
        UserList += "User : " + rooms[room][i].user + " \n"
    }
    joinuserTemp += 1;

    obj = {
        "type" : "info",
        "myParams" : {
            "room" : ws["room"],
            "UserList " : UserList
        }
    }

    for(var i = 0; i < rooms[room].length; i++)
    {
        rooms[room][i].send(JSON.stringify(obj));
    }
}

function leaveRoom(params)  //룸을 나갈경우
{
    const room = ws.room;

    if(rooms[room].length > 0){
        rooms[room] = rooms[room].filter(so => so !== ws);

        ws["room"] = undefined;

        if(rooms[room].length == 0){        //룸이 0명이 되었을 때
            close(room);
        }
    }

    function close(room){   //룸을 제거한다.
        if(rooms.length > 0)
        rooms = rooms.filter(key => key !== room);
    }
}


wss.on('listening', () =>{
    console.log('리스닝....');
});