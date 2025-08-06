const mongoose = require('mongoose');
const UserPinnedPolicy = require('../models/UserPinnedPolicy.js');
const dbConnect = require('../components/lib/mongodb.js');

// Connect to MongoDB using the same method as the app
dbConnect();

async function migratePinnedPolicies() {
  try {
    console.log('Starting migration of pinned policies...');
    
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find all user pinned policies
    const userPinnedPolicies = await UserPinnedPolicy.find({});
    
    console.log(`Found ${userPinnedPolicies.length} user pinned policy records`);
    
    for (const userPinnedPolicy of userPinnedPolicies) {
      console.log(`Processing user: ${userPinnedPolicy.userId}`);
      
      // Check if any item in the array doesn't have policyId (old format)
      const needsMigration = userPinnedPolicy.pinnedPolicies.some(item => !item.policyId);
      
      if (!needsMigration) {
        console.log('  - Already in new format, skipping');
        continue;
      }
      
      // Convert old format to new format
      const newPinnedPolicies = userPinnedPolicy.pinnedPolicies.map(policy => {
        if (policy.policyId) {
          // This is already in the new format
          return policy;
        } else {
          // This is in the old format (just ObjectId), convert to new format
          return {
            policyId: policy,
            pinnedAt: new Date() // Use current time as pinned time
          };
        }
      });
      
      // Update the document
      userPinnedPolicy.pinnedPolicies = newPinnedPolicies;
      await userPinnedPolicy.save();
      
      console.log(`  - Migrated ${newPinnedPolicies.length} pinned policies`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
migratePinnedPolicies(); 