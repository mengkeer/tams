var excelMulter = require("../Util/excelUploadUtil");
var imageMulter = require("../Util/imageUploadUtil");
var excelUtil = require("../Util/excelUtil");
var xlsx = require("node-xlsx");

var UploadLogic = {
    uploadExcelFile: function (req, res, callback) {
        var upload = excelMulter.single('myfile');
        var check = req.query.check;
        upload(req, res, function (err) {
            if (err) callback(err);
            else {
                var filePath = req.session.filePath;
                req.session.filePath = null;
                if(filePath==null)      return callback(null,new Error("没有选择文件"));
                var data = xlsx.parse(filePath);

                //第一个err表示是否解析出错 第二个表示错误定位信息
                excelUtil.parse(data,check, function (err, err2) {
                    if (err) callback(err);
                    else callback(null, err2);
                });
            }

        });
    },
    uploadImage:function(req,res,callback){
        var upload=imageMulter.single('myImage');
        upload(req,res,function(err){
            if(err) callback(err);
            else{
                var filePath = req.session.filePath;
                req.session.filePath = null;
                callback(null,filePath);
            }

        });
    }
};

module.exports = UploadLogic;