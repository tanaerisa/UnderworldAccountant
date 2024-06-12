// load environment variables
require("dotenv").config();
require('./dbLog')

const https = require('https');

// Client for DB access
var mongoHandler = require('./mongoHandler')

// get tokens from json file
const fs = require("fs");

var currentAuthToken = "";
var currentRefreshToken = "";
const date = new Date().toISOString().slice(0,19)

exports.clientAuthToken = () => { return currentAuthToken; }

//exports.refreshOAuth = () => {
var refreshOAuth = function () {
    console.log("inside refreshOAuth, before promise")
    return new Promise(function(resolve, reject) {
        console.log("inside promise")
        var refreshRequestParams = {
            method: 'POST',
            host: "id.twitch.tv",
            path: "oauth2/token",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        var refreshRequestBody = {
            "grant_type": "refresh_token",
            "refresh_token": currentRefreshToken,
            "client_id": process.env.TWITCH_CLIENT_ID,
            "client_secret": process.env.TWITCH_CLIENT_SECRET
        }

        var responseData = "";
        var refreshRequest = https.request(refreshRequestParams, (result) => {
            result.setEncoding('utf8');
            result.on('data', function(d) {
                responseData = responseData + d;
            })
            .on('end', function(result) {
                var responseBody = JSON.parse(responseData);
                console.log(responseBody);
                if (responseBody.hasOwnProperty("access_token") && responseBody.hasOwnProperty("refresh_token")) {
                    // log success
                    const date = new Date().toISOString().slice(0,19)
                    console.log(`${date} Client Credentials Refreshed`)
                    console.log(`${date} access_token: ${responseBody.access_token}`)
                    console.log(`${date} refresh_token: ${responseBody.refresh_token}`)

                    // insert new tokens to database
                    tokenLog(responseBody.access_token, responseBody.refresh_token)

                    // update token values
                    currentAuthToken = responseBody.access_token
                    currentRefreshToken = responseBody.refresh_token

                    // write new token values to json file
                    jsonData = JSON.stringify({access_token: responseBody.access_token, refresh_token: responseBody.refresh_token})
                    fs.writeFile("../oauth.json", JSON.stringify(jsonData), err => {
                        if (err)
                            console.error(`COULD NOT UPDATE JSON FILE WITH NEW CLIENT TOKENS: access_token ${responseBody.access_token}, refresh_token ${responseBody.refresh_token}`)
                    })
                    resolve(`New Client Token: ${currentAuthToken}`)
                }
            })
        });
        refreshRequest.on('error', (e) => { console.log(`Client Token Refresh Error: ${e.message}`); reject(e) });
        refreshRequest.write(JSON.stringify(refreshRequestBody));
        refreshRequest.end();
    });
}
exports.refreshOAuth = refreshOAuth()
