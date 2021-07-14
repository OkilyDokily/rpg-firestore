import React, { useState } from 'react'
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useFirestoreConnect, isLoaded } from 'react-redux-firebase';
import * as a from '../helpers/directions';

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


const headLine = {
  textDecoration: "underline"
}
function Display(props) {

  const [room, changeRoom] = useState("X61whV3TLafhIwdZrees")
  const [lastCall, incrementCall] = useState(0);

  const [holdKeys, addKey] = useState({});
  const [message, changeMessage] = useState("");
  const directions = ["up", "down", "left", "right", "forward", "backward"];
  const [previousDirection, setPreviousDirection] = useState("backward");
  console.log(previousDirection,"previousDirection")

  useFirestoreConnect([
    { collection: 'rooms', storeAs: "rooms" }
  ]);

  const rooms = useSelector(state => state.firestore.ordered["rooms"])


  function addItemToInventory(item) {
    if (item.type === "key") {
      let key = { ...item }
      key.used = false;
      addKey({ ...holdKeys, [key.room]: { ...key } });
    }
  }

  function processInspectCommand(current, command) {
    const regex = new RegExp('^(inspect) (\\w+)$');

    let item = command.match(regex)[2];
    const inspectable = (current.inspectables).find(x => x.keywords.includes(item));
    console.log(inspectable, "inspectable")
    changeMessage(inspectable.message);
    if (inspectable.takeid) {
      addItemToInventory(current.items[inspectable.takeid]);
    }
  }

  function conditionallyAddKeyToUsed(current, command) {
    const regex = new RegExp('^(unlock) (\\w+)$');
    let direction = command.match(regex)[2];

    let key = Object.keys(holdKeys).find(x => holdKeys[room].direction === direction);

    let alreadyFound = holdKeys[key]?.used;

    if (current?.locked[direction] && key && !alreadyFound) {
      changeMessage("You've unlocked the door");
      let newObj = { ...holdKeys };
      let newKey = { ...holdKeys[key] };
      newKey.used = true;
      addKey({ ...newObj, [room]: { ...newKey } });
    }
  }

  function handleChangeRoom(current, direction) {
    const roomDirection = handleToRoomDirection(direction);
   
    if (current[roomDirection]) {
      setPreviousDirection(a.oppositeDirections[roomDirection]);
      if (current.locked?.[roomDirection]) {
        if (Object.keys(holdKeys).find(x => holdKeys[room]?.direction === roomDirection)) {
          if (Object.keys(holdKeys).find(x => holdKeys[room]?.direction === roomDirection && holdKeys[room]?.used === false)) {

            changeMessage("You must use your key to unlock this door before you can open it.")
          }
          else {
            changeRoom(current[roomDirection])
          }
        }
        else {
          changeMessage("The door is locked.")
        }
      }
      else {
        changeRoom(current[roomDirection])
      }
    }
  }

  function respondToCommandFromProps(current) {
    changeMessage("");

    const inspectregex = new RegExp('^inspect ');
    const unlockregex = new RegExp('^unlock ');
    if (unlockregex.test(props.command)) {
      conditionallyAddKeyToUsed(current, props.command);
    } else
      if (inspectregex.test(props.command)) {
        processInspectCommand(current, props.command);
      } else
        if (/^(move|go|walk|run|travel) (\w+)$/.test(props.command)) {
          let direction = props.command.match(/^(move|go|walk|run|travel) (\w+)$/)[2];
          handleChangeRoom(current, direction);
        }
  }

  function handleShowDirection(direction) {
    if (previousDirection.includes(["left", "right", "forward"])) {
      return a.showDirections[previousDirection][direction];
    }
    else {
      return direction;
    }
  }

  function handleToRoomDirection(direction) {
    if (previousDirection.includes(["left", "right", "forward"])) {
      return a.toRoomDirections[previousDirection][direction];
    }
    else {
      return direction;
    }
  }

  function displayRooms(current) {

    let display = "Available directions\n";
    directions.forEach(x => {
      if (current[x]) {
        display += ":" + handleShowDirection(x) + ".\n"
      }
    }
    )
    return display;
  }

  function displayInspect(current) {
    let display = "Inspectables:\n";
    if (current?.inspectables) {
      current.inspectables.forEach(x => {
        display += "You see a " + x.title + ".\n"
      })
    }
    return display;
  }

  function displayKeys() {
    let display = "";
    let keys = Object.keys(holdKeys).filter(x => !holdKeys[x]?.used).length;
    if (keys > 0) {
      display += "You have " + keys + " key/s."
    }
    console.log("display key previous direction", previousDirection)
    return display;
  }


  if (isLoaded(rooms) && rooms !== undefined && rooms?.length) {

    let current = rooms.find(x => x.id === room);
 
    if (lastCall !== props.call) {
      respondToCommandFromProps(current);
      incrementCall(props.call);
    }

    return (
      <DisplayStyle>
        <div style={headLine}>{current.name}</div>
        <div>
          {current.message}
        </div>

        <div>
          {displayRooms(current)}
        </div>
        <div>
          {displayInspect(current)}
          {message}
        </div>
        <div>
          {displayKeys()}
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