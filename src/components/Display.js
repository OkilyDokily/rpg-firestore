import React, { useState } from 'react'
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useFirestoreConnect, isLoaded } from 'react-redux-firebase';

const DisplayStyle = styled.div`
  font-size: 24px;
  font-family: Consolas;
  text-align: left;
  background-color: black;
  padding: 10px;
  color: green;
  width: 400px;
  height: 400px;
`;


function Display(props) {


  const [room, changeRoom] = useState("X61whV3TLafhIwdZrees")
  const [lastCall,changeLastCall] = useState(0);

  const [holdKeys, addKey] = useState([]);
  const [inspectMessage, addMessage] = useState("");
  
  useFirestoreConnect([
    { collection: 'rooms', storeAs: "rooms" }
  ]);



  const rooms = useSelector(state => state.firestore.ordered["rooms"])


  function getAdjacentRooms(current) {

    let obj = {
      left: rooms.find(x => x.id === current.left),
      right: rooms.find(x => x.id === current.right),
      forward: rooms.find(x => x.id === current.forward),
      backward: rooms.find(x => x.id === current.backward),
      up: rooms.find(x => x.id === current.up),
      down: rooms.find(x => x.id === current.down)
    }

    return obj;
  }
  function addItemToInventory(current, takeid) {

    if (current?.items[takeid]?.type === "key") {
      addKey([...holdKeys, current.items[takeid]]);
    }
  }

  function revealMessage(current, command) {
    const regex = new RegExp('^(inspect) (\\w+)$');
    let result = command.match(regex)[2];
    addMessage(current.inspect?.[result].message);
    if (current.inspect?.[result]?.takeid) {
     
      addItemToInventory(current, current.inspect?.[result]?.takeid);
    }
  }

  function respondToCommandFromProps(current) {
    const regex = new RegExp('^inspect ');
    if (regex.test(props.command)) {
      revealMessage(current, props.command);
    }
    else {
      let adjacentRooms = getAdjacentRooms(current);

      if (adjacentRooms[props.command] !== undefined) {

        if (current.locked?.[props.command]) {
          if(holdKeys.find(x=>x[room] === props.command)){
            addMessage("");
            changeRoom(current[props.command])
          }
        }
        else {
          addMessage("");
          changeRoom(current[props.command])
        }
      }
    }

  }


  function displayRooms(current) {

    let obj = getAdjacentRooms(current);
    let display = "Options\n";
    Object.keys(obj).forEach(x => {
      if (obj[x] !== undefined) {
        display += ":" + x + ".\n"
      }
    }
    )
    return display;
  }

  function displayInspect(current) {
    let display = "Inspectables:\n";
    if (current?.inspect) {
      Object.keys(current.inspect).forEach(x => {
        display += "You see a :" + x + ".\n"
      })
    }
    return display;
  }


  if (isLoaded(rooms) && rooms !== undefined && rooms?.length) {

    let current = rooms.find(x => x.id === room);
 
    if (lastCall !== props.call) {
      respondToCommandFromProps(current);
      changeLastCall(props.call);
    }

    return (
      <DisplayStyle>
        <div>{current.name}</div>
        <div>
          {current.message}
        </div>

        <div>
          {displayRooms(current)}
        </div>
        <div>
          {displayInspect(current)}
          {inspectMessage}
        </div>
      </DisplayStyle>
    )
  }
  else {
    return (
      <DisplayStyle>

      </DisplayStyle>

    )
  }
}

export default Display;