const mongoose = require('mongoose');

async function removeWebsite() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/socialmediaapp');
    const User = require('../src/modules/user/user.model.js');
    
    // Try to find maddy by username or fullName
    const result = await User.findOneAndUpdate(
      { 
        $or: [
          { username: { $regex: /maddy/i } },
          { fullName: { $regex: /maddy/i } }
        ]
      },
      { $set: { website: "" } }
    );
    
    if (result) {
      console.log(`Successfully cleared website for user: ${result.username} / ${result.fullName}`);
    } else {
      console.log('User maddy not found by username or fullName.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

removeWebsite();
