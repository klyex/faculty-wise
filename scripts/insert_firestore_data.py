#!/usr/bin/env python3
"""
FacultyWise - Firestore REST API Seeding & Payload Simulation Script
This script converts sample records (schedules, courses, users, rooms, departments)
into the Firestore REST API JSON format and simulates or executes the inserts.
"""

import os
import sys
import json
import argparse
from datetime import datetime
import urllib.request
import urllib.error

# Sample data dictionary matching the mockData structures
SAMPLE_COLLECTIONS = {
    "users": [
        {
            "id": "7utO6Dqf8YOWeF4ZAeWVXbs2NyV2",
            "email": "wwen485@gmail.com",
            "displayName": "John Doe (Super Admin)",
            "role": "admin",
            "status": "active",
            "departmentId": "cs-dept",
            "createdAt": datetime(2026, 1, 1),
            "updatedAt": datetime(2026, 5, 18)
        },
        {
            "id": "user-001",
            "email": "john.smith@university.edu",
            "displayName": "Dr. John Smith",
            "role": "teacher",
            "status": "active",
            "departmentId": "cs-dept",
            "createdAt": datetime(2026, 1, 10),
            "updatedAt": datetime(2026, 5, 18)
        },
        {
            "id": "user-002",
            "email": "sarah.johnson@university.edu",
            "displayName": "Prof. Sarah Johnson",
            "role": "teacher",
            "status": "active",
            "departmentId": "math-dept",
            "createdAt": datetime(2026, 1, 12),
            "updatedAt": datetime(2026, 5, 18)
        },
        {
            "id": "user-003",
            "email": "alice.brown@university.edu",
            "displayName": "Alice Brown",
            "role": "student",
            "status": "active",
            "departmentId": "cs-dept",
            "createdAt": datetime(2026, 2, 1),
            "updatedAt": datetime(2026, 5, 18)
        }
    ],
    "departments": [
        {
            "id": "cs-dept",
            "code": "CS",
            "name": "Computer Science Department",
            "chairUid": "user-001",
            "createdAt": datetime(2026, 1, 1)
        },
        {
            "id": "math-dept",
            "code": "MATH",
            "name": "Mathematics Department",
            "chairUid": "user-002",
            "createdAt": datetime(2026, 1, 1)
        }
    ],
    "courses": [
        {
            "id": "CS-101",
            "code": "CS-101",
            "name": "Introduction to Computer Science",
            "description": "Basic programming, logic, and concepts of computing.",
            "units": 3,
            "lectureHours": 2,
            "labHours": 3,
            "category": "major",
            "departmentId": "cs-dept",
            "isActive": True
        },
        {
            "id": "MATH-101",
            "code": "MATH-101",
            "name": "Calculus I",
            "description": "Limits, derivatives, integrals, and mathematical modeling.",
            "units": 4,
            "lectureHours": 4,
            "labHours": 0,
            "category": "major",
            "departmentId": "math-dept",
            "isActive": True
        },
        {
            "id": "CS-202",
            "code": "CS-202",
            "name": "Data Structures & Algorithms",
            "description": "Arrays, lists, trees, graphs, hashing, and complexity.",
            "units": 3,
            "lectureHours": 2,
            "labHours": 3,
            "category": "major",
            "departmentId": "cs-dept",
            "isActive": True
        }
    ],
    "rooms": [
        {
            "id": "room-001",
            "name": "Lab 101",
            "building": "Science Building",
            "floor": 1,
            "capacity": 30,
            "type": "laboratory",
            "status": "available",
            "features": ["Computers", "Projector", "Whiteboard"]
        },
        {
            "id": "room-002",
            "name": "Lecture Hall A",
            "building": "Main Building",
            "floor": 2,
            "capacity": 100,
            "type": "lecture",
            "status": "available",
            "features": ["Sound System", "High-capacity", "AC"]
        }
    ],
    "schedules": [
        {
            "id": "schedule-001",
            "courseId": "CS-101",
            "teacherId": "user-001",
            "roomId": "room-001",
            "dayOfWeek": "Monday",
            "startTime": "09:00",
            "endTime": "10:30",
            "semester": "Spring 2026"
        },
        {
            "id": "schedule-002",
            "courseId": "MATH-101",
            "teacherId": "user-002",
            "roomId": "room-002",
            "dayOfWeek": "Wednesday",
            "startTime": "10:00",
            "endTime": "11:30",
            "semester": "Spring 2026"
        },
        {
            "id": "schedule-003",
            "courseId": "CS-202",
            "teacherId": "user-001",
            "roomId": "room-001",
            "dayOfWeek": "Thursday",
            "startTime": "14:00",
            "endTime": "15:30",
            "semester": "Spring 2026"
        }
    ]
}

