const express = require('express');
const router = express.Router();

const { Dialog, validateMessage } = require('../models/dialog');
const { User, validateUsername } = require('../models/user');
const authorise = require('../middleware/authorise'); //Custom middleware for authorising requests.

router.post('/', [authorise, validateUsername], async (req, res) => {
  //Make sure there is an existing dialog between this two users.
  let dialog = await Dialog.findOne({
    talkers: { $all: [req.user.username, req.body.username] },
  });

  //If not, start a new one!
  if (!dialog) {
    dialog = new Dialog({
      talkers: [req.user.username, req.body.username],
    });
    dialog = await dialog.save();
    console.log('A new dialog was created');
  }

  res.send(dialog);
});

//Export Router
module.exports = router;
