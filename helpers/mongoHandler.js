// load environment variables
require("dotenv").config()
const MongoClient = require('mongodb').MongoClient;
const url = process.env.CONN_STRING;

var _db;

module.exports = {
    connectToServer: function (callback) {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
          _db  = client.db('master');
          return callback(err);
        } );
      },

      getDb: function () {
        return _db;
      }
}
