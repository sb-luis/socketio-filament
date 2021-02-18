const {User} = require('../models/user');

module.exports = (socket, io) => {
  socket.on('addContact', async function (contactName) {
    let me = await User.findOne({ username: socket.request.user.username });
    if (!socket.mainSocket || !me) return;

    //Make sure my new friend is not already a friend
    for (let i = 0; i < me.friends.length; i++) {
      if (me.friends[i] == contactName) {
        console.log('SKIP! This user is already a friend of mine!');
        return;
      }
    }
    //Add it as a friend
    me.friends.push(contactName);
    await me.save(); //Catch errors here!

    //Get my friend
    let other = await User.findOne({ username: contactName });
    //Make sure I´m not already a friend
    for (let i = 0; i < other.friends.length; i++) {
      if (other.friends[i] == me.username) {
        console.log('SKIP! I´m already a friend of this user!');
        return;
      }
    }
    other.friends.push(me.username);
    await other.save(); //Catch errors here!

    //Emit updateContacts event to my new friend, if he is online :)
    if (usersOnline[contactName]) {
      io.to(usersOnline[contactName]).emit('addContact', me.username);
    }
  });
};
