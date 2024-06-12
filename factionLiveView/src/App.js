import React, { useState, createRef, useEffect } from 'react';
import './App.scss';
import AnimateLeaderboard from "./leaderboard/animateLeaderboard"
import Faction from './leaderboard/faction';
import factionList from "./leaderboard/factionList"
import io from "socket.io-client";

const socket = io('/', {
  transports: ['websocket'],
  path: '/socket',
});

export default function App() {
  const [factions, setFactions] = useState(factionList);

  let search = window.location.search;
  let layout = (new URLSearchParams(search).get('horizontal') != null) ? "horizontal" : "vertical";

  useEffect(() => {
      socket.on('connection', () => {
          console.log('Socket connected...')
      });
  },[]);

  useEffect(() => {
      socket.on('update', message => {
          const sortedFactions = [...factions]
          sortedFactions.forEach(fac => {
              if (fac.factionName === message.faction) {
                  fac.total = message.total
              }
          });
          sortedFactions.sort((a,b) => {if(a.total > b.total) return -1; if(a.total < b.total) return 1; return 0;});
          setFactions(sortedFactions);
      });
  }, [])

  return (
    <div className="App">
      <div className='faction-leaderboard'>
          <AnimateLeaderboard>
              {factions.map(({factionName,total}) => (
                  <Faction key={factionName} name={factionName} total={total} layout={layout} ref={createRef()} />
              ))}
          </AnimateLeaderboard>
      </div>
    </div>
  );
}