var commentObj = require('../model/commentObj');
var db = require("../model/db");
var querystring = require("querystring");
var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');

var CommentLogic = {
    save:function(req,callback){

        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("comment",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                var str = querystring.stringify(commentObj);
                var newComment = querystring.parse(str);

                newComment.id = req.body._id;
                newComment.title = req.body.title;
                newComment.post_id = req.body.post_id;
                newComment.post_name = req.body.post_name;
                newComment.reviewer_id = req.session.user.id;
                newComment.reviewer_name = req.session.user.name;
                newComment.content = req.body.content;
                newComment.date = moment().format("YYYY-MM-DD HH:mm:ss");

                collection.insert(newComment,function(err,user){
                    //console.log(user.ops[0]);
                    db.close();
                    callback(err,user.ops[0]);
                });
            });
        });
    },
    //通过_id来删除评论
    removeCommentById:function(_id,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("comment",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                collection.findOneAndDelete({_id:new ObjectID(_id)},{single:true},function(err,result){
                    db.close();
                    console.log(result.lastErrorObject.n);
                    callback(null,result.lastErrorObject.n)
                });
            });
        });
    },
    getCommentsByLimits:function(req,callback){
        var selector = {};
        var limits = {};
        var pageObj = {};

        CommentLogic.setAllLimits(req,selector,limits,pageObj);

        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("comment",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                collection.find(selector).toArray(function(err,allarticles){
                    if(err) return callback(err);
                    pageObj.totalRow = allarticles.length;     //计算得到教学成果总条数
                    if(parseInt(pageObj.totalRow%pageObj.limit)==0)   pageObj.totalPage = parseInt(pageObj.totalRow/pageObj.limit);
                    else pageObj.totalPage = parseInt(pageObj.totalRow/pageObj.limit)+1;

                    collection.find(selector,limits).toArray(function(err,articles){
                        db.close();
                        //console.log(err);
                        //console.log(users.length);
                        CommentLogic.setPagination(pageObj.currPage,pageObj.totalPage,pageObj);
                        pageObj.data = articles;
                        //pageObj.curLen = articles.length;
                        callback(err,pageObj);
                    });
                });
            });
        });
    },
    //针对所有评论设置过滤器
    setAllLimits:function(req,selector,limits,pageObj){

        if ((typeof  req.query.content) != 'undefined' && req.query.content.trim() != '') {
            var text = req.query.content;
            pageObj.content = text;
            selector.$or = [
                {"id": {$regex: text, $options: 'i'}},
                {"post_id": {$regex: text, $options: 'i'}},
                {"reviewer_id": {$regex: text, $options: 'i'}},
                {"title": {$regex: text, $options: 'i'}},
                {"content": {$regex: text, $options: 'i'}},
                {"reply": {$regex: text, $options: 'i'}},
                {"date": {$regex: text, $options: 'i'}}
            ];
        }

        if ((typeof req.query.limit) == 'undefined' || req.query.limit.trim() == '')     req.query.limit = 10;
        if ((typeof req.query.page) == 'undefined' || req.query.page.trim() == '')     req.query.page = 1;
        limits.limit = parseInt(req.query.limit);
        limits.skip = (parseInt(req.query.page) - 1) * limits.limit;
        pageObj.limit = limits.limit;
        pageObj.currPage = parseInt(req.query.page);

        limits.sort = {date:-1}
    },
    //设置分页参数
    setPagination:function(currPage,totalPage,pageObj){
        var x = currPage%5;
        var start = currPage-x+1;
        var end = currPage-x+5;
        if(x==0){
            start = start-5;
            end = start+4;
        }

        pageObj.startPage = start;
        if( pageObj.startPage==1){
            pageObj.hasPrevious = false;
            pageObj.hasFirst = false;
        }else{
            pageObj.hasPrevious = true;
            pageObj.hasFirst = true;
        }
        if(end<totalPage){
            pageObj.hasNext = true;
            pageObj.hasEnd = true;
        }else{
            pageObj.hasNext = false;
            pageObj.hasEnd = false;
        }

        if(end>totalPage){
            pageObj.endPage = totalPage;
        }else{
            pageObj.endPage = end;
        }
    },
    //根据_id来回复
    replyById:function(_id,reply,callback){
        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("comment", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }

                collection.findAndModify({_id: new ObjectID(_id)}, {}, {
                    $set: {
                        reply: reply,
                        reply_date : moment().format("YYYY-MM-DD HH:mm:ss")
                    }
                }, {new: true}, function (err, reslut) {
                    if (err) callback(err);
                    callback(null, reslut.value)
                });
            });
        });
    }
};

module.exports = CommentLogic;