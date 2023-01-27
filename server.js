const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
require('dotenv').config()

app.use('/public', express.static('public'));

var db;

MongoClient.connect(process.env.DB_URL, function(error, client){
    //연결되면 할일
    if (error) return console.log(error);

    //DB 사용방법
    db = client.db('todoapp');

    app.listen(process.env.PORT, function() {
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

app.get('/list', function(request, response){
    // DB에 저장된 데이터 꺼내기
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        response.render('list.ejs', { posts : 결과 });
    });

});

app.get('/search', (요청, 응답)=>{
    var 검색조건 = [
        {
            $search: {
            index: 'titleSearch',
            text: {
                query: 요청.query.value,
                path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                }
            }
        },
        //{$sort : {_id : 1}},  // $sort  : 전체를 검색후 원하는 값으로 정렬이 가능하다.
        //{$limit : 10},        // $limit : 가져올 데이터의 갯수를 정해준다.
        {$project : {제목 : 1, _id: 0, score:{$meta:"searchScore"}}} // $project : 검색결과에서 필터를줄 수 있다. $meat : 몽고DB에서 제공하는 스코어 시스템
    ] 
    console.log(요청.query.value);
    db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
        console.log(결과);
        응답.render('searchList',{result : 결과});
    })
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

app.post('/register', function(요청, 응답){
    // DB저장하기
    db.collection('login').insertOne( { id : 요청.body.id, pw : 요청.body.pw}, function(에러, 결과){
        console.log('회원가입 성공');
        응답.redirect('/');
    });
});


//만든 미들웨어 사용 해보기
app.get('/mypage', 로그인체크, function(요청, 응답){
    console.log(요청.user);
    응답.render('mypage.ejs', {사용자 : 요청.user});
});

//미들웨어 만들기
function 로그인체크(요청, 응답, next){
    if(요청.user){
        next(); // next : 다음으로 통과 시켜주는 함수
    } else{
        응답.send('로그인안하셨는데요?');
    }
}

//회원가입 기능
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
    db.collection('login').findOne({id : 아이디}, function(에러, 결과){
        done(null, 결과)
    })
}); 



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

        let 저장할것 = { _id : totalPostNm + 1, 작성자 : request.user.id, 제목 : request.body.title, 날짜 : today}

        // DB저장하기
        db.collection('post').insertOne( 저장할것, function(에러, 결과){
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



app.delete('/delete', function(요청, 응답){
    // console.log(요청);
    console.log("삭제요청들어옴");
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id);

    let 삭제할데이터 = {_id : 요청.body._id, 작성자 : 요청.user._id}

    // DELETE
    // db.collection('post').deleteOne({삭제할 데이터}, function(){});
    db.collection('post').deleteOne(삭제할데이터, function(에러, 결과){
        console.log('DB post 데이터 삭제 완료');
        if(에러) {console.log(에러)}
        if(결과) {console.log(결과)}
        응답.status(200).send({ message : '성공했습니다.' });
    });
});

app.use('/shop', require('./routus/shop.js'));
app.use('/board/sub', require('./routus/board.js'));


let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image');
  },
  filename : function(req, file, cb){
    let toDay = new Date();
    cb(null, file.originalname + "날짜 " + toDay.toLocaleDateString());
  }

});

var path = require('path');

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('PNG, JPG만 업로드하세요'))
        }
        callback(null, true)
    },
    limits:{
        fileSize: 1024 * 1024
    }
});

app.get('/upload', (요청, 응답)=>{
    응답.render('upload.ejs');
});

// app.post('/upload', upload.single('input의 name속성이름'), (요청, 응답)=>{
// app.post('/upload', upload.array('input의 name속성이름', 최대 갯수), (요청, 응답)=>{
app.post('/upload', upload.array('profile', 10), function(요청, 응답){
    응답.send('업로드완료');
});

app.get('/image/:imageName', (요청, 응답)=>{
    응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName);
});


app.get('/chat', (요청, 응답)=>{
    // DB에 저장된 데이터 꺼내기
    db.collection('chat').find().toArray(function(에러, 결과){
        console.log(결과);
        응답.render('chat.ejs', { chatList : 결과 });
    });
});



