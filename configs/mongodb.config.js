const mongoose = require("mongoose");


const connectToDB = async()=>{
    try{
     await mongoose.connect(process.env.MONGO_URI)
      //console.log(process.env.MONGO_URI)
        console.log("Connected To DB")
    }catch(err){
        console.log("Failed To Connect DB")
    }
}

module.exports = connectToDB;