const express=require("express");
const path=require("path")
const {v4:uuidv4}=require("uuid");
const app=express();
const ConnectToMongoDb=require("./connect.js");
const User = require("./Models/user.js");
const cookieParser = require("cookie-parser");
const dotenv=require("dotenv")
dotenv.config();

const { restrictToLoggedInUser } = require("./Middleware/Auth.js");
const {restrictToAdmin}=require("./Middleware/Auth2.js")
const { setUser } = require("./Service/Auth.js");
const Book = require("./Models/book.js");

app.set("view engine","ejs");
app.set("views",path.resolve('./views'))

app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

const PORT=process.env.PORT || 5000;
ConnectToMongoDb(process.env.MONGO_URI);

app.get("/signup",(req,res)=>{
    res.render("signup");
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/home",restrictToLoggedInUser,async(req,res)=>{
    
    const name=req.user.email;
    const isAdmin=req.user.isAdmin;

    const allBooks=await Book.find({});
    res.render("home",{Name:name,isAdmin:isAdmin,allBooks:allBooks});
})

app.get("/fail",(req,res)=>{
    const purposeOfFail=req.query.purpose;
    res.render("fail",{Purpose:purposeOfFail});
})

app.get("/logout",(req,res)=>{
    res.clearCookie("uid");
    res.redirect("/home")
})

app.post("/user",async(req,res)=>{
    const new_user=req.body;

    if(!new_user.name || !new_user.email || !new_user.password){
        const x="Please fill all your fields🥲"
        res.redirect(`/fail?purpose=${x}`);
    }
    try{
        const exists=await User.findOne({email:new_user.email});
        if(exists){
            const x="Account already exists😊 , Please try login"
            res.redirect(`/fail?purpose=${x}`);
        }else{
            const createdUser=await User.create({
                name:new_user.name,
                email:new_user.email,
                password:new_user.password
            })

            if(createdUser){
               
                res.redirect(`/home`);
            }else{
                const x="Failed to create User"
                res.redirect(`/fail?purpose=${x}`);
            }
        }
    }catch(err){
        console.log("Error in creating user",err.message);
        res.status(500).json({message:"Internal Server error"});
    }
})  

app.post("/user/login",async(req,res)=>{
    const user=req.body;

    if(!user.email || !user.password){
        const x="Please fill all the details for Login😊"
        res.redirect(`/fail?purpose=${x}`);
    }
    try{
        const valid=await User.findOne({email:user.email,password:user.password});
        if(valid){

            const token=setUser(user);
            res.cookie("uid",token);
            res.redirect(`/home`);
        }else{
            const x="Wrong Credentials 😧😧"
            res.redirect(`/fail?purpose=${x}`);
        }
    }catch(err){
        console.log(err);
    }
})

app.get("/addBook",restrictToLoggedInUser,restrictToAdmin,async(req,res)=>{
   res.render("addBook")
})

app.post("/addBook",async(req,res)=>{
    const newBook=req.body;
    if(!newBook.title || !newBook.ISBN || !newBook.author || !newBook.quantity){
        const x="Please fill all the details of book😊"
          res.redirect(`/fail?purpose=${x}`);
    }
    try{
        const exists=await Book.findOne({ISBN:newBook.ISBN});
        if(exists) {
            const x="Book already exists😊"
          res.redirect(`/fail?purpose=${x}`);
        }

        const createdBook=await Book.create({
            title:newBook.title,
            ISBN:newBook.ISBN,
            author:newBook.author,
            quantity:newBook.quantity

        })

        if(createdBook){
            res.redirect('/home');
        }
        else{
            const x="Failed to create Book"
            res.redirect(`/fail?purpose=${x}`);
        }
    }catch(err){
        console.log("Internal Server error");
        res.status(401).json({msg:"Book creation failed"})
    }
})

app.get("/borrow/:bookId",restrictToLoggedInUser,async(req,res)=>{
    const bookId=req.params.bookId;
    const borrowingUser=req.user.email;
    if(!borrowingUser){
        const x="Only logged in user can borrow books🥲";
        res.redirect(`/fail?purpose=${x}`);
    }
    //console.log(bookId , borrowingUser)
    try{
        const whichBook=await Book.findOne({_id:bookId});
        const user=await User.findOne({email:borrowingUser});
       // console.log(whichBook,user);
        if (user.borrowedBooks.includes(bookId)) {
            const errorMessage = "You already borrowed this book";
            return res.redirect(`/fail?purpose=${errorMessage}`);
        }
        if(whichBook.quantity>0){
            user.borrowedBooks.push(whichBook._id);
            whichBook.quantity=whichBook.quantity-1;

            await whichBook.save();
            await user.save();
            
            console.log("Book borrowed successfully:", whichBook.title);
            console.log("User's borrowed books:", user.borrowedBooks);
           // console.log(whichBook.quantity);
            res.redirect("/home");
        }
        else{
            const x="Book Not Availible🥲";
            res.redirect(`/fail?purpose=${x}`);
        }
    }catch(err){
        console.log("Internal Server error");
        res.status(401).json({msg:"Failed to Borrow Book"})
    }
})

app.get("/myBooks", restrictToLoggedInUser, async (req, res) => {
    const userEmail = req.user.email;
    try {
        const userDoc = await User.findOne({ email: userEmail });
        if (!userDoc) {
            return res.status(404).send("User not found.");
        }
        const borrowedBooksIds = userDoc.borrowedBooks;
        const allBorrowedBooks = await Promise.all(borrowedBooksIds.map(async (bookId) => {
            const book = await Book.findById(bookId);
            return book;
        }));
        res.render("myBooks", { allBorrowedBooks: allBorrowedBooks });
    } catch (err) {
        console.error("Error fetching user's borrowed books:", err);
        res.status(500).send("Internal Server Error: " + err.message); // Send error message in response
    }
});

app.post("/return/:bookId",restrictToLoggedInUser, async (req, res) => {
    const bookId = req.params.bookId;
    const userEmail = req.user.email; // Assuming you have the user object in the request

    try {
        // Find the user by email
        const user = await User.findOne({ email: userEmail });

        // Remove the book from the user's borrowedBooks array
        user.borrowedBooks.pull(bookId);

        // Save the updated user
        await user.save();

        // Find the book by ID
        const book = await Book.findById(bookId);

        // Increase the quantity of the book by 1
        book.quantity += 1;

        // Save the updated book
        await book.save();

        // Redirect back to the My Books page
        res.redirect("/myBooks");
    } catch (error) {
        console.error("Error returning book:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.listen(5000,()=>{
    console.log("Server started at PORT:5000")
})