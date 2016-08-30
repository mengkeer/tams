var settings = require("../../Config"),
    Db = require("mongodb").Db,
    Connection = require('mongodb').Connection,
    Server  = require('mongodb').Server;
    module.exports = new Db(settings.db,new Server(settings.host,settings.port,{
        auto_reconnect:true
    })
    ,{safe:true});
