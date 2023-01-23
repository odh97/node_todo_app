var router = require('express').Router();

//미들웨어 만들기
function 로그인체크(요청, 응답, next){
    if(요청.user){
        next(); // next : 다음으로 통과 시켜주는 함수
    } else{
        응답.send('로그인안하셨는데요?');
    }
}

router.use('/shirts', 로그인체크);

router.get('/sports', (요청, 응답)=>{
    응답.send('스포츠 게시판');
});

router.get('/game', (요청, 응답)=>{
    응답.send('게임 게시판');
});

module.exports = router;