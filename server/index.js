import { DB_URL, PORT } from './config/env.js';
import express from 'express'
import cors from 'cors'
import { connetToDataBase } from './config/db.js';
import { authRoute } from './router/auth.router.js';
import { teacherRoute } from './router/teacherAuth.router.js';
import { fileRoute } from './router/file.router.js';
import justificationRoute from './router/justification.js';

// get env data 
// express app

const app = express();

// cors usage 
app.use(cors({}));
// decode the express body
app.use(express.json())

// basicn get route 
app.get("/", (req,res,next)=>{
    try{
        res.status(200).json({
            msg : "Server is running "
        })
    }
    catch(e){
        console.log("error at /", e)
        next(e)
    }
})

// routes 

app.use("/api/auth", authRoute) //auth Route 
app.use("/api/teacher-auth", teacherRoute) //Teacher auth Route 
app.use("/api/upload", fileRoute)
app.use('/api/chatgpt', justificationRoute);

//grlobal Handle errors
app.use((err, req, res, next) => {
    if (! err) {
        return next();
    }

    res.status(500);
    res.send(err);
});

// listen server 



try {
    const valid = connetToDataBase(DB_URL)

    valid ? app.listen(PORT, ()=>{
        try {
            console.log("Server is Running at the port http://localhost:",PORT)
        } catch (error) {
            console.log("Error At Server", error)
        }
    }) : console.log("Something went wrong ")
} catch (error) {


    console.log("Something went wrong ")
    console.log("Failed to conneted the DB")
    console.log("Error Is ",error)
}