const {User} = require('../models/user');
const {Dialog} = require('../models/dialog');
const bcrypt = require('bcrypt'); //password hashing function

module.exports = (socket, io) => {
  socket.on('deleteAccount', async (password) => {
    let me = await User.findOne({ username: socket.request.user.username });
    if (!socket.mainSocket || !me) return;

    console.log(password);
    console.log(me.password);

    //Check if password is correct
    bcrypt.compare(password, me.password, async function (error, result) {
      if (error) {
        console.log(error);
      }

      if (result) {
        socket.emit('logout');
        //Delete myself from ALL my contacts friendlist -> Need to find an efficient way to do this.
        for (let i = 0; i < me.friends.length; i++) {
          let contact = await User.findOne({ username: me.friends[i] });
          if (!contact) break;

          console.log(contact.username + ' was found!');

          if (contact) {
            contact.unfriendRequests.push(me.username);
            await contact.save();

            //If this user is online, notify it!
            if (usersOnline[contact.username]) {
              io.to(usersOnline[contact.username]).emit(
                'deleteContact',
                me.username
              );
            }
          }
        }

        //Delete all my conversations.
        try {
          await Dialog.deleteMany({ talkers: { $all: [me.username] } });
        } catch (e) {
          console.log(e);
        }

        //Delete my user.
        try {
          await User.deleteOne({ username: me.username });
        } catch (e) {
          console.log(e);
        }

        console.log('DONE. USER DELETED.');
        //res.send('Correct password. Account was deleted.');
      } else {
        console.log('Incorrect Password');
        //res.status('400').send('incorrect password');
      }
    });
  });
};
