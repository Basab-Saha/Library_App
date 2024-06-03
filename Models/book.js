const mongoose=require("mongoose");

const bookSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    ISBN:{
        type:String,
        required:true,
        unique:true
    },
    author:{
        type:String,
        required:true,
    },
    quantity:{
        type:Number,
        required:true,
    }
},{timestamps:true})

const Book=mongoose.model("book",bookSchema);
module.exports=Book;