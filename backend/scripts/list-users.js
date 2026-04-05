const mongoose = require('mongoose');

async function listUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/socialmediaapp');
    const User = require('../src/modules/user/user.model.js');
    const users = await User.find({}, 'username fullName website');
    console.log("Users:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
