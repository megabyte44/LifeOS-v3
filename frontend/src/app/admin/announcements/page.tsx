'use client';

import { useState } from 'react';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Announcement } from '@/types';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAnnouncements } from '@/hooks/api';

export default function AnnouncementsPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const { announcements, isLoading, createAnnouncement: createAnnouncementApi, updateAnnouncement: updateAnnouncementApi, deleteAnnouncement: deleteAnnouncementApi } = useAdminAnnouncements();
  const loading = adminLoading || isLoading;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const emptyAnnouncement: Omit<Announcement, 'id' | 'createdAt'> = {
    title: '',
    content: '',
    type: 'info',
    version: '',
    published: false,
    createdBy: ''
  };

  const [formData, setFormData] = useState(emptyAnnouncement);

  async function saveAnnouncement() {
    if (!formData.title || !formData.content) {
      toast({ title: "Validation Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    try {
      if (editingAnnouncement) {
        await updateAnnouncementApi({ id: editingAnnouncement.id, updates: { ...formData } });
      } else {
        await createAnnouncementApi({ ...formData });
      }
      toast({ title: "Success", description: editingAnnouncement ? "Announcement updated" : "Announcement created" });
      setDialogOpen(false);
      setEditingAnnouncement(null);
      setFormData(emptyAnnouncement);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({ title: "Error", description: "Failed to save announcement", variant: "destructive" });
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncementApi(id);
      toast({ title: "Success", description: "Announcement deleted" });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" });
    }
  }

  async function togglePublish(announcement: Announcement) {
    try {
      await updateAnnouncementApi({ id: announcement.id, updates: { published: !announcement.published, publishedAt: !announcement.published ? new Date().toISOString() : undefined } });
      toast({ title: "Success", description: !announcement.published ? "Announcement published" : "Announcement unpublished" });
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({ title: "Error", description: "Failed to update announcement", variant: "destructive" });
    }
  }

  function openEditDialog(announcement?: Announcement) {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        version: announcement.version || '',
        published: announcement.published,
        createdBy: announcement.createdBy || ''
      });
    } else {
      setEditingAnnouncement(null);
      setFormData(emptyAnnouncement);
    }
    setDialogOpen(true);
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'update': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (adminLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Megaphone className="w-8 h-8" />
              Announcements
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage app updates & announcements
            </p>
          </div>
          <Button onClick={() => openEditDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>

        <div className="grid gap-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No announcements yet. Create your first one!
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        {announcement.version && (
                          <Badge variant="outline">v{announcement.version}</Badge>
                        )}
                        <Badge variant={announcement.published ? "default" : "secondary"}>
                          {announcement.published ? (
                            <><Eye className="w-3 h-3 mr-1" /> Published</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                          )}
                        </Badge>
                      </div>
                      <CardTitle>{announcement.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {announcement.content}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => togglePublish(announcement)}
                      >
                        {announcement.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(announcement.createdAt).toLocaleString()}
                    {announcement.publishedAt && (
                      <> • Published: {new Date(announcement.publishedAt).toLocaleString()}</>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </DialogTitle>
              <DialogDescription>
                Create announcements to inform users about updates and changes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title..."
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  placeholder="Announcement content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Version (optional)</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g., 2.0.0"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveAnnouncement}>
                {editingAnnouncement ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
