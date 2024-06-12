// load environment variables
require("dotenv").config()

const https = require('https');

const requestedSubscriptionTypes = process.env.SUB_TYPES.split(',')

// variables needed for twitch calls
const callbackUrl = process.env.CALLBACK_URL;
const port = process.env.PORT || 6336;
const twitchSigningSecret = process.env.TWITCH_SIGNING_SECRET;

var ActiveSubscriptions = {};
requestedSubscriptionTypes.forEach(subType => {
    ActiveSubscriptions[subType] = ""
});

exports.getEventSubSubscriptions = () => {
    var listRequestParams = {
        host: "api.twitch.tv",
        path: "helix/eventsub/subscriptions",
        method: 'GET',
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            "Authorization": "Bearer "+ process.env.TWITCH_APP_BEARER
        }
    };
    var responseData = "";
    var listRequest = https.request(listRequestParams, (result) => {
        result.setEncoding('utf8');
        result.on('data', function(d) {
            responseData = responseData + d;
        })
        .on('end', function(result) {
            var responseBody = JSON.parse(responseData);

            // parse subscription list for redeem sub
            if (responseBody.hasOwnProperty("data")) {
                responseBody.data.forEach(sub => {
                    // Add as active redeem if good status, for this callback url, and is of requested type
                    if (sub.status === "enabled" && sub.transport.callback === callbackUrl+"/notification" && sub.transport.method === "webhook" && ActiveSubscriptions.hasOwnProperty(sub.type)) {
                        ActiveSubscriptions[sub.type] = sub.id;
                        console.log(`${sub.type} EventSub ID: ${ActiveSubscriptions[sub.type]}`);
                    }
                    // end any subscriptions for this service that aren't enabled, aren't in requested types, or is a duplicate of an existing sub
                    else if(sub.transport.callback === callbackUrl+"/notification" && sub.transport.method === "webhook" &&
                        (sub.status !== "enabled" || !ActiveSubscriptions.hasOwnProperty(sub.type) || ActiveSubscriptions[sub.type] !== "")) {
                        console.log(`attempting to stop ${sub.type}, ID: ${sub.id}`)
                        endEventSubSubscription(sub.id);
                    }
                });

                // Initialize any subscriptions that didn't have existing sub
                for (var subType in ActiveSubscriptions) {
                    if (ActiveSubscriptions[subType] === "") {
                        console.log(`attempting to start ${subType} sub`)
                        module.exports.initializeRedeemSubscription(subType);
                    }
                }
            } else {
                console.log("FAILED TO INITIALIZE EVENTSUB SUBSCRIPTIONS")
            }
        });
    });
    listRequest.on('error', (e) => { console.log("Error") });
    listRequest.end()
}

// Will create a channel redeem listener for GeneralGEEGA channel
exports.initializeRedeemSubscription = (subType) => {
    // Request headers
    var redeemListenerParams = {
        host: "api.twitch.tv",
        path: "helix/eventsub/subscriptions",
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            "Authorization": "Bearer "+ process.env.TWITCH_APP_BEARER
        }
    };
    // Body info to post to Twitch
    // Need to re-tokenize Geega for channel:read:hype_train
    var redeemListenerBody = {
        "type": subType,
        "version": "1",
        "transport": {
            "method": "webhook",
            // ngrok can be used for testing
            "callback": callbackUrl+"/notification", // If you change the /notification path, also adjust it in post listener elsewhere
            "secret": twitchSigningSecret
        }
    }
    // condition object changes a tiny bit for raid sub request
    if (subType === "channel.raid") {
        redeemListenerBody["condition"] = {"to_broadcaster_user_id": process.env.BROADCASTER_ID}
    } else {
        redeemListenerBody["condition"] = {"broadcaster_user_id": process.env.BROADCASTER_ID}
    }

    // Create/send request
    var responseData = "";
    var redeemListenerReq = https.request(redeemListenerParams, (result) => {
        result.setEncoding('utf8');
        result.on('data', function (d) {
                responseData = responseData + d;
            })
            .on('end', function (result) {
                var responseBody = JSON.parse(responseData);
                if (responseBody.hasOwnProperty('data') && responseBody.data.length === 1) {
                    ActiveSubscriptions[subType] = responseBody.data[0].id;
                    console.log(`Initialized ${subType}, EventSub ID: ${ActiveSubscriptions[subType]}`);
                } else if (responseBody.hasOwnProperty('error')) {
                    console.error(`Error Initializing Redeem Sub`,`${responseBody.error}: ${responseBody.message}`);
                } else {
                    consolee.error(`Error Initializing Redeem Sub, Unable to Parse Response`,responseBody)
                }
            });
    });
    redeemListenerReq.on('error', (e) => { console.log(`Redeem Listener Initialize Error: ${e.message}`) });
    redeemListenerReq.write(JSON.stringify(redeemListenerBody));
    redeemListenerReq.end();
}

// delete the given event subscription
function endEventSubSubscription(subId) {
    // stop current EventSub Subscription
    var stopSubscriptionParams = {
        host: "api.twitch.tv",
        path: "helix/eventsub/subscriptions?id=" + subId,
        method: 'DELETE',
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            "Authorization": "Bearer "+ process.env.TWITCH_APP_BEARER
        }
    };
    var responseData = "";
    var listRequest = https.request(stopSubscriptionParams, (result) => {
        result.setEncoding('utf8');
        result.on('data', function (d) {
            responseData = responseData + d;
        })
        .on('end', function (result) {
            console.log(`Sub ${subId} Stopped`)
        });
    });
    listRequest.on('error', (e) => { console.log("Error") });
    listRequest.end()
}
