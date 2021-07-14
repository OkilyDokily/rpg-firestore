export const showDirections = {
  right: {
    forward: "right",
    backward: "left",
    left: "forward",
    right: "backward"
  },
  left: {
    forward: "left",
    backward: "right",
    left: "backward",
    right: "forward"
  }
  ,
  forward: {
    forward: "backward",
    backward: "forward",
    left: "right",
    right: "left"
  }
}

export const oppositeDirections = {
  right: "left",
  left: "right",
  forward: "backward",
  backward: "forward"
}

export const toRoomDirections = {
  right: {
    right: "forward",
    left: "backward",
    forward: "left",
    backward: "right"
  },
  left: {
    left: "forward",
    right: "backward",
    backward: "left",
    forward: "right"
  }
  ,
  forward: {
    backward: "forward",
    forward: "backward",
    right: "left",
    left: "right"
  }
}
