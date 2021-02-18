const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { User, validateUser, validateUsername } = require('../models/user');
const authorise = require('../middleware/authorise'); //Custom middleware for authorising requests.

router.post('/register', validateUser, async (req, res) => {
  console.log('register!!');
  let username = req.body.username.toLowerCase();
  //Make sure user is not registered already.
  let user = await User.findOne({ username: username });
  if (user)
    return res.status(400).send('A user with that name already exists.');
  //Hash User Password
  const hash = await bcrypt
    .hash(req.body.password, parseInt(process.env.SALT_ROUNDS_2020))
    .catch((err) => {
      console.error(`Error while salting or hashing bcrypt process: ${err}`);
    });
  //Create user
  user = new User({ username: username, password: hash });
  user = await user.save(); //Catch errors here!
  //Log in the user
  req.login(user, function (err) {
    if (err) {
      return next(err);
    }
    return res.redirect('/app');
  });
});

router.get('/who-am-i', authorise, (req, res) => {
  res.send(req.user.username);
});

router.get('/friends', authorise, async (req, res) => {
  let friends = [];
  let user = await User.findOne({ username: req.user.username });
  if (!user) return console.log('Couldn´t find a user');

  //Check if we have any unfriend requests.
  if (user.unfriendRequests.length > 0) {
    //If we do, delete them from our friendlist & delete any unread messages we have with them.
    for (let f = 0; f < user.unfriendRequests.length; f++) {
      //Delete contact from my friendlist
      for (let i = 0; i < user.friends.length; i++) {
        if (user.friends[i] === user.unfriendRequests[i]) {
          user.friends.splice(i, 1);
        }
      }
      //Delete any Unread message counters
      console.log(user.unreadMessages);
      for (let i = 0; i < user.unreadMessages.length; i++) {
        if (user.unreadMessages[i].sender === user.unfriendRequests[i]) {
          console.log(user.unreadMessages[i]);
          user.unreadMessages.splice(i, 1);
        }
      }

      user.unfriendRequests.splice(f, 1); //Once executed the unfriend procedure, we can remove them from our list.
      await user.save();
    }
  }

  //Get our friends.
  for (let i = 0; i < user.friends.length; i++) {
    let f = {};
    f.name = user.friends[i];
    f.online = false;
    if (usersOnline[f.name]) {
      f.online = true;
    }
    friends.push(f);
  }

  res.send(friends);
  //res.send({'contacts': user.friends, 'friendRequests' : user.friendRequests});
});

router.post(
  '/search-contact',
  [authorise, validateUsername],
  async (req, res) => {
    console.log('searching contact...');
    //Make sure user is not myself.
    if (req.body.username == req.user.username)
      return res.status(400).send('You cannot search yourself.');

    //Make sure user exists.
    let user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(404).send('No user was found.');

    //If it does return it to the client.
    let isFriend = false;
    //if (req.user.friends[req.body.username]) isFriend = true;
    for (i = 0; i < req.user.friends.length; i++) {
      if (req.user.friends[i] == req.body.username) {
        isFriend = true; //If this contact name is within our friend array then it means is our friend.
      }
    }

    res.send({ contact: user.username, friendship: isFriend });
  }
);

router.get('/unread-messages', (req, res) => {
  res.send(req.user.unreadMessages);
});

//Export Router
module.exports = router;
