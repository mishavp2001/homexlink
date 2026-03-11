import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageMetadata } from '@/api/entities';
import { generateAllPageMetadata, generatePageMetadata } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function SEOTab() {
  const [generatingAll, setGeneratingAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const { data: metadata = [], isLoading } = useQuery({
    queryKey: ['pageMetadata'],
    queryFn: () => PageMetadata.list('-last_generated_date')
  });

  const generateSingleMutation = useMutation({
    mutationFn: async (pageName) => {
      const response = await generatePageMetadata(pageName);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageMetadata'] });
      toast.success('Metadata generated successfully');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await PageMetadata.update(id, {
        ...data,
        is_auto_generated: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageMetadata'] });
      toast.success('Updated successfully');
      setEditingId(null);
      setEditData({});
    }
  });

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      const response = await generateAllPageMetadata();
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ['pageMetadata'] });
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setGeneratingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1e3a5f]">SEO Metadata</h2>
          <p className="text-sm text-gray-600 mt-1">AI-powered meta tags for all pages</p>
        </div>
        <Button
          onClick={handleGenerateAll}
          disabled={generatingAll}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {generatingAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate All
            </>
          )}
        </Button>
      </div>

      {metadata.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No metadata yet. Click "Generate All" to create AI-optimized metadata.
        </div>
      ) : (
        <div className="space-y-4">
          {metadata.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.page_name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={item.is_auto_generated ? 'default' : 'secondary'}>
                        {item.is_auto_generated ? 'AI' : 'Manual'}
                      </Badge>
                      {item.last_generated_date && (
                        <Badge variant="outline">
                          {new Date(item.last_generated_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <Button size="sm" onClick={() => updateMutation.mutate({ id: editingId, data: editData })}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditData({}); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(item.id); setEditData(item); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => generateSingleMutation.mutate(item.page_name)}
                          disabled={generateSingleMutation.isPending}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingId === item.id ? (
                  <>
                    <div>
                      <Label className="text-xs">Meta Title</Label>
                      <Input
                        value={editData.meta_title || ''}
                        onChange={(e) => setEditData({ ...editData, meta_title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea
                        value={editData.meta_description || ''}
                        onChange={(e) => setEditData({ ...editData, meta_description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Keywords</Label>
                      <Input
                        value={editData.meta_keywords || ''}
                        onChange={(e) => setEditData({ ...editData, meta_keywords: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs text-gray-500">Title</Label>
                      <p className="text-sm">{item.meta_title}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Description</Label>
                      <p className="text-sm text-gray-600">{item.meta_description}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Keywords</Label>
                      <p className="text-xs text-gray-500">{item.meta_keywords}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}