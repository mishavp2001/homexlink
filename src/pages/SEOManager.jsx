import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUserProfile, hasAuthenticatedUser } from '@/api/client';
import { PageMetadata } from '@/api/entities';
import { generateAllPageMetadata, generatePageMetadata } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function SEOManager() {
  const [generatingAll, setGeneratingAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await hasAuthenticatedUser();
      if (!isAuth) return null;
      return getCurrentUserProfile();
    }
  });

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
      toast.error(`Failed to generate metadata: ${error.message}`);
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
      toast.success('Metadata updated successfully');
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
      toast.error(`Failed to generate all metadata: ${error.message}`);
    } finally {
      setGeneratingAll(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, data: editData });
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SEO Metadata Manager</h1>
            <p className="text-gray-600 mt-1">AI-powered meta tags for all pages</p>
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
                Generate All Pages
              </>
            )}
          </Button>
        </div>

        {metadata.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Metadata Yet</CardTitle>
              <CardDescription>
                Click "Generate All Pages" to create AI-optimized metadata for all pages.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6">
            {metadata.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{item.page_name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={item.is_auto_generated ? 'default' : 'secondary'}>
                          {item.is_auto_generated ? 'AI Generated' : 'Manual'}
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
                          <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
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
                <CardContent className="space-y-4">
                  {editingId === item.id ? (
                    <>
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={editData.meta_title || ''}
                          onChange={(e) => setEditData({ ...editData, meta_title: e.target.value })}
                          placeholder="Page title for search engines"
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          value={editData.meta_description || ''}
                          onChange={(e) => setEditData({ ...editData, meta_description: e.target.value })}
                          placeholder="Description for search results"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Keywords</Label>
                        <Input
                          value={editData.meta_keywords || ''}
                          onChange={(e) => setEditData({ ...editData, meta_keywords: e.target.value })}
                          placeholder="Comma-separated keywords"
                        />
                      </div>
                      <div>
                        <Label>Open Graph Title</Label>
                        <Input
                          value={editData.og_title || ''}
                          onChange={(e) => setEditData({ ...editData, og_title: e.target.value })}
                          placeholder="Title for social media"
                        />
                      </div>
                      <div>
                        <Label>Open Graph Description</Label>
                        <Textarea
                          value={editData.og_description || ''}
                          onChange={(e) => setEditData({ ...editData, og_description: e.target.value })}
                          placeholder="Description for social media"
                          rows={2}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">Meta Title</Label>
                        <p className="text-sm mt-1">{item.meta_title}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Meta Description</Label>
                        <p className="text-sm mt-1">{item.meta_description}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Keywords</Label>
                        <p className="text-sm mt-1 text-gray-600">{item.meta_keywords}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <Label className="text-xs text-gray-500">OG Title</Label>
                          <p className="text-sm mt-1">{item.og_title}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Twitter Title</Label>
                          <p className="text-sm mt-1">{item.twitter_title}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}