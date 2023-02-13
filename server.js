const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
require('dotenv').config()

app.use('/public', express.static('public'));


//세션
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

//미들웨어 전체 적용
app.use(loginCheck);

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
app.get('/', function(req, res){
    console.log("Home login Data check");
    console.log(req.loginName);
    console.log("=================  Home 종료  =================");
    
    db.collection('login').find().toArray(function(에러, 결과){
        console.log("=======login data=======");
        console.log(결과);
        // res.sendFile(__dirname + '/index.html');
        res.render('index.ejs', { loginName : req.loginName, posts : 결과 });
    });
});

app.get('/write', function(request, response){
    // response.sendFile(__dirname + '/write.html');
    response.render('write.ejs', { loginName : request.loginName });
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
        response.render('list.ejs', { loginName : request.loginName, posts : 결과 });
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
        응답.render('searchList',{loginName : 요청.loginName, result : 결과});
    })
});





app.get('/detail/:id', function(요청, 응답){

    // DB에 저장된 데이터 꺼내기
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if (결과 === null) return 응답.send("404 페이지 입니다.");
        console.log(결과);
        응답.render('detail.ejs', {loginName : 요청.loginName, data : 결과 });
    });
});

app.get('/edit/:id',function(요청, 응답){

    // DB에 저장된 데이터 꺼내기
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if (결과 === null) return 응답.send("404 페이지 입니다.");
        console.log(결과);
        응답.render('edit.ejs', {loginName : 요청.loginName, data : 결과 });
    });
});




app.put('/edit', function (요청, 응답) {
    console.log(요청);

    //DB에 데이터 수정하기
    db.collection('post').updateOne({_id : parseInt(요청.body.id)}, {$set : {제목 : 요청.body.title, 날짜 : 요청.body.date }}, function(에러,결과){})
    console.log('수정 완료');
    응답.redirect('/list');
});


app.get('/login', function(요청, 응답){
    console.log("===============login GET 시작===============");

    응답.render('login.ejs',{loginName : 요청.loginName});
});

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
    }), function(요청, 응답){
        console.log("===============login POST 시작===============");
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
    console.log(요청);
    console.log(요청.user);
    응답.render('mypage.ejs', {loginName : 요청.loginName, 사용자 : 요청.user});
});

//미들웨어 만들기
function 로그인체크(요청, 응답, next){
    if(요청.user){
        console.log(요청.user);
        next(); // next : 다음으로 통과 시켜주는 함수
    } else{
        console.log(요청.user);
        응답.send('로그인안하셨는데요?');
    }
}

//로그인 체크
function loginCheck(req, res, next){
    

    console.log("=================  미들웨어 시작  =================");
    console.log("로그인 데이터 확인");
    console.log(req.user);

    if(req.user){
        console.log("유저이름");
        console.log(req.user.id);

        req.loginName = req.user;

        console.log("미들웨어 데이터");
        console.log("loginName : "+ req.loginName.id);
        
        console.log("=================  미들웨어 종료  =================");

        next();
    }else{
        console.log("데이터 없을 경우");

        req.loginName = null;

        console.log("미들웨어 데이터");
        console.log("loginName : "+ req.loginName);

        console.log("=================  미들웨어 종료  =================");

        next();
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
            response.redirect('/');
        });
    });
    
});



app.delete('/delete', function(요청, 응답){
    // console.log(요청);
    console.log("삭제요청들어옴");
    console.log(요청.user);
    console.log(요청.body);
    요청.body._id = parseInt(요청.body._id);

    let 삭제할데이터 = {_id : 요청.body._id, 작성자 : 요청.user.id}

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
const { checkPrimeSync } = require('crypto');

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
    응답.render('upload.ejs', {loginName : 요청.loginName});
});

// app.post('/upload', upload.single('input의 name속성이름'), (요청, 응답)=>{
// app.post('/upload', upload.array('input의 name속성이름', 최대 갯수), (요청, 응답)=>{
app.post('/upload', upload.array('profile', 5), function(요청, 응답){
    응답.send('업로드완료');
});

app.get('/image/:imageName', (요청, 응답)=>{
    응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName);
});












app.get('/chatList', (요청, 응답)=>{
    // DB에 저장된 데이터 꺼내기
    db.collection('chatRoom').find({ member : 요청.user.id }).toArray(function(에러, 결과){
        console.log("DB chatRoom 데이터 조회");
        console.log(결과);

        응답.render('chatList.ejs', {loginName : 요청.loginName, chatRoom : 결과})
    });
});

app.get('/chat/:id', (요청, 응답)=>{
    console.log("===============chat GET 시작===============");
    console.log("요청.params");
    console.log(요청.params);
    console.log("요청.query");
    console.log(요청.query);
    console.log(요청.query.userName);
    console.log("요청.user");
    console.log(요청.user);
    console.log("요청body 종료");

    let chatRoomData = null;

    // DB에 저장된 데이터 꺼내기 (채팅룸 조회만 하기)
    db.collection('chatRoom').find({ member : 요청.user.id }).toArray(function(에러, 결과1){
        console.log("DB chatRoom 데이터 조회");
        console.log(결과1);

        // DB chatRoom 데이터 체크
        for(i=0; 결과1.length > i; i++){
            for(k=0; 결과1[i].member.length > k; k++){

                if(결과1[i].member[k] !== 요청.user.id && 결과1[i].member[k] === 요청.query.userName){
                    chatRoomData = 결과1[i].member;
                    console.log("데이터 확인 완료 : " + chatRoomData);
                }

            }
        }
        
        // DB chatRoom 조회 및 생성
        if(결과1.length > 0 && chatRoomData !== null){
            console.log("기존 데이터 확인 완료");

        }else{
            console.log("새로운 채팅룸 생성");

            let day = new Date();
            let toDay = day.toLocaleDateString();

            // DB 저장하기 (채팅룸 없으면 생성)
            db.collection('chatRoom').insertOne( { member : [요청.user.id, 요청.query.userName] , title : null, toDay : toDay }, function(에러, 생성결과){
                if(에러){return console.log(에러)}

                console.log('DB new chatRoom');
                chatRoomData = { member : [요청.user.id, 요청.query.userName] , title : null, toDay : toDay };
            });
        }
        console.log("!!!!!!DB chatRoom 조회 및 생성 종료!!!!");
        console.log(chatRoomData);

        // DB에 저장된 데이터 꺼내기
        db.collection('chat').find({ $or: [ { member : 요청.query.userName }, { member : 요청.user.id } ] }).toArray(function(에러, 결과2){
            console.log("chat list 조회");
            console.log(결과2);
            응답.render('chat.ejs', { chatList : 결과2, paramsData : 요청.params.id , user : 요청.query.userName, loginName : 요청.loginName });
        });
    });

});

app.post('/chatEnter', (요청, 응답)=>{
    console.log("======== chatEnter 시작 ===========");
    console.log("body 부분");
    console.log("======== 요청.user ========");
    console.log(요청.user);
    console.log("======== 요청.body ========");
    console.log(요청.body);
    console.log("body 부분 종료");

    // DB저장하기
    db.collection('chat').insertOne( { member : [요청.user.id, 요청.body.user], name : 요청.user.id, comment : 요청.body.chat}, function(에러, 결과){
        console.log('채팅 입력 완료');
        console.log(결과);
        응답.redirect('/chat/'+요청.body.paramsData);
    });
});





