var db = require("../model/db");
var crypto = require("crypto");
var User = require("../model/UserObj");
var querystring = require("querystring");

var UserLogic = {
    //根据用户名 密码判断用户是否存在
    checkUser:function(req,callback){
        db.open(function(err,db){
           if(err) {
               return callback(err);
           }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                var md5 = crypto.createHash("md5");
                var password = md5.update(req.body.password).digest("hex");

                collection.findOne({
                    id:req.body.id,
                    password:password
                },function(err,user){
                    db.close();
                    if(err) return callback(err);
                    else{
                        callback(null,user)
                    }
                });
            });
        });
    },
    //根据id判断用户名是否存在  返回获取到的用户
    checkUserById:function(id,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                collection.findOne({
                    id:id
                },function(err,user){
                    db.close();
                    if(err) return callback(err);
                    else{
                        callback(null,user)
                    }
                });
            });
        });
    },
    //注册时添加用户  默认student类型
    save:function(req,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                var str = querystring.stringify(User);
                var newUser = querystring.parse(str);

                var md5 = crypto.createHash("md5");
                var password = md5.update(req.body.password).digest("hex");

                newUser.id = req.body.id;
                newUser.password = password;

                collection.insert(newUser,function(err,user){
                    //console.log(user.ops[0]);
                    db.close();
                    callback(err,user.ops[0]);
                });
            });
        });
    },
    //管理员添加用户 可指定用户类型
    addUser:function(req,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                var str = querystring.stringify(User);
                var newUser = querystring.parse(str);

                var md5 = crypto.createHash("md5");
                var password = md5.update(req.body.password).digest("hex");

                newUser.id = req.body.id;
                newUser.password = password;
                newUser.type = req.body.type,
                newUser.name = req.body.name;
                newUser.sex = req.body.sex;
                newUser.academic = req.body.academic;
                newUser.rank = req.body.rank;
                newUser.contact = req.body.contact;
                newUser.remark = req.body.remark;
                newUser.brief = req.body.brief;

                collection.insert(newUser,function(err,user){
                    db.close();
                    callback(err);
                });
            });
        });
    },
    //用户更新自身信息
    updateUser:function(req,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                collection.findAndModify({id:req.session.user.id},{},{$set:{
                    name:req.body.name,
                    sex:req.body.sex,
                    academic:req.body.academic,
                    rank:req.body.rank,
                    contact:req.body.contact,
                    remark:req.body.remark,
                    brief:req.body.brief
                }},{new:true},function(err,reslut){
                    if(err) callback(err);
                    callback(null,reslut.value)
                });
            });
        });
    },
    //管理员编辑其它用户信息
    editUser:function(req,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                var modify = {
                    name:req.body.name,
                    sex:req.body.sex,
                    academic:req.body.academic,
                    rank:req.body.rank,
                    contact:req.body.contact,
                    remark:req.body.remark,
                    brief:req.body.brief
                };
                //针对超管提权状况
                if((typeof req.body.type)!='undefined'){
                    modify.type=req.body.type;
                }
                //防止非超管提权
                if(req.session.user.type!='superadmin'){
                    delete  modify.type;
                }
                collection.findAndModify({id:req.body.id},{},{$set:modify},{new:true},function(err,reslut){
                    if(err) callback(err);
                    callback(null,reslut.value)
                });
            });
        });
    },
    //根据ID更改密码
    changePassword:function(id,Password,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                var md5 = crypto.createHash("md5");
                var newPassword = md5.update(Password).digest("hex");

                collection.findAndModify({id:id},{},{$set:{
                    password:newPassword
                }},{new:true},function(err,reslut){
                    if(err) callback(err);
                    callback(null,reslut.value)
                });
            });
        });
    },
    //根据ID重设密码
    resetPassword:function(id,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                var md5 = crypto.createHash("md5");
                var newPassword = md5.update(id).digest("hex");

                collection.findAndModify({id:id},{},{$set:{
                    password:newPassword
                }},{new:true},function(err,reslut){
                    if(err) callback(err);
                    callback(null,reslut.value)
                });
            });
        });
    },
    //获取所有用户
    getAllUsers:function(callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                collection.find({},{}).toArray(function(err,users){
                    //console.log(users);
                    db.close();
                    callback(err,users);
                });
            });
        });
    },
    //根据分页情况来获取用户数据
    getUsersByLimits:function(req,callback){
        var selector = {};
        var limits = {};
        var pageObj = {};

        UserLogic.setLimits(req,selector,limits,pageObj);

        //console.log(limits);
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                collection.find(selector).toArray(function(err,allusers){
                    if(err) return callback(err);
                    pageObj.totalRow = allusers.length;     //计算得到用户总条数
                    if(parseInt(pageObj.totalRow%pageObj.limit)==0)   pageObj.totalPage = parseInt(pageObj.totalRow/pageObj.limit);
                    else pageObj.totalPage = parseInt(pageObj.totalRow/pageObj.limit)+1;

                    collection.find(selector,limits).toArray(function(err,users){
                        db.close();
                        //console.log(err);
                        //console.log(users.length);
                        UserLogic.setPagination(pageObj.currPage,pageObj.totalPage,pageObj);
                        pageObj.data = users;
                        //pageObj.curLen = users.length;
                        callback(err,pageObj);
                    });
                });
            });
        });
    },
    //设置分页查询过滤去
    setLimits:function(req,selector,limits,pageObj){
        if(req.body==null) {
            //limits.limit = 5;
            //if(req.session.user.type=='admin'){
            //    selector.type = {$in:['teacher','student']}
            //}
            //pageObj.limit = 5;
            //pageObj.currPage = 1;

            var type = req.query.type;
            if ((typeof type) == 'undefined' || type.trim() == '') {
                type = 'all';
            }
            pageObj.type = type;
            if (req.session.user.type == 'superadmin') {
                selector.type = type;
                if (type == 'all')     selector.type = {$in: ['teacher', 'student', 'admin']}
            } else if (req.session.user.type == 'admin') {
                if (type == 'teacher' || type == 'student') {
                    selector.type = type;
                } else {
                    selector.type = {$in: ['teacher', 'student']}
                }
            }

            if ((typeof  req.query.content) != 'undefined' && req.query.content.trim() != '') {
                var text = req.query.content;
                pageObj.content = text;
                selector.$or = [
                    {"id": {$regex: text, $options: 'i'}},
                    {"type": {$regex: text, $options: 'i'}},
                    {"name": {$regex: text, $options: 'i'}},
                    {"sex": {$regex: text, $options: 'i'}},
                    {"academic": {$regex: text, $options: 'i'}},
                    {"rank": {$regex: text, $options: 'i'}},
                    {"contact": {$regex: text, $options: 'i'}},
                    {"remark": {$regex: text, $options: 'i'}},
                    {"brief": {$regex: text, $options: 'i'}}
                ];
            }

            if ((typeof req.query.limit) == 'undefined' || req.query.limit.trim() == '')     req.query.limit = 5;
            if ((typeof req.query.page) == 'undefined' || req.query.page.trim() == '')     req.query.page = 1;
            limits.limit = parseInt(req.query.limit);
            limits.skip = (parseInt(req.query.page) - 1) * limits.limit;
            pageObj.limit = limits.limit;
            pageObj.currPage = parseInt(req.query.page);


        }else{
            var type = req.body.type;
            if((typeof type)=='undefined'||type.trim()=='')     {
                type = 'all';
            }
            pageObj.content = type;
            if(req.session.user.type=='superadmin'){
                selector.type = type;
                if(type=='all')     selector.type = {$in:['teacher','student','admin']}
            }else if(req.session.user.type=='admin'){
                if(type=='teacher'||type=='student'){
                    selector.type = type;
                }else{
                    selector.type = {$in:['teacher','student']}
                }
            }

            //if((typeof selector.type)=='undefined'||selector.type=='all'||selector.type.trim()=='')    delete selector.type;
            if((typeof  req.body.content)!='undefined'&&req.body.content.trim()!=''){
                var text = req.body.content;
                pageObj.content = text;
                selector.$or = [
                    {"id": {$regex:text, $options:'i'}},
                    {"type": {$regex:text, $options:'i'}},
                    {"name": {$regex:text, $options:'i'}},
                    {"sex": {$regex:text, $options:'i'}},
                    {"academic": {$regex:text, $options:'i'}},
                    {"rank": {$regex:text, $options:'i'}},
                    {"contact": {$regex:text, $options:'i'}},
                    {"remark": {$regex:text, $options:'i'}},
                    {"brief": {$regex:text, $options:'i'}}
                ];
            };
            if((typeof req.body.limit)=='undefined'||req.body.limit.trim()=='')     req.body.limit = 5;
            if((typeof req.body.page)=='undefined'||req.body.page.trim()=='')     req.body.page = 1;
            limits.limit = parseInt(req.body.limit);
            limits.skip = (parseInt(req.body.page)-1)*limits.limit;
            pageObj.limit = limits.limit;
            pageObj.currPage = parseInt(req.body.page);
        }
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
    //根据ID删除用户
    removeUserById:function(id,callback){
        db.open(function(err,db){
            if(err) {
                return callback(err);
            }
            db.collection("user",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }

                collection.findOneAndDelete({id:id},{single:true},function(err,result){
                    db.close();
                    console.log(result.lastErrorObject.n);
                    callback(null,result.lastErrorObject.n)
                });
            });
        });
    }
};

module.exports = UserLogic;