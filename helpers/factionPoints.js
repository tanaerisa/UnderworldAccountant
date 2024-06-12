// load environment variables
require("dotenv").config()
require('./dbLog')
require('./userManager')
// used to manage client credeentials for redeem completion
//var oauth = require('./oauth');

const https = require('https');

// Client for DB access
var mongoHandler = require('./mongoHandler')

// get tokens from json file
const fs = require("fs");
const { tokenLog, pointLog } = require("./dbLog");
const { updateUserPoints } = require("./userManager");
var currentAuthToken = "";
var currentRefreshToken = "";
const date = new Date().toISOString().slice(0,19)

// last redeem is hydrate and should be removed
const redeemDict = {
    "2ff18cda-98f3-4a8c-bbb4-9925a7757c3a": "creatures add 10",
    "fc470584-9044-4e1a-b9f5-06809f0298fa": "undead add 10",
    "0396e776-51f4-475c-9667-3efefe689bc9": "monsters add 10",
    "258b8c49-dabe-4701-ab29-6810a8d61502": "user_input remove 10"
    ,"2b4eb5c1-6976-44c1-b31a-13918491ff9f": "undead add 5"
}
//"2b4eb5c1-6976-44c1-b31a-13918491ff9f": "undead add 5"} // life advice

exports.parseFactionPoints = (event) => {
    if (event.reward.id in redeemDict) {
        const date = new Date().toISOString().slice(0,19)

        // get configuration arguments
        let redeemArgs = redeemDict[event.reward.id].split(" ");

        // set targeted faction
        var targetFaction = "";
        if (redeemArgs[0] == "user_input") {
            var requestedFaction = event.user_input.toLowerCase();
            if (requestedFaction.includes("creature")) { targetFaction = "creatures" }
            else if (requestedFaction.includes("undead")) { targetFaction = "undead" }
            else if (requestedFaction.includes("monster")) { targetFaction = "monsters" }
            else{
                console.log(`${date} ERR: "${event.reward.title}" redeem failed to parse target faction from "${requestedFaction}"`,event);
            }
        } else {
            targetFaction = redeemArgs[0];
        }

        // set add/remove points and value
        var pointDirection = redeemArgs[1];
        var pointValue = parseInt(redeemArgs[2]);

        // generate update/filter queries
        var update;
        if (pointDirection === "add")
            update = {"$inc":{"total":pointValue,"positive":pointValue}};
        else
            update = {"$inc":{"total":pointValue*-1,"negative":pointValue}};

        var filter = {"faction": targetFaction, "discordServer": process.env.DISCORD_SERVER_ID, "sprintEnd":{"$exists":false}}

        var dbo = mongoHandler.getDb()

        return dbo.collection("sprints").findOneAndUpdate(filter,update, {"returnOriginal": false}, function (err, factionDoc) {
            if (err) throw err;

            console.log(`${date} ${pointValue} points ${(pointDirection=="add")?"to":"from"} ${targetFaction}. Redeem "${event.reward.title}", User ${event.user_name}`);

            // Mark Redeem As Completed
            //console.log("attempting complete reward")
            //completeRedeem(event.reward.id,event.id)

            // update user's points. Only add to total if its points in the positive direction
            updateUserPoints((pointDirection === "add") ? pointValue : 0, pointDirection, event.user_id, event.user_name).then(() => {
                // log point event
                pointLog((pointDirection === "remove") ? pointValue * -1 : pointValue, targetFaction, event.user_id, event.user_name, event.reward.title)
            })
            return 1;
        });
    }
}

// async function completeRedeem(channelRedemptionId,userRedemptionId,repeatAttempt=false){
//     // Request headers
//     var completeRedeemParams = {
//         host: "api.twitch.tv",
//         path: `helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.BROADCASTER_ID}&reward_id=${channelRedemptionId}&id=${userRedemptionId}`,
//         method: 'PATCH',
//         headers: {
//             "Content-Type": "application/json",
//             "client-id": process.env.TWITCH_CLIENT_ID,
//             "Authorization": "Bearer "+ currentAuthToken
//         }
//     };
//     // Body info to post to Twitch
//     // Need to re-tokenize Geega for channel:read:hype_train
//     var completeRedeemBody = {
//         "status": "FULFILLED"
//     }

