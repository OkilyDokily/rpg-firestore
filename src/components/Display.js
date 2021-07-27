import React, { useState, useRef} from 'react'
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useFirestoreConnect, isLoaded } from 'react-redux-firebase';
import * as a from '../helpers/directions';
import { v4 as uuidv4 } from 'uuid';
import useInterval from '../hooks/useInterval'

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

const InnerDivs = styled.div`
  margin-bottom: 10px;
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
  const [takeIdArray, addToTakeIdArray] = useState([]);
  const [visitedArray, addToVisitedArray] = useState([]);
  const [hideItem, setHideItem] = useState(false);
  const [hasGlasses, setHasGlasses] = useState(false);

  const [gameOver, setGameOver] = useState(false);
  const [matrixLines, setMatrixLines] = useState([]);
 
  useFirestoreConnect([
    { collection: 'rooms', storeAs: "rooms" }
  ]);
  const [delay, setDelay] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
 
  useInterval(() => {
    addMatrixLinesFunc();
  }, isRunning ? delay : null);


  function addMatrixLinesFunc() {
    if (delay > 400){
      setDelay(400);
    }
    function returnOneOrZero() {
      return Math.floor(Math.random() * 2) === 1 ? 1 : 0;
    }
    const line = new Array(30).fill(1).map(() => returnOneOrZero()).join("");
    if (matrixLines.length <= 10) {
      
      setMatrixLines(x => [line,...x]);
    }
  
    else {
      setMatrixLines(x => [line,...x.slice(0,10)]); 
    } 
  }

  const rooms = useSelector(state => state.firestore.ordered["rooms"])

  function addItemToInventory(item, takeid) {
    if (item.type === "key") {
      let key = { ...item }
      key.used = false;
      addKey({ ...holdKeys, [key.room]: { ...key } });
      addToTakeIdArray([...takeIdArray, takeid]);
    }
    if (item.type === "portalgun") {
      togglePortalGun({ ...item })
      addToTakeIdArray([...takeIdArray, takeid]);
    }
  }

  function mysteryBoxStuff(current, item) {
    if ((current.inspectables).find(x => x.keywords.includes(item)) && current.id === "mysteryroom") {
      //return key to array so that it is reusable.
      addToTakeIdArray(takeIdArray.filter(x => x !== "vasekey"));
    }
  }

  function itemIsLockedAndNotKey(item, inspectable) {
    if (inspectable.locked && Object.keys(holdKeys).find(x => x.item === item)) {
      return false;
    }
    return true;
  }

  function itemPreviouslyOpened(inspectable) {
    return takeIdArray.includes(inspectable.takeid);
  }

  function processInspectCommand(current, command) {
    const regex = new RegExp('^(inspect) (\\w+)$');

    let item = command.match(regex)[2];

    const inspectable = (current.inspectables).find(x => x.keywords.includes(item));
    mysteryBoxStuff(current, item);

    //dont show the inspectable if being viewed/this is a clearable state.
    setHideItem(inspectable.title);

    //prevent showing message for takeid that is already in inventory
    if (inspectable.beforemessage !== undefined && itemIsLockedAndNotKey(item, inspectable) && !itemPreviouslyOpened(inspectable)) {
      changeMessage(inspectable.beforemessage)
    }
    else if (!takeIdArray.includes(inspectable.takeid) && inspectable.takeid !== undefined && !(inspectable.locked === true)) {
      changeMessage(inspectable.takemessage);
    }
    else {
      changeMessage(inspectable.message);
    }

    if (!takeIdArray.includes(inspectable.takeid) && !(inspectable.locked === true)) {
      if (inspectable.takeid) {
        addItemToInventory(current.items[inspectable.takeid], inspectable.takeid);
      }
    }
  }

  function handleUnlockBox(current) {
    if (current.id === "mysteryroom") {
      if (Object.keys(holdKeys).find(x => holdKeys["commonarea"].direction === "forward")) {
        const inspectable = current.inspectables.find(x => x.keywords.includes("box"))
        if (!itemPreviouslyOpened(inspectable)) {
          addToTakeIdArray([...takeIdArray, inspectable.takeid]);
          const newKey = { ...holdKeys["commonarea"] }
          newKey.used = true;
          addKey({ ...holdKeys, "commonarea": { ...newKey } })
          setHideItem(inspectable.title);
          changeMessage(inspectable.takemessage);
          setHasGlasses(true);
        }
      }
    }
  }

  function conditionallyAddKeyToUsed(current, command) {
    const regex = new RegExp('^(unlock) (\\w+)$');
    let direction = command.match(regex)[2];

    if (direction === "box") {
      handleUnlockBox(current);
      return;
    }

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
    if (current["glassesdirections"]?.includes(direction) && hasGlasses) {
      changeRoom(current["glasses" + direction]);
    }
    else if (!current.doorsinvisible === true || hasGlasses === true) {

      if (current[roomDirection]) {

        setPreviousDirection(a.oppositeDirections[roomDirection]);
        if (current.locked?.[roomDirection]) {
          if (Object.keys(holdKeys).find(x => holdKeys[room]?.direction === roomDirection)) {
            if (Object.keys(holdKeys).find(x => holdKeys[room]?.direction === roomDirection && holdKeys[room]?.used === false)) {
              changeMessage("You must use your key to unlock this door before you can open it. Try to <unlock> in the direction you need to go")
            }
            else {
              changeRoom(current[roomDirection])
              addToVisitedArray(...visitedArray, room);
            }
          }
          else {
            changeMessage("The door is locked.")
          }
        }
        else {
          changeRoom(current[roomDirection])
          addToVisitedArray(...visitedArray, room);
        }
      }
    }
  }

  function handleUsePortal(current) {
    if (portalGun) {
      let array = [...portalGun.rooms.filter(x => x !== room)];
      let roomResult = array[Math.floor(Math.random() * array.length)];
      setPreviousDirection("backward");
      changeRoom(roomResult);
    }
  }

  function handleGoInMatrix(current) {
    if (current.id === "matrix") {
      changeMessage();
      setGameOver(true);
      console.log(current.matrixmessage);
      setMatrixLines(["\u2007", current.specialmessages[1]]);
      setIsRunning(true);
    }
  }

  function clearClearables() {
    changeMessage("");
    setHideItem(false);
  }

  function respondToCommandFromProps(current) {
    clearClearables();
    const inspectregex = new RegExp('^inspect ');
    const unlockregex = new RegExp('^unlock ');
    const fumblearoundregex = new RegExp('^fumble around$');
    const yankregex = new RegExp('^yank');
    const useportalregex = new RegExp('^use portal$');
    const goin = new RegExp('^go in$');
    const transport = new RegExp('^transport ');
    const wearglasses = new RegExp('^wear glasses$');

    if (!gameOver) {
      if (unlockregex.test(props.command)) {
        conditionallyAddKeyToUsed(current, props.command);
      }
      else if (goin.test(props.command)) {
        handleGoInMatrix(current);
      }
      else if (inspectregex.test(props.command)) {
        processInspectCommand(current, props.command);
      }
      else if (/^(move|go|walk|run|travel) (\w+)$/.test(props.command)) {
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
      else if (transport.test(props.command)) {
        let room = props.command.match(/^transport (\w+)$/)[1];
        changeRoom(room);
      }
      else if (wearglasses.test(props.command)) {
        setHasGlasses(true);
      }
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

  function displayDirections(current) {
    let display = "Available directions: ";

    if (!current.doorsinvisible === true || hasGlasses === true) {
      directions.forEach((x, index) => {
        if (current[x]) {
          display += "" + handleShowDirection(x) + ", "
        }
      }
      )
    }
    display = display.slice(0, -2);
    display += ".";
    if (display !== "Available directions.`<go> <direction>`") {
      return display;
    }
    return "";
  }

  function displayInspect(current) {
    let display = "<inspect>";

    if (current?.inspectables) {
      current.inspectables.forEach(x => {
        display += processInspectableItem(x);
      })
    }
    return display;
  }

  function processInspectableItem(item) {
    if (hideItem === item.title) {
      return "";
    }
    if (item.notvisible === true && !inspectableState.includes(item.title)) {
      return "";
    }
    else if (item.takentitle && takeIdArray.includes(item.takeid)) {
      return "You see  " + item.takentitle + "\n";
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

  function makeInspectablesVisible(arr) {
    arr.forEach(x => { setInspectableState([...inspectableState, x.title]) });
  }

  function removeInspectablesFromVisible(arr) {
    arr.forEach(x => { setInspectableState(inspectableState.filter(y => y !== x.title)) });
  }

  // special state functions for walkincloset
  const [fumbled, toggleFumbled] = useState(false);
  function handleFumbleAround(current) {
    if (current.fumble && !yanked && !fumbled) {
      toggleFumbled(!fumbled);
    }
  }

  const [yanked, toggleYanked] = useState(false);
  function handleYank(current) {
    if (current.fumble && fumbled && !yanked) {
      toggleYanked(true);
      makeInspectablesVisible(current.inspectables);
    }
    else if (current.fumble && yanked && fumbled) {
      toggleYanked(false);
      toggleFumbled(false);
      removeInspectablesFromVisible(current.inspectables);
    }
  }

  const [blared, toggleBlared] = useState(false);
  function processSpecialRoomMessages(current) {
    if (current.id === "walkincloset") {
      if (fumbled !== true) {
        return current.specialmessages[0];
      }
      else if (fumbled === true && yanked !== true) {
        return current.specialmessages[1];
      }
      else if (fumbled === true && yanked === true && blared !== true) {
        changeMessage(current.specialmessages[2]);
        toggleBlared(true);
        return "";
      }
    }
    else if (current.id === "matrix") {
      if (gameOver === true) {
        return current.specialmessages[1];
      }
      else {
        return current.specialmessages[0];
      }
    }
  }

  function processThought(current) {
    if (current.glassesthought !== undefined && hasGlasses === true) {
      return current.glassesthought;
    }
    else {
      return current.thought;
    }
  }


  if (isLoaded(rooms) && rooms !== undefined && rooms?.length) {

    let current = rooms.find(x => x.id === room);

    if (lastCall !== props.call) {
      respondToCommandFromProps(current);
      incrementCall(props.call);
    }

    if (gameOver !== true) {
      return (
        <DisplayStyle>
          <InnerDivs style={headLine}>{current.name}</InnerDivs>
          <InnerDivs >
            {current.message}
          </InnerDivs>
          <InnerDivs >
            {processSpecialRoomMessages(current)}
          </InnerDivs>
          <InnerDivs>
            {message}
          </InnerDivs>
          <InnerDivs >
            {processThought(current)}
          </InnerDivs>
          <InnerDivs>
            {displayDirections(current)}
          </InnerDivs>
          <InnerDivs>
            {displayInspect(current)}
          </InnerDivs>
          <InnerDivs>
            {displayKeys()}
          </InnerDivs>
        </DisplayStyle>
      )
    }
    else {
      return (
        <DisplayStyle>

          {matrixLines.map(x => {
            return <InnerDivs key={uuidv4()}>{x}</InnerDivs>
          })}

        </DisplayStyle>
      )
    }
  }
  else {
    return (
      <DisplayStyle>

      </DisplayStyle>
    )
  }

}





export default Display;