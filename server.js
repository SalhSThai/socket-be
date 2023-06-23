const server = require("./app");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const chalk = require("chalk");

const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});
instrument(io, {
  auth: false,
});

const onlineUser = {};

io.use((socket, next) => {
  const userId = socket.handshake.auth.id;

  console.log(socket.id);
  console.log(userId);
  if (!userId) {
    console.log(chalk.red("error connect"));
    return next(new Error("invalid username"));
  }
  socket.userId = userId;
  onlineUser[userId] = socket.id;
  console.log(chalk.greenBright(`online : ${Object.keys(onlineUser).length}`));
  console.log(chalk.greenBright(`User connected ${socket.id}`));
  next();
});

io.on("connection", async (socket) => {
  console.log(onlineUser);
  io.emit("onlinefriends", onlineUser);

  socket.on("join_room", function (roomName) {
    socket.join(roomName);
    console.log(socket.rooms, "1");
  });

  socket.on("sendMessage", (input) => {
    console.log(input);
    socket.emit("receiveMessage", input);
    // socket.to(onlineUser[input?.to]).emit("receiveMessage", input);
  });

  socket.on("disconnect", () => {
    delete onlineUser[socket.userId];
    console.log(onlineUser);
    io.emit("onlinefriends", onlineUser);
    console.log("User Disconnected", socket.id, socket.userId, "userId");
  });
});

const port = process.env.PORT || 8080;
server.listen(port, () => console.log(`server running on port: ${port}`));
