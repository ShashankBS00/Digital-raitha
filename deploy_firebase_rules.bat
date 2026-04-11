@echo off
REM Script to deploy Firebase security rules on Windows

echo 🚀 Deploying Firebase Security Rules...
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

REM Login to Firebase (if not already logged in)
echo 🔐 Logging in to Firebase...
firebase login --no-localhost

REM Set the project
echo 📁 Setting Firebase project to 'digital-raita'...
firebase use digital-raita

REM Deploy rules
echo 📤 Deploying Firestore and Storage rules...
firebase deploy --only firestore:rules,storage

echo.
echo ✅ Firebase security rules deployed successfully!
echo 🔥 Continuous learning data should now be stored in Firebase.

pause