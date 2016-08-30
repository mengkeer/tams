var db = require("../model/db");
var async = require('async');
var crypto = require("crypto");

var XlsxUtil = {
    parse: function (data, check, callback) {
        //console.log("check;"+check);
        var flag = false;       //flag表示excel内容格式是否有误
        var err2 = {};          //用来定位错误sheet与错误行
        var Teachers = new Array();
        for (var sheetIndex in data) {
            var sheet = data[sheetIndex]
            for (var index in sheet.data) {
                var row = sheet.data[index];
                //console.log(row.length);
                if (row.length != 9 && row.length != 0) {
                    flag = true;
                    var message = "sheet" + (parseInt(sheetIndex) + 1) + "的第" + (parseInt(index) + 1) + "行格式有误";
                    err2.message = message;
                    break;
                }
                if (row.length == 0)   continue;
                if (index > 0) {
                    var md5 = crypto.createHash("md5");
                    var password = md5.update(row[0] + "").digest("hex");
                    var Teacher = {
                        id: row[0] + "" == "undefined" ? "" : row[0] + "",
                        password: password,
                        type: 'teacher',
                        name: row[1] + "" == "undefined" ? "" : row[1] + "",
                        sex: row[2] + "" == "undefined" ? "" : row[2] + "",
                        academic: row[3] + "" == "undefined" ? "" : row[3] + "",
                        rank: row[4] + "" == "undefined" ? "" : row[4] + "",
                        contact: row[5] + "" == "undefined" ? "" : row[5] + "",
                        type: XlsxUtil.getType(row[6]),
                        remark: row[7] + "" == "undefined" ? "" : row[7] + "",
                        brief: row[8] + "" == "undefined" ? "" : row[8] + ""
                    };
                    Teachers.push(Teacher);
                }
            }
            if (flag)    break;
        }
        ;

        if (flag) return callback(null, err2);

        XlsxUtil.importToMongodb(Teachers, check, function (err) {
            if (err)  callback(err);
            else callback(null);
        });
    },
    getType: function (str) {
        //默认为学生类型
        if ((typeof str) == 'undefined' || str == '' || str.trim() == '') {
            return 'student';
        }
        if (str == 'student' || str == '学生' || str.indexOf('学生') > -1) {
            return 'student';
        }
        if (str == 'teacher' || str == '老师' || str.indexOf('老师') > -1) {
            return 'teacher';
        }
        if (str == 'admin' || str == '管理员' || str.indexOf("管理员") > -1) {
            return 'admin';
        }
        return 'student';
    },
    importToMongodb: function (Teachers, check, callback) {
        //console.log(Teachers);
        db.open(function (err, db) {
            if (err) {
                callback(err);
                db.close();
            }
            db.collection("user", function (err, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }

                if (check == 'true') {
                    async.eachSeries(Teachers, function (data, cb) {
                        collection.update({"id": data.id}, data, {"upsert": true}, function (err, result) {
                            if (err) cb(err);
                            cb(null)
                        });
                    }, function (err) {
                        db.close();
                        if (err) callback(err);
                        callback(null);
                    });
                } else {
                    async.eachSeries(Teachers, function (data, cb) {
                        collection.findOne({"id": data.id},data,function(err,user){
                            if(err) cb(err)
                            if(!user){
                                collection.insert(data,function(err,user){
                                    if(err)     cb(err);
                                    cb(null);
                                })
                            }else{
                                cb(null);
                            }
                        });
                    }, function (err) {
                        db.close();
                        if (err) callback(err);
                        callback(null);
                    });
                }


            });
        });
    }

};

module.exports = XlsxUtil;