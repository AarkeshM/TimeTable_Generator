# ai_logic.py - FIXED LAB ALLOCATION (ONE LAB PER DAY)
import os
import random
import pandas as pd
from collections import defaultdict
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv

# =========================================================
# 1. CONFIGURATION
# =========================================================
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://aarkeshcse2023_db_user:aarkeshharry@cluster0.s81ocvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = "test"

# =========================================================
# 2. DAYS & TIME SLOTS
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
# 3. YEAR SECTIONS
# =========================================================
YEAR_SECTIONS = {
    "1st Year": ["A", "B", "C"],
    "2nd Year": ["A", "B", "C", "D"],
    "3rd Year": ["A", "B"],
    "4th Year": ["A", "B"],
}

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
# 4. DATABASE FUNCTIONS
# =========================================================
def fetch_and_prepare_data():
    """
    Fetch data and organize by year and section
    Returns: {
        year_label: {
            'A': {subject: periods},
            'B': {subject: periods},
            ...
        }
    }
    """
    print("🔍 Fetching data from database...")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Get all allocations
        allocations = list(db.allocations.find())
        if not allocations:
            print("❌ No allocations found!")
            client.close()
            return {}
        
        print(f"✅ Found {len(allocations)} allocations")
        
        # Get all courses
        courses = list(db.courses.find())
        courses_dict = {str(course['_id']): course for course in courses}
        print(f"✅ Found {len(courses)} courses")
        
        # Get all staff
        staff = list(db.users.find({"role": "staff"}))
        staff_dict = {str(s['_id']): s for s in staff}
        
        # Organize data by year and section
        year_section_data = {}
        
        for alloc in allocations:
            year_str = alloc.get('year', '').strip()
            section = alloc.get('section', 'A').strip().upper()
            
            # Handle periods
            periods = alloc.get('periods', 0) or 0
            lab_periods = alloc.get('lab', 0) or 0
            total_periods = periods + lab_periods
            
            if not year_str or total_periods == 0:
                continue
            
            # Map year to label
            year_label = YEAR_MAP_DB.get(year_str, f"Year {year_str}")
            
            # Get course details
            course_id = str(alloc.get('courseId', ''))
            course = courses_dict.get(course_id)
            
            if not course:
                continue
            
            # Get subject name
            subject_name = course.get('name', 'Unknown').strip()
            if not subject_name:
                subject_name = course.get('code', 'Unknown').strip()
            
            # Get faculty name
            faculty_name = "Unknown"
            staff_id = str(alloc.get('staffId', ''))
            if staff_id in staff_dict:
                faculty = staff_dict[staff_id]
                faculty_name = faculty.get('name', faculty.get('username', 'Unknown')).strip()
            
            # Initialize data structure
            if year_label not in year_section_data:
                year_section_data[year_label] = {}
            
            if section not in year_section_data[year_label]:
                year_section_data[year_label][section] = {}
            
            # Create subject key
            subject_key = f"{subject_name}"
            if faculty_name != "Unknown":
                subject_key = f"{subject_name} ({faculty_name})"
            
            # Store subject
            year_section_data[year_label][section][subject_key] = total_periods
        
        client.close()
        
        # Print summary
        print("\n📊 DATABASE DATA SUMMARY:")
        print("="*60)
        
        for year_label, sections in year_section_data.items():
            print(f"\n{year_label}:")
            total_subjects = 0
            total_periods = 0
            
            for section, subjects in sections.items():
                section_subjects = len(subjects)
                section_periods = sum(subjects.values())
                total_subjects += section_subjects
                total_periods += section_periods
                
                print(f"  Section {section}: {section_subjects} subjects, {section_periods} periods")
                for subject, periods in subjects.items():
                    lab_marker = " (Lab)" if is_lab(subject) else ""
                    print(f"    - {subject}: {periods}{lab_marker}")
            
            print(f"  TOTAL: {total_subjects} subjects, {total_periods} periods")
        
        return year_section_data
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {}

# =========================================================
# 5. LAB ALLOCATION FUNCTIONS (FIXED - ONE LAB PER DAY)
# =========================================================
def is_lab(subject):
    subject_lower = subject.lower()
    lab_keywords = ['lab', 'laboratory', 'practical', 'workshop', 'experiment']
    return any(keyword in subject_lower for keyword in lab_keywords)

def allocate_labs_one_per_day(tt, labs, rnd):
    """
    Allocate labs with ONE LAB PER DAY rule
    Each lab gets 3 continuous periods on a separate day
    """
    print(f"    🔬 Allocating {len(labs)} labs (one lab per day)...")
    
    # Days available for labs (no Saturday for labs)
    available_days = [d for d in DAYS if d != "SAT"]
    rnd.shuffle(available_days)
    
    labs_placed = 0
    
    for lab in labs:
        placed = False
        
        for day in available_days:
            # Check if this day already has a lab
            day_has_lab = False
            for period in range(9):
                if period != 4 and is_lab(tt[day][period]):
                    day_has_lab = True
                    break
            
            if day_has_lab:
                continue  # Skip this day, already has a lab
            
            # Try both lab slot configurations
            for slot in LAB_SLOTS:
                # Check if slot is completely empty
                if all(tt[day][i] == "" for i in slot):
                    # Place the lab
                    for i in slot:
                        tt[day][i] = lab
                    print(f"      ✅ {lab} -> {day} periods {slot}")
                    labs_placed += 1
                    placed = True
                    break
            
            if placed:
                # Remove this day from available days
                available_days.remove(day)
                break
        
        if not placed:
            print(f"      ❌ Could not place lab: {lab}")
    
    print(f"    ✅ Placed {labs_placed}/{len(labs)} labs")
    return labs_placed

