/// <reference lib="deno.ns" />
import { Resend } from 'npm:resend@3.2.0';
import { HttpError, requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { listAmplifyPrivateItems } from './_amplifyPrivateData.ts';

type MaintenanceTaskRecord = {
  id: string;
  property_id: string;
  project_title: string;
  project_description?: string | null;
  urgency?: string | null;
  preferred_timeline?: string | null;
  budget_range?: string | null;
  status?: string | null;
};

type PropertyRecord = {
  id: string;
  address?: string | null;
  user_email?: string | null;
};

type SettingRecord = {
  setting_key?: string | null;
  setting_value?: unknown;
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const fallbackAppOrigin = 'https://homexrei.com';
const resendFrom = 'HomeXREI Admin <onboarding@resend.dev>';

const listMaintenanceTasksQuery = `
  query ListMaintenanceTasks($filter: ModelMaintenanceTaskFilterInput, $limit: Int, $nextToken: String) {
    listMaintenanceTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        property_id
        project_title
        project_description
        urgency
        preferred_timeline
        budget_range
        status
      }
      nextToken
    }
  }
`;

const listPropertiesQuery = `
  query ListProperties($filter: ModelPropertyFilterInput, $limit: Int, $nextToken: String) {
    listProperties(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        address
        user_email
      }
      nextToken
    }
  }
`;

const listSettingsQuery = `
  query ListSettings($filter: ModelSettingFilterInput, $limit: Int, $nextToken: String) {
    listSettings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        setting_key
        setting_value
      }
      nextToken
    }
  }
`;

const normalizeAppOrigin = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallbackAppOrigin;

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string' && parsed.trim()) {
        return parsed.trim().replace(/\/$/, '');
      }
    } catch {
      return trimmed.replace(/\/$/, '');
    }
  }

  return fallbackAppOrigin;
};

Deno.serve(async (req) => {
  try {
    const user = await requireAmplifyUser(req);
    if (!user.isAdmin) {
      throw new HttpError(403, 'Forbidden: Admin access required');
    }

    const [tasks, properties, settings] = await Promise.all([
      listAmplifyPrivateItems({
        authToken: user.authToken,
        query: listMaintenanceTasksQuery,
        rootField: 'listMaintenanceTasks',
      }) as Promise<MaintenanceTaskRecord[]>,
      listAmplifyPrivateItems({
        authToken: user.authToken,
        query: listPropertiesQuery,
        rootField: 'listProperties',
      }) as Promise<PropertyRecord[]>,
      listAmplifyPrivateItems({
        authToken: user.authToken,
        query: listSettingsQuery,
        rootField: 'listSettings',
        filter: { setting_key: { eq: 'default_domain' } },
      }) as Promise<SettingRecord[]>,
    ]);

    const activeTasks = tasks.filter(task => task?.status === 'open' || task?.status === 'in_progress');

    if (activeTasks.length === 0) {
      return Response.json({
        success: true,
        message: 'No active maintenance tasks found',
        count: 0,
      });
    }

    const propertyMap = Object.fromEntries(
      properties
        .filter((property): property is PropertyRecord & { id: string } => Boolean(property?.id))
        .map(property => [property.id, property]),
    );

    const tasksByOwner = activeTasks.reduce<Record<string, Array<{ task: MaintenanceTaskRecord; property: PropertyRecord }>>>(
      (accumulator, task) => {
        const property = propertyMap[task.property_id];
        const ownerEmail = property?.user_email?.trim();
        if (!property || !ownerEmail) {
          return accumulator;
        }

        if (!accumulator[ownerEmail]) {
          accumulator[ownerEmail] = [];
        }

        accumulator[ownerEmail].push({ task, property });
        return accumulator;
      },
      {},
    );

    const appOrigin = normalizeAppOrigin(settings[0]?.setting_value);
    let emailsSent = 0;

    for (const [ownerEmail, items] of Object.entries(tasksByOwner)) {
      try {
        const tasksList = items.map(({ task, property }) => `
          <div style="background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${
            task.urgency === 'urgent' ? '#ef4444' : task.urgency === 'high' ? '#f59e0b' : task.urgency === 'medium' ? '#3b82f6' : '#10b981'
          };"><h3 style="margin: 0 0 10px 0; color: #1e3a5f;">${task.project_title}</h3>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Property:</strong> ${property.address || 'Unknown property'}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Status:</strong> ${(task.status || 'open').replace('_', ' ').toUpperCase()}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Urgency:</strong> ${(task.urgency || 'normal').toUpperCase()}</p>
            ${task.project_description ? `<p style="margin: 5px 0; color: #6b7280;">${task.project_description}</p>` : ''}
            ${task.preferred_timeline ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Timeline:</strong> ${task.preferred_timeline}</p>` : ''}
            ${task.budget_range ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Budget:</strong> $${task.budget_range}</p>` : ''}
            <a href="${appOrigin}/maintenance?propertyid=${property.id}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 6px;">View Project</a>
          </div>
        `).join('');

        const subject = `Maintenance Reminder: ${items.length} Active Project${items.length > 1 ? 's' : ''}`;
        const html = `
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
        `;
        const text = [
          'Maintenance Project Reminder',
          '',
          `You have ${items.length} active maintenance project${items.length > 1 ? 's' : ''} that need${items.length === 1 ? 's' : ''} attention:`,
          '',
          ...items.map(({ task, property }) => [
            `- ${task.project_title}`,
            `  Property: ${property.address || 'Unknown property'}`,
            `  Status: ${(task.status || 'open').replace('_', ' ').toUpperCase()}`,
            `  Urgency: ${(task.urgency || 'normal').toUpperCase()}`,
            task.preferred_timeline ? `  Timeline: ${task.preferred_timeline}` : null,
            task.budget_range ? `  Budget: $${task.budget_range}` : null,
            `  View Project: ${appOrigin}/maintenance?propertyid=${property.id}`,
          ].filter(Boolean).join('\n')),
          '',
          'Tip: Keeping your maintenance projects up to date helps protect your property value and prevents costly repairs.',
          '',
          `Dashboard: ${appOrigin}/dashboard`,
          `Find Professionals: ${appOrigin}/services`,
        ].join('\n');

        const { error } = await resend.emails.send({
          from: resendFrom,
          to: [ownerEmail],
          subject,
          html,
          text,
        });

        if (error) {
          throw new Error(typeof error.message === 'string' ? error.message : 'Resend failed to send maintenance reminder email.');
        }

        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${ownerEmail}:`, emailError);
      }
    }

    return Response.json({
      success: true,
      message: `Sent ${emailsSent} reminder emails for ${activeTasks.length} active tasks`,
      emailsSent,
      tasksFound: activeTasks.length,
    });
  } catch (error) {
    console.error('Error sending maintenance reminders:', error);
    return toErrorResponse(error, 'Failed to send maintenance reminders');
  }
});