def parse_env_file(filepath):
    """Parses environment variables from .env or .env.local file."""
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars
    
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

def to_firestore_value(val):
    """Translates Python data types to Firestore REST API typed values."""
    if isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, datetime):
        return {"timestampValue": val.strftime("%Y-%m-%dT%H:%M:%SZ")}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(x) for x in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    elif val is None:
        return {"nullValue": None}
    else:
        return {"stringValue": str(val)}

def construct_payload(doc_dict):
    """Formats a document dictionary into a Firestore write fields payload."""
    payload = {"fields": {}}
    for key, value in doc_dict.items():
        if key == 'id':
            continue
        payload["fields"][key] = to_firestore_value(value)
    return payload

def simulate_insert(collection_name, doc_id, payload, project_id, api_key):
    """Simulates a REST API document PATCH write request and returns mock response."""
    endpoint = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection_name}/{doc_id}?key={api_key}"
    
    # Construct mock response matching actual Firestore JSON output
    mock_response = {
        "name": f"projects/{project_id}/databases/(default)/documents/{collection_name}/{doc_id}",
        "fields": payload["fields"],
        "createTime": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "updateTime": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    }
    
    print("\n" + "="*80)
    print(f"🎬 SIMULATING INSERT: {collection_name}/{doc_id}")
    print(f"👉 TARGET URL: {endpoint}")
    print(f"📦 JSON PAYLOAD SENT:")
    print(json.dumps(payload, indent=2))
    print(f"📥 SIMULATED RESPONSE (200 OK):")
    print(json.dumps(mock_response, indent=2))
    print("="*80)
    return mock_response

def execute_insert(collection_name, doc_id, payload, project_id, api_key):
    """Executes a live Firestore REST PATCH call using urllib.request."""
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection_name}/{doc_id}?key={api_key}"
    data = json.dumps(payload).encode('utf-8')
    
    # Firestore PATCH updates or creates the document at this exact ID
    req = urllib.request.Request(
        url, 
        data=data,
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"   ❌ HTTP Error {e.code} inserting {collection_name}/{doc_id}: {err_body}")
        raise e
    except Exception as e:
        print(f"   ❌ Network Error: {str(e)}")
        raise e

def main():
    parser = argparse.ArgumentParser(description="Insert mock/sample data into Firestore or run payload simulations.")
    parser.add_argument("-s", "--simulate", action="store_true", help="Force dry-run simulation mode")
    parser.add_argument("-e", "--env", default=".env.local", help="Path to environment file (default: .env.local)")
    parser.add_argument("-p", "--project", help="Firestore Project ID override")
    parser.add_argument("-k", "--key", help="Firebase API Key override")
    args = parser.parse_args()

    # Load environment variables
    env_vars = parse_env_file(args.env)
    
    project_id = args.project or env_vars.get("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
    api_key = args.key or env_vars.get("NEXT_PUBLIC_FIREBASE_API_KEY")

    is_simulation = args.simulate or not project_id or not api_key

    if is_simulation:
        print("⚠️  No active Firebase credentials found or --simulate flag set.")
        print("💡 Running in PAYLOAD SIMULATION MODE (Dry Run).")
        # Use dummy parameters for simulation display
        project_id = project_id or "demo-facultywise-project"
        api_key = api_key or "AIzaSyFakeKeyForSimulationPurposeOnly"
    else:
        print("🔥 Firebase credentials loaded successfully.")
        print(f"🚀 Running in LIVE INSERTION MODE for Project ID: '{project_id}'")

    success_count = 0
    failure_count = 0

    for collection_name, documents in SAMPLE_COLLECTIONS.items():
        print(f"\n📂 Processing collection: '{collection_name}'")
        for doc in documents:
            doc_id = doc.get("id")
            payload = construct_payload(doc)
            
            try:
                if is_simulation:
                    simulate_insert(collection_name, doc_id, payload, project_id, api_key)
                else:
                    execute_insert(collection_name, doc_id, payload, project_id, api_key)
                    print(f"   ✅ Successfully upserted document: {collection_name}/{doc_id}")
                success_count += 1
            except Exception:
                failure_count += 1

    print("\n" + "="*50)
    if is_simulation:
        print(f"✨ Simulation complete! {success_count} payloads verified.")
    else:
        print(f"✨ Seeding complete! {success_count} succeeded, {failure_count} failed.")
    print("="*50)

if __name__ == "__main__":
    main()
