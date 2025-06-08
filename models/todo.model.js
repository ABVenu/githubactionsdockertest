const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    title:{type:String, required:true},
    status:{type:Boolean, default:false},
    userId:{type:mongoose.Schema.Types.ObjectId, ref:"User"} 
    /// this userId to be adxded behind the scene through Auth Middleware 
}) 


const TodoModel = mongoose.model("Todo", todoSchema);


module.exports = TodoModel;