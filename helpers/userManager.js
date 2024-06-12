// load environment variables
require("dotenv").config()

// Client for DB access
var mongoHandler = require('./mongoHandler')

module.exports = {
    updateUserPoints: function(pointValue, pointDirection, twitchId, twitchUsername) {
        return new Promise(function (resolve, reject) {
            var db = mongoHandler.getDb()

            // gather user info
            query = {"discordServer": process.env.DISCORD_SERVER_ID, "twitchId": twitchId}
            if (pointDirection === "add")
                update = {"$inc":{"total":pointValue,"positive":pointValue},"$set":{"twitchUsername":twitchUsername}}
            else
                update = {"$inc":{"total":pointValue*-1,"negative":pointValue},"$set":{"twitchUsername":twitchUsername}}

            db.collection("users").findOneAndUpdate(query, update, { "returnOriginal": false }, function(err, documents){
                if (err) throw err;

                // if no user found to update, add it to the table
                if (documents["lastErrorObject"]["n"] == 0) {
                    if (pointDirection === "add") {
                        userObj = {"discordServer":process.env.DISCORD_SERVER_ID,"twitchId":twitchId,"twitchUsername":twitchUsername,"total":pointValue,"positive":pointValue,"negative":0}
                    } else {
                        userObj = {"discordServer":process.env.DISCORD_SERVER_ID,"twitchId":twitchId,"twitchUsername":twitchUsername,"total":pointValue*-1,"positive":0,"negative":pointValue}
                    }

                    db.collection("users").insertOne(userObj, function (err, insDocument) {
                        if(err) throw err;

                        resolve("document inserted")
                    })
                } else {
                    resolve("document updated")
                }
            })
        })
    }
}
