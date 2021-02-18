const {User} = require('../models/user');
const {Dialog} = require('../models/dialog');

module.exports = (socket, io) => {
  socket.on('deleteContact', async function (contactName) {
    let me = await User.findOne({ username: socket.request.user.username });
    if (!socket.mainSocket || !me) return;

    //Delete contact from my friendlist
    for (let i = 0; i < me.friends.length; i++) {
      if (me.friends[i] === contactName) {
        me.friends.splice(i, 1);
      }
    }
    //Delete any Unread message counters
    for (let i = 0; i < me.unreadMessages.length; i++) {
      if (me.unreadMessages[i].sender === contactName) {
        console.log(me.unreadMessages[i]);
        me.unreadMessages.splice(i, 1);
      }
    }
    await me.save();

    let other = await User.findOne({ username: contactName }); //Get friend user.
    if (!other) return; //If we cannot find the friend user return!
    other.unfriendRequests.push(me.username); //Notify my ex-friend that I´ve deleted it.
    await other.save();

    //Delete any on-going conversations that we have
    let dialog = await Dialog.deleteOne({
      talkers: { $all: [me.username, contactName] },
    });

    //Emit updateContacts event to the clients
    socket.emit('deleteContact', contactName);
    if (usersOnline[contactName]) {
      io.to(usersOnline[contactName]).emit('deleteContact', me.username);
    }
  });
};
