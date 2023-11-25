var LOOPS = require('./loop.js');

var CREATE = function()
{
    console.log("CREAT Read INFO");//방이 만들어진 Log
};

CREATE.prototype.LogMsg = function()
{
    console.log("CREATE Connect");  //방안에서의 Log 메세지
};

CREATE.prototype.generalInformation = function(ws, rooms){

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

CREATE.prototype.createRoom = function(params, rooms, ws)
{
    const room = this.genkey(5);        //랜덤으로 방 이름을 지정해주는 함수
    console.log('room id : ' + room);
    rooms[room] = [ws];
    ws["room"] = room;

    this.generalInformation(ws, rooms);

    var loop = new LOOPS(); //방이 만들어진 것을 확인후에 시간 설정
    loop.StartLoops(params, rooms, ws, room);       //해당 루프를 실행
    
}

CREATE.prototype.genkey = function(length){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for(let i = 0; i < length; i++)
    {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = CREATE;