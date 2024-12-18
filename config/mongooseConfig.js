const mongoose=require('mongoose')

async function connecttodb(){
    await mongoose.connect("mongodb://127.0.0.1:27017/chat")
    console.log("connected to database")
}
connecttodb();

module.exports=mongoose.connection;