"use client"

import React, { useState, useEffect } from 'react';
import { Search, X, User, UserPlus } from 'lucide-react';

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface UserAssignmentInputProps {
  assignedUsers: User[];
  onUsersChange: (users: User[]) => void;
  currentUserId?: string;
  disabled?: boolean;
  error?: string;
  isAdmin?: boolean;
}

export default function UserAssignmentInput({
  assignedUsers,
  onUsersChange,
  currentUserId,
  disabled = false,
  error,
  isAdmin = false
}: UserAssignmentInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search users based on input
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Filter out users that are already assigned
            const filteredUsers = data.users.filter((user: User) => 
              !assignedUsers.some(assigned => assigned._id === user._id)
            );
            setSearchResults(filteredUsers);
            setShowDropdown(filteredUsers.length > 0);
          }
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, assignedUsers]);

  const handleAddUser = (user: User) => {
    if (!assignedUsers.some(assigned => assigned._id === user._id)) {
      onUsersChange([...assignedUsers, user]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemoveUser = (userId: string) => {
    onUsersChange(assignedUsers.filter(user => user._id !== userId));
  };

  const handleInputFocus = () => {
    if (searchTerm.trim().length >= 2 && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">
        Assigned Users
        {!disabled && (
          <span className="text-muted ms-2">
            (Optional - you are automatically included)
          </span>
        )}
      </label>
      
      {/* Current assigned users as pills */}
      {assignedUsers.length > 0 && (
        <div className="mb-3">
          <div className="d-flex flex-wrap gap-2">
            {assignedUsers.map((user) => (
              <div key={user._id} className="d-flex align-items-center">
                <span className="badge bg-info text-white d-flex align-items-center px-3 py-2">
                  <User size={12} className="me-1" />
                  {user.first_name} {user.last_name}
                  {!disabled && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light ms-2 p-0 border-0"
                      onClick={() => handleRemoveUser(user._id)}
                      title="Remove user"
                      style={{ 
                        border: '1px solid #dc3545', 
                        background: 'transparent',
                        color: '#dc3545',
                        borderRadius: '3px',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      {!disabled && (
        <div className="position-relative">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <input
              type="text"
              className={`form-control${error ? " is-invalid" : ""}`}
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              disabled={disabled}
            />
            {isSearching && (
              <span className="input-group-text">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Searching...</span>
                </div>
              </span>
            )}
          </div>

          {/* Search results dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="position-absolute w-100 mt-1 user-assignment-dropdown" style={{ zIndex: 1000 }}>
              <div className="list-group list-group-flush">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="list-group-item list-group-item-action d-flex align-items-center"
                    onClick={() => handleAddUser(user)}
                  >
                    <UserPlus size={16} className="me-2 text-muted" />
                    <div>
                      <div className="fw-semibold">{user.first_name} {user.last_name}</div>
                      <small className="text-muted">{user.email}</small>
                    </div>
                    <span className="badge bg-secondary ms-auto">{user.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {showDropdown && searchTerm.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="position-absolute w-100 mt-1 user-assignment-dropdown p-3 text-center text-muted">
              No users found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="invalid-feedback d-block">{error}</div>
      )}

      {/* Help text */}
      <div className="form-text">
        {disabled ? (
          "User assignment is disabled in this mode."
        ) : (
          "You are automatically assigned to this policy. Type at least 2 characters to search for additional users to assign."
        )}
      </div>
    </div>
  );
} 