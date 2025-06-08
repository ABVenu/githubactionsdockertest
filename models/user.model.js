const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:String,
    email:{type:String,unique:true},
    password:{type:String},
    role:{type:String, enum:["admin", "user"], default:"user"},
    profileId:Number
})

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;