const { io } = require("socket.io-client");
const socket_server = "https://zarena-dev1.zinza.com.vn"
const socket = io(socket_server, {
  auth: {
    token: process.env.TOKEN
  },
  transports: ['websocket']
});

export default socket;