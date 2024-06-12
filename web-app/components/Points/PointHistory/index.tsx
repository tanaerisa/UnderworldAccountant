/** @jsxImportSource theme-ui */
import React from 'react';
import './assets/pointhistory.css';

const integrations = {
	Creatures: {
    id: "Creatures",
    value: "+10",
    source: 'Dailies',
		userName: 'ReallyLongUsername'
	},
	Undead: {
    id: "Undead",
    value: "+10",
    source: 'Dailies',
		userName: 'ReallyLongUsername'
	},
	Monsters: {
    id: "Monsters",
    value: "+10",
    source: 'Dailies',
		userName: 'ReallyLongUsername'
	},
};

export default function PointHistory({
	integration,
}) {
	const context = integrations[integration];
	return <>
		<div className="PointHistory">
			<div className="pointCapsule"><div className={"pointFaction " + (context.id).toLowerCase()}>{context.id} {context.value}</div><div className="pointType">{context.source}</div><div className="pointUser">{context.userName}</div></div>
		</div>
	</>;
}
