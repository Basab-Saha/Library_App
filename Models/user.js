const mongoose=require("mongoose");


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },
    borrowedBooks:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Book",
        }
    ],

},{timestamps:true});

const User=mongoose.model("user",userSchema);

module.exports=User;