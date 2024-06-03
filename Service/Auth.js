const jwt=require("jsonwebtoken");
const secret="739edyh7e23y";

 function setUser(user){
    return jwt.sign(user,secret);
}

  function getUser(token){
    if(!token) return null;
    else return jwt.verify(token,secret);
  }

module.exports = {
   
    setUser, // Export setUser function
    getUser  // Export getUser function
};

