import React from 'react';
import Button from './index';

const config = {
	component: Button,
	title: 'Integration / Button',
};

const Template = (args) => <Button {...args} />;
const redirectUri = 'http://localhost:6336/auth/?clientUrl=http://localhost:6006/&type=';

export const Discord = Template.bind({});
Discord.args = {
	integration: 'discord',
	redirectUri: redirectUri + 'discord',
};

export const Twitch = Template.bind({});
Twitch.args = {
	integration: 'twitch',
	redirectUri: redirectUri + 'twitch',
};

export default config;
