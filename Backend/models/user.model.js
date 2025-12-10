import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

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


const User = mongoose.model("user",userSchema);
export default User;