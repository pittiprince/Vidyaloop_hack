import express from 'express'
import { StudentModel } from '../models/student.model.js';
import { studentValidation } from '../validations/student.validate.js';
import GenerateOtp from '../utils/genrateOtp.js';
import { OtpModel } from '../models/otp.model.js';
import {JWT} from '../config/env.js'
import bcrypt from 'bcrypt'
import sendEmail from '../utils/sendMail.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
export const authRoute = express.Router()

// check auth route is working or not 
authRoute.get('/check', (req,res,next)=>{
    try {
        res.status(200).json({
            msg :" This is an auth route "
        })
    } catch (error) {
        
    }
})

authRoute.post ('/signup', async (req, res,next) => {
    try {
       
      const {email} = req.body
      console.log(req.body)
    //   checks validation 
      const validation = studentValidation.safeParse(req.body);
      const otp = GenerateOtp()
          if(!validation.success){
                  res.json ({
                    msg:"Invalid Inputs",
                    success:0,
                    errors:validation.error.issues
                  });
              }
            //   after validation it will hash the password
      validation.data.password = await bcrypt.hash(validation.data.password,10)
      const Exist_user = await StudentModel.findOne({email})
      console.log(Exist_user)
      if(Exist_user)
        return res.status(200).json({
          success:1,
          msg :"User Exist please login",
          Exist_user
        })
      const user =await StudentModel.create(validation?.data)
      const hashedOTP = await bcrypt.hash(otp,10)
      const userOtp = new OtpModel({
          userId: user._id, 
          UserOTP: hashedOTP,
          expiryTime: Date.now() + 10 * 60 * 1000 
      });
      
      userOtp.save().then(() => {
          console.log("OTP saved successfully");
          sendEmail(validation?.data?.email,"OTP Verification By Bridge",otp)
      }).catch(err => {
          console.error("Error saving OTP:", err);
      });
      res.json({
        msg:"User Created",
        success:1,
        user})
      
  } catch (e) {
      console.log("Error in the line 24",e)
      next(e)
  }
  });
// login route 
  authRoute.get("/signin",async(req,res,next)=>{
    try{
      const {email,password} = req?.query;
      const user = await StudentModel.findOne({email:email})
    //   console.log(user).
      if(!user){
        return res.status(401).json({
          success:0,
          msg:"User Not Found" 
        })
      }
      const validate = await bcrypt.compare(password,user?.password)
      if(!validate)
        return res.status(401).json({
          success:0,
          msg:"Invalid Email or Password" 
        })
      const token = jwt.sign(user.email, JWT)
      res.status(200).json({
        success:1,
        token,
        user,
        msg:"User Signed In"
      })
    }
    catch(e){
      console.log("Error in sign",e)
      next(e)
    }
  })


  // signin

  authRoute.get("/signin",async(req,res,next)=>{
    try{
      const {email,password} = req.query;
      const user = await StudentModel.findOne({email:email})
      console.log(user)
      if(!user){
        return res.status(401).json({
          success:0,
          msg:"User Not Found" 
        })
      }
      const validate = await bcrypt.compare(password,user?.password)
      if(!validate)
        return res.status(401).json({
          success:0,
          msg:"Invalid Email or Password" 
        })
      const token = jwt.sign(user.email, JWT)
      const userInfo = {...user, password:""}
      res.status(200).json({
        success:1,
        token,
        userInfo,
        msg:"User Signed In"
      })
    }
    catch(e){
      console.log("Error in sign",e)
      next(e)
    }
  
  })


  // sentotp 

  authRoute.post("/sendotp", async (req, res, next) => {
    try {
      const { email, userId } = req.body;
      console.log("User ID:", userId, email);
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: 0, msg: "Invalid User ID format." });
      }
  
      const otp = GenerateOtp();
      const hashedOTP = await bcrypt.hash(otp, 5);
      const id = new mongoose.Types.ObjectId(userId);
  
      const userOtp = await OtpModel.findOne({ userId: id });
      if (userOtp) {
        userOtp.UserOTP = hashedOTP;
        userOtp.expiryTime = Date.now() + 10 * 60 * 1000;
        await userOtp.save();
      } else {
        await OtpModel.create({
          userId: userId,
          UserOTP: hashedOTP,
          expiryTime: Date.now() + 10 * 60 * 1000,
        });
      }
  
      const isSent = await sendEmail(email, "OTP Verification By Tracker", otp);
  
      if (isSent) {
        console.log(otp);
        return res.status(200).json({ success: 1, msg: "OTP sent to " + email });
      } else {
        return res.status(400).json({ success: 0, msg: "Failed to send OTP to " + email });
      }
    } catch (e) {
      console.error("Error in /sendotp", e);
      next(e);
    }
  });
  
  // verify OTP
  
authRoute.post("/otp",async(req,res,next)=>{
  try {
    const {userId,otp} = req.body;
    if(!userId)
      return res.status(403).json({
        success:0,
        msg:"Invalid User Id"
     
    })
    const id = new  mongoose.Types.ObjectId(userId)
    const userOtp = await OtpModel.findOne({userId : id})
    console.log(userOtp)
    if(!userOtp||!userOtp.UserOTP){
      return res.status(200).json({
        success:0,
        msg:"User not found or Invalid User Id"
      })
    }
      const compareOtp = userOtp?.UserOTP
      const validation = compareOtp?await bcrypt.compare(otp,userOtp?.UserOTP) : false
      if(validation){
        const user = await StudentModel.findByIdAndUpdate({_id:id},{ $set: { isValid: true } },{new : true})
        res.status(200).json({
          success:1,
          msg:"User Verified ✔️",
          validation,user})
      }
      else{
        res.status(400).json({
          success:0,
          msg:"Invalid User OTP"
        })
      }    
  } catch (e) {
    console.log("Error in 57 Auth Router",e)
    next(e)
  }
})

// 
  authRoute.post("/rest",async(req,res,next)=>{
  try{
    const {email,password} = req.body;
    const hashedPassword = await bcrypt.hash(password,10)
    const user = await StudentModel.findOneAndUpdate({email},{
      $set:{password:hashedPassword}
    },{new: true})  
   res.status(200).json({
    success:1,
    msg:"Password Reset Done",
    user
   }) 
  }catch(e){
  }
})