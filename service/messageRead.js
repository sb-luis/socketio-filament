const {User} = require('../models/user');

module.exports = (socket, io) => {
  socket.on('messagesRead', async (sender) => {
    let me = await User.findOne({ username: socket.request.user.username });
    if (!socket.mainSocket || !me) return;

    //This event is called by the client each time the user opens a given conversation that has some number of unread messages on it.
    console.log('Messages Read.');

    for (let i = 0; i < me.unreadMessages.length; i++) {
      if (me.unreadMessages[i].sender == sender) {
        me.unreadMessages[i].amount = 0;
      }
    }

    await me.save();
  });
};
