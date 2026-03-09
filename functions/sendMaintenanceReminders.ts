/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role to access all maintenance tasks
    const tasks = await base44.asServiceRole.entities.MaintenanceTask.list();
    
    // Filter for open or in_progress tasks
    const activeTasks = tasks.filter(t => 
      t.status === 'open' || t.status === 'in_progress'
    );
    
    if (activeTasks.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No active maintenance tasks found',
        count: 0
      });
    }
    
    // Get all properties to map property_id to user_email
    const properties = await base44.asServiceRole.entities.Property.list();
    const propertyMap = {};
    properties.forEach(p => {
      propertyMap[p.id] = p;
    });
    
    // Group tasks by owner email
    const tasksByOwner = {};
    activeTasks.forEach(task => {
      const property = propertyMap[task.property_id];
      if (property && property.user_email) {
        if (!tasksByOwner[property.user_email]) {
          tasksByOwner[property.user_email] = [];
        }
        tasksByOwner[property.user_email].push({
          task,
          property
        });
      }
    });
    
    // Get default domain from Settings
    const settings = await base44.asServiceRole.entities.Settings.filter({ setting_key: 'default_domain' });
    const appOrigin = settings.length > 0 ? settings[0].setting_value : 'https://homexrei.com';
    
    // Send emails to each owner
    let emailsSent = 0;
    
    for (const [ownerEmail, items] of Object.entries(tasksByOwner)) {
      try {
        const tasksList = items.map(({ task, property }) => `
          <div style="background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${
            task.urgency === 'urgent' ? '#ef4444' : 
            task.urgency === 'high' ? '#f59e0b' : 
            task.urgency === 'medium' ? '#3b82f6' : '#10b981'
          };">
            <h3 style="margin: 0 0 10px 0; color: #1e3a5f;">${task.project_title}</h3>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Property:</strong> ${property.address}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Status:</strong> ${task.status.replace('_', ' ').toUpperCase()}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Urgency:</strong> ${task.urgency.toUpperCase()}</p>
            ${task.project_description ? `<p style="margin: 5px 0; color: #6b7280;">${task.project_description}</p>` : ''}
            ${task.preferred_timeline ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Timeline:</strong> ${task.preferred_timeline}</p>` : ''}
            ${task.budget_range ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Budget:</strong> $${task.budget_range}</p>` : ''}
            <a href="${appOrigin}/maintenance?propertyid=${property.id}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 6px;">View Project</a>
          </div>
        `).join('');
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'HomeXREI Admin',
          to: ownerEmail,
          subject: `Maintenance Reminder: ${items.length} Active Project${items.length > 1 ? 's' : ''}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e3a5f;">Maintenance Project Reminder</h2>
              <p style="color: #6b7280;">You have ${items.length} active maintenance project${items.length > 1 ? 's' : ''} that need${items.length === 1 ? 's' : ''} attention:</p>
              ${tasksList}
              <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e;"><strong>💡 Tip:</strong> Keeping your maintenance projects up to date helps protect your property value and prevents costly repairs.</p>
              </div>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                <a href="${appOrigin}/dashboard" style="color: #1e3a5f;">View Dashboard</a> | 
                <a href="${appOrigin}/services" style="color: #1e3a5f;">Find Professionals</a>
              </p>
            </div>
          `
        });
        
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${ownerEmail}:`, emailError);
      }
    }
    
    return Response.json({
      success: true,
      message: `Sent ${emailsSent} reminder emails for ${activeTasks.length} active tasks`,
      emailsSent,
      tasksFound: activeTasks.length
    });
    
  } catch (error) {
    console.error('Error sending maintenance reminders:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});