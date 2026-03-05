import Timetable from '../models/TimeTable.js';

// --- SAVE TIMETABLE ---
export const saveTimetable = async (req, res) => {
  try {
    const { timetable } = req.body;

    if (!timetable) {
      return res.status(400).json({ success: false, message: "Timetable data is missing" });
    }

    const newEntry = new Timetable({
      data: timetable,
      updatedBy: req.user ? req.user.id : 'Admin' // uses Auth user if available
    });

    const saved = await newEntry.save();

    res.status(201).json({ 
      success: true, 
      message: "Timetable saved successfully", 
      data: saved // Return the whole object so frontend gets the ID
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

    if (id && id !== 'undefined' && id !== 'null') {
      record = await Timetable.findById(id);
    } else {
      // FIX: Sort by 'createdAt' (Mongoose default) instead of 'lastUpdated'
      // unless you specifically added 'lastUpdated' to your Schema.
      record = await Timetable.findOne().sort({ createdAt: -1 });
    }

    if (!record) {
      // This sends 404 if DB is empty -> Frontend sees this and loads Mock Data.
      // This is expected behavior for a new app.
      return res.status(404).json({ success: false, message: "No timetable found" });
    }

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

// --- GET HISTORY ---
export const getHistory = async (req, res) => {
    try {
        // FIX: Select 'createdAt' so the frontend can display the date
        const list = await Timetable.find({}, '_id createdAt updatedBy').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ message: "Error fetching history" });
    }
};

// --- DELETE ---
export const deleteTimetable = async (req, res) => {
    try {
        const { id } = req.query;

        // FIX: Only delete the specific ID, not the whole database!
        if (id) {
            await Timetable.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: "Version deleted" });
        } else {
            // Only delete all if explicitly intended (optional safety)
            // await Timetable.deleteMany({}); 
            res.status(400).json({ success: false, message: "No ID provided for deletion" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting" });
    }
};