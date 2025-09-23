"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Save } from 'lucide-react';

interface UserProfile {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  organization: string;
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchUserProfile();
  }, [session, status, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile');
      const result = await response.json();
      
      if (response.ok) {
        setUserProfile(result.data);
        setFirstName(result.data.first_name);
        setLastName(result.data.last_name);
        setPosition(result.data.position || '');
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to fetch profile' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while fetching profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) return;

    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          position: position.trim() || null,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setUserProfile(result.data);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setSaving(false);
    }
  };



  if (status === 'loading' || loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center mb-4">
            <User size={24} className="me-2" />
            <h2 className="mb-0">Settings</h2>
          </div>

          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
              {message.text}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMessage(null)}
              />
            </div>
          )}

          {/* Profile Settings */}
          <div className="col-lg-8 mx-auto">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <User size={18} className="me-2" />
                  Profile Information
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileUpdate}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userProfile?.email || ''}
                      disabled
                    />
                    <div className="form-text">Email cannot be changed</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Organization</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userProfile?.organization || ''}
                      disabled
                    />
                    <div className="form-text">Organization cannot be changed</div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          maxLength={50}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          maxLength={50}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-control"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      maxLength={100}
                      placeholder="Enter your position"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 