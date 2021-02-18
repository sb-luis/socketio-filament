const {User} = require('../models/user');

module.exports = (socket, io) => {
  socket.on('messagesUnread', async (sender) => {
    let me = await User.findOne({ username: socket.request.user.username });
    if (!socket.mainSocket || !me) return;

    //This event is called by the client each time the user miss a message.
    let userChanged = false;

    for (let i = 0; i < me.unreadMessages.length; i++) {
      if (me.unreadMessages[i].sender == sender) {
        me.unreadMessages[i].amount++;
        userChanged = true;
        break;
      }
    }

    if (userChanged) {
      await me.save();
    } else {
      //If the user hasn´t change that means we aren´t tracking yet the unread messages in this conversation, so start doing so!
      let counter = {
        sender: sender,
        amount: 1,
      };
      me.unreadMessages.push(counter);
      await me.save();
    }
  });
};

//SOCKET HANDLER FUNCTIONS
async function increaseUnreadMessages(recipient, sender) {
  let u = await User.findOne({ username: recipient });

  let userChanged = false;

  for (let i = 0; i < u.unreadMessages.length; i++) {
    if (u.unreadMessages[i].sender == sender.username) {
      u.unreadMessages[i].amount++;
      userChanged = true;
      break;
    }
  }

  if (userChanged) {
    await u.save();
  } else {
    //If the user hasn´t change that means we aren´t tracking yet the unread messages in this conversation, so start doing so!
    let counter = {
      sender: sender.username,
      amount: 1,
    };
    u.unreadMessages.push(counter);
    await u.save();
  }
}
