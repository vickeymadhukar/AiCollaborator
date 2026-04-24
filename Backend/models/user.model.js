import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
dotenv.config();

const userSchema= new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minlength:[6],
        maxlength:[50]
    },
    password :{
        type:String,
        select:false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
})


userSchema.statics.Hashpassword = async function (password){
    return await bcrypt.hash(password,10);
}


userSchema.methods.isValidpassword = async function (password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.Jwttoken =  function () {
    return jwt.sign({email:this.email},process.env.SCERECT_KEY,{expiresIn:'24h'});
}

userSchema.methods.getResetPasswordToken = function () {
   
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
}


const User = mongoose.model("user",userSchema);
export default User;