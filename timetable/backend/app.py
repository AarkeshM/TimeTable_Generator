import os
import io
import json
import zipfile
import sqlite3
from datetime import datetime
from flask import (
    Flask, render_template, request, send_file, redirect, url_for, flash, jsonify
)
from flask_cors import CORS
import pandas as pd
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from pymongo import MongoClient
from dotenv import load_dotenv  # <--- NEW: Import dotenv

# Import your AI Logic
from ai_logic import generate_all 

# ----- Config -----
app = Flask(__name__)
app.secret_key = "ksr-timetable-secret"
CORS(app)  # <--- ENABLE CORS FOR REACT FRONTEND

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Keep SQLite ONLY for saving generated history
DB_FILE = os.path.join(BASE_DIR, "timetables.db") 
GENERATED_DIR = os.path.join(BASE_DIR, "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)

# =========================================================
# MONGODB CONFIGURATION (UPDATED)
# =========================================================

# Load environment variables from .env file
load_dotenv()

# Get the MONGO_URI from the environment
MONGO_URI = os.getenv("MONGO_URI")

# Fallback in case .env is missing or variable is empty
if not MONGO_URI:
    print("WARNING: MONGO_URI not found in .env file. Attempting localhost default.")
    MONGO_URI = "mongodb://localhost:27017/"

# ✅ FIX 1: Default Mongoose DB name is 'test'. 
DB_NAME = "test"

COLLEGE_NAME = "K S R COLLEGE OF ENGINEERING"
DEPARTMENT_NAME = "Computer Science and Engineering"
YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

# ✅ FIX 2: Mapping Flask Year Strings -> Mongoose Schema Strings (Roman Numerals)
YEAR_MAP_DB = {
    "1st Year": "I",
    "2nd Year": "II",
    "3rd Year": "III",
    "4th Year": "IV"
}

# ----- Init SQLite for History (Timetables only) -----
def init_timetable_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS timetables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year TEXT,
        section TEXT,
        subjects TEXT,
        hours TEXT,
        timetable_html TEXT,
        timestamp TEXT
    )
    """)
    conn.commit()
    conn.close()

init_timetable_db()

# ----- MONGODB HELPER: Fetch from Allocations -----
def get_subjects_from_mongo(year_label):
    """
    Connects to MongoDB, finds allocations for the specific year,
    and joins with the Courses collection to get names.
    """
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Get the Roman Numeral (e.g., "II")
    year_str = YEAR_MAP_DB.get(year_label)
    if not year_str:
        return []

    # Aggregation Pipeline
    pipeline = [
        # 1. Match allocations for this Year (using String "I", "II" etc)
        {"$match": {"year": year_str}},
        
        # 2. Join with 'courses' collection
        # ✅ FIX 3: Correct localField to 'courseId' (matches Schema)
        {"$lookup": {
            "from": "courses", 
            "localField": "courseId", 
            "foreignField": "_id",
            "as": "course_info"
        }},
        
        # 3. Unwind the array
        {"$unwind": "$course_info"},
        
        # 4. Extract just the name
        {"$project": {
            "_id": 0,
            "name": "$course_info.name" # Ensure Course schema has a 'name' field
        }}
    ]
    
    # ✅ FIX 4: Correct Collection Name to 'allocations' (Mongoose pluralizes models)
    results = list(db.allocations.aggregate(pipeline))
    
    # Extract names and remove duplicates
    subject_names = list(set([item['name'] for item in results]))
    
    client.close()
    return subject_names

# ----- Timetable DB helpers (SQLite for History) -----
def save_timetable_to_db(year, section, subjects, hours, html):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("INSERT INTO timetables (year, section, subjects, hours, timetable_html, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                (year, section, json.dumps(subjects), json.dumps(hours), html, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def list_saved_timetables():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT id, year, section, timestamp FROM timetables ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    return rows

def get_saved_timetable(id_):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT id, year, section, subjects, hours, timetable_html FROM timetables WHERE id=?", (id_,))
    row = cur.fetchone()
    conn.close()
    return row

def delete_saved_timetable(id_):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("DELETE FROM timetables WHERE id=?", (id_,))
    conn.commit()
    conn.close()

# ----- PDF builder -----
def build_pdf_with_cover(timetable_list):
    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    styles = getSampleStyleSheet()
    elements = []

    # cover
    cover_style = styles["Title"]
    cover_style.textColor = colors.HexColor("#003366")
    elements.append(Paragraph(f"<b>{COLLEGE_NAME}</b>", cover_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(DEPARTMENT_NAME, styles["Heading2"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("AI Automated Timetable Report", styles["Heading1"]))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"Generated On: {datetime.now().strftime('%d-%m-%Y')}", styles["Normal"]))
    elements.append(PageBreak())

    for title, df in timetable_list:
        elements.append(Paragraph(title, styles["Heading2"]))
        elements.append(Spacer(1, 8))
        header = ["DAY/TIME"] + list(df.columns)
        data = [header]
        for idx, row in df.iterrows():
            cleaned = []
            for cell in row:
                s = str(cell)
                s = s.replace("<div class='vertical-text'>", "").replace("</div>", "").replace("<br>", "\n")
                cleaned.append(s)
            data.append([idx] + cleaned)
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.3, colors.grey),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(table)
        elements.append(PageBreak())

    pdf.build(elements)
    buffer.seek(0)
    return buffer

# ----- INPUT COLLECTOR -----
def collect_year_subjects(req_form):
    year_subjects = {}
    for y in YEARS:
        mongo_subjects = get_subjects_from_mongo(y)
        if mongo_subjects:
            year_subjects[y] = mongo_subjects
        else:
            raw = req_form.get(f'subjects_{y}', "").strip()
            if raw == "":
                year_subjects[y] = []
            else:
                parts = raw.replace("\n", ",").split(",")
                subs = [s.strip() for s in parts if s.strip()]
                year_subjects[y] = subs
    return year_subjects


# =================================================================
# NEW API ENDPOINTS FOR REACT FRONTEND
# =================================================================

@app.route('/api/generate-timetable', methods=['POST'])
def api_generate_timetable():
    """
    API Endpoint for React Dashboard.
    1. Fetches subjects from MongoDB.
    2. Runs AI generation logic.
    3. Returns JSON response.
    """
    try:
        # 1. Fetch Subjects automatically from Mongo
        db_inputs = {}
        found_allocations = False

        for year_label in YEARS:
            subjects = get_subjects_from_mongo(year_label)
            if subjects:
                db_inputs[year_label] = subjects
                found_allocations = True
            else:
                db_inputs[year_label] = []

        if not found_allocations:
            return jsonify({
                "success": False, 
                "message": "No Staff/Course allocations found in Database. Please allocate courses first."
            }), 400

        # 2. Run the AI Generator
        generated_data = generate_all(db_inputs)

        # 3. Convert DataFrames to JSON
        json_response = {}
        
        for year, sections in generated_data.items():
            json_response[year] = {}
            for sec, (df, hours) in sections.items():
                # Clean Data for JSON (replace NaNs with empty string)
                df_clean = df.fillna("")
                
                # Convert DataFrame to List of Lists (Rows)
                table_data = df_clean.reset_index().values.tolist() # Includes 'Day' as first column
                
                # Get Column Headers (Time Slots)
                columns = ["Time"] + df_clean.columns.tolist()
                
                json_response[year][sec] = {
                    "columns": columns,
                    "data": table_data,
                    "hours": hours
                }

        return jsonify({
            "success": True, 
            "message": "Timetable Generated Successfully",
            "timetable": json_response
        })

    except Exception as e:
        print(f"Generation Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# LEGACY HTML ROUTES (Keep these if you still want to use the old UI)
# =================================================================

@app.route('/')
def dashboard():
    return render_template("dashboard.html", years=YEARS)

@app.route('/subjects_page')
def subjects_page():
    return render_template('course_management.html', years=YEARS)

@app.route('/generate_all', methods=['POST'])
def generate_all_route():
    year_subjects = collect_year_subjects(request.form)
    has_data = any(len(subs) > 0 for subs in year_subjects.values())
    if not has_data:
        flash("No subjects found in Staff Allocation DB.", "error")
        return redirect(url_for('dashboard'))

    all_timetables = generate_all(year_subjects) 
    return render_template("timetable_tabs.html", all_timetables=all_timetables, college=COLLEGE_NAME, department=DEPARTMENT_NAME)

@app.route('/download_pdf', methods=['POST'])
def download_pdf_route():
    year_subjects = collect_year_subjects(request.form)
    all_timetables = generate_all(year_subjects)
    pdf_list = []
    for year, sections in all_timetables.items():
        for sec, (df, hours) in sections.items():
            pdf_list.append((f"{year} - Section {sec}", df))
    buf = build_pdf_with_cover(pdf_list)
    return send_file(buf, as_attachment=True, download_name="All_Timetables.pdf", mimetype="application/pdf")

@app.route('/download_excel', methods=['POST'])
def download_excel_route():
    year_subjects = collect_year_subjects(request.form)
    all_timetables = generate_all(year_subjects)
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="xlsxwriter") as writer:
        for year, sections in all_timetables.items():
            for sec, (df, hours) in sections.items():
                sheet = f"{year[:3]}-{sec}"
                df_clean = df.replace({r"<.*?>": ""}, regex=True)
                df_clean.to_excel(writer, sheet_name=sheet[:31])
    out.seek(0)
    return send_file(out, as_attachment=True, download_name="All_Timetables.xlsx", mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

@app.route('/download_zip', methods=['POST'])
def download_zip_route():
    year_subjects = collect_year_subjects(request.form)
    all_timetables = generate_all(year_subjects)
    zbuf = io.BytesIO()
    with zipfile.ZipFile(zbuf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for year, sections in all_timetables.items():
            for sec, (df, hours) in sections.items():
                pdf_buf = build_pdf_with_cover([(f"{year} - Section {sec}", df)])
                filename = f"{year.replace(' ', '_')}_{sec}.pdf"
                zf.writestr(filename, pdf_buf.getvalue())
    zbuf.seek(0)
    return send_file(zbuf, as_attachment=True, download_name="Timetables_Zip.zip", mimetype="application/zip")

@app.route('/save', methods=['POST'])
def save_route():
    year = request.form.get('year')
    section = request.form.get('section')
    html = request.form.get('html')
    subjects = []
    hours = {}
    if year and section and html:
        save_timetable_to_db(year, section, subjects, hours, html)
        flash("Saved timetable to DB.", "success")
    return redirect(url_for('dashboard'))

@app.route('/stored')
def stored_page():
    rows = list_saved_timetables()
    return render_template("stored.html", rows=rows)

@app.route('/view/<int:id>')
def view_saved_page(id):
    row = get_saved_timetable(id)
    if not row:
        flash("Not found", "error")
        return redirect(url_for('stored_page'))
    id_, year, section, subjects_json, hours_json, html = row
    return render_template("view.html", id=id_, year=year, section=section, table_html=html)

@app.route('/delete/<int:id>', methods=['POST'])
def delete_saved_route(id):
    delete_saved_timetable(id)
    flash("Deleted.", "success")
    return redirect(url_for('stored_page'))

if __name__ == '__main__':
    print("Starting AI Timetable Generator API & Web App — http://127.0.0.1:5001")
    app.run(debug=True, port=5001)