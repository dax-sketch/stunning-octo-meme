# Meetings Collection Setup Guide

Since the Appwrite SDK doesn't expose collection creation methods in the current version, you'll need to create the `meetings` collection manually through the Appwrite Console.

## 🎯 Steps to Create the Meetings Collection

### 1. Open Appwrite Console
- Go to your Appwrite Console (usually http://localhost/console or your cloud instance)
- Navigate to your project
- Go to **Databases** → **client-management** (or your database name)

### 2. Create the Collection
- Click **"Create Collection"**
- **Collection ID**: `meetings`
- **Collection Name**: `Meetings`
- Click **"Create"**

### 3. Add Attributes
Add the following attributes to the `meetings` collection:

#### Attribute 1: companyId
- **Key**: `companyId`
- **Type**: String
- **Size**: 255
- **Required**: Yes
- **Array**: No

#### Attribute 2: scheduledDate
- **Key**: `scheduledDate`
- **Type**: DateTime
- **Required**: Yes
- **Array**: No

#### Attribute 3: duration
- **Key**: `duration`
- **Type**: Integer
- **Required**: Yes
- **Array**: No
- **Min**: 1
- **Max**: 1440

#### Attribute 4: attendees
- **Key**: `attendees`
- **Type**: String
- **Size**: 2000
- **Required**: Yes
- **Array**: No

#### Attribute 5: notes
- **Key**: `notes`
- **Type**: String
- **Size**: 5000
- **Required**: No
- **Array**: No

#### Attribute 6: createdBy
- **Key**: `createdBy`
- **Type**: String
- **Size**: 255
- **Required**: Yes
- **Array**: No

### 4. Set Permissions
Go to the **Settings** tab of the meetings collection and set permissions:
- **Read**: Any
- **Create**: Any
- **Update**: Any
- **Delete**: Any

### 5. Create Indexes (Optional but Recommended)
Go to the **Indexes** tab and create:

#### Index 1: companyId_index
- **Key**: `companyId_index`
- **Type**: Key
- **Attributes**: `companyId`

#### Index 2: scheduledDate_index
- **Key**: `scheduledDate_index`
- **Type**: Key
- **Attributes**: `scheduledDate`

#### Index 3: createdBy_index
- **Key**: `createdBy_index`
- **Type**: Key
- **Attributes**: `createdBy`

## ✅ Verification
After creating the collection, you can verify it's working by:
1. Trying to schedule a meeting through the frontend
2. The error "Collection with the requested ID could not be found" should disappear

## 🔧 Alternative: Quick Test Script
If you want to test if the collection exists, you can run this simple test:

```bash
cd backend
npx ts-node -e "
import { databases } from './src/config/appwrite';
const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
databases.listDocuments(databaseId, 'meetings', [])
  .then(() => console.log('✅ Meetings collection exists!'))
  .catch(err => console.log('❌ Meetings collection not found:', err.message));
"
```

Once you've created the collection following these steps, the meeting scheduling should work properly!