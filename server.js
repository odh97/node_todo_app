const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://zxdheogus1:qwer1234@cluster0.awi9wey.mongodb.net/?retryWrites=true&w=majority',
function(error, client){
    //연결되면 할일
    if (error) return console.log(error);

    //DB 사용방법
    db = client.db('todoapp');
    db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(에러, 결과){
        console.log('저장완료');
    });

    app.listen(8080, function() {
        console.log('listening on 8080');
      });
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

// REST API 참고
/*

1) 단어들을 동사보다는 명사 위주로 구성함
2) 응용해서 다른 정보들을 쉽게 가져올 수 있을 정도로 일관성 있음 
3) 대충 봐도 어떤 정보가 들어올지 예측이 가능함

네이밍 tip
1) 띄어쓰기는 언더바_대신 대시-기호-사용
2) 파일 확장자 쓰지 말기 (.html 이런거)
3) 하위 문서들을 뜻할 땐 / 기호를 사용함 (하위폴더같은 느낌)

*/


//post 요청
app.post('/add', function(request, response){
    response.send('전송완료');
    console.log(request.body.title);
    console.log(request.body.date);

    let day = new Date();
    let today = day.toLocaleDateString();

    //DB저장하기
    db.collection('post').insertOne( {제목 : request.body.title, 날짜 : today}, function(에러, 결과){
        console.log('todoapp DB 저장완료');
    });

});

app.get('/list', function(request, response){
    response.render('list.ejs');
});