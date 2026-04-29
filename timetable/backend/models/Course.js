import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema(
{
    courseName: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        trim: true
    },

    acronym: {
        type: String,
        required: true,
        trim: true
    },

    year: {
        type: String,
        required: true,
        enum: ["I", "II", "III", "IV"]
    },

    // ✅ NEW: Course Type
    type: {
        type: String,
        required: true,
        enum: ["Core", "Lab", "Elective"]
    },

    // ✅ NEW: Approval Status
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },

    // Staff who owns this course
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Who created (can be same as staff or admin)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

},
{
    timestamps: true
}
);

export default mongoose.model('Course', CourseSchema);