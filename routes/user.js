var express = require('express');
var UserLogic = require("../server/logic/UserLogic");
var ArticleLogic = require("../server/logic/ArticleLogic");
var UploadLogic = require("../server/logic/UploadLogic");
var router = express.Router();
var common = require("./common");

router.get("/login",function(req,res){
    res.render("login");
});

router.post("/login",function(req,res){
    //user表示获取到的用户
    UserLogic.checkUser(req,function(err,user){
        //console.log(user);
        if(err)  res.redirect("/error");
        else if(user){
            req.session.user = user;
            //req.session.date = new Date();
            res.redirect('/index');
        }
        else  res.render("login",{errInfo:"当前用户不存在"});
    });
});

router.get("/register",function(req,res){
    res.render("register");
});

router.post('/register',function(req,res){
    var id = req.body.id;
    UserLogic.checkUserById(id,function(err,user){
        //console.log(user);
        if(err)  res.redirect("/error");
        else if(user){
            //type=1表示该用户已存在
            res.json({type:1});
        }else{
            UserLogic.save(req,function(err,user){
                //console.log(user);
                if(err)  res.redirect("/error");
                //type=2表示该用户注册成功
                else {
                    req.session.user = user;
                    res.json({type:2});
                }
            });
        }
    });
});

//router.get('/addUser',function(req,res){
//    var flag = common.verifyAdmin(req);
//    if(!flag){
//        return res.send("权限不足");
//    }
//    res.render('addUser',{user:req.session.user});
//});
//添加用户是指管理员添加用户
router.post('/addUser',function(req,res){
    var flag = common.verifyUser(req);
    if(!flag){
        return res.send("权限不足");
    }

    var id = req.body.id;
    UserLogic.checkUserById(id,function(err,user){
        if(err)  res.redirect("/error");
        else if(user){
            //type=1表示该用户已存在
            res.json({type:1});
        }else{
            UserLogic.addUser(req,function(err){
                //console.log(err);
                if(err)  res.redirect("/error");
                //type=2表示该用户添加成功
                else res.redirect('/getUsers');
            });
        }
    });
});

//更新用户是指更新自身个人信息
router.get('/updateUser',function(req,res){
    //console.log(req.session.user);
    var flag = common.verifyUser(req);
    if(!flag){
        return res.redirect("/login");
    }
    res.render('updateUser',{user:req.session.user});
});

router.post('/updateUser',function(req,res){
    var flag = common.verifyUser(req);
    if(!flag){
        return res.redirect("/login");
    }
    UserLogic.updateUser(req,function(err,user){
        if(err)  res.redirect("/error");
        //type=1表示该用户更新成功
        else{
            req.session.user = user;
            res.json({type:1});
        }
    });
});

//编辑用户是指管理员编辑其它人的个人信息
router.get('/editUser',function(req,res){
    console.log(req.session.user);
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("权限不足");
    }
    res.render('editUser',{user:req.session.user});
});

router.post('/editUser',function(req,res){
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("权限不足");
    }
    UserLogic.checkUserById(req.body.id,function(err,user){
        if(err)  return res.redirect("/error");
        if(!user){
            return res.send("您要编辑的用户不存在");
        }else{
            if(user.type=='superadmin'){
                return res.send("对方的权限比你大，不能编辑");
            }else if(req.session.user.type=='admin'&&user.type=='admin'){
                return res.send("权限一样，无法编辑");
            }else{
                UserLogic.editUser(req,function(err,user){
                    if(err)  res.redirect("/error");
                    //type=1表示该用户编辑成功
                    else{
                        res.json({type:1});
                    }
                })
            }
        }
    });

});

//用户自身更改密码
//router.get('/changePassword',function(req,res){
//    var flag = common.verifyUser(req);
//    if(!flag){
//        return res.redirect("/login");
//    }
//    res.render("changePassword",{user:req.session.user});
//});

router.post('/changePassword',function(req,res){
    var flag = common.verifyUser(req);
    if(!flag){
        return res.redirect("/login");
    }
    req.body.id = req.session.user.id;
    UserLogic.checkUser(req,function(err,user){
        if(!user)    return res.json("error","error");
        console.log(user);
        UserLogic.changePassword(req.session.user.id,req.body.new_password,function(err,user){
            if(err)     return res.redirect('/error');
            res.json("success","success");
        })
    });

});

//管理员更改其它用户密码
router.post('/resetPassword',function(req,res){
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("您没有编辑权限");
    }

    UserLogic.checkUserById(req.body.id,function(err,user){
        if(err)  return res.redirect("/error");
        if(!user){
            return res.send("该用户不存在");
        }else{
            if(user.type=='superadmin'){
                return res.send("对方的权限比你大，不能重设密码");
            }else if(req.session.user.type=='admin'&&user.type=='admin'){
                return res.send("权限一样，无法重设密码");
            }else{
                UserLogic.resetPassword(req.body.id,function(err,user){
                    if(err)     return res.redirect('/error');
                    res.send("重设密码成功");
                })
            }
        }
    });

});

