import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  // We use 'Mixed' because your data structure has dynamic keys (Years/Sections)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String, 
    default: 'Admin'
  }
});

// Note: Using export default for ES Modules
const Timetable = mongoose.model('Timetable', TimetableSchema);
export default Timetable;