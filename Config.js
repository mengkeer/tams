var path = require("path");
module.exports = {
    cookieSecret: 'tams',
    db: 'tams',
    host: 'www.slotus.cc',
    port: 27017,
    excelUploadRoot:path.join(__dirname,'public/upload/excel'),
    imageUploadRoot:path.join(__dirname,'public/upload/images')
};