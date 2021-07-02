import React, { useState,useEffect } from 'react'
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


  useEffect((prevProps)=>
  {

  })

  useFirestoreConnect([
    { collection: 'rooms', storeAs: "rooms" }
  ]);

  const rooms = useSelector(state => state.firestore.ordered["rooms"])

  function getAdjacentRooms(current) {
    console.log(current,"current")
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

  function respondToCommandFromProps(current){
    if (getAdjacentRooms(current)[props.command].id !== undefined && getAdjacentRooms(current)[props.command].id !== room) {
      changeRoom(current[props.command].id)
    }
  }
 

  function displayRooms(current) {

    let obj = getAdjacentRooms(current);
    let display = "\n";
    Object.keys(obj).forEach(x => {
      if (obj[x] !== undefined) {
        display += "To your " + x + " is the " + obj[x].name + ".\n"
      }
    }
    )
    return display;
  }

  if (isLoaded(rooms) && rooms !== undefined && rooms?.length) {
    let current = rooms.find(x => x.id === room);
    respondToCommandFromProps();
    
    return (
      <DisplayStyle>
        {current.message}
        {displayRooms(current)}
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