var  multer=require('multer');
var Config = require("../../Config");
var storage = multer.diskStorage({
    //设置上传后文件路径，uploads文件夹会自动创建。
    destination: Config.excelUploadRoot,
    //给上传文件重命名，获取添加后缀名
    filename: function (req, file, cb) {
        var fileFormat = (file.originalname).split(".");
        var nowFileName = Date.now()+ "." + fileFormat[fileFormat.length - 1];
        req.session.filePath = Config.excelUploadRoot+"/"+nowFileName;
        cb(null, nowFileName);
    }
});
//添加配置文件到muler对象。
var upload = multer({
    storage: storage,
    limits:{
        fileSize:1024*1024*2,
    },
    fileFilter:function(req, file,cb){
        if(file.originalname.indexOf(".xls")>-1||file.originalname.indexOf(".xlsx")>-1){
            cb(null, true);
        }else{
            cb(new Error('文件类型不符'));
        }

    }
});

module.exports = upload;