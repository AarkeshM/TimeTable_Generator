import Course from "../models/Course.js";  

export const addCourse = async (req, res) => {
    try {
        const { name, code, acronym, year } = req.body;
        if(!name || !code || !acronym || !year){
            return res.status(400).json({message: "All the fields are required."});
        }
        const existing = await Course.findOne({code});
        if(existing){
            return res.status(400).json({ messages: "Course code already exists."});
        }

        const course = await Course.create({
            name,
            code,
            acronym,
            year,
            CreatedBy: req.user?.id || null
        });
        
        res.status(201).json({ message: "Course added Successfully", course});
    } catch (error){
        console.error("Add Course Error:", error);
        res.status(500).json({ message: "Server error while adding course."});
    }
};

export const getCourse = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json({ courses });
    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({ message: "Server error while fetching courses." });
    }
};