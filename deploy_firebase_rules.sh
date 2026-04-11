#!/bin/bash
# Script to deploy Firebase security rules

echo "🚀 Deploying Firebase Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Logging in to Firebase..."
firebase login --no-localhost

# Set the project
echo "📁 Setting Firebase project to 'digital-raita'..."
firebase use digital-raita

# Deploy rules
echo "📤 Deploying Firestore and Storage rules..."
firebase deploy --only firestore:rules,storage

echo ""
echo "✅ Firebase security rules deployed successfully!"
echo "🔥 Continuous learning data should now be stored in Firebase."