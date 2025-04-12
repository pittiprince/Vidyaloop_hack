import express from 'express'
import { TeacherModel } from '../models/teacher.model.js';
import { TeacherValidation } from '../validations/teacher.validations.js'
import GenerateOtp from '../utils/genrateOtp.js';
import { OtpModel } from '../models/otp.model.js';
import { JWT } from '../config/env.js'
import bcrypt from 'bcrypt'
import sendEmail from '../utils/sendMail.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';

export const teacherRoute = express.Router()

// check auth route is working or not 
teacherRoute.get('/check', (req, res, next) => {
    try {
        res.status(200).json({
            msg: "This is an Teacher auth route"
        })
    } catch (error) {
        next(error);
    }
})

teacherRoute.post('/signup', async (req, res, next) => {
    try {
        const { email } = req.body
        console.log(req.body)
        //   checks validation 
        const validation = TeacherValidation.safeParse(req.body);
        const otp = GenerateOtp()
        if (!validation.success) {
            return res.json({
                msg: "Invalid Inputs",
                success: 0,
                errors: validation.error.issues
            });
        }
        //   after validation it will hash the password
        validation.data.password = await bcrypt.hash(validation.data.password, 10)
        const Exist_user = await TeacherModel.findOne({ email })
        console.log(Exist_user)
        if (Exist_user)
            return res.status(200).json({
                success: 1,
                msg: "User Exist please login",
                Exist_user
            })
        const user = await TeacherModel.create(validation?.data)
        const hashedOTP = await bcrypt.hash(otp, 10)
        const userOtp = new OtpModel({
            userId: user._id,
            UserOTP: hashedOTP,
            expiryTime: Date.now() + 10 * 60 * 1000
        });

        userOtp.save().then(() => {
            console.log("OTP saved successfully");
            sendEmail(validation?.data?.email, "OTP Verification By Bridge", otp)
        }).catch(err => {
            console.error("Error saving OTP:", err);
        });
        res.json({
            msg: "User Created",
            success: 1,
            user
        })

    } catch (e) {
        console.log("Error in signup", e)
        next(e)
    }
});

// login route - FIX: Changed from GET to POST and fixed model reference 
teacherRoute.post("/signin", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await TeacherModel.findOne({ email: email })
        console.log(user)
        if (!user) {
            return res.status(401).json({
                success: 0,
                msg: "User Not Found"
            })
        }
        const validate = await bcrypt.compare(password, user.password)
        if (!validate)
            return res.status(401).json({
                success: 0,
                msg: "Invalid Email or Password"
            })
        const token = jwt.sign({ email: user.email }, JWT)
        
        // Return clean user object without password
        const userWithoutPassword = {
            _id: user._id,
            name: user.name,
            email: user.email,
            age: user.age,
            institute: user.institute,
            exprience: user.exprience,
            isTeacher: user.isTeacher,
            isValid: user.isValid
        };
        
        res.status(200).json({
            success: 1,
            token,
            user: userWithoutPassword,
            msg: "User Signed In"
        })
    }
    catch (e) {
        console.log("Error in sign", e)
        next(e)
    }
});

// send otp
teacherRoute.post("/sendotp", async (req, res, next) => {
    try {
        const { email, userId } = req.body;
        console.log("User ID:", userId, email);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: 0, msg: "Invalid User ID format." });
        }

        if (!email) {
            return res.status(400).json({ success: 0, msg: "Email is required." });
        }

        const otp = GenerateOtp();
        const hashedOTP = await bcrypt.hash(otp, 5);
        const id = new mongoose.Types.ObjectId(userId);

        // Find the user to make sure they exist
        const user = await TeacherModel.findById(id);
        if (!user) {
            return res.status(404).json({ success: 0, msg: "User not found." });
        }

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

        const isSent = await sendEmail(email, "OTP Verification By Bridge", otp);

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
teacherRoute.post("/otp", async (req, res, next) => {
    try {
        const { userId, otp } = req.body;
        
        if (!userId) {
            return res.status(403).json({
                success: 0,
                msg: "Invalid User Id"
            });
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                success: 0, 
                msg: "Invalid User ID format." 
            });
        }

        const id = new mongoose.Types.ObjectId(userId);
        const userOtp = await OtpModel.findOne({ userId: id });
        
        if (!userOtp || !userOtp.UserOTP) {
            return res.status(200).json({
                success: 0,
                msg: "User not found or Invalid User Id"
            });
        }
        
        // Check if OTP is expired
        if (userOtp.expiryTime < Date.now()) {
            return res.status(400).json({
                success: 0,
                msg: "OTP has expired. Please request a new one."
            });
        }

        const compareOtp = userOtp?.UserOTP;
        const validation = compareOtp ? await bcrypt.compare(otp, userOtp?.UserOTP) : false;
        
        if (validation) {
            const user = await TeacherModel.findByIdAndUpdate(
                { _id: id },
                { $set: { isValid: true } },
                { new: true }
            );
            
            // Generate a token for the validated user
            const token = jwt.sign({ email: user.email }, JWT);
            
            // Return the user without sensitive information
            const userWithoutPassword = {
                _id: user._id,
                name: user.name,
                email: user.email,
                age: user.age,
                institute: user.institute,
                exprience: user.exprience,
                isTeacher: user.isTeacher,
                isValid: user.isValid
            };
            
            res.status(200).json({
                success: 1,
                msg: "User Verified ✔️",
                token,
                user: userWithoutPassword
            });
        } else {
            res.status(400).json({
                success: 0,
                msg: "Invalid OTP"
            });
        }
    } catch (e) {
        console.log("Error in OTP verification", e);
        next(e);
    }
});

// reset password
teacherRoute.post("/reset", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: 0,
                msg: "Email and password are required"
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await TeacherModel.findOneAndUpdate(
            { email },
            { $set: { password: hashedPassword } },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: 0,
                msg: "User not found"
            });
        }
        
        res.status(200).json({
            success: 1,
            msg: "Password Reset Done",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (e) {
        console.log("Error in reset password", e);
        next(e);
    }
});

teacherRoute.get('/user', async (req, res) => {
    try {
        const teacher = await TeacherModel.find(req.header.email);  

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Send the teacher's data (excluding sensitive info like password)
        const { password, ...teacherData } = teacher;
        return res.status(200).json(teacherData);
    } catch (error) {
        console.error('Error fetching teacher data:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});