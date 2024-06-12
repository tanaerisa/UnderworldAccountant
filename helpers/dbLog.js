// load environment variables
require("dotenv").config();

// Client for DB access
var mongoHandler = require('./mongoHandler')

exports.pointLog = (pointValue, targetFaction, userId, username, memo) => {
    // get connection
    var dbo = mongoHandler.getDb()

    // gather user info
    query = {"discordServer": process.env.DISCORD_SERVER_ID, "twitchId": userId, "dateDeleted": {"$exists": false}}
    return dbo.collection("users").findOne(query, function(err, document){
        if (err) throw err

        var discordId,discordUsername,userTotal,userPositive,userNegative, factionTotal,factionPositive,factionNegative
        if (document.discordID !== undefined) {
            discordId = document["discordID"]
            discordUsername = document["nickname"]
        } else {
            discordId = ""
            discordUsername = ""
        }

        userTotal = document["total"]
        userPositive = document["positive"]
        userNegative = document["negative"]

        //get target faction info
        query = {"discordServer": process.env.DISCORD_SERVER_ID, "faction": targetFaction, "sprintEnd":{"$exists":false}}
        return dbo.collection("sprints").findOne(query,function(err, factionDoc){
            if (err) throw err

            const date = new Date().toISOString().slice(0,19)
            var logObj = {"dateCreated": date,"discordServer":process.env.DISCORD_SERVER_ID,"discordId":discordId,"discordName":discordUsername,"twitchId":userId,"twitchName":username,"pointValue":pointValue,"memo":memo,"userTotal":userTotal,"userPositive":userPositive,"userNegative":userNegative,"targetFaction":targetFaction,"targetFactionTotal":factionDoc["total"],"targetFactionPositive":factionDoc["positive"],"targetFactionNegative":factionDoc["negative"]}
            dbo.collection("pointsLog").insertOne(logObj, function(err, logDoc){
                if (err) throw err
                return 1
            })
        })
    })
}

exports.tokenLog = (access_token, refresh_token) => {
    // get connection
    var dbo = mongoHandler.getDb()

    // insert new tokens into log
    const date = new Date().toISOString().slice(0,19)
    logObj = {"dateCreated": date,"discordServer":process.env.DISCORD_SERVER_ID,"access_token":access_token,"refresh_token":refresh_token};
    return dbo.collection("twitchClientTokenLog").insertOne(logObj, function (err, logDoc) {
        if (err)
            throw err;

        return 1;
    });
}

exports.ahogeLog = (pointValue,pointSource) => {
    // get connection
    var dbo = mongoHandler.getDb()

    filter = {"discordServer": process.env.DISCORD_SERVER_ID,"dateEnded":{"$exists":false}}

    logUpdateObj = {"$inc":{"total": parseInt(pointValue)}}
    // must be added dynamically to use variable as column name
    logUpdateObj["$inc"][pointSource] = parseInt(pointValue)

    return dbo.collection("ahogeLog").findOneAndUpdate(filter, logUpdateObj, {"returnOriginal": false}, function (err, logDoc) {
        if (err) throw err;

        return 1;
    });
}
