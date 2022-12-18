const express = require('express');
const app = express();

app.listen(8080, function(){
    console.log("listening on 8080");
});

//누군가가 /pet 으로 방문하면..
//pet 관련된 안내문을 띄워주자

app.get('/pet', function(request, response){
    response.send("펫용품 쇼핑할 수 있는 페이지입니다.");
});


app.get('/beauty', function(request, response){
    response.send("뷰티용품 쇼핑할 수 있는 페이지입니다..");
});


//__dirname은 현재 파일의 경로를 뜻합니다.
app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
});

app.get('/write', function(request, response){
    response.sendFile(__dirname + '/write.html');
});
