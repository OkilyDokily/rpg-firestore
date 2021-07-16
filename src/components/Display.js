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

  const [room, changeRoom] = useState("beginning")
  const [lastCall, incrementCall] = useState(0);

  const [holdKeys, addKey] = useState({});
  const [message, changeMessage] = useState("");
  const directions = ["up", "down", "left", "right", "forward", "backward"];
  const [previousDirection, setPreviousDirection] = useState("backward");
  const [inspectableState, setInspectableState] = useState([]);
  const [portalGun, togglePortalGun] = useState(false);
  const [takeIdArray,addToTakeIdArray] = useState([]);

  useFirestoreConnect([
    { collection: 'rooms', storeAs: "rooms" }
  ]);

  const rooms = useSelector(state => state.firestore.ordered["rooms"])



  function addItemToInventory(item,takeid) {
    if (item.type === "key") {
      let key = { ...item }
      key.used = false;
      addKey({ ...holdKeys, [key.room]: { ...key } });
      addToTakeIdArray([...takeIdArray,takeid]);
    }
    if (item.type === "portalgun") {
      togglePortalGun({ ...item })
      addToTakeIdArray([...takeIdArray, takeid]);
    }
    
  }


  function processInspectCommand(current, command) {
    const regex = new RegExp('^(inspect) (\\w+)$');

    let item = command.match(regex)[2];
    const inspectable = (current.inspectables).find(x => x.keywords.includes(item));

    //prevent showing message for takeid that is already in inventory

    if (!takeIdArray.includes(inspectable.takeid) && inspectable.takeid !== undefined){
      changeMessage(inspectable.takemessage);
    }
    else{
      changeMessage(inspectable.message);
    }
    if(!takeIdArray.includes(inspectable.takeid))
    { 
      if (inspectable.takeid) {
        addItemToInventory(current.items[inspectable.takeid],inspectable.takeid);
      }
    }
  }

  function conditionallyAddKeyToUsed(current, command) {
    const regex = new RegExp('^(unlock) (\\w+)$');
    let direction = command.match(regex)[2];

    let key = Object.keys(holdKeys).find(x => holdKeys[room].direction === direction);

    let alreadyFound = holdKeys[key]?.used;

    if (current?.locked?.[direction] && key && !alreadyFound) {
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

  const [fumbled, toggleFumbled] = useState(false);
  function handleFumbleAround(current) {
    if (current.fumble) {
      changeMessage("You reach out and eventually find a string, maybe you should yank it?");
      toggleFumbled(!fumbled);
    }
  }

  function makeInspectablesVisible(current, arr) {
    arr.forEach(x => { setInspectableState([...inspectableState, current.inspectables[x].title]) });
  }

  function handleYank(current) {
    if (fumbled) {
      changeMessage("A speaker blares, and then there was light.");
      makeInspectablesVisible(current, [0]);
    }
  }

  function handleUsePortal(current) {
    if (portalGun) {
      let array = [...portalGun.rooms]
      let room = array[Math.floor(Math.random() * array.length)];
      changeRoom(room);
    }
  }

  function respondToCommandFromProps(current) {
    changeMessage("");

    const inspectregex = new RegExp('^inspect ');
    const unlockregex = new RegExp('^unlock ');
    const fumblearoundregex = new RegExp('^fumble around$');
    const yankregex = new RegExp('^yank');
    const useportalregex = new RegExp('^use portal$');

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
        else if (fumblearoundregex.test(props.command)) {
          handleFumbleAround(current);
        }
        else if (yankregex.test(props.command)) {
          handleYank(current);
        }
        else if (useportalregex.test(props.command)) {
          handleUsePortal(current);
        }
  }


  function handleShowDirection(direction) {
    if (["up", "down"].includes(direction)) {
      return direction;
    }
    else
      if (["left", "right", "forward"].includes(previousDirection)) {
        return a.showDirections[previousDirection][direction];
      }
      else {
        return direction;
      }
  }

  function handleToRoomDirection(direction) {
    if (["up", "down"].includes(direction)) {
      return direction;
    }
    else
      if (["left", "right", "forward"].includes(previousDirection)) {
        return a.toRoomDirections[previousDirection][direction];
      }
      else {
        return direction;
      }
  }


  function displayRooms(current) {

    let display = "Available directions: ";
    directions.forEach((x, index) => {
      if (current[x]) {
        display += "" + handleShowDirection(x) + ", "
      }
    }
    )
    display = display.slice(0, -2);
    display += ".";
    return display;
  }

  function displayInspect(current) {
    let display = "";
    if (current?.inspectables) {
      current.inspectables.forEach(x => {
        display += processInspectableItem(x);
      })
    }
    return display;
  }

  function processInspectableItem(item) {

    if (item.notvisible === true && !inspectableState.includes(item.title)) {
      return "";
    }
    else {
      return "You see  " + item.title + "\n";
    }
  }


  function displayKeys() {
    let display = "";
    let keys = Object.keys(holdKeys).filter(x => !holdKeys[x]?.used).length;
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
          {current.thought}
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