import mongoose  from "mongoose";

const TeacherSchema = mongoose.Schema({
    name : {
        type:String,
        required:true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    createdAt : {
        type:Date,
        default :  Date.now()
    },
    age:{
        type:String, 
        required:true,
    },
    institute :{
        type:String,
        required:true
    },
    isValid : {
        type:Boolean,
        default:false
    },
    isTeacher:{
        default:true,
        type:Boolean
    },
    exprience : {
        type:String,
        required:true,
    }
})

const TeacherModel = new mongoose.model("Teacher", TeacherSchema)

export {TeacherModel};