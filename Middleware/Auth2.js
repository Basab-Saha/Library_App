const User = require("../Models/user");
const { getUser } = require("../Service/Auth");

async function restrictToAdmin(req, res, next){
    const token=req.cookies?.uid;
    if(!token) return res.redirect("/login");

    const decoded=getUser(token);
    if(!decoded) return res.redirect("/login");

    const useDoc=await User.findOne({email:decoded.email});
    console.log(useDoc);
    if(!useDoc.isAdmin){
        const x="You are not an admin🤨"
        res.redirect(`/fail?purpose=${x}`);
    }

    req.user=useDoc;

    next();
}

module.exports = {
    restrictToAdmin
};
