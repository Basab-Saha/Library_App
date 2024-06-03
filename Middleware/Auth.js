const User = require("../Models/user");
const { getUser } = require("../Service/Auth");

async function restrictToLoggedInUser(req, res, next){
    const token=req.cookies?.uid;
    if(!token) return res.redirect("/login");

    const decoded=getUser(token);
    if(!decoded) return res.redirect("/login");

    const useDoc=await User.findOne({email:decoded.email});
    req.user=useDoc;

    next();
}

module.exports = {
    restrictToLoggedInUser
};
