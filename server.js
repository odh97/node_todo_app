const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

var db;

MongoClient.connect('mongodb+srv://zxdheogus1:qwer1234@cluster0.awi9wey.mongodb.net/?retryWrites=true&w=majority',
function(error, client){
    //연결되면 할일
    if (error) return console.log(error);

    //DB 사용방법
    db = client.db('todoapp');

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
    // response.sendFile(__dirname + '/index.html');
    response.render('index.ejs');
});

app.get('/write', function(request, response){
    // response.sendFile(__dirname + '/write.html');
    response.render('write.ejs');
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

    
    // auto increment(자동으로 ID번호를 만들어주기)
    db.collection('counter').findOne({name : '게시물 갯수'}, function(에러, 결과){
        let totalPostNm = 결과.totalPost;

        // DB저장하기
        db.collection('post').insertOne( { _id : totalPostNm + 1, 제목 : request.body.title, 날짜 : today}, function(에러, 결과){
            console.log('todoapp DB 저장완료');

            // 여러개 수정할때
            // db.collection('counter').updateMany()
            // 하나 수정할때
            // db.collection('counter').updateOne({변경할 데이터 정의},{수정값},function(에러, 결과){})
            // { $set : {바꿀값} }
            // { $inc : {기존값에 더해줄 값} }
            db.collection('counter').updateOne({name : '게시물 갯수'},{ $inc : {totalPost:1} },function(){})
        });

    });
});

app.get('/list', function(request, response){
    // DB에 저장된 데이터 꺼내기
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        response.render('list.ejs', { posts : 결과 });
    });

});

app.delete('/delete', function(요청, 응답){
    // console.log(요청);
    console.log(요청.body);

    요청.body._id = parseInt(요청.body._id);

    // DELETE
    // db.collection('post').deleteOne({삭제할 데이터}, function(){});
    db.collection('post').deleteOne(요청.body, function(에러, 결과){
        console.log('DB post 데이터 삭제 완료');
        응답.status(200).send({ message : '성공했습니다.' });
    });
});


app.get('/detail/:id', function(요청, 응답){

    // DB에 저장된 데이터 꺼내기
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if (결과 === null) return 응답.send("404 페이지 입니다.");
        console.log(결과);
        응답.render('detail.ejs', { data : 결과 });
    });
});

app.get('/edit/:id',function(요청, 응답){

    // DB에 저장된 데이터 꺼내기
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if (결과 === null) return 응답.send("404 페이지 입니다.");
        console.log(결과);
        응답.render('edit.ejs', { data : 결과 });
    });
});




app.put('/edit', function (요청, 응답) {
    console.log(요청);

    //DB에 데이터 수정하기
    db.collection('post').updateOne({_id : parseInt(요청.body.id)}, {$set : {제목 : 요청.body.title, 날짜 : 요청.body.date }}, function(에러,결과){})
    console.log('수정 완료');
    응답.redirect('/list');
});


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(요청, 응답){
    응답.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
    }), function(요청, 응답){
        응답.redirect('/');
});


passport.use(new LocalStrategy({
    usernameField: 'id',        //form에 name의 id value 값을 가져온다
    passwordField: 'pw',        //form에 name의 pw value 값을 가져온다
    session: true,              //seesion에 저장한다
    passReqToCallback: false,   //seesion에 저장한다
  }, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
}));

// id를 이용해서 세션을 저장시키는 코드(로그인 성공시 실행)
passport.serializeUser(function (user, done) {
    done(null, user.id)
  });

// 나중에 사용(마이페이지 접속시 실행)
passport.deserializeUser(function (아이디, done) {
    done(null, {})
}); 



