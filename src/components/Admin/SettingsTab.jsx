import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsTab() {
  const queryClient = useQueryClient();
  const [defaultDomain, setDefaultDomain] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
    initialData: []
  });

  const domainSetting = settings.find(s => s.setting_key === 'default_domain');

  React.useEffect(() => {
    if (domainSetting) {
      setDefaultDomain(domainSetting.setting_value);
    }
  }, [domainSetting]);

  const updateSettingMutation = useMutation({
    mutationFn: async (data) => {
      if (domainSetting) {
        return await base44.entities.Settings.update(domainSetting.id, data);
      } else {
        return await base44.entities.Settings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      alert('Settings saved successfully!');
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings.');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    
    // Validate URL format
    if (!defaultDomain.startsWith('http://') && !defaultDomain.startsWith('https://')) {
      alert('Domain must start with http:// or https://');
      return;
    }

    updateSettingMutation.mutate({
      setting_key: 'default_domain',
      setting_value: defaultDomain,
      description: 'Default domain used for email links and notifications'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">App Settings</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-[#1e3a5f] mb-2">Default Domain</h3>
              <p className="text-sm text-gray-600 mb-4">
                This domain will be used in email notifications and scheduled task links (e.g., maintenance reminders).
              </p>

              <div className="space-y-3">
                <div>
                  <Label>Domain URL *</Label>
                  <Input
                    type="url"
                    value={defaultDomain}
                    onChange={(e) => setDefaultDomain(e.target.value)}
                    placeholder="https://homexrei.com"
                    required
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include https:// or http://
                  </p>
                </div>

                {domainSetting && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Current Setting</p>
                        <p className="text-green-700">{domainSetting.setting_value}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-300 mt-4">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Where This is Used:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Daily maintenance reminder emails</li>
              <li>• Links to property maintenance pages</li>
              <li>• Dashboard and service links in notifications</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-4 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
            disabled={updateSettingMutation.isLoading}
          >
            {updateSettingMutation.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </Card>
      </form>
    </Card>
  );
}