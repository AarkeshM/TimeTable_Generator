import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
        // REMOVED: unique: true <--- This was causing the 500 error
    },
    acronym: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true,
        enum: ["I", "II", "III", "IV"]
    },
    // This links the course to a specific staff member
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',    
        required: true  
    },
    CreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
},
    {
        timestamps: true
    }
);

export default mongoose.model('Course', CourseSchema);