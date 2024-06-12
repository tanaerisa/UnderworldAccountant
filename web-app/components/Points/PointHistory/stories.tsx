import React from 'react';
import PointHistory from './index';

const config = {
	component: PointHistory,
	title: 'Points / PointHistory',
};

const Template = (args) => <PointHistory {...args} />;

export const Creatures = Template.bind({});
Creatures.args = {
	integration: 'Creatures',
	id: "Creatures",
	value: "+10",
	source: 'Dailies',
	userName: 'ReallyLongUsername'
};

export const Undead = Template.bind({});
Undead.args = {
	integration: 'Undead',
	id: "Undead",
	value: "+10",
	source: 'Dailies',
	userName: 'ReallyLongUsername'
};

export const Monsters = Template.bind({});
Monsters.args = {
	integration: 'Monsters',
	id: "Monsters",
	value: "+10",
	source: 'Dailies',
	userName: 'ReallyLongUsername'
};

export default config;
