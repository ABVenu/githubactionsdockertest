const mongoose = require("mongoose");



const blacklistTokenSchema = new mongoose.Schema({
    token:String
}) 


const BlacklistTokenModel = mongoose.model("BlacklistToken", blacklistTokenSchema);


module.exports = BlacklistTokenModel;