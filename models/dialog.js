const mongoose = require('mongoose'); //mongodb object modeling
const Joi = require('joi'); //schema description and data validation

const dialogSchema = new mongoose.Schema({
  talkers: {
    type: [
      {
        type: String,
        min: 5,
        max: 50,
        required: true,
      },
    ],
    required: true,
  },
  messages: {
    type: [
      {
        sender: {
          type: String,
          min: 5,
          max: 50,
          required: true,
        },
        content: {
          type: String,
          min: 5,
          max: 500,
          required: true,
        },
      },
    ],
    default: [],
  },
});

const Dialog = mongoose.model('Dialog', dialogSchema);

//Validation
function validateMessage(content) {
  //At the moment I´m just checking for any kind of html tag.
  if (content.match(/<.*>/)) {
    console.log('The message sent contained a html tag!');
    return false;
  } else {
    return true;
  }
}

module.exports.Dialog = Dialog;
module.exports.validateMessage = validateMessage;
