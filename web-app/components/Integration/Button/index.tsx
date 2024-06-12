/** @jsxImportSource theme-ui */
import React from 'react';

const getUrl = (baseUrl, searchParams) => {
	const url = new URL(baseUrl);

	Object.entries(searchParams).map(([attribute, value]) => {
		url.searchParams.set(attribute, value);
	});

	return url.toString();
};

const integrations = {
	discord: {
		baseUrl: 'https://discord.com/api/oauth2/authorize',
		id: 'connect-to-discord',
		label: 'Connect to Discord',
		searchParams: {
			client_id: process.env.DISCORD_CLIENT_ID,
			response_type: 'code',
			scope: 'identify',
		},
		testId: 'action_connect-to-discord',
		variant: 'buttons.discord',
	},
	twitch: {
		baseUrl: 'https://id.twitch.tv/oauth2/authorize',
		id: 'connect-to-twitch',
		label: 'Connect to Twitch',
		searchParams: {
			client_id: process.env.TWITCH_CLIENT_ID,
			response_type: 'code',
			scope: 'user:read:email',
		},
		testId: 'action_connect-to-twitch',
		variant: 'buttons.twitch',
	},
};

export default function Button({
	integration,
	redirectUri,
}) {
	const context = integrations[integration];
	context.searchParams.redirect_uri = redirectUri;
	return <>
		<a
			data-test={context.testId}
			href={getUrl(context.baseUrl, context.searchParams)}
			id={context.id}
			sx={{
				variant: context.variant,
			}}
		>{context.label}</a>
	</>;
}
