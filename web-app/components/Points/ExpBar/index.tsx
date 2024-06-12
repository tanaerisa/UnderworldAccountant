/** @jsxImportSource theme-ui */
import React from 'react';
import './assets/exp.css';

const integrations = {
	Empty: {
    id: "Empty",
    level: 0,
    width: '0%'
	},
	Full: {
    id: "Full",
    level: 10,
    width: '100%'
	},
};

export default function ExpBar({
	integration,
}) {
	const context = integrations[integration];
	return <>
      <div className="ExpBar">
        <div className="full-bar">
          <div className="exp-level"><span className="content">{context.level}</span></div>
          <div className="exp-background">
            <div className="exp-bar" sx={{width: context.width}}></div>
            <div className="exp-foreground"></div>
          </div>
        </div>
      </div>
	</>;
}
