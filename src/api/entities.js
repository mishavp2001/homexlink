import { auth, entities } from './client';

export const Query = entities.Query;
export const Category = entities.Category;
export const Booking = entities.Booking;
export const Deal = entities.Deal;
export const Insight = entities.Insight;
export const LeadCharge = entities.LeadCharge;
export const MaintenanceTask = entities.MaintenanceTask;
export const Message = entities.Message;
export const Offer = entities.Offer;
export const PageMetadata = entities.PageMetadata;
export const PendingUser = entities.PendingUser;
export const Property = entities.Property;
export const PropertyComponent = entities.PropertyComponent;
export const ProviderSettings = entities.ProviderSettings;
export const Report = entities.Report;
export const Review = entities.Review;
export const SavedDeal = entities.SavedDeal;
export const ServiceListing = entities.ServiceListing;
export const Settings = entities.Settings;
export const Transaction = entities.Transaction;
export const UserProfile = entities.User;

// legacy auth sdk compatibility:
export const User = auth;