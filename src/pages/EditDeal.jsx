import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DealForm from '../components/Deals/DealForm';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function EditDeal() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dealId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (!currentUser) {
           base44.auth.redirectToAppLogin(window.location.href);
        }
      } catch (error) {
        base44.auth.redirectToAppLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!dealId) return null;
      const deals = await base44.entities.Deal.filter({ id: dealId });
      return deals[0];
    },
    enabled: !!dealId
  });

  const { data: dealTypeCategories } = useQuery({
    queryKey: ['dealTypeCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'deal_type', is_active: true }),
    initialData: []
  });

  const { data: serviceCategories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'service_type', is_active: true }),
    initialData: []
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      navigate(-1); // Go back
    }
  });

  const createDealMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      navigate(createPageUrl('Deals'));
    }
  });

  const handleSubmit = (data) => {
    if (dealId && deal) {
      updateDealMutation.mutate({ id: deal.id, data });
    } else {
      // Handle create if accessed without ID (though mostly for edit per request)
      createDealMutation.mutate({ ...data, user_email: user.email });
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (dealId && !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Deal Not Found</h2>
          <Button onClick={() => navigate(createPageUrl('Deals'))}>Go to Deals</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/90 backdrop-blur-sm flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl relative">
        <Button 
          variant="ghost" 
          className="absolute -top-12 left-0 text-gray-600 hover:text-gray-900"
          onClick={handleCancel}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card className="shadow-2xl overflow-hidden">
           <DealForm 
             deal={deal} 
             onSubmit={handleSubmit} 
             onCancel={handleCancel}
             dealTypeCategories={dealTypeCategories}
             serviceCategories={serviceCategories}
             currentUser={user}
           />
        </Card>
      </div>
    </div>
  );
}