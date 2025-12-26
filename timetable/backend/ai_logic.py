import os
import random
import pandas as pd
from collections import defaultdict
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv  # <--- NEW: Import dotenv

# =========================================================
# 1. DATABASE CONFIGURATION
# =========================================================

# Load environment variables from .env file
load_dotenv() 

# Get the MONGO_URI from the environment (secure way)
MONGO_URI = os.getenv("MONGO_URI")

# Fallback in case .env is missing or variable is empty (useful for debugging)
if not MONGO_URI:
    print("WARNING: MONGO_URI not found in .env file. Attempting localhost default.")
    MONGO_URI = "mongodb://localhost:27017/"

# ✅ FIX 1: Default Mongoose DB name is 'test'. 
# If you named it something else in mongoose.connect(), change it here.
DB_NAME = "test"

def fetch_subjects_from_db(year_string, department=None):
    """
    Connects to MongoDB and fetches course names for a specific year.
    Performs a Lookup to get the Course Name from the Course ID.
    """
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Define the match criteria
    # ✅ FIX 2: Schema uses "I", "II" (Strings), not Integers.
    match_query = {"year": year_string}
    
    # Note: I removed the 'department' filter because your Allocation schema 
    # didn't show a department field. If you add it later, uncomment below.
    # if department:
    #     match_query["department"] = department

    pipeline = [
        # 1. Filter by Year
        {"$match": match_query},
        
        # 2. Join with 'courses' collection to get name
        # ✅ FIX 3: Local field is 'courseId' in your schema, not 'course'
        {"$lookup": {
            "from": "courses", 
            "localField": "courseId",
            "foreignField": "_id",
            "as": "course_info"
        }},
        
        # 3. Unwind the array (since lookup returns an array)
        {"$unwind": "$course_info"},
        
        # 4. Project only the course name
        {"$project": {
            "_id": 0,
            "subject_name": "$course_info.name", 
            "subject_code": "$course_info.code"
        }}
    ]
    
    # ✅ FIX 4: Mongoose model "Allocation" becomes "allocations" collection
    results = list(db.allocations.aggregate(pipeline))
    
    # Extract just the list of names
    subject_list = [item['subject_name'] for item in results]
    
    # Remove duplicates
    client.close()
    return list(set(subject_list))

# =========================================================
# 2. DAYS & TIME SLOTS (UNCHANGED)
# =========================================================
DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
TIME_SLOTS = [
    "9.00–9.50",   # 0 First period
    "9.50–10.40",  # 1
    "10.55–11.45", # 2
    "11.45–12.35", # 3
    "12.35–1.30",  # 4 LUNCH
    "1.30–2.20",   # 5
    "2.20–3.10",   # 6
    "3.10–4.00",   # 7
    "4.00–4.50",   # 8 Last period
]

BASE_TEMPLATE = {d: [""] * len(TIME_SLOTS) for d in DAYS}
for d in DAYS:
    BASE_TEMPLATE[d][4] = "LUNCH"

LUNCH_HTML = "<div class='vertical-text'>L<br>U<br>N<br>C<br>H</div>"

# =========================================================
# 3. YEAR SECTIONS & LOGIC
# =========================================================
YEAR_SECTIONS = {
    "1st Year": ["A", "B", "C"],
    "2nd Year": ["A", "B", "C", "D"],
    "3rd Year": ["A", "B"],
    "4th Year": ["A", "B"],
}

# ✅ FIX 5: Mapping Year Labels to Schema Values (Roman Numerals)
YEAR_MAP_DB = {
    "1st Year": "I",
    "2nd Year": "II",
    "3rd Year": "III",
    "4th Year": "IV"
}

LAB_SLOTS = [
    [1, 2, 3],  # Periods 2–3–4 only
    [5, 6, 7],  # Periods 6–7–8 only
]

# =========================================================
# 4. ALGORITHM HELPERS (UNCHANGED)
# =========================================================
def is_lab(s):
    return "lab" in str(s).lower()

def auto_assign_hours(subjects, rnd):
    hours = {}
    theory_subjects = [s for s in subjects if not is_lab(s)]
    lab_subjects = [s for s in subjects if is_lab(s)]

    total_periods = len(DAYS) * (len(TIME_SLOTS) - 1) 
    
    for lab in lab_subjects:
        hours[lab] = 3

    total_lab_hours = len(lab_subjects) * 3
    remaining = total_periods - total_lab_hours

    if remaining < 0:
        while remaining < 0 and lab_subjects:
            lab_subjects.pop()
            total_lab_hours = len(lab_subjects) * 3
            remaining = total_periods - total_lab_hours
        hours = {lab: 3 for lab in lab_subjects}

    if theory_subjects:
        base = remaining // len(theory_subjects)
        extra = remaining % len(theory_subjects)
        for s in theory_subjects:
            hours[s] = base
        for i in range(extra):
            hours[theory_subjects[i]] += 1

    return hours

def assign_first_period_unique(tt, theory, rnd):
    FIRST = 0
    theory_no_lab = [s for s in theory if not is_lab(s)]
    if not theory_no_lab: return {}

    if len(theory_no_lab) < len(DAYS):
        theory_no_lab = theory_no_lab * 2

    rnd.shuffle(theory_no_lab)
    used = set()
    assigned = {}

    for day in DAYS:
        valid = [s for s in theory_no_lab if s not in used]
        if not valid:
            valid = [s for s in theory_no_lab]

        pick = rnd.choice(valid)
        used.add(pick)
        tt[day][FIRST] = pick
        assigned[day] = pick
    return assigned

