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

const headLine = {
  textDecoration: "underline"
}
function Display(props) {

  const [room, changeRoom] = useState("X61whV3TLafhIwdZrees")
  const [lastCall, incrementCall] = useState(0);

  const [holdKeys, addKey] = useState([]);
  const [message, changeMessage] = useState("");

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
      let key = {...current.items[takeid]};
      key.used = false;
      addKey([...holdKeys, key]);
    }
  }

  function processInspectCommand(current, command) {
    const regex = new RegExp('^(inspect) (\\w+)$');
    let item = command.match(regex)[2];
    const inspectable = (current.inspectables).find(x => x.keyword === item);
   
    changeMessage(inspectable.message);
    if (inspectable.takeid) {
      addItemToInventory(current, current.items[inspectable.takeid]);
    }
  }

  function addKeyToUsedIfItExistsAndIsUnusedAndIsUsedAtTheRightPlace(current, command) {
    const regex = new RegExp('^(unlock) (\\w+)$');
    let direction = command.match(regex)[2];
   
    let key = holdKeys.findIndex(x => x[room] === direction);

    let alreadyFound = holdKeys[key].used;
   
    if (current?.locked[direction] && (key !== undefined) && !alreadyFound) {
      changeMessage("You've unlocked the door");
      let newArr = [...holdKeys];
      newArr[key].used = true;
      addKey([...newArr]);
    }
  }

  function respondToCommandFromProps(current) {
    changeMessage("");

    const inspectregex = new RegExp('^inspect ');
    const unlockregex = new RegExp('^unlock ');
    if (unlockregex.test(props.command)) {
      addKeyToUsedIfItExistsAndIsUnusedAndIsUsedAtTheRightPlace(current, props.command);
    }
    if (inspectregex.test(props.command)) {
      processInspectCommand(current, props.command);
    }
    else {
      let adjacentRooms = getAdjacentRooms(current);

      if (adjacentRooms[props.command] !== undefined) {

        if (current.locked?.[props.command]) {
          if (holdKeys.find(x => x[room] === props.command)) {
            if (holdKeys.find(x => x[current.id] === props.command && !x.used)) {
           
              changeMessage("You must use your key to unlock this door before you can open it.")
            }
            else {
              changeRoom(current[props.command])
            }
          }
          else {
            changeMessage("The door is locked.")
          }
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

  function displayKeys() {
    let display = "";
    let keys = holdKeys.filter(x => !x.used).length;
    if (keys > 0) {
      display += "You have " + keys + " key/s."
    }
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