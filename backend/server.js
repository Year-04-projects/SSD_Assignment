const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors= require("cors");
const app = express();
const path = require('path');
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
require("dotenv").config();
require("./auth");
const logger=require("./logger/logger");
const passport=require("passport");
const PORT = process.env.PORT || 8070;
const session=require('express-session');
const rateLimit = require("express-rate-limit");
const timeout = require("connect-timeout"); 

//limiter to minimize brutforce attack
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: "Too many attempts, try again later.",
  });

app.use(express.json());
app.set('trust proxy', 1);
app.use(cors());
app.use(cookieParser());
function isLoggedIn(req,res,next){
 req.user?next():res.sendStatus(401);   
}


app.use(session({
    secret:'mysecret',
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false}
}))
app.use(passport.initialize());
app.use(passport.session());
// app.use(
//   fileUpload({
//     useTempFiles: true,
//   })
// );
app.use('./uploads',express.static(path.join(__dirname,'uploads')));
//add timeout to minimize DDOS attack
app.use(timeout("10s"));

app.get('/long-request', (req, res) => {
    setTimeout(() => {
        req.clearTimeout(); 
        res.send("Long request completed");
    }, 15000); // 15 seconds 
});

//reduced limit request size to avoid exhastion attacks
app.use(bodyParser.json({ limit: '3mb' }));


app.get('/auth/google',passport.authenticate('google',{
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

}))

app.get("/auth/google/callback",
passport.authenticate('google',{
    successRedirect:'/auth/protected',
    failureRedirect:'/auth/google/failure'
}))

app.get('/auth/protected',isLoggedIn,(req,res)=>{
    console.log("req.user",req.user.given_name)
    // let name=req.user.displayName();

    res.send(`Helllo there! ${req.user.given_name}`)
    res.redirect('http://localhost:3000');
})
app.get('/auth/google/failure',isLoggedIn,(req,res)=>{
    res.send("Error in auth here!")
})
app.get('/auth/logout', (req, res) => {
    console.log("log out")
    req.logout((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('http://localhost:3000');
    });
});


const URL = process.env.MONGODB_URL;

mongoose.connect(URL,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify:false
});

const connection = mongoose.connection;

connection.once("open", () => {
    console.log("MongoDB Connection success!");
});

app.listen(PORT, ()=>{
    console.log('Server is up and running on port number: ',PORT)
})


//Postman check
//URL = http://localhost:8070/assessment/

const AssessmentRouter = require("./routes/Assessment.js");
app.use("/Assessment",AssessmentRouter);

//URL = http://localhost:8070/quiz/
const QuizRouter = require("./routes/Quiz.js");
app.use("/quiz",QuizRouter);

//URL = http://localhost:8070/instructor/
const instructorRoutes = require('./routes/instructors');
app.use(instructorRoutes);

//URL = http://localhost:8070/lecturer/
const lecturerRoutes = require('./routes/lecturers');
app.use(lecturerRoutes);


// students routes
app.use("/student/login", limiter);
app.use("/student", require("./routes/studentRouter"));
app.use("/admin", require("./routes/adminRouter"));
app.use("/api", require("./routes/uploadImg"));

//URL = http://localhost:8070/attemptsquiz/

const Attempts_QuizRouter = require("./routes/Attempts_Quiz.js");
app.use("/attemptsquiz",Attempts_QuizRouter);

//URL = http://localhost:8070/attemptsass/

const Attempts_AssRouter = require("./routes/Attempts_Ass.js");
app.use("/attemptsass",Attempts_AssRouter);

//URL = http://localhost:8070/assignment/

const Assignment = require("./routes/Assignment.js");
app.use("/assignment",Assignment);


//payment
//http://localhost:8070/file/
const file=require('./routes/StudentPayments');
app.use('/file',file)

//enroll
//http://localhost:8070/enroll/
const enrollRoutes = require(`./routes/Enrolls`);
app.use(enrollRoutes);

//enrollKeys
//http://localhost:8070/enrollKey
const enrollKeyRoutes = require(`./routes/EnrollKeys`);
app.use(enrollKeyRoutes);


//URL = http://localhost:8070/contactus/
const contactusRouter = require("./routes/contactuss.js");
app.use("/contactus",contactusRouter);

//URL = http://localhost:8070/notice/
const noticeRouter = require("./routes/notices.js");
app.use("/notice",noticeRouter);


//URL = http://localhost:8070/feedback/
const feedbackRouter = require("./routes/feedbacks.js");
app.use("/feedback",feedbackRouter);


//URL = http://localhost:8070/subject/
const subjectRoutes = require('./routes/subjects');
app.use(subjectRoutes);

//URL = http://localhost:8070/material/
const materialRoutes = require('./routes/materials');
app.use(materialRoutes);




