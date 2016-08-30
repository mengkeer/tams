var express = require('express');
var UserLogic = require("../server/logic/UserLogic");
var ArticleLogic = require('../server/logic/ArticleLogic');
var UploadLogic = require('../server/logic/UploadLogic');
var router = express.Router();
var common = require("./common");
var moment = require('moment');

//教师发布教学成果
router.get('/teacherAch', function (req, res) {
    if (!common.verifyTeacher(req))    return res.send('权限不足');
    res.render('teacher/teacherAch', {user: req.session.user});
});
//教师发布文章
router.get('/teacherArt', function (req, res) {
    if (!common.verifyTeacher(req))    return res.send('权限不足');
    console.log(req.session.user);
    res.render('teacherArt', {user: req.session.user});
});
//学生发布文章
router.get('/studentArt', function (req, res) {
    if (!common.verifyUser(req))    return res.send('权限不足');
    res.render('teacherArt', {user: req.session.user});
});

router.post('/publish', function (req, res) {
    if (!common.verifyUser(req))    return res.send('权限不足');
    ArticleLogic.save(req, function (err, article) {
        if (err)        return res.redirect('/error');
        res.json('rs','success');
    });
});

router.get("/review", function (req, res) {
    res.render("审核文章API测试");
});

//管理员审核文章  需传递两个参数 _id 与 flag（审核状态）
router.post("/review", function (req, res) {
    if (!common.verifyAdmin(req)) return res.send("权限不足");
    ArticleLogic.review(req.body._id, req.body.flag, function (err, article) {
        if (err)         return res.redirect('/error');
        if (article == null)   return res.send('该文章不存在');
        res.send("文章已被审核成" + (article.status == true ? '通过' : '不通过'));
    });
});

//根据分页获取教师成果列表  初始获取10条数据  Ta = 教师成果
router.get('/getTaArticles', function (req, res) {
    req.body = null;
    var rs = {};
    ArticleLogic.getTaArticleByLimits(req, function (err, pageObj) {
        if (err)  res.redirect("/error");
        else {
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            ArticleLogic.setBadge(null,req.query.content,true,function (err,badge) {
                if(err)  return res.redirect("/error");
                rs.badge = badge;
                //console.log(rs);
                res.render('index',rs);
            });
        }
    });
});

router.get('/getAllArticles', function (req, res) {
    req.body = null;
    var rs = {};
    ArticleLogic.getAllByLimits(req, function (err, pageObj) {
        if (err)  res.redirect("/error");
        else {
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            //console.log(rs.pageObj);
            res.render("admin/getAllArticles", rs);
        }
    });
});

router.post("/uploadImg", function (req, res) {
    UploadLogic.uploadImage(req, res, function (err, filePath) {
        if (err) {
            //文件类型有误或文件大小超出
            console.log(err);
            res.json("error");
        } else {
            //上传并解析成功
            console.log(filePath);
            res.json(filePath);
        }
    });
});

router.post("/removeArticle", function (req, res) {
    var flag = common.verifyUser(req);
    if (!flag)   return res.redirect("/login");
    ArticleLogic.removeArticleById(req.body._id, function (err, n) {
        if (err)     return res.redirect('/error');
        res.json({"rs":"success"});
    })
});

//通过id获取文章详情  eg  /articleDetail?id=xxx;
router.get('/articleDetail', function (req, res) {
    var rs = {};
    rs.user = req.session.user;
    ArticleLogic.getArticleByArticleId(req.query.id, function (err, results) {
        if (err)  return res.redirect('/error');
        rs.article = results.Article;
        rs.comments = results.Comments;
        rs.poster = results.poster;
        if((typeof req.session.visited)=='undefined')    req.session.visited = {};
        if(req.session.visited[req.query.id]){
            res.render("articleDetail", rs);
        }else{
            req.session.visited[req.query.id] = moment().format("YYYY-MM-DD HH:mm:ss");;
            ArticleLogic.addRead(req.query.id,function(err,result){
                res.render("articleDetail", rs);
            });
        }


    });

});

router.post('/editArticle',function(req,res){
    if(!common.verifyAdmin(req))    res.send('权限不足');

    ArticleLogic.getArticleByArticleId(req.body._id, function (err, results) {
        if (err)  return res.redirect('/error');
        var article = results.Article;
        //console.log(article);
        if((typeof article)=='undefined'||article==null)    res.json({"rs":"该文章不存在"});
        if(article.id_type=='superadmin'){
            res.json({"rs":"对方的权限比你大，不能编辑"});
        }else if(req.session.user.type=='admin'&&article.id_type=='admin'&&req.session.user.id!=article.id) {
            return res.json({"rs":"权限一样，无法编辑"});
        }else{
            ArticleLogic.editArticleById(req,function(err,article){
                if(err)     return res.redirect('/error');
                res.json({"rs":"success"});
            })
        }
    });

});


module.exports = router;