//     // Create/send request
//     console.log(completeRedeemParams)
//     var responseData = "";
//     var completeRedeemReq = https.request(completeRedeemParams, (result) => {
//         result.setEncoding('utf8');
//         result.on('data', function(d) {
//                 responseData = responseData + d;
//             })
//             .on('end', function(result) {
//                 const date = new Date().toISOString().slice(0,19)
//                 var responseBody = JSON.parse(responseData);
//                 console.log(responseBody);
//                 if ( responseBody.hasOwnProperty('data') && responseBody.data.length === 1 ){
//                     console.log(`${date} Redeem Completed: ${responseBody.data[0].reward.title} for user ${responseBody.data[0].user_name}`);
//                 }
//                 else if (responseBody.hasOwnProperty('status') && responseBody.hasOwnProperty('message')){
//                     if ( !repeatAttempt && responseBody.status == 401 && responseBody.message == "Invalid OAuth token"){
//                         // if token expired, refresh and retry request
//                         console.log("attempting refresh");
//                         refreshOAuth().then(
//                             completeRedeem(channelRedemptionId,userRedemptionId,true)
//                         ).catch((err) => {console.error(`Error Refreshing Token: ${err}`)});
//                     }
//                     else if (repeatAttempt && responseBody.status == 401 && responseBody.message == "Invalid OAuth token"){
//                         console.error(`${date} Repeated OAuth refresh attemp failed with unauthorized error.`);
//                     }
//                     else {
//                         console.error(`${date} Error Completing Redeem, Bad Response From Twitch`,responseBody);
//                     }
//                 }
//                 else {
//                     console.error(`${date} Error Completing Redeem, Bad Response From Twitch`,responseBody);
//                 }
//             });
//     });
//     // TEMP, FIGURE OUT USER TOKEN AND REFRESH SHIT
//     completeRedeemReq.on('error', (e) => { console.log(`Error Requesting Redeem Completion: ${e.message}`) });
//     completeRedeemReq.write(JSON.stringify(completeRedeemBody));
//     completeRedeemReq.end();
// }

// function refreshOAuth () {
//     console.log("inside refreshOAuth, before promise")
//     return new Promise(function(resolve, reject) {
//         console.log("inside promise")
//         var refreshRequestParams = {
//             method: 'POST',
//             host: "id.twitch.tv",
//             path: "oauth2/token",
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         };

//         var refreshRequestBody = {
//             "grant_type": "refresh_token",
//             "refresh_token": currentRefreshToken,
//             "client_id": process.env.TWITCH_CLIENT_ID,
//             "client_secret": process.env.TWITCH_CLIENT_SECRET
//         }

//         var responseData = "";
//         var refreshRequest = https.request(refreshRequestParams, (result) => {
//             result.setEncoding('utf8');
//             result.on('data', function(d) {
//                 responseData = responseData + d;
//             })
//             .on('end', function(result) {
//                 console.log(responseData)
//                 var responseBody = JSON.parse(responseData);
//                 console.log(responseBody);
//                 if (responseBody.hasOwnProperty("access_token") && responseBody.hasOwnProperty("refresh_token")){
//                     try{
//                         // log success
//                         const date = new Date().toISOString().slice(0,19)
//                         console.log(`${date} Client Credentials Refreshed`)
//                         console.log(`${date} access_token: ${responseBody.access_token}`)
//                         console.log(`${date} refresh_token: ${responseBody.refresh_token}`)

//                         // insert new tokens to database
//                         LogNewTokens(responseBody.access_token, responseBody.refresh_token)

//                         // update token values
//                         currentAuthToken = responseBody.access_token
//                         currentRefreshToken = responseBody.refresh_token

//                         // write new token values to json file
//                         jsonData = JSON.stringify({access_token: responseBody.access_token, refresh_token: responseBody.refresh_token})
//                         fs.writeFile("../oauth.json", JSON.stringify(jsonData), err => {
//                             if (err)
//                                 console.error(`COULD NOT UPDATE JSON FILE WITH NEW CLIENT TOKENS: access_token ${responseBody.access_token}, refresh_token ${responseBody.refresh_token}`)
//                         })
//                         resolve(`New Client Token: ${currentAuthToken}`)
//                     }
//                     catch(e){
//                         console.log("Failed Refresh While logging: "+e);
//                         reject (e); return;
//                     }
//                 }
//                 else{
//                     console.error("Bad Response: "+responseBody);
//                     reject ("Unsuccessful Response"); return;
//                 }
//             })
//         });
//         refreshRequest.on('error', (e) => { console.log(`Client Token Refresh Error: ${e.message}`); reject(e); return; });
//         refreshRequest.write(JSON.stringify(refreshRequestBody));
//         refreshRequest.end();
//     });
// }

// function LogNewTokens(access_token, refresh_token){
//     // conneect mongo client
//     const client = new MongoClient(process.env.CONN_STRING,{ useUnifiedTopology: true });
//     try{
//         MongoClient.connect(process.env.CONN_STRING, function(err, db) {
//             if (err) throw err;

//             var dbo = db.db("master");

//             // insert new tokens into log
//             const date = new Date().toISOString().slice(0,19)
//             logObj = {"dateCreated": date,"discordID":process.env.DISCORD_SERVER_ID,"access_token":access_token,"refresh_token":refresh_token};
//             return dbo.collection("twitchClientTokenLog").insertOne(logObj, function (err, logDoc) {
//                 if (err)
//                     throw err;

//                 return 1;
//             });
//         });
//     }
//     catch (ex) {
//         console.error(ex);
//     }
//
