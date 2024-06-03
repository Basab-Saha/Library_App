const mongoose=require("mongoose");

async function ConnectToMongoDb(url){
    return mongoose.connect(url).then(()=>{
        console.log("Mongodb connected")
    }).catch((err)=>{
        console.log("MongoDB Error",err);
    })
}

module.exports=ConnectToMongoDb;