import React, { Component, useEffect } from 'react'
import './exp.css';
/*
import io from "socket.io-client";

const socket = io('/', {
  transports: ['websocket'],
  path: '/socket',
});
*/

//exp for each level
var levels = [100,200,300,400,500,600,700,800,900,1000];

class App extends Component { 
  constructor(props){ 
    super(props) 

    // Set initial state 
    this.state = {
      cumExp: 0, //cumulative exp
      exp: 0, //current exp per level
      level: 0, //current level
      fill : {width: 'calc(0%)'} //full string for css animation
    }
        
    // Binding this keyword 
    this.updateState = this.updateState.bind(this)
  } 

  updateState(){ 
    //pick a random provided value
    //This just picks a random value from the fake array
    var fakeValues = [10,20,30,40,50]
    var expInject = fakeValues[Math.floor(Math.random() * 5)]

    //contribute exp
    //Function call with sample value.
    this.updateBar(parseInt(expInject))
  }

  updateBar(incoming){
    this.setState({
      cumExp : this.state.cumExp+incoming,
      exp : this.state.exp+incoming
    });
    var cumExp = this.state.cumExp;
    var curExp = this.state.exp;
    var curLevel = this.state.level;

    if(curLevel == 10){
      console.log("MAX LEVEL")
      this.setState({
        fill : {width: 'calc(110%)'}
      });
    } else if(curExp >= levels[this.state.level]){
      this.setState({
        fill : {width: 'calc(100%)'},
        level: this.state.level+1,
        exp: 0
      });
      console.log("Level Up");
    }else{
      this.setState({
        fill : {width: 'calc('+((this.state.exp / levels[this.state.level])*100)+'%)'}
      });
      console.log("Grind More");
    }
    
    console.log(cumExp + " / " + curExp + " / " + curLevel);
  }

  /*
  useEffect(() => {
    socket.on('connection', () => {
      console.log('Socket connected...')
    });
  },[]);

  useEffect(() => {
    socket.on('update', message => {
      console.log(message);
      this.updateBar(message);
    });
  }, [])
  */
      
  render(){ 
    return ( 
      <div className="App" onClick={this.updateState}>
        <div className="full-bar">
          <div className="exp-level"><span className="content">{this.state.level}</span></div>
          <div className="exp-background">
            <div className="exp-bar" style={this.state.fill}></div>
            <div className="exp-foreground"></div>
          </div>
        </div>
      </div>
    ) 
  } 
} 
    
export default App;