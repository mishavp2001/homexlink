import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, redirectToAppLogin } from '@/api/base44Client';
import { Property, PropertyComponent } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, Trash2, Save, Edit2 } from 'lucide-react';
import AddSingleComponent from '../components/PropertyCapture/AddSingleComponent';

export default function EditProperty() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    sqft: '',
    lot_size: '',
    bedrooms: '',
    bathrooms: '',
    property_classification: 'primary'
  });
  const [showComponentUploader, setShowComponentUploader] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        setUser(currentUser);
        if (!currentUser) void redirectToAppLogin(window.location.href);
      } catch (error) {
        void redirectToAppLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: property, isLoading: loadingProp } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const props = await Property.filter({ id: propertyId });
      return props[0];
    },
    enabled: !!propertyId
  });

  const { data: components, refetch: refetchComponents } = useQuery({
    queryKey: ['components', propertyId],
    queryFn: () => PropertyComponent.filter({ property_id: propertyId }),
    enabled: !!propertyId,
    initialData: []
  });

  useEffect(() => {
    if (property) setFormData(property);
  }, [property]);

  const updatePropertyMutation = useMutation({
    mutationFn: data => Property.update(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['property', propertyId]);
      alert('Property updated successfully');
    }
  });

  const saveSingleComponentMutation = useMutation({
    mutationFn: async componentData => {
      return PropertyComponent.create({
        property_id: propertyId,
        component_type: componentData.component_type,
        description: componentData.description,
        photo_urls: componentData.photo_urls,
        serial_number: componentData.serial_number,
        brand: componentData.brand,
        installation_year: componentData.installation_year ? parseInt(componentData.installation_year) : null,
        current_condition: componentData.current_condition,
        estimated_lifetime_years: 10 // default
      });
    },
    onSuccess: () => {
      refetchComponents();
      setShowComponentUploader(false);
    }
  });

  const updateComponentMutation = useMutation({
    mutationFn: async componentData => {
      return PropertyComponent.update(editingComponent.id, {
        component_type: componentData.component_type,
        description: componentData.description,
        photo_urls: componentData.photo_urls,
        serial_number: componentData.serial_number,
        brand: componentData.brand,
        installation_year: componentData.installation_year ? parseInt(componentData.installation_year) : null,
        current_condition: componentData.current_condition
      });
    },
    onSuccess: () => {
      refetchComponents();
      setShowComponentUploader(false);
      setEditingComponent(null);
    }
  });

  const deleteComponentMutation = useMutation({
    mutationFn: id => PropertyComponent.delete(id),
    onSuccess: () => refetchComponents()
  });

  const handleSave = (e) => {
    e.preventDefault();
    updatePropertyMutation.mutate(formData);
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setShowComponentUploader(true);
  };

  const handleCancelEdit = () => {
    setShowComponentUploader(false);
    setEditingComponent(null);
  };

  if (loadingProp || !user) return <div className="min-h-screen flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="min-h-screen bg-gray-100/90 backdrop-blur-sm flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-5xl relative">
        <Button 
          variant="ghost" 
          className="absolute -top-12 left-0 text-gray-600 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">Edit Property: {property?.address}</h2>
            <Button onClick={handleSave} className="bg-[#d4af37] hover:bg-[#c49d2a]">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sqft</Label>
                  <Input 
                    type="number" 
                    value={formData.sqft || ''} 
                    onChange={e => setFormData({...formData, sqft: parseFloat(e.target.value)})} 
                  />
                </div>
                <div>
                  <Label>Lot Size</Label>
                  <Input 
                    type="number" 
                    value={formData.lot_size || ''} 
                    onChange={e => setFormData({...formData, lot_size: parseFloat(e.target.value)})} 
                  />
                </div>
                <div>
                  <Label>Bedrooms</Label>
                  <Input 
                    type="number" 
                    value={formData.bedrooms || ''} 
                    onChange={e => setFormData({...formData, bedrooms: parseFloat(e.target.value)})} 
                  />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <Input 
                    type="number" 
                    value={formData.bathrooms || ''} 
                    onChange={e => setFormData({...formData, bathrooms: parseFloat(e.target.value)})} 
                  />
                </div>
                <div>
                  <Label>Classification</Label>
                  <Select 
                    value={formData.property_classification || 'primary'} 
                    onValueChange={v => setFormData({...formData, property_classification: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select 
                    value={formData.property_type || 'single_family'} 
                    onValueChange={v => setFormData({...formData, property_type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_family">Multi Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Components</h3>
                {!showComponentUploader && (
                  <Button size="sm" onClick={() => setShowComponentUploader(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Add Component
                  </Button>
                )}
              </div>

              {showComponentUploader ? (
                <AddSingleComponent 
                  initialData={editingComponent}
                  onSave={(data) => {
                    if (editingComponent) {
                      updateComponentMutation.mutate(data);
                    } else {
                      saveSingleComponentMutation.mutate(data);
                    }
                  }} 
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {components.map(comp => (
                    <Card key={comp.id} className="p-3 flex justify-between items-start">
                      <div>
                        <p className="font-medium capitalize">{comp.component_type.replace('_', ' ')}</p>
                        {comp.serial_number && <p className="text-xs text-gray-500">SN: {comp.serial_number}</p>}
                        {comp.description && <p className="text-xs text-gray-600 mt-1">{comp.description}</p>}
                        <div className="flex gap-2 mt-2">
                          {comp.photo_urls?.map((url, i) => (
                            <img key={i} src={url} className="w-12 h-12 object-cover rounded" />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditComponent(comp)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteComponentMutation.mutate(comp.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {components.length === 0 && <p className="text-gray-500 text-sm">No components.</p>}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}