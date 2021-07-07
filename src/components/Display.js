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
  const [lastCommand, changeLastCommand] = useState("none");

  const [holdKeys, addKey] = useState("none");
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
    if (current[takeid]?.type === "key") {

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


        }
        else {
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

  function displayTake(current) {

  }

  if (isLoaded(rooms) && rooms !== undefined && rooms?.length) {

    let current = rooms.find(x => x.id === room);

    if (lastCommand !== props.command) {
      changeLastCommand(props.command);

      respondToCommandFromProps(current);
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
        <div>
          {displayTake(current)}
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