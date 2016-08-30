var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var fs = require('fs');

var user = require("./routes/user");
var article = require("./routes/article");
var comment = require("./routes/comment");
var common = require('./routes/common');

var app = express();

//var accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});
var errorLog = fs.createWriteStream( path.join(__dirname, 'error.log'), {flags: 'a'});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images/article.jpg')));
app.use(logger('dev'));
//输出访问日志
//app.use(logger("combined",{stream: accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var Config = require("./Config");
app.use(session({
    resave:false,//添加这行
    saveUninitialized: true,//添加这行
    secret:Config.cookieSecret,
    key:Config.db,
    cookie:{
        maxAge:1000*60*60*24,
        httpOnly:false
    },
    store:new MongoStore({
        url: 'mongodb://www.slotus.cc/tams'
    })
}));

app.use('/',user);
app.use('/',article);
app.use('/',comment);
app.use('/', common);

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        var meta = '[' + new Date() + '] ' + req.url + '\n';
        errorLog.write(meta + err.stack + '\n');
        //res.render("error");
    });
}

//// production error handler
//// no stacktraces leaked to user
//app.use(function(err, req, res, next) {
//    var meta = '[' + new Date() + '] ' + req.url + '\n';
//    errorLog.write(meta + err.stack + '\n');
//    res.redirect("/error");
//});

module.exports = app;
