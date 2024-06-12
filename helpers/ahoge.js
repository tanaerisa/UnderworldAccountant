const { ahogeLog } = require("./dbLog");
var mongoHandler = require("./mongoHandler")

require("dotenv").config()

var currentXp = 0;


exports.addXp = (eventType,eventBody) => {
    // calculate how many points to add
    let pointVal = 0;
    let pointType = "";
    console.log(`${eventType} event detected`)

    if (eventType == "channel.follow") {
        console.log("follow event detected")
        pointVal = 200
        pointType = "follow"
    }
    if (eventType == "channel.subscribe" && eventBody.is_gift == "false") {
        pointVal = eventBody.tier
        pointType = "sub"
    }
    if (eventType == "channel.subscription.gift") {
        pointVal = eventBody.total * eventBody.tier
        pointType = "sub"
    }
    if (eventType == "channel.subscription.message") {
        pointVal = eventBody.tier
        pointType = "sub"
    }
    if (eventType == "channel.cheer") {
        pointVal = eventBody.bits
        pointType = "bits"
    }
    if (eventType == "channel.raid") {
        pointVal = eventBody.viewers * 100
        pointType = "raid"
        console.log(`raid detected, points ${pointVal}`)
    }
    if (eventType == "channel.hype_train.end") {
        pointVal = eventBody.level * 2000
        pointType = "hypeTrain"
    }
    if (eventType == "channel.channel_points_custom_reward_redemption.add") {
        // works out to 500 pt redeem about 220 xp and 6k pt redeem about 770 xp
        pointVal = Math.floor(Math.sqrt(eventBody.reward.cost)) * 10
        pointType = "redeem"
    }
    console.log(`ahoge log event ${pointType}, value ${pointVal}`)
    ahogeLog(pointVal,pointType)
    currentXp += pointVal;
}

exports.streamOnline = () => {
    var db = mongoHandler.getDb()
    const date = new Date()

    // find most recent stream log
    query = {"discordServer": process.env.DISCORD_SERVER_ID}
    db.collection("ahogeLog").find(query).limit(1).sort({"$natural": -1}).toArray(function(err,document){
        if (err) throw err

        if (document.length < 1 || (document["dateEnded"] && document["dateEnded"])) {
            createNew = true
        }
        else{

        }
    })
}

exports.streamOffline = () => {
    var db = mongoHandler.getDb()
    // get timestamp
    const date = new Date().toISOString().slice(0,19)

    var filter = {"discordServer": process.env.DISCORD_SERVER_ID, "dateEnded": {"$exists":false}}
    var update = {"dateEnded": date.toString()}
    db.collection("ahogeLog").findOneAndUpdate(filter, update, function (err, document) {
        if (err) throw err;
    })
}

function resetXp() {

}
