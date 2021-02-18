const mongoose = require('mongoose'); //mongodb object modeling
const Joi = require('joi'); //schema description and data validation

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    min: 2,
    max: 10,
    required: true,
  },
  password: {
    type: String,
    min: 5,
    max: 1024,
    required: true,
  },
  friends: { type: [{ type: String, min: 5, max: 15 }], default: [] },
  friendRequests: { type: [{ type: String, min: 5, max: 15 }], default: [] },
  unfriendRequests: { type: [{ type: String, min: 5, max: 15 }], default: [] },
  unreadMessages: [
    {
      sender: {
        type: String,
        min: 2,
        max: 10,
        required: true,
      },
      amount: {
        type: Number,
        min: 0,
        max: 99,
        default: 0,
        required: true,
      },
    },
  ],
});

const User = mongoose.model('User', userSchema);

//Input Validation middleware
async function validateUser(req, res, next) {
  const joiSchema = Joi.object({
    username: Joi.string().alphanum().min(2).max(10),
    password: Joi.string().min(5).max(20),
  });

  let { value, error } = await joiSchema.validate(req.body);

  if (error) {
    console.log(error);
    return res.status(400).send(error.details[0].message);
  } else {
    next();
  }
}

async function validateUsername(req, res, next) {
  const joiSchema = Joi.object({
    username: Joi.string().alphanum().min(2).max(10),
  });

  let { value, error } = await joiSchema.validate(req.body);

  if (error) {
    console.log(error);
    return res.status(400).send(error.details[0].message);
  } else {
    next();
  }
}

/* async function validatePassword(req, res, next) {
  const joiSchema = Joi.object({
    password: Joi.string().min(5).max(50),
  });

  let { value, error } = await joiSchema.validate(req.body);

  if (error) {
    console.log(error);
    return res.status(400).send(error.details[0].message);
  } else {
    next();
  }
} */

module.exports.User = User;
module.exports.validateUser = validateUser;
module.exports.validateUsername = validateUsername;
//module.exports.validatePassword = validatePassword;
