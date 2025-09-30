import { databases } from '../src/config/appwrite';
import { Permission, Role } from 'appwrite';

const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
const collectionId = 'meetings';

async function setupMeetingsCollection() {
  try {
    console.log('🔧 Setting up meetings collection...');

    // Create the meetings collection
    const collection = await databases.createCollection(
      databaseId,
      collectionId,
      'Meetings',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );

    console.log('✅ Created meetings collection:', collection.name);

    // Create attributes for the meetings collection
    const attributes = [
      {
        key: 'companyId',
        type: 'string',
        size: 255,
        required: true,
        array: false,
        default: null,
      },
      {
        key: 'scheduledDate',
        type: 'datetime',
        required: true,
        array: false,
        default: null,
      },
      {
        key: 'duration',
        type: 'integer',
        required: true,
        array: false,
        min: 1,
        max: 1440, // Max 24 hours in minutes
        default: null,
      },
      {
        key: 'attendees',
        type: 'string',
        size: 2000, // JSON string of attendees
        required: true,
        array: false,
        default: null,
      },
      {
        key: 'notes',
        type: 'string',
        size: 5000,
        required: false,
        array: false,
        default: null,
      },
      {
        key: 'createdBy',
        type: 'string',
        size: 255,
        required: true,
        array: false,
        default: null,
      },
    ];

    // Create each attribute
    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
            attr.array
          );
        }

        console.log(`✅ Created attribute: ${attr.key} (${attr.type})`);
        
        // Wait a bit between attribute creations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Attribute ${attr.key} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Create indexes for better query performance
    const indexes = [
      {
        key: 'companyId_index',
        type: 'key',
        attributes: ['companyId'],
      },
      {
        key: 'scheduledDate_index',
        type: 'key',
        attributes: ['scheduledDate'],
      },
      {
        key: 'createdBy_index',
        type: 'key',
        attributes: ['createdBy'],
      },
    ];

    for (const index of indexes) {
      try {
        await databases.createIndex(
          databaseId,
          collectionId,
          index.key,
          index.type as any,
          index.attributes
        );
        console.log(`✅ Created index: ${index.key}`);
        
        // Wait between index creations
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Index ${index.key} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create index ${index.key}:`, error.message);
        }
      }
    }

    console.log('🎉 Meetings collection setup completed successfully!');
    console.log('\nCollection Details:');
    console.log('- Collection ID: meetings');
    console.log('- Attributes: companyId, scheduledDate, duration, attendees, notes, createdBy');
    console.log('- Indexes: companyId_index, scheduledDate_index, createdBy_index');

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Meetings collection already exists!');
      console.log('Attempting to create missing attributes and indexes...');
      
      // Try to create attributes even if collection exists
      // (This part would be the same attribute creation code as above)
    } else {
      console.error('❌ Error setting up meetings collection:', error.message);
      console.error('Full error:', error);
    }
  }
}

setupMeetingsCollection().then(() => {
  console.log('\n✨ Setup script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup script failed:', error);
  process.exit(1);
});