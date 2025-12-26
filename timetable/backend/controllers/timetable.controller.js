import Timetable from '../models/TimeTable.js';

// --- SAVE TIMETABLE ---
export const saveTimetable = async (req, res) => {
  try {
    console.log("1. Backend Received Save Request");
    
    // The frontend sends { timetable: { ... } }
    const { timetable } = req.body;

    if (!timetable) {
      console.log("Error: No timetable data in body");
      return res.status(400).json({ success: false, message: "Timetable data is missing" });
    }

    // --- THE FIX IS HERE ---
    // We create a new entry using 'data' because that is what your Model uses.
    const newEntry = new Timetable({
      data: timetable,  // Map frontend 'timetable' -> DB 'data'
      updatedBy: 'Admin' // Optional, based on your model
    });

    const saved = await newEntry.save();
    console.log("2. Database Saved Successfully:", saved._id);

    res.status(201).json({ 
      success: true, 
      message: "Timetable saved successfully", 
      id: saved._id 
    });

  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// --- GET TIMETABLE ---
export const getTimetable = async (req, res) => {
  try {
    const { id } = req.query;
    let record;

    if (id) {
      record = await Timetable.findById(id);
    } else {
      // Get the most recent one
      record = await Timetable.findOne().sort({ lastUpdated: -1 });
    }

    if (!record) {
      return res.status(404).json({ success: false, message: "No timetable found" });
    }

    // --- THE FIX IS ALSO HERE ---
    // Your model stores it in 'data', so we must send back 'record.data'
    res.status(200).json({ 
      success: true, 
      data: record.data, 
      id: record._id 
    });

  } catch (error) {
    console.error("Get Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- GET HISTORY (Optional) ---
export const getHistory = async (req, res) => {
    try {
        // Fetch ID and Date for the dropdown list
        const list = await Timetable.find({}, '_id lastUpdated').sort({ lastUpdated: -1 });
        res.status(200).json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ message: "Error fetching history" });
    }
};

// --- DELETE (Optional) ---
export const deleteTimetable = async (req, res) => {
    try {
        await Timetable.deleteMany({});
        res.status(200).json({ message: "All timetables deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting" });
    }
};