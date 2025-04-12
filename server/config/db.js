import mongoose from 'mongoose'

export const connetToDataBase = async(url)=>{
    try{
        await mongoose.connect(url)
        console.log("Data Base Conneted ")
    }
    catch(e){
        console.log("error occured and  ", e)
    }

}