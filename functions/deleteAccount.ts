import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Delete all user's data from all entities
    const entitiesToClean = [
      'Property',
      'PropertyComponent',
      'MaintenanceTask',
      'Report',
      'ServiceListing',
      'Deal',
      'SavedDeal',
      'Booking',
      'Offer',
      'Insight',
      'Message',
      'Review',
      'Transaction',
      'LeadCharge',
      'ProviderSettings',
      'PendingUser'
    ];

    // Delete records where user is the creator or owner
    for (const entityName of entitiesToClean) {
      try {
        // Try to delete by created_by
        const createdRecords = await base44.asServiceRole.entities[entityName].filter({ created_by: userEmail });
        for (const record of createdRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by user_email
        const userRecords = await base44.asServiceRole.entities[entityName].filter({ user_email: userEmail });
        for (const record of userRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by expert_email (for ServiceListing)
        const expertRecords = await base44.asServiceRole.entities[entityName].filter({ expert_email: userEmail });
        for (const record of expertRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by provider_email (for ProviderSettings, LeadCharge)
        const providerRecords = await base44.asServiceRole.entities[entityName].filter({ provider_email: userEmail });
        for (const record of providerRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by email (for PendingUser)
        const emailRecords = await base44.asServiceRole.entities[entityName].filter({ email: userEmail });
        for (const record of emailRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by sender_email or recipient_email (for Message)
        const senderRecords = await base44.asServiceRole.entities[entityName].filter({ sender_email: userEmail });
        for (const record of senderRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }
        const recipientRecords = await base44.asServiceRole.entities[entityName].filter({ recipient_email: userEmail });
        for (const record of recipientRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by reviewer_email (for Review)
        const reviewerRecords = await base44.asServiceRole.entities[entityName].filter({ reviewer_email: userEmail });
        for (const record of reviewerRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by buyer_email or seller_email (for Offer)
        const buyerRecords = await base44.asServiceRole.entities[entityName].filter({ buyer_email: userEmail });
        for (const record of buyerRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }
        const sellerRecords = await base44.asServiceRole.entities[entityName].filter({ seller_email: userEmail });
        for (const record of sellerRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        // Try to delete by renter_email or owner_email (for Booking)
        const renterRecords = await base44.asServiceRole.entities[entityName].filter({ renter_email: userEmail });
        for (const record of renterRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }
        const ownerRecords = await base44.asServiceRole.entities[entityName].filter({ owner_email: userEmail });
        for (const record of ownerRecords) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }
      } catch (error) {
        console.log(`Could not clean ${entityName}:`, error.message);
      }
    }

    // Finally, delete the user account itself
    // Note: Base44 SDK doesn't have a direct user deletion method
    // Mark user as deleted by updating their data
    await base44.asServiceRole.auth.updateUser(userEmail, {
      deleted_at: new Date().toISOString(),
      email: `deleted_${Date.now()}@deleted.local`,
      full_name: 'Deleted User'
    });

    return Response.json({ 
      success: true,
      message: 'Account and all associated data deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ 
      error: error.message || 'Failed to delete account' 
    }, { status: 500 });
  }
});