def assign_first_period_unique(tt, subjects, rnd):
    """Assign unique non-lab subjects to first period"""
    FIRST = 0
    eligible = [s for s in subjects if not is_lab(s)]
    if not eligible:
        return {}
    
    if len(eligible) < len(DAYS):
        eligible = eligible * 2
    
    rnd.shuffle(eligible)
    used = set()
    assigned = {}
    
    for day in DAYS:
        valid = [s for s in eligible if s not in used]
        if not valid:
            valid = eligible
        
        pick = rnd.choice(valid)
        used.add(pick)
        tt[day][FIRST] = pick
        assigned[day] = pick
    
    return assigned

def assign_last_period_unique(tt, subjects, rnd):
    """Assign unique non-lab subjects to last period"""
    LAST = 8
    eligible = [s for s in subjects if not is_lab(s)]
    if not eligible:
        return {}
    
    if len(eligible) < len(DAYS):
        eligible = eligible * 2
    
    rnd.shuffle(eligible)
    used = set()
    assigned = {}
    
    for day in DAYS:
        valid = [s for s in eligible if s not in used]
        if not valid:
            valid = eligible
        
        pick = rnd.choice(valid)
        used.add(pick)
        tt[day][LAST] = pick
        assigned[day] = pick
    
    return assigned

def place_theory_subjects(tt, subjects, periods_left, first_assign, last_assign, rnd):
    """Place theory subjects respecting exact period counts"""
    # Track placed periods
    placed_count = 0
    
    # Deduct first and last periods
    for day, subject in first_assign.items():
        if subject in periods_left:
            periods_left[subject] = max(0, periods_left[subject] - 1)
            placed_count += 1
            print(f"      First period: {subject} on {day}")
    
    for day, subject in last_assign.items():
        if subject in periods_left:
            periods_left[subject] = max(0, periods_left[subject] - 1)
            placed_count += 1
            print(f"      Last period: {subject} on {day}")
    
    # Get all empty slots
    empty_slots = []
    for day in DAYS:
        for idx in range(len(TIME_SLOTS)):
            if idx == 4:  # Skip lunch
                continue
            if tt[day][idx] == "":
                empty_slots.append((day, idx))
    
    rnd.shuffle(empty_slots)
    
    print(f"      Empty slots: {len(empty_slots)}")
    print(f"      Periods to place: {sum(periods_left.values())}")
    
    # Place remaining subjects
    for day, idx in empty_slots:
        if sum(periods_left.values()) == 0:
            break
        
        # Check adjacent periods
        prev_subject = tt[day][idx-1] if idx > 0 and idx-1 != 4 else None
        next_subject = tt[day][idx+1] if idx < 8 and idx+1 != 4 else None
        
        # Get available subjects
        pool = [s for s in subjects if periods_left.get(s, 0) > 0]
        
        # Avoid consecutive same subject
        if prev_subject:
            pool = [s for s in pool if s != prev_subject]
        if next_subject:
            pool = [s for s in pool if s != next_subject]
        
        # Apply daily limit (max 2 periods per day per subject)
        limited = []
        for s in pool:
            daily_count = sum(1 for j in range(9) if tt[day][j] == s)
            if daily_count < 2:
                limited.append(s)
        if limited:
            pool = limited
        
        if pool:
            pick = rnd.choice(pool)
            tt[day][idx] = pick
            periods_left[pick] = max(0, periods_left[pick] - 1)
            placed_count += 1
    
    # Check for unplaced periods
    unplaced = sum(periods_left.values())
    if unplaced > 0:
        print(f"      ⚠️ {unplaced} periods could not be placed")
        for subject, remaining in periods_left.items():
            if remaining > 0:
                print(f"        - {subject}: {remaining} periods unplaced")
    
    print(f"      ✅ Placed {placed_count} total periods")

