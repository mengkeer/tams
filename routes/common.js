var express = require('express');
var ArticleLogic = require("../server/logic/ArticleLogic");
var router = express.Router();

router.get('/', function(req, res, next) {
    if(req.session.user){
        res.redirect('/index');
    }else{
        res.render('indexFace');
    }
});

router.get('/index', function(req, res, next) {
    req.body = null;
    var rs = {};
    ArticleLogic.getTaArticleByLimits(req,function(err,pageObj){
        if(err)  res.redirect("/error");
        else{
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            // console.log(rs);
            ArticleLogic.setBadge(null,req.query.content, true,function (err,badge) {
                if(err)  return res.redirect("/error");
                rs.badge = badge;
                //console.log(rs);
                res.render('index',rs);
            });

        }
    });
});


router.get('/indexTeaArt', function(req, res, next) {
    req.body = null;
    var rs = {};
    req.query.id_type = 'teacher';
    ArticleLogic.getArticlesByLimits(req,function(err,pageObj){
        if(err)  res.redirect("/error");
        else{
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            res.render('indexTeaArt',rs);
        }
    });
});

router.get('/indexStuArt', function(req, res, next) {
    req.body = null;
    var rs = {};
    req.query.id_type = 'student';
    ArticleLogic.getArticlesByLimits(req,function(err,pageObj){
        if(err)  res.redirect("/error");
        else{
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            res.render('indexStuArt',rs);
        }
    });
});

router.get("/error",function(req,res){
    return res.render("error");
});

router.use("/*",function(req,res){
    res.render("error");
});

//验证用户是否登录
router.verifyUser = function(req){
    var user = req.session.user;
    if(user==null||user.type==null||user.type==''){
        return false;
    }
    return true;
};

//验证当前账号是否是老师及以上等级
router.verifyTeacher = function(req){
    var user = req.session.user;
    if(user==null||user.type==null||user.type==''){
        return false;
    }
    if(user.type=='teacher'||user.type=='admin'||user.type=='superadmin'){
        return true;
    }else{
        return false;
    }
};

//验证当前账号是管理员及以上等级
router.verifyAdmin = function(req){
    var user = req.session.user;
    if(user==null||user.type==null||user.type==''){
        return false;
    }
    if(user.type=='admin'||user.type=='superadmin'){
        return true;
    }else{
        return false;
    }
};

//验证当前账号是否是超级管理员
router.verifySuperAdmin = function(req){
    var user = req.session.user;
    if(user==null||user.type==null||user.type==''){
        return false;
    }
    if(user.type=='superadmin'){
        return true;
    }else{
        return false;
    }
};

module.exports = router;
