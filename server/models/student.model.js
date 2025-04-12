import mongoose from "mongoose";


const StudentSchema = mongoose.Schema({
    name : {
        type:String,
        required: true,
    },

    email:{
        unique: true,
        type:String,
        required: true,
    },
    class:{
        required:true,
        type:String,

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
        default:false,
        type:Boolean
    },
    password:{
        type:String,
        required:true
    }
})

const StudentModel = mongoose.model("Student", StudentSchema)

export {StudentModel}