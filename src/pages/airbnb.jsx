export const isPublic = true;

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import DealDetailsModal from '../components/Deals/DealDetailsModal';
import CategoryPage from '../components/CategoryPage';

export default function AirbnbPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const address = searchParams.get('address');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal-by-address', address],
    queryFn: async () => {
      const deals = await base44.entities.Deal.filter({ 
        location: address,
        deal_type: 'short_term_rent'
      });
      return deals.length > 0 ? deals[0] : null;
    },
    enabled: !!address
  });

  if (!address) {
    return <CategoryPage type="deal" category="short_term_rent" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading property...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600">The property listing you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.email === deal.user_email;

  return (
    <DealDetailsModal
      deal={deal}
      isOpen={true}
      onClose={() => window.history.back()}
      isOwner={isOwner}
      onEdit={() => {}}
      currentUser={currentUser}
    />
  );
}