import React,{useState} from 'react'
import styled from 'styled-components';
import { useFirestoreConnect, isLoaded } from 'react-redux-firebase';

const DisplayStyle = styled.div`
  font-size: 24px;
  text-align: left;
  background-color: black;
  padding: 10px;
  color: green;
  width: 300px;
  height: 300px;
`;


function Display(){
  const [room, changeRoom] = useState("X61whV3TLafhIwdZrees")

  useFirestoreConnect([
    { collection: 'room', doc: room, storeAs: "room" }
  ]);

  const room = useSelector(state => state.firestore.ordered["quizzes"])

  return (
   <DisplayStyle>
     
   </DisplayStyle>
  )
}

export default Display;