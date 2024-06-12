// load environment variables
require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const https = require('https');
const path = require("path");
const AhogeManager = require('./helpers/ahoge');
const EventSub = require('./helpers/eventSub');
const FactionPoints = require('./helpers/factionPoints');
const authenticate = require('./model/authenticate');
const mongoHandler = require('./helpers/mongoHandler');

// redirect console output to log files
let logConsoleStream = fs.createWriteStream('./logs/console.log', { flags: 'a' });
let logErrorStream = fs.createWriteStream('./logs/error.log', { flags: 'a' });
process.stdout.write = logConsoleStream.write.bind(logConsoleStream);
process.stderr.write = logErrorStream.write.bind(logErrorStream);
process.on('uncaughtException', function (ex) {
	console.error(ex);
});

// initial db connection
mongoHandler.connectToServer((err, client) => {
	if (err) console.log(err)

	// express setup
	const app = express();
	var http = require('http').createServer(app);

	// variables needed for twitch calls
	const callbackUrl = process.env.CALLBACK_URL;
	const port = process.env.PORT || 6336;
	const twitchSigningSecret = process.env.TWITCH_SIGNING_SECRET;

	// start listening for gets/posts
	const listener = app.listen(port, () => {
		console.log("Your app is listening on port " + listener.address().port);
	});

	// initialize faction overview socket
	const io = require('socket.io')(listener, {
		path: '/socket',
		rejectUnauthorized: 'false'
	});

	// holds recent EventSub event IDs to prevent consuming duplicates
	let recentNotifIds = new Set();

	// Welcome Screen
	app.get("/", (req, res) => {
		res.send("perish.");
	});

	// easter egg :3
	app.get("/snocket", (req, res) => {
		res.send("This is where Nexilitus goes genera421Oops");
	});

	app.get('/auth', async (req, res) => {
		const url = new URL(req.query.clientUrl);
		const authData = await authenticate(req.query);

		res.cookie(`${authData.type}-token`, authData.access_token, {
			httpOnly: true,
			maxAge: authData.expires_in,
			sameSite: 'Strict',
		});

		res.redirect(url);
	});

	// Display active EventSub subscriptions (only in test mode)
	if (process.env.TEST_ENV == "true") {
		app.get('/listWebhooks', (req, res) => {
			var createWebHookParams = {
				host: "api.twitch.tv",
				path: "helix/eventsub/subscriptions",
				method: 'GET',
				headers: {
					"Client-ID": process.env.TWITCH_CLIENT_ID,
					"Authorization": "Bearer " + process.env.TWITCH_APP_BEARER
				}
			};
			var responseData = "";
			var listRequest = https.request(createWebHookParams, (result) => {
				result.setEncoding('utf8');
				result.on('data', function (d) {
					responseData = responseData + d;
				})
					.on('end', function (result) {
						var responseBody = JSON.parse(responseData);
						res.send(responseBody);
					});
			});
			listRequest.on('error', (e) => { console.log("Error") });
			listRequest.end();
		});
	}

	// verify signature of twitch even, check the "Verifying the event message" section of https://dev.twitch.tv/docs/eventsub/handling-webhook-events
	const verifyTwitchSignature = (req, res, buf, encoding) => {
		const messageId = req.header("Twitch-Eventsub-Message-Id");
		const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
		const messageSignature = req.header("Twitch-Eventsub-Message-Signature");

		const time = Math.floor(new Date().getTime() / 1000);

		if (Math.abs(time - timestamp) > 600) {
			// must be < 10 minutes
			console.log(`Verification Failed: timestamp > 10 minutes. Message Id: ${messageId}.`);
			throw new Error("Ignore this request.");
		}

		if (!twitchSigningSecret) {
			console.log(`Twitch signing secret is empty`);
			throw new Error("Twitch signing secret is empty");
		}

		const computedSignature =
			"sha256=" +
			crypto
				.createHmac("sha256", twitchSigningSecret)
				.update(messageId + timestamp + buf)
				.digest("hex");

		if (messageSignature !== computedSignature) {
			//throw new Error("Invalid Signature.");
			console.log("Verification failed");
			res.status(403).send("Forbidden");
		}
	};

	// use verification function as express middleware
	app.use(express.json({ verify: verifyTwitchSignature }));

	// endpoint for handling EventSub events
	app.post("/notification", async (req, res) => {
		const messageType = req.header("Twitch-Eventsub-Message-Type");
		// must reply with 200 status/verify before any processing
		if (messageType === "webhook_callback_verification") {
			console.log("Verifying Webhook");
			return res.status(200).send(req.body.challenge);
		} else {
			res.status(200).end();
		}

		const { type } = req.body.subscription;
		const { event } = req.body;

		if (req.header("Twitch-Eventsub-Message-Type") === "notification") {
			// log event if in debug mode
			if (process.env.DEBUG == "true") { console.log(type); console.log(event); }

			// make sure this event has not been received already
			if (!recentNotifIds.has(event.id)) {
				// add event id to recents notif list
				recentNotifIds.add(event.id);

				// there's some kinda iffy race condition fucky wucky goin on in here
				if (type != "stream.online" && type != "stream.offline" && type != "channel.channel_points_custom_reward_redemption.add") {
					AhogeManager.addXp(type, event);
				}
				// parse out the title of the redeem
				else if (type === "channel.channel_points_custom_reward_redemption.add") {
					FactionPoints.parseFactionPoints(event);
				}
				else if (type == "stream.online") {
					AhogeManager.streamOnline();
				}
				else if (type == "stream.offline") {
					AhogeManager.streamOffline();
				}
			}
		}
		else if (req.header("Twitch-Eventsub-Message-Type") === "revocation") {
			console.log("EventSub Subscription Revoked");
			recentNotifIds.clear();
			EventSub.initializeRedeemSubscription(req.body.type);
		}
		else {
			console.log(`Message type ${req.header("Twitch-Eventsub-Message-Type")} not recognized as command.`);
			console.log(req);
		}
	});

	// START EVENTSUB SUBSCRIPTION FOR CHANNEL REDEEMS
	if (process.env.LISTEN_EVENTS == "true") {
		EventSub.getEventSubSubscriptions();
	}

	// ---------------------------- LIVE FACTION VIEW CODE ----------------------------

	// client list to maintain
	var clients = {};

	// load the table that holds points
	var db = mongoHandler.getDb();
	const collection = db.collection('sprints');

	// handle new socket connections
	io.on('connection', (socket) => {
		var id = socket.id;
		var ip = socket.request.connection.remoteAddress;
		clients[id] = { socket: socket, ip: ip }

		clients[id].socket.emit('connection', null);

		clients[id].socket.on('disconnect', () => {
			delete clients[id];
		});

		clients[id].socket.on('connect_error', () => {
			console.log(`Connection error detected from socket ${id} at IP: ${ip}`);
		});

		// initialize faction values for new sockets
		query = { "discordServer": process.env.DISCORD_SERVER_ID, "sprintEnd": { "$exists": false } }
		collection.find(query).toArray(function (err, result) {
			if (err)
				throw err;

			for (const faction of result) {
				clients[id].socket.emit('update', { faction: faction["faction"], total: faction["total"] });
			}
		});
	});

	// create change stream to emit point updates to all sockets
	const pipeLine = [{ $match: { 'fullDocument.discordServer': process.env.DISCORD_SERVER_ID } }];
	const changeStream = collection.watch(pipeLine, { fullDocument: 'updateLookup' });
	changeStream.on('change', next => {
		io.emit('update', { faction: next.fullDocument.faction, total: next.fullDocument.total });
	});

	app.use(express.static(path.join(__dirname, 'factionLiveView/build')));
	app.get('/factionOverview', function (req, res) {
		res.sendFile(path.join(__dirname, 'factionLiveView/build', 'index.html'));
	});
});
