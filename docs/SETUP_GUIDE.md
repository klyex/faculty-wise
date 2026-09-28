# FacultyWise - Project Run and Configuration Guide

Welcome to **FacultyWise**! The project has been fully set up, dependencies installed, all TypeScript compiler and config bugs resolved, and a premium **Developer Sandbox Mode** fallback implemented.

---

## 🚀 The 1-Command Startup

You can run the entire project locally using just **one command**:

```bash
npm run dev
```

This starts the Next.js development server on [http://localhost:3000](http://localhost:3000) in high-performance Turbopack mode. 

> [!NOTE]
> All dependencies are already pre-installed via `npm install`, and the codebase has been fully audited and compiled successfully.

---

## 🔥 Firebase & Database Architecture

Yes, **FacultyWise uses Firebase** as its core operational stack!

- **Firebase Authentication**: For secure user sign-in and session management.
- **Cloud Firestore**: A real-time, NoSQL document store used to save:
  - `users` (Admin, Teacher, Student profiles)
  - `schedules` (Active courses, classrooms, timings, and semesters)
  - `courses` (Course information, units, and credit hours)
  - `rooms` (Classrooms, laboratories, capacity, and buildings)
  - `audit_logs` (Sensitive administrative operations)

---

## 🛠️ Premium Developer Sandbox Mode

Setting up Firebase from scratch is usually a tedious process. To make sure you can **run, test, and demonstrate this project immediately**, we built a **Premium Developer Sandbox Mode**!

### How It Works:
1. **Automatic Detection**: If Firebase credentials are not specified in your `.env.local`, the application detects this and **gracefully fallbacks to Sandbox Mode** instead of crashing or showing database errors.
2. **High-Fidelity Mock Database**: A full, local-first in-memory database matching the real Firestore schema is loaded (`lib/constants/mockData.ts`).
3. **Simulated Latency**: Database operations simulate a `600ms` network latency, showing you the premium Lucide spinners and smooth micro-animations.
4. **Interactive Mutations**: You can create new users, modify roles, set them active/inactive, delete them, and schedule items. All changes update the UI dynamically in-memory and trigger corresponding **Audit Logs**!
5. **Role Quick-Access Panel**: A gorgeous sandbox panel is added underneath the login form, letting you sign in as **Admin**, **Teacher**, or **Student** with a single click!

### Sandbox Login Accounts:
- **Admin**: `wwen485@gmail.com`
- **Teacher**: `john.smith@university.edu`
- **Student**: `alice.brown@university.edu`
- **Password (for all)**: `Password123!`

---

## 🌐 Connecting to Your Live Firebase Project

When you are ready to connect to your live Firebase project, follow these simple steps:

1. **Create a Firebase Project** in the [Firebase Console](https://console.firebase.google.com/).
2. **Enable services**:
   - Enable **Authentication** (Email/Password provider).
   - Enable **Cloud Firestore** in test or production mode.
3. **Retrieve Keys**: Go to Project Settings -> General -> Web Apps, register a new web app, and copy the configuration keys.
4. **Update `.env.local`**: Append the following lines to your `/var/www/html/faculti_wise/.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Once these keys are added, the app will **automatically switch from Sandbox Mode to live Firebase mode**!

5. **Pre-seed Firebase Firestore data** (Optional):
   You can run the included helper scripts to insert the default tables into your live Firestore database using your Web API key:
   ```bash
   npx tsx scripts/insert-firestore-data.ts
   ```