# =========================================================
# 6. TIMETABLE GENERATION
# =========================================================
def generate_single_section(subjects_with_hours, section_name, seed=None):
    """Generate timetable for a single section"""
    rnd = random.Random(seed)
    tt = {d: BASE_TEMPLATE[d][:] for d in DAYS}
    
    subjects = list(subjects_with_hours.keys())
    labs = [s for s in subjects if is_lab(s)]
    theory = [s for s in subjects if not is_lab(s)]
    
    periods = subjects_with_hours.copy()
    
    print(f"\n    📚 Section {section_name}")
    print(f"    Total subjects: {len(subjects)}")
    print(f"    Theory subjects: {len(theory)}")
    print(f"    Lab subjects: {len(labs)}")
    print(f"    Total periods: {sum(periods.values())}")
    
    # Check if we have too many labs for available days
    if len(labs) > len([d for d in DAYS if d != "SAT"]):
        print(f"    ⚠️ Warning: Too many labs ({len(labs)}) for available days!")
    
    # Step 1: Allocate labs (ONE LAB PER DAY)
    allocate_labs_one_per_day(tt, labs, rnd)
    
    # Step 2: Assign first periods (unique subjects)
    print(f"\n    🕘 Assigning first periods...")
    first_assign = assign_first_period_unique(tt, subjects, rnd)
    
    # Step 3: Assign last periods (unique subjects)
    print(f"\n    🕔 Assigning last periods...")
    last_assign = assign_last_period_unique(tt, subjects, rnd)
    
    # Step 4: Place theory subjects
    print(f"\n    📖 Placing theory subjects...")
    periods_left = periods.copy()
    place_theory_subjects(tt, theory, periods_left, first_assign, last_assign, rnd)
    
    # Format lunch
    for d in DAYS:
        if tt[d][4] == "LUNCH": 
            tt[d][4] = LUNCH_HTML
    
    df = pd.DataFrame(tt, index=TIME_SLOTS).T
    
    # Calculate actual periods placed
    actual_periods = {}
    for subject in subjects:
        count = sum(1 for day in DAYS for i in range(9) if tt[day][i] == subject)
        actual_periods[subject] = count
    
    # Verify labs are correctly placed (3 continuous periods)
    print(f"\n    🔍 Verifying lab placements:")
    for lab in labs:
        lab_days = []
        for day in DAYS:
            if lab in tt[day]:
                lab_days.append(day)
        
        if lab_days:
            print(f"      {lab}: placed on {lab_days}")
            # Check if it's 3 continuous periods
            for day in lab_days:
                positions = [i for i in range(9) if tt[day][i] == lab]
                if len(positions) == 3:
                    print(f"        ✅ {day}: 3 continuous periods ({positions})")
                else:
                    print(f"        ❌ {day}: {len(positions)} periods ({positions})")
        else:
            print(f"      {lab}: NOT PLACED")
    
    return df, actual_periods

def generate_all(year_section_data):
    """
    Generate timetables for ALL sections
    """
    results = {}
    
    if not year_section_data:
        print("❌ No data to generate!")
        return results
    
    print("\n" + "="*60)
    print("GENERATING TIMETABLES FOR ALL SECTIONS")
    print("="*60)
    
    for year_label, sections in year_section_data.items():
        print(f"\n🎯 {year_label.upper()}")
        
        year_results = {}
        
        for section, subjects in sections.items():
            if not subjects:
                print(f"  ⚠️ No subjects for Section {section}")
                continue
            
            seed = abs(hash(f"{year_label}_{section}")) % (10**6)
            
            df, periods = generate_single_section(subjects, section, seed)
            year_results[section] = (df, periods)
        
        if year_results:
            results[year_label] = year_results
            print(f"\n  ✅ Generated for {len(year_results)} section(s)")
    
    return results

# =========================================================
# 7. COMPATIBILITY FUNCTIONS
# =========================================================
def fetch_subjects_with_hours_from_db(year_string):
    all_data = fetch_and_prepare_data()
    
    # Convert to old format for compatibility
    result = {}
    for year_label, sections in all_data.items():
        if YEAR_MAP_DB.get(year_label) == year_string:
            for section, subjects in sections.items():
                result.update(subjects)
    
    return result

def fetch_subjects_from_db(year_string):
    subjects_with_hours = fetch_subjects_with_hours_from_db(year_string)
    return list(subjects_with_hours.keys())

# =========================================================
# 8. MAIN EXECUTION
# =========================================================
if __name__ == "__main__":
    try:
        print("🎯 AI TIMETABLE GENERATOR - ONE LAB PER DAY RULE")
        print("=" * 60)
        
        # Fetch data
        year_section_data = fetch_and_prepare_data()
        
        if year_section_data:
            # Generate for ALL sections
            timetables = generate_all(year_section_data)
            
            # Display ALL results
            if timetables:
                print("\n✅ GENERATION COMPLETE FOR ALL SECTIONS!")
                print("=" * 60)
                
                for year_label, sections in timetables.items():
                    print(f"\n📊 {year_label.upper()}")
                    print("-" * 40)
                    
                    for section, (df, periods) in sections.items():
                        print(f"\nSection {section}:")
                        print(df.to_string())
                        
                        if periods:
                            print(f"\nPeriods Summary:")
                            labs = [s for s in periods.keys() if is_lab(s)]
                            theory = [s for s in periods.keys() if not is_lab(s)]
                            
                            if theory:
                                print(f"\n  Theory Subjects:")
                                for subject in theory:
                                    print(f"    {subject}: {periods[subject]}")
                            
                            if labs:
                                print(f"\n  Lab Subjects:")
                                for lab in labs:
                                    print(f"    {lab}: {periods[lab]}")
            else:
                print("\n❌ No timetables generated")
        else:
            print("\n❌ No data available")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()