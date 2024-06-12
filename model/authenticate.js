const axios = require('axios');
const qs = require('qs');

const integrations = {
	discord: {
		clientId: process.env.DISCORD_CLIENT_ID,
		clientSecret: process.env.DISCORD_CLIENT_SECRET,
		tokenUrl: 'https://discord.com/api/oauth2/token',
	},
	twitch: {
		clientId: process.env.TWITCH_CLIENT_ID,
		clientSecret: process.env.TWITCH_CLIENT_SECRET,
		tokenUrl: 'https://id.twitch.tv/oauth2/token',
	},
};

const authenticate = async ({ clientUrl, type, code }) => {
	const integration = integrations[type];
	return await axios.post(
		integration.tokenUrl,
		qs.stringify({
			client_id: integration.clientId,
			client_secret: integration.clientSecret,
			code,
			grant_type: 'authorization_code',
			redirect_uri: `${process.env.OAUTH_BASE_REDIRECT_URL}/auth/?clientUrl=${clientUrl}&type=${type}`,
		})
	).then((response) => {
		return {
			...response.data,
			type,
		};
	});
};

module.exports = authenticate;