//根据id获取用户信息    eg：/getUserInfo？id=XXX  不传id则获取自身信息
router.get('/getUserInfo',function(req,res){
    var id = (typeof req.query.id)=='undefined'?req.session.user.id:req.query.id;
    UserLogic.checkUserById(id,function(err,user){
        if(err)     return res.redirect("/error");
        else if(user==null){
            res.send("不存在该用户");
        }else {
            res.send({user:user});
        }
    })
});

//根据id删除用户信息    eg：/removeUser？id=XXX
router.post('/removeUser',function(req,res){
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("权限不足");
    }

    UserLogic.checkUserById(req.body.id,function(err,user){
        if(err)  return res.redirect("/error");
        if(!user){
            return res.json({"rs":"您要删除的用户不存在"});
        }else{
            if(user.type=='superadmin'){
                return res.json({"rs":"对方的权限比你大，不能删除"});
            }else if(req.session.user.type=='admin'&&user.type=='admin'){
                return res.json({"rs":"权限一样，无法删除"});
            }else{
                UserLogic.removeUserById(req.body.id,function(err,len){
                    if(err)     return res.redirect("/error");
                    else if(len==0){
                        res.json({"rs":"删除失败"});
                    }else {
                        res.json({"rs":"success"});
                    }
                })
            }
        }
    });

});


//根据分页获取用户  初始时获取5条数据
router.get('/getUsers',function(req,res){
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("权限不足");
    }

    req.body = null;
    var rs={};
    UserLogic.getUsersByLimits(req,function(err,pageObj){
        if(err)  res.redirect("/error");
        //else res.json({"users":users});
        else{
            rs.pageObj = pageObj;
            rs.user = req.session.user;
            //console.log(rs);
            res.render("admin/getUsers",rs);
        }
    });
});

//根据分页获取用户
router.post("/getUsersByLimits",function(req,res){
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("权限不足");
    }
    var rs = {};
    UserLogic.getUsersByLimits(req,function(err,pageObj){
        if(err)  res.redirect("/error");
        else{
            rs.user = req.session.user;
            rs.pageObj = pageObj;
            //console.log(rs);
            res.render("common/userListTableAjax",rs);
        }
    });
});

router.get('/logout',function(req,res){
    req.session.user = null;
    res.redirect('/');
});

//根据id获取个人信息+发表过的文章   eg：/personalCenter？id=XXX  不传id则获取自身信息
router.get('/personalCenter',function(req,res){
    if(!common.verifyUser(req))     return res.redirect("/login");
    var rs = {};
    req.query.id = req.session.user.id;
    ArticleLogic.getPersonalArticles(req,function(err,pageObj){
        if(err)     return res.redirect('/error');
        rs.user = req.session.user;
        rs.pageObj = pageObj;

        ArticleLogic.setBadge(req.query.id,req.query.content,null, function (err,badge) {
            if(err)  return res.redirect("/error");
            rs.badge = badge;
            console.log(rs);
            res.render('personalCenter',rs);
        });
    });
});

router.get('/personalInfo',function(req,res){
    var id = (typeof req.query.id)=='undefined'?req.session.user.id:req.query.id;
    UserLogic.checkUserById(id,function(err,user){
        if(err)     return res.redirect("/error");
        else if(user==null){
            res.send("不存在该用户");
        }else {
            req.query.id = id;
            var rs = {};
            rs.user = user;
            req.query.status = true;
            ArticleLogic.getPersonalArticles(req,function(err,pageObj){
                if(err)     return res.redirect('/error');
                rs.pageObj = pageObj;
                ArticleLogic.setBadge(req.query.id,req.query.content,true,function (err,badge) {
                    if(err)  return res.redirect("/error");
                    rs.badge = badge;
                    console.log(rs);
                    res.render('personalInfo',rs);
                });
            });
        }
    })
});


//router.get("/upload",function(req,res){
//    var flag = router.verifyAdmin(req);
//    if(!flag){
//        return res.send("权限不足");
//    }
//    res.render("upload",{user:req.session.user});
//});

router.post("/upload",function(req,res){
    var flag = common.verifyAdmin(req);
    if(!flag){
        return res.send("权限不足");
    }
    UploadLogic.uploadExcelFile(req,res,function(err,err2){
        if(err){
            //文件类型有误或文件大小超出
            //console.log(err);
            res.json({"message":"文件类型有误或文件大小超出"});
        }else if(err2){
            //excel内容格式有误
            res.json(err2);
        }else{
            //上传并解析成功
            res.json({"message":"上传成功"});
        }
    });
});

module.exports = router;
