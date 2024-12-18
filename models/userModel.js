const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    googleId: {
        type: String,
       
      },
      name: {
        type: String,
        
      },
      email: {
        type: String,
        
      },

      password: {
        type: String,
        
      },
      

     image: {
        type: String, 
        
      },
      status: {
        type: String,
        default: "Online", 
      },
      socketId: {
        type: String, 
        default: null,
      },
      lastSeen: {
        type: Date,
        default: null, 
      },
     
      createdAt: {
        type: Date,
        default: Date.now,
      },
    });
    
    module.exports = mongoose.model('User', userSchema);
  