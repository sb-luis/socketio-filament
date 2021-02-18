const addContact = require('./addContact');
const deleteContact = require('./deleteContact');
const addMessage = require('./addMessage');
const friendOnline = require('./checkIfContactOnline');
const deleteAccount = require('./deleteAccount');
const messageRead = require('./messageRead');
const messageUnread = require('./messageUnread');

module.exports = (io) => {

  //START SOCKET CONNECTION
  io.on('connection', async (socket) => {
    //If for some reason we don´t have access to the user object don´t bother to read the rest of the code.
    if (!socket.request.user)
      return console.log(
        `No username was found when a connection to the socket was established.`
      );

    //Get my name and my user
    let name = socket.request.user.username;
    socket.mainSocket = false;
    socket.join(`${name}`); //Socket joins group.

    if (!usersOnline[name]) {
      //First time the user connects we add it to our dictionary.
      console.log(`${name} is online.`);
      usersOnline[name] = socket.id;
      socket.mainSocket = true;

      //Notify I´m logging on to my friends
      let f = socket.request.user.friends;

      for (let i = 0; i < f.length; i++) {
        //Only if they are also online.
        if (usersOnline[f[i]]) {
          io.to(usersOnline[f[i]]).emit('friendOnline', name);
        }
      }
    }

    socket.on('upgradeSocket', () => {
      if (!socket.mainSocket) {
        socket.mainSocket = true;
      }

      socket.to(`${name}`).emit('downgrade');
      socket.emit('upgrade');
    });

    socket.on('downgradeSocket', (username) => {
      if (socket.mainSocket) {
        socket.mainSocket = false;
      }
    });

    //If this is the main socket initialise the application on the client. Otherwise make sure the app is downgraded.
    if (socket.mainSocket) {
      socket.emit('initialise', name);
    } else {
      socket.emit('downgrade');
    }

    // ------ SOCKETS EVENTS HERE ------
    addContact(socket, io);
    deleteContact(socket,io);
    addMessage(socket, io);
    friendOnline(socket, io);
    deleteAccount(socket, io);
    messageRead(socket, io);
    messageUnread(socket, io);

    socket.on('disconnect', () => {
      if (socket.mainSocket) {
        delete usersOnline[name]; //we delete our current user from our online list.

        //Notify I´m logging off to my friends
        let f = socket.request.user.friends;
        for (let i = 0; i < f.length; i++) {
          //Only if they are also online.
          if (usersOnline[f[i]]) {
            io.to(usersOnline[f[i]]).emit('friendOffline', name);
          }
        }
      }

      socket.leave(`${name}`); //Socket leaves group.
      console.log(`${name} went offline.`);
    });
  });
};
