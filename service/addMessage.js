const {User} = require('../models/user');
const {Dialog, validateMessage} = require('../models/dialog');

module.exports = (socket, io) => {
  socket.on('addMessage', async (content, recipient) => {
    let name = socket.request.user.username;
    let me = await User.findOne({ username: name });
    if (!socket.mainSocket || !me) return;

    if (validateMessage(content)) {
      console.log(`${recipient} received the message: ${content}`);
    }

    //Make sure there is an existing dialog between this two users.
    let dialog = await Dialog.findOne({
      talkers: { $all: [name, recipient] },
    });

    //If not, something went wrong!
    if (!dialog) {
      return console.error('No dialog was found. Couldn´t add message.');
    }

    //Add message to the dialog
    dialog.messages.push({ sender: name, content: content });
    dialog = await dialog.save();

    //If the recipient is online, notify him!
    if (usersOnline[recipient]) {
      io.to(usersOnline[recipient]).emit('addMessage', content, name);
    } else {
      //If its not! increase its unread counter in this conversation!
      await increaseUnreadMessages(recipient, me);
    }
  });
};
