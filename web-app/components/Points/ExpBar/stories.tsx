import React from 'react';
import ExpBar from './index';

const config = {
	component: ExpBar,
	title: 'Points / ExpBar',
};

const Template = (args) => <ExpBar {...args} />;

export const Empty = Template.bind({});
Empty.args = {
	integration: 'Empty',
	width: 0
};

export const Full = Template.bind({});
Full.args = {
	integration: 'Full',
	width: 100
};

export default config;
