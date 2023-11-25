var LOOPS = function()
{
    let loop;
    let fps = 1;
    let gameloopTimeCount = 0;

    this.LogMst = function()
    {
        console.log("GAMELOOPS");
    };

    //게임 루프가 시작 되었을 때
    this.StartLoops = function(params, rooms, ws, room)
    {
        loop = setInterval(() =>{
            gameloopTimeCount += 1;
            console.log("Looping : " + gameloopTimeCount);

            obj = {
                "type " : "info",
                "myParams " : {
                    "room" : ws["room"],
                    "loopTimeCount " : gameloopTimeCount
                }
            }   //JSON 포맷 형식

            for(var i = 0; i < rooms[room].length; i++)
            {//룸 안에 있는 모든 사람들에게 전달
                rooms[room][i].send(JSON.stringify(obj));
            }

        }, 1000/fps);   //1초당 메세지를 전달한다.
    }

};

module.exports = LOOPS;