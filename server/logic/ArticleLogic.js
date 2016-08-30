var db = require("../model/db");
var Article = require("../model/ArticleObj");
var querystring = require("querystring");
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');


var ArticleLogic = {
    //保存一篇文章
    save: function (req, callback) {
        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                var str = querystring.stringify(Article);
                var newArticle = querystring.parse(str);
                newArticle.id = req.session.user.id;
                newArticle.id_type = req.session.user.type;
                newArticle.name = req.session.user.name;
                newArticle.title = req.body.title;
                if ((typeof req.body.image) == 'undefined') req.body.image = '';
                newArticle.image = req.body.image;
                if ((typeof req.body.type) == 'undefined') req.body.type = 'article';
                newArticle.type = req.body.type;
                newArticle.content = req.body.content;
                newArticle.date = moment().format("YYYY-MM-DD HH:mm:ss");
                newArticle.status = false;
                newArticle.read = 0;
                collection.insert(newArticle, function (err, result) {
                    db.close();
                    callback(err, result.ops[0]);
                });
            });
        });
    },
    //管理员通过_id和flag来审核一篇文章
    review: function (_id, flag, callback) {
        var flag = flag == 'true' ? true : false;
        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }

                collection.findAndModify({_id: new ObjectID(_id)}, {}, {
                    $set: {
                        status: flag
                    }
                }, {new: true}, function (err, reslut) {
                    if (err) callback(err);
                    callback(null, reslut.value)
                });
            });
        });
    },
    //根据分页获取教学成果列表  初始获取10条数据  最多传递4个变量 page（想跳转的页）
    // limit（每页多少条数据）  type 文章类型过滤  content 搜索内容过滤
    getTaArticleByLimits: function (req, callback) {
        var selector = {};
        var limits = {};
        var pageObj = {};

        ArticleLogic.setTaLimits(req, selector, limits, pageObj);

        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.find(selector).toArray(function (err, allarticles) {
                    if (err) return callback(err);
                    pageObj.totalRow = allarticles.length;     //计算得到教学成果总条数
                    if (parseInt(pageObj.totalRow % pageObj.limit) == 0)   pageObj.totalPage = parseInt(pageObj.totalRow / pageObj.limit);
                    else pageObj.totalPage = parseInt(pageObj.totalRow / pageObj.limit) + 1;

                    collection.find(selector, limits).toArray(function (err, articles) {
                        db.close();
                        //console.log(err);
                        //console.log(users.length);
                        ArticleLogic.setPagination(pageObj.currPage, pageObj.totalPage, pageObj);
                        pageObj.data = articles;
                        //pageObj.curLen = articles.length;
                        callback(err, pageObj);
                    });
                });
            });
        });
    },
    setTaLimits: function (req, selector, limits, pageObj) {
        var type = req.query.type;
        if ((typeof type) == 'undefined' || type.trim() == '') {
            type = 'all';
        }
        pageObj.type = type;
        selector.type = type;
        selector.status = true;
        if (type == 'all')     selector.type = {$in: ['thesis', 'lecture', 'award', 'others']}
        if ((typeof  req.query.content) != 'undefined' && req.query.content.trim() != '') {
            var text = req.query.content;
            pageObj.content = text;
            selector.$or = [
                {"id": {$regex: text, $options: 'i'}},
                {"name": {$regex: text, $options: 'i'}},
                {"id_type": {$regex: text, $options: 'i'}},
                {"title": {$regex: text, $options: 'i'}},
                {"type": {$regex: text, $options: 'i'}},
                {"content": {$regex: text, $options: 'i'}},
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
    setPagination: function (currPage, totalPage, pageObj) {
        var x = currPage % 5;
        var start = currPage - x + 1;
        var end = currPage - x + 5;
        if (x == 0) {
            start = start - 5;
            end = start + 4;
        }

        pageObj.startPage = start;
        if (pageObj.startPage == 1) {
            pageObj.hasPrevious = false;
            pageObj.hasFirst = false;
        } else {
            pageObj.hasPrevious = true;
            pageObj.hasFirst = true;
        }
        if (end < totalPage) {
            pageObj.hasNext = true;
            pageObj.hasEnd = true;
        } else {
            pageObj.hasNext = false;
            pageObj.hasEnd = false;
        }

        if (end > totalPage) {
            pageObj.endPage = totalPage;
        } else {
            pageObj.endPage = end;
        }


    },
    //教师与学生文章分页
    getArticlesByLimits: function (req, callback) {
        var selector = {};
        var limits = {};
        var pageObj = {};

        ArticleLogic.setArticlesLimits(req, selector, limits, pageObj);

        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.find(selector).toArray(function (err, allarticles) {
                    if (err) return callback(err);
                    pageObj.totalRow = allarticles.length;     //计算得到教学成果总条数
                    if (parseInt(pageObj.totalRow % pageObj.limit) == 0)   pageObj.totalPage = parseInt(pageObj.totalRow / pageObj.limit);
                    else pageObj.totalPage = parseInt(pageObj.totalRow / pageObj.limit) + 1;

                    collection.find(selector, limits).toArray(function (err, articles) {
                        db.close();
                        //console.log(err);
                        //console.log(users.length);
                        ArticleLogic.setPagination(pageObj.currPage, pageObj.totalPage, pageObj);
                        pageObj.data = articles;
                        //pageObj.curLen = articles.length;
                        callback(err, pageObj);
                    });
                });
            });
        });
    },
    setArticlesLimits: function (req, selector, limits, pageObj) {

        selector.id_type = req.query.id_type;
        if (selector.id_type == 'teacher') {
            selector.id_type = {$in: ['admin', 'teacher']}
        }
        pageObj.id_type = req.query.id_type;
        selector.type = 'article';
        selector.status = true;
        if ((typeof  req.query.content) != 'undefined' && req.query.content.trim() != '') {
            var text = req.query.content;
            pageObj.content = text;
            selector.$or = [
                {"id": {$regex: text, $options: 'i'}},
                {"name": {$regex: text, $options: 'i'}},
                {"id_type": {$regex: text, $options: 'i'}},
                {"title": {$regex: text, $options: 'i'}},
                {"type": {$regex: text, $options: 'i'}},
                {"content": {$regex: text, $options: 'i'}},
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
    //针对所有文章分页
    getAllByLimits: function (req, callback) {
        var selector = {};
        var limits = {};
        var pageObj = {};

        ArticleLogic.setAllLimits(req, selector, limits, pageObj);

        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.find(selector).toArray(function (err, allarticles) {
                    if (err) return callback(err);
                    pageObj.totalRow = allarticles.length;     //计算得到教学成果总条数
                    if (parseInt(pageObj.totalRow % pageObj.limit) == 0)   pageObj.totalPage = parseInt(pageObj.totalRow / pageObj.limit);
                    else pageObj.totalPage = parseInt(pageObj.totalRow / pageObj.limit) + 1;

                    collection.find(selector, limits).toArray(function (err, articles) {
                        db.close();
                        //console.log(err);
                        //console.log(users.length);
                        ArticleLogic.setPagination(pageObj.currPage, pageObj.totalPage, pageObj);
                        pageObj.data = articles;
                        //pageObj.curLen = articles.length;
                        callback(err, pageObj);
                    });
                });
            });
        });
    },
    //针对所有文章分页所设置过滤器
    setAllLimits: function (req, selector, limits, pageObj) {
        var id_type = req.query.id_type;
        if ((typeof id_type) == 'undefined' || id_type.trim() == '')    id_type = 'all';
        selector.id_type = id_type;
        pageObj.id_type = id_type;
        if (id_type == 'all')  delete selector.id_type;

        var type = req.query.type;
        if ((typeof type) == 'undefined' || type.trim() == '')    type = 'all';
        selector.type = type;
        pageObj.type = type;
        if (type == 'all')  delete selector.type;

        var status = req.query.status;
        if ((typeof status) == 'undefined' || status.trim() == '')    status = 'all';
        pageObj.status = status;
        if (status == 'all') {
        } else {
            selector.status = status == 'true' ? true : false;
        }

        if ((typeof  req.query.content) != 'undefined' && req.query.content.trim() != '') {
            var text = req.query.content;
            pageObj.content = text;
            selector.$or = [
                {"id": {$regex: text, $options: 'i'}},
                {"name": {$regex: text, $options: 'i'}},
                {"id_type": {$regex: text, $options: 'i'}},
                {"title": {$regex: text, $options: 'i'}},
                {"type": {$regex: text, $options: 'i'}},
                {"content": {$regex: text, $options: 'i'}},
                {"date": {$regex: text, $options: 'i'}}
            ];
        }

        if ((typeof req.query.limit) == 'undefined' || req.query.limit.trim() == '')     req.query.limit = 5;
        if ((typeof req.query.page) == 'undefined' || req.query.page.trim() == '')     req.query.page = 1;
        limits.limit = parseInt(req.query.limit);
        limits.skip = (parseInt(req.query.page) - 1) * limits.limit;
        pageObj.limit = limits.limit;
        pageObj.currPage = parseInt(req.query.page);

        limits.sort = {date:-1}

    },
    //获取用户发表过的文章并分页
    getPersonalArticles: function (req, callback) {

        var selector = {};
        var limits = {};
        var pageObj = {};

        selector.id = req.query.id;

        var status = req.query.status;
        if((typeof status)!='undefined'&&status!=null){
            selector.status = status;
        }

        if((typeof req.query.type)!='undefined'&&req.query.type.trim()!=''){
            selector.type = req.query.type;
            pageObj.type = req.query.type;
            if(selector.type=='all')  delete  selector.type;
        }

        if ((typeof  req.query.content) != 'undefined' && req.query.content.trim() != '') {
            var text = req.query.content;
            pageObj.content = text;
            selector.$or = [
                {"id": {$regex: text, $options: 'i'}},
                {"name": {$regex: text, $options: 'i'}},
                {"id_type": {$regex: text, $options: 'i'}},
                {"title": {$regex: text, $options: 'i'}},
                {"type": {$regex: text, $options: 'i'}},
                {"content": {$regex: text, $options: 'i'}},
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



        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }

                collection.find(selector).toArray(function(err,all){
                    if(err) return callback(err);
                    pageObj.totalRow = all.length;
                    if(parseInt(pageObj.totalRow%pageObj.limit)==0)   pageObj.totalPage = parseInt(pageObj.totalRow/pageObj.limit);
                    else pageObj.totalPage = parseInt(pageObj.totalRow/pageObj.limit)+1;

                    collection.find(selector,limits).toArray(function(err,articles){
                        db.close();
                        ArticleLogic.setPagination(pageObj.currPage,pageObj.totalPage,pageObj);
                        pageObj.data = articles;
                        callback(err,pageObj);
                    });
                });
            });
        });
    },
    removeArticleById: function (_id, callback) {
        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }

                collection.findOneAndDelete({_id: new ObjectID(_id)}, {single: true}, function (err, result) {
                    db.close();
                    console.log(result.lastErrorObject.n);
                    callback(null, result.lastErrorObject.n)
                });
            });
        });
    },
    //通过_id获取文章详情与该文章的评论
    getArticleByArticleId: function (_id, callback) {
        var rs = {};
        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            async.auto({
                Article: function (callback, results) {
                    db.collection("article", function (err, collection) {
                        if (err)        callback(err);
                        collection.findOne({_id: new ObjectID(_id)},function(err,article){
                            callback(err, article);
                        });
                    })
                },
                poster:['Article',function(results,callback){
                    db.collection("user", function (err, collection) {
                        if (err)        callback(err);
                        collection.findOne({id: results.Article.id},function(err,user){
                            callback(err, user);
                        });
                    })
                }],
                Comments: function (callback, results) {
                    db.collection("comment", function (err, collection) {
                        if (err)        callback(err);
                        collection.find({id:_id}).toArray(function(err,comments){
                            callback(err, comments);
                        })
                    })
                }
            }, function (err, results) {
                db.close();
                if (err) callback(err);
                callback(err, results)
            });
        });

    },
    editArticleById:function(req,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("article",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                var status=req.body.status=='true'?true:false;
                var modify = {
                    title:req.body.title,
                    status:status,
                    type:req.body.type,
                    content:req.body.content
                };

                collection.findAndModify({_id:new ObjectID(req.body._id)},{},{$set:modify},{new:true},function(err,reslut){
                    if(err) callback(err);
                    callback(null,reslut.value)
                });
            });
        });
    },
    setBadge:function(id,content,status,callback){
        var selector = {};
        if(id!=null){
            selector.id = id;
        }
        if(status!=null)  selector.status = status;
        selector.id_type = {$in: ['teacher', 'admin']};

        if ((typeof  content) != 'undefined' &&content!=null&& content.trim() != '') {
            var text = content;
            selector.$or = [
                {"id": {$regex: text, $options: 'i'}},
                {"name": {$regex: text, $options: 'i'}},
                {"title": {$regex: text, $options: 'i'}},
                {"content": {$regex: text, $options: 'i'}},
                {"date": {$regex: text, $options: 'i'}}
            ];
        }

        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }

                collection.find(selector).toArray(function (err, articles) {
                    db.close();
                    var badge = ArticleLogic.setBadgeNum(articles)
                    callback(err, badge);
                });
            });
        });
    },
    setBadgeNum:function(data) {
        var badge = {};
        var a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0;
        data.forEach(function (item) {
            if (item.type == 'thesis') {
                b++;
            } else if (item.type == 'lecture') {
                c++;
            } else if (item.type == 'award') {
                d++;
            } else if (item.type == 'article') {
                e++;
            } else if (item.type == 'others') {
                f++;
            }
            a++;
        });
        badge.indexAll = b+c+d+f;
        badge.all = a;
        badge.thesis = b;
        badge.lecture = c;
        badge.award = d;
        badge.article = e;
        badge.others = f;

        return badge;
    },

    addRead: function (_id, callback) {
        db.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection("article", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.update({_id:new ObjectID(_id)},{"$inc":{"read":1}}, function (err, result) {
                    db.close();
                    callback(err, result);
                });
            });
        });
    },


};


module.exports = ArticleLogic;