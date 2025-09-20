"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  getCollections, 
  createOrUpdateCollection, 
  deleteCollection,
  type CollectionWithProductCount 
} from "@/lib/actions/admin/collectionActions";
import { uploadImages } from "@/lib/actions/uploadActions";

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Image as ImageIcon } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";

export default function CollectionManagement() {
  const [collections, setCollections] = useState<CollectionWithProductCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithProductCount | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isFeatured: false,
    imageUrl: "",
    imageFile: null as File | null,
  });

  // Load collections
  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const data = await getCollections();
      setCollections(data);
    } catch (error) {
      console.error("Error loading collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("slug", formData.slug);
      formDataObj.append("description", formData.description);
      formDataObj.append("isFeatured", formData.isFeatured.toString());
      
      if (editingCollection) {
        formDataObj.append("id", editingCollection.id);
      }

      // Handle image upload if a new file is selected
      if (formData.imageFile) {
        formDataObj.append("image", formData.imageFile);
      }

      const result = await createOrUpdateCollection(formDataObj);

      if (result.success) {
        toast.success(result.message);
        setIsDialogOpen(false);
        resetForm();
        loadCollections();
      } else {
        if (result.errors) {
          toast.error("Please fix the validation errors");
        } else {
          toast.error(result.error || "An error occurred");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    console.log("Selected file:", file.name, file.size, file.type);
    
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF images are allowed.`);
      return;
    }
    
    if (file.size > maxFileSize) {
      toast.error(`File is too large. Maximum size is 10MB.`);
      return;
    }
    
    setIsUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('images', file);
      console.log("FormData created, calling uploadImages...");

      const result = await uploadImages(uploadFormData);
      console.log("Upload result:", result);
      
      if (result.success && result.urls && result.urls.length > 0) {
        setFormData(prev => ({
          ...prev,
          imageUrl: result.urls![0],
          imageFile: file,
        }));
        toast.success("Image uploaded successfully");
      } else {
        console.error("Upload failed:", result.error);
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle delete
  const handleDelete = async (collectionId: string, collectionName: string) => {
    if (!confirm(`Are you sure you want to delete the collection "${collectionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteCollection(collectionId);
      
      if (result.success) {
        toast.success(result.message);
        loadCollections();
      } else {
        toast.error(result.error || "Failed to delete collection");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Handle edit
  const handleEdit = (collection: CollectionWithProductCount) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || "",
      isFeatured: collection.isFeatured,
      imageUrl: collection.imageUrl || "",
      imageFile: null,
    });
    setIsDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      isFeatured: false,
      imageUrl: "",
      imageFile: null,
    });
    setEditingCollection(null);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Collections Management</h3>
          <p className="text-sm text-gray-600">Create and manage product collections</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? "Edit Collection" : "Create Collection"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name,
                        slug: generateSlug(name),
                      }));
                    }}
                    placeholder="e.g., Summer Collection"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., summer-collection"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this collection..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Collection Image</Label>
                <div className="space-y-2">
                  {formData.imageUrl && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={formData.imageUrl}
                        alt="Collection preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={(e) => {
                        console.log("File input changed:", e.target.files);
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          console.log("Files selected:", files.length);
                          handleImageUpload(files);
                        }
                      }}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        console.log("Button clicked, triggering file input");
                        document.getElementById('image')?.click();
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {formData.imageUrl ? "Change Image" : "Upload Image"}
                    </Button>
                    {isUploadingImage && (
                      <span className="text-sm text-gray-500">Uploading...</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                />
                <Label htmlFor="isFeatured">Featured Collection</Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                >
                  {editingCollection ? "Update Collection" : "Create Collection"}
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No collections found. Create your first collection to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {collection.imageUrl && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border">
                            <img
                              src={collection.imageUrl}
                              alt={collection.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{collection.name}</div>
                          <div className="text-sm text-gray-500">{collection.slug}</div>
                          {collection.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {collection.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {collection.productCount} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {collection.isFeatured ? (
                        <Badge variant="default">Featured</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(collection)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(collection.id, collection.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
