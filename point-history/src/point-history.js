import React, { Component } from 'react'
import './point-history.css';

//Fake variables for sources
var cumFaction = ['Creatures','Undead','Monsters'];
var cumSource = ['Offerings','Dailies'];

class pointHistory extends Component { 
  constructor(props){ 
    super(props);

    this.displayData = [];

    this.state = {
      domDisplay : this.displayData
    }

    this.updateState = this.updateState.bind(this);
  } 

  updateState(){ 
    //Generate a fake data stream for testing and animation

    this.updateHistory(cumFaction[Math.floor(Math.random() * 3)],Math.floor(Math.random() * 100),cumSource[Math.floor(Math.random() * 2)],"ReallyLongUserName");
  }

  updateHistory(cumFaction,cumValue,cumSource,cumName){
    //targetFaction pointValue | memo | TwitchName
    //console.log(cumFaction + " " + cumValue + " | " + cumSource + " | " + cumName);
    
    var newElement = {
      showFaction: cumFaction,
      showValue: cumValue,
      showSource: cumSource,
      showName: cumName
    };

    this.displayData.unshift(newElement);
    console.log(this.state.domDisplay);
    this.setState({
        domDisplay : this.displayData
    });

  }

  render(){
    var data = this.state.domDisplay;
    return ( 
      <div className="App" onClick={this.updateState}>
          {data.map(function(d, idx){
            var factionClass = "pointFaction " + d.showFaction.toLowerCase();
            return (<div className="pointCapsule" key={idx}><div className={factionClass}>{d.showFaction} {d.showValue}</div><div className="pointType">{d.showSource}</div><div className="pointUser">{d.showName}</div></div>)
          })}
      </div>
    ) 
  }
};

    
export default pointHistory;