def assign_last_period_unique(tt, theory, rnd):
    LAST = 8
    theory_no_lab = [s for s in theory if not is_lab(s)]
    if not theory_no_lab: return {}

    if len(theory_no_lab) < len(DAYS):
        theory_no_lab = theory_no_lab * 2

    rnd.shuffle(theory_no_lab)
    used = set()
    assigned = {}

    for day in DAYS:
        valid = [s for s in theory_no_lab if s not in used]
        if not valid:
            valid = [s for s in theory_no_lab]

        pick = rnd.choice(valid)
        used.add(pick)
        tt[day][LAST] = pick
        assigned[day] = pick
    return assigned

def place_labs(tt, labs, rnd, forbidden=None):
    if forbidden is None: forbidden = {}
    placements = []
    days_used = set()

    for lab in labs:
        placed = False
        candidates = [d for d in DAYS[:-1] if d not in days_used] # No Sat
        rnd.shuffle(candidates)

        for day in candidates:
            if day in forbidden.get(lab, set()): continue
            
            slots_try = LAB_SLOTS.copy()
            rnd.shuffle(slots_try)
            
            for slot in slots_try:
                if all(tt[day][i] == "" for i in slot):
                    for i in slot: tt[day][i] = lab
                    placements.append((lab, day, slot))
                    days_used.add(day)
                    placed = True
                    break
            if placed: break
    return placements

def place_theory_subjects(tt, theory, hours_left, first_assign, last_assign, rnd):
    for d, s in first_assign.items():
        if s in hours_left: hours_left[s] -= 1
    for d, s in last_assign.items():
        if s in hours_left: hours_left[s] -= 1

    empty = []
    for day in DAYS:
        for idx in range(len(TIME_SLOTS)):
            if idx == 4: continue
            if tt[day][idx] == "": empty.append((day, idx))

    rnd.shuffle(empty)
    sat_used = set()

    for (day, idx) in empty:
        prev = tt[day][idx-1] if idx > 0 and idx-1 != 4 else None
        nxt = tt[day][idx+1] if idx < 8 and idx+1 != 4 else None

        pool = [s for s in theory if hours_left.get(s, 0) > 0]
        pool = [s for s in pool if s != prev and s != nxt]

        if day == "SAT":
            pool = [s for s in pool if s not in sat_used]

        if day != "SAT":
            limited = [s for s in pool if sum(1 for j in range(9) if tt[day][j] == s) < 2]
            if limited: pool = limited

        if not pool: pool = [s for s in theory if s != prev and s != nxt]
        if not pool: pool = [s for s in theory if s != prev]
        
        if pool:
            pick = rnd.choice(pool)
            tt[day][idx] = pick
            if pick in hours_left: hours_left[pick] -= 1
            if day == "SAT": sat_used.add(pick)

# =========================================================
# 5. GENERATORS (UNCHANGED)
# =========================================================
def generate_single(subjects, seed=None, forbidden=None):
    rnd = random.Random(seed)
    tt = {d: BASE_TEMPLATE[d][:] for d in DAYS}

    labs = [s for s in subjects if is_lab(s)]
    theory = [s for s in subjects if not is_lab(s)]

    if not theory and not labs:
        theory = ["Free Period"]

    hours = auto_assign_hours(subjects, rnd)
    first_assign = assign_first_period_unique(tt, theory, rnd)
    last_assign = assign_last_period_unique(tt, theory, rnd)
    placements = place_labs(tt, labs, rnd, forbidden)

    hours_left = hours.copy()
    place_theory_subjects(tt, theory, hours_left, first_assign, last_assign, rnd)

    for d in DAYS:
        if tt[d][4] == "LUNCH": tt[d][4] = LUNCH_HTML

    df = pd.DataFrame(tt, index=TIME_SLOTS).T
    return df, hours, placements, first_assign, last_assign

def generate_for_year(subjects, year_label):
    secs = YEAR_SECTIONS.get(year_label, ["A"])
    out = {}
    forbidden = {}
    base = abs(hash(year_label)) % (10**6)

    for i, sec in enumerate(secs):
        seed = base + i * 11
        df, hours, placements, first_assign, last_assign = generate_single(subjects, seed, forbidden)
        for lab, day, _ in placements:
            forbidden.setdefault(lab, set()).add(day)
        out[sec] = (df, hours)
    return out

def generate_all(year_subjects_map):
    result = {}
    for year_label, subjects in year_subjects_map.items():
        print(f"Generating for {year_label} with subjects: {subjects}")
        result[year_label] = generate_for_year(subjects, year_label)
    return result

# =========================================================
# 6. MAIN EXECUTION WITH DB FETCH
# =========================================================
if __name__ == "__main__":
    try:
        # 1. Prepare input dictionary dynamically from DB
        db_inputs = {}
        
        # NOTE: Removed Department filter here as well to match Schema
        
        for year_label, year_code in YEAR_MAP_DB.items():
            # Fetch subjects for Year "I", "II", "III", "IV"
            subjects = fetch_subjects_from_db(year_code)
            
            if subjects:
                db_inputs[year_label] = subjects
            else:
                print(f"No subjects found for {year_label} (Year Code: {year_code}) in DB.")
        
        # 2. Generate Timetables
        if db_inputs:
            timetables = generate_all(db_inputs)

            # 3. Print/Export logic
            if "2nd Year" in timetables:
                print("\n--- 2nd Year Section A Timetable ---")
                print(timetables["2nd Year"]["A"][0]) 
        else:
            print("No data available to generate timetables. (Did you add allocations in the Admin Dashboard?)")

    except Exception as e:
        print(f"Error connecting to DB or generating: {e}") 