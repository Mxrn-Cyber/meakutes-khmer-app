// Profile page, on the FastAPI backend (no Firebase).
//
// Name/phone are saved with PATCH /auth/me. Changing the email address also
// goes through PATCH /auth/me but requires the current password, since email
// is what signs you in. Password change is POST /auth/me/password, and the
// profile photo is POST /auth/me/avatar — all reached through useAuth() so the
// navbar and the rest of the app see the new values immediately.
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Upload,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const PLACEHOLDER_PHOTO = "https://via.placeholder.com/150?text=No+Photo";
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const toFormState = (user) => ({
  firstName: user?.first_name || "",
  lastName: user?.last_name || "",
  email: user?.email || "",
  phone: user?.phone || "",
});

const Profile = () => {
  const { user, isLoading, updateProfile, changePassword, uploadAvatar } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(toFormState(user));
  const [emailPassword, setEmailPassword] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Keep the edit form in step with the signed-in user (e.g. after a refresh).
  useEffect(() => {
    if (!editMode) setEditData(toFormState(user));
  }, [user, editMode]);

  // Revoke the object URL the preview is holding, so the blob is not leaked.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const photoURL = photoPreview || (user?.avatar_url ? api.mediaUrl(user.avatar_url) : PLACEHOLDER_PHOTO);
  const emailChanged =
    editData.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();

  const handleEditToggle = () => {
    setApiError("");
    setSuccessMessage("");
    setEmailPassword("");
    if (editMode) {
      setEditData(toFormState(user));
      setEditMode(false);
    } else {
      setEditData(toFormState(user));
      setEditMode(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    setApiError("");
    setSuccessMessage("");
  };

  const validateEditData = () => {
    const errors = [];
    if (!editData.firstName?.trim()) errors.push("First name is required");
    if (!editData.lastName?.trim()) errors.push("Last name is required");
    if (!editData.email?.trim()) errors.push("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email.trim()))
      errors.push("Please enter a valid email address");
    if (editData.phone && !/^[\d\s\-+()]+$/.test(editData.phone))
      errors.push("Please enter a valid phone number");
    if (emailChanged && !emailPassword)
      errors.push("Enter your current password to change your email");
    return errors;
  };

  const handleSaveProfile = async () => {
    const errors = validateEditData();
    if (errors.length) {
      setApiError(errors.join(". "));
      return;
    }

    setIsUpdating(true);
    setApiError("");
    setSuccessMessage("");
    try {
      const payload = {
        first_name: editData.firstName.trim(),
        last_name: editData.lastName.trim(),
        phone: editData.phone?.trim() || "",
      };
      if (emailChanged) {
        payload.email = editData.email.trim();
        payload.current_password = emailPassword;
      }
      await updateProfile(payload);
      setSuccessMessage(
        emailChanged
          ? "Profile updated. Your new email address is now the one you sign in with."
          : "Profile updated."
      );
      setEditMode(false);
      setEmailPassword("");
    } catch (error) {
      setApiError(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    setApiError("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setApiError("Fill in all three password fields");
      return;
    }
    if (newPassword.length < 8) {
      setApiError("New password must be at least 8 characters");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setApiError("New password must contain an uppercase letter, a lowercase letter and a number");
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError("The new passwords do not match");
      return;
    }

    setIsUpdating(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage("Password updated. Any other devices have been signed out.");
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setApiError(error.message || "Failed to update password. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setApiError("");
    setSuccessMessage("");
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setApiError("Please choose an image file");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setApiError("That image is larger than 4MB. Please choose a smaller one.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setIsUploading(true);
    setApiError("");
    setSuccessMessage("");
    try {
      await uploadAvatar(photoFile);
      setSuccessMessage("Profile photo updated.");
      setPhotoFile(null);
      setPhotoPreview(null);
      const input = document.getElementById("photo-upload");
      if (input) input.value = "";
    } catch (error) {
      setApiError(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ProtectedRoute already handles the signed-out case; this is just a guard
  // for the moment between logout and redirect.
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Profile
            </h1>
            <button
              onClick={handleEditToggle}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
            >
              {editMode ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </>
              )}
            </button>
          </div>

          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You are offline. Changes cannot be saved until you reconnect.
              </p>
            </div>
          )}

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </p>
            </div>
          )}

          {/* Profile photo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-600 dark:border-blue-400"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_PHOTO;
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            {editMode ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Phone number"
                  />
                </div>

                {/* Only asked for when the email is actually being changed. */}
                {emailChanged && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password (required to change your email)
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Current password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={isUpdating || !isOnline}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 inline mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Name:</span>{" "}
                    {user.display_name || "Not set"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Email:</span> {user.email || "Not set"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Phone:</span> {user.phone || "Not set"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Password */}
          {!editMode && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </button>

              {showPasswordForm && (
                <div className="mt-4 space-y-3">
                  {[
                    { key: "currentPassword", toggle: "current", placeholder: "Current Password" },
                    { key: "newPassword", toggle: "new", placeholder: "New Password" },
                    { key: "confirmPassword", toggle: "confirm", placeholder: "Confirm New Password" },
                  ].map(({ key, toggle, placeholder }) => (
                    <div className="relative" key={key}>
                      <input
                        type={showPasswords[toggle] ? "text" : "password"}
                        placeholder={placeholder}
                        value={passwordData[key]}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, [toggle]: !prev[toggle] }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[toggle] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}

                  <div className="flex space-x-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={isUpdating || !isOnline}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? "Updating..." : "Update Password"}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                        setApiError("");
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo upload */}
          {!editMode && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Upload className="w-4 h-4 inline mr-2" />
                Update Profile Photo
              </label>

              <div className="space-y-3">
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                />

                {photoFile && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {photoFile.name} ({(photoFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}

                <button
                  onClick={handlePhotoUpload}
                  disabled={isUploading || !photoFile || !isOnline}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload Photo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
