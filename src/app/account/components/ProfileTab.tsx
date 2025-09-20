"use client";

import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "@/lib/actions/userActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfileTab() {
  const [profile, setProfile] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            name: userProfile.name || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);

      const result = await updateUserProfile(formDataObj);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the profile data
        const updatedProfile = await getUserProfile();
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load profile information.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
