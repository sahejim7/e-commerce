"use client";

import { useState, useEffect } from "react";
import { getUserAddresses, addOrUpdateUserAddress } from "@/lib/actions/userActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type UserAddress = {
  id: string;
  type: 'billing' | 'shipping';
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

export default function AddressesTab() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [formData, setFormData] = useState({
    type: 'shipping' as 'billing' | 'shipping',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false,
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const userAddresses = await getUserAddresses();
        setAddresses(userAddresses);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        toast.error("Failed to load addresses");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataObj = new FormData();
      if (editingAddress) {
        formDataObj.append("id", editingAddress.id);
      }
      formDataObj.append("type", formData.type);
      formDataObj.append("line1", formData.line1);
      formDataObj.append("line2", formData.line2);
      formDataObj.append("city", formData.city);
      formDataObj.append("state", formData.state);
      formDataObj.append("country", formData.country);
      formDataObj.append("postalCode", formData.postalCode);
      formDataObj.append("isDefault", formData.isDefault.toString());

      const result = await addOrUpdateUserAddress(formDataObj);
      
      if (result.success) {
        toast.success(result.message);
        setDialogOpen(false);
        resetForm();
        // Refresh addresses
        const updatedAddresses = await getUserAddresses();
        setAddresses(updatedAddresses);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to save address:", error);
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      type: 'shipping',
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (address: UserAddress) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Your Addresses</h3>
          <p className="text-sm text-gray-600">Manage your billing and shipping addresses</p>
        </div>
        <Button onClick={openAddDialog} className="bg-black hover:bg-gray-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't saved any addresses yet.</p>
              <Button onClick={openAddDialog} className="bg-black hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base capitalize">
                      {address.type} Address
                    </CardTitle>
                    {address.isDefault && (
                      <Badge variant="default" className="mt-1">
                        Default
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(address)}
                    className="p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>{address.city}, {address.state} {address.postalCode}</p>
                  <p>{address.country}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress 
                ? "Update your address information below." 
                : "Add a new billing or shipping address to your account."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Address Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isDefault">Set as Default</Label>
                <Select
                  value={formData.isDefault.toString()}
                  onValueChange={(value) => handleSelectChange('isDefault', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="line1">Address Line 1 *</Label>
              <Input
                id="line1"
                name="line1"
                value={formData.line1}
                onChange={handleInputChange}
                placeholder="Street address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line2">Address Line 2</Label>
              <Input
                id="line2"
                name="line2"
                value={formData.line2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Postal code"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {saving ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
