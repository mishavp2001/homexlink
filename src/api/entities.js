import { base44 } from './base44Client';

export const Query = base44.entities.Query;
export const Category = base44.entities.Category;
export const Deal = base44.entities.Deal;
export const Insight = base44.entities.Insight;
export const LeadCharge = base44.entities.LeadCharge;
export const MaintenanceTask = base44.entities.MaintenanceTask;
export const Message = base44.entities.Message;
export const PageMetadata = base44.entities.PageMetadata;
export const PendingUser = base44.entities.PendingUser;
export const Property = base44.entities.Property;
export const PropertyComponent = base44.entities.PropertyComponent;
export const ProviderSettings = base44.entities.ProviderSettings;
export const Report = base44.entities.Report;
export const Review = base44.entities.Review;
export const SavedDeal = base44.entities.SavedDeal;
export const ServiceListing = base44.entities.ServiceListing;
export const Settings = base44.entities.Settings;
export const Transaction = base44.entities.Transaction;
export const UserProfile = base44.entities.User;

// legacy auth sdk compatibility:
export const User = base44.auth;