module.exports = (socket, io) => {
  socket.on('checkIfContactOnline', (contact) => {
    if (!socket.mainSocket) return;

    if (usersOnline[contact]) {
      socket.emit('friendOnline', contact);
    }
  });
};
