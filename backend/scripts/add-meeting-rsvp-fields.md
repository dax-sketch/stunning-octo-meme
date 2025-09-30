# Add RSVP Fields to Meetings Collection

You need to manually add these attributes to your `meetings` collection in Appwrite:

## New Attributes to Add:

1. **rsvpResponses**
   - Type: String
   - Size: 2000
   - Required: No
   - Default: (empty)
   - Description: JSON string storing user RSVP responses

2. **meetingNotes**
   - Type: String  
   - Size: 2000
   - Required: No
   - Default: (empty)
   - Description: Post-meeting notes

3. **status**
   - Type: String
   - Size: 50
   - Required: No
   - Default: "scheduled"
   - Description: Meeting status (scheduled/confirmed/completed)

## Steps:
1. Go to Appwrite Console → Database → Collections → meetings
2. Click "Add Attribute" for each field above
3. Set the properties as specified
4. Save each attribute

## Indexes (Optional but Recommended):
- Create index on `status` field for better query performance

Once these fields are added, the RSVP functionality should work properly.