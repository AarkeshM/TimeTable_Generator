import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    code:{
        type:String,
        required:true,
        unique:true
    },
    acronym:{
        type:String,
        required:true
    },
    year:{
        type:String,
        required:true,
        enum: ["I", "II", "III", "IV"]
    },
    CreatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
},
    {
        timestamps:true
    }
);

export default mongoose.model('Course', CourseSchema);