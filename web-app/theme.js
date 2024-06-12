import { roboto } from '@theme-ui/presets';

const theme = {
	...roboto,
	colors: {
		discordBlue: '#5865F2',
		twitchPurple: '#9146FF',
	},
	buttons: {
		discord: {
			color: 'white',
			bg: 'discordBlue',
			border: '1rem #5865F2 solid',
			borderRadius: 7,
			':hover': {
				bg: '#4650c1',
				border: '1rem #4650c1 solid',
				transition: 'background-color 0s',
			}
		},
		twitch: {
			color: 'white',
			bg: 'twitchPurple',
			border: '1rem #9146FF solid',
			borderRadius: 7,
			':hover': {
				bg: '#7438cc',
				border: '1rem #7438cc solid',
				transition: 'background-color 0s',
			}
		},
	},
};

export default theme;
