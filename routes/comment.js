var express = require('express');
var UserLogic = require("../server/logic/UserLogic");
var ArticleLogic = require('../server/logic/ArticleLogic');
var CommentLogic = require('../server/logic/CommentLogic');
var router = express.Router();
var common = require("./common");

//教师发布教学成果
router.post('/postComment', function (req, res) {
    var flag = common.verifyUser(req);
    if (!flag)   return res.redirect("/login");
    CommentLogic.save(req, function (err, comment) {
        if (err)     return res.redirect('/error');
        res.json('success','success');
    });
});

router.post('/removeComment', function (req, res) {
    var flag = common.verifyUser(req);
    if (!flag)   return res.redirect("/login");
    CommentLogic.removeCommentById(req.body._id, function (err, n) {
        if (err)     return res.redirect('/error');
        res.json('success','success');
    });
});

router.get('/getComments', function (req, res) {
    if (!common.verifyAdmin(req))    return res.redirect('/login');
    req.body = null;
    var rs = {};
    CommentLogic.getCommentsByLimits(req, function (err, pageObj) {
        if (err)  res.redirect("/error");
        else {
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            //console.log(rs);
            res.render('admin/getComments',rs);;
        }
    });
});

//根据_id设置评论回复  只能回复一条
router.post("/reply", function (req, res) {
    if (!common.verifyUser(req))    return res.redirect('/login');
    CommentLogic.replyById(req.body.id, req.body.reply, function (err, comment) {
        if (err)  return res.redirect("/error");
        res.json("success","success");
    });
});


module.exports = router;
