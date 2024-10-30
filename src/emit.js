import socket from "./connect";

export function moveBot(direction) {
  socket.emit("move", {orient: direction});
}

export function shoot() {
  socket.emit("shoot");
}
