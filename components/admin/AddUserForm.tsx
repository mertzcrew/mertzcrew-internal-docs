"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    USER_ROLES, 
    USER_PERMISSIONS, 
    ORGANIZATIONS, 
    USER_DEPARTMENTS,
    validateUser,
    isValidEmail,
    isValidPassword
} from '../../lib/validations';

interface FormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
  organization: string;
  department: string;
  position?: string;
  phone?: string;
}

interface AddUserFormProps {
  editMode?: boolean;
  initialData?: Partial<FormData>;
  userId?: string;
}

export default function AddUserForm({ editMode = false, initialData, userId }: AddUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: editMode ? undefined : '',
    first_name: '',
    last_name: '',
    role: 'associate',
    permissions: [],
    organization: '',
    department: '',
    position: '',
    phone: ''
  });

  useEffect(() => {
    if (editMode && initialData) {
      setFormData(prev => ({
        ...prev,
        email: initialData.email ?? '',
        // password field not included in edit mode
        first_name: initialData.first_name ?? '',
        last_name: initialData.last_name ?? '',
        role: initialData.role ?? 'associate',
        permissions: initialData.permissions ?? [],
        organization: initialData.organization ?? '',
        department: initialData.department ?? '',
        position: initialData.position ?? '',
        phone: initialData.phone ?? ''
      }));
    }
  }, [editMode, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // If organization is changed and it's not Mertzcrew, clear the department
      if (name === 'organization' && value !== 'mertzcrew') {
        newData.department = '';
      }
      
      return newData;
    });
  };

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate (for edits, password can be empty)
      const toValidate = { ...formData };
      if (editMode) delete (toValidate as any).password;
      const v = validateUser(toValidate, editMode);
      if (!v.isValid) {
        setError(Object.values(v.errors)[0] || 'Please fix validation errors');
        setIsSubmitting(false);
        return;
      }

      const payload: any = { ...formData };
      if (editMode) delete payload.password; // Never send password in edit mode

      const res = await fetch(editMode && userId ? `/api/users/${userId}` : '/api/users', {
        method: editMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(editMode ? 'User updated successfully!' : 'User created successfully!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(result.message || (editMode ? 'Failed to update user' : 'Failed to create user'));
      }
    } catch (err) {
      setError('An error occurred while saving the user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const baseFields = (
      formData.email &&
      formData.first_name &&
      formData.last_name &&
      formData.organization
    );
    
    const departmentRequired = formData.organization === 'mertzcrew' ? formData.department : true;
    const passwordRequired = editMode ? true : (formData.password && formData.password.length >= 8);
    
    return baseFields && departmentRequired && passwordRequired;
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="first_name" className="form-label">
            First Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
            maxLength={50}
          />
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="last_name" className="form-label">
            Last Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
            maxLength={50}
          />
        </div>
      </div>

            <div className="row">
        <div className={editMode ? "col-md-12 mb-3" : "col-md-6 mb-3"}>
          <label htmlFor="email" className="form-label">
            Email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        {!editMode && (
          <div className="col-md-6 mb-3">
            <label htmlFor="password" className="form-label">
              Password <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
            />
            <div className="form-text">
              Password must be at least 8 characters long
            </div>
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="organization" className="form-label">
            Organization <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Organization</option>
            {ORGANIZATIONS.map(org => (
              <option key={org.value} value={org.value}>
                {org.display}
              </option>
            ))}
          </select>
        </div>
        {formData.organization === 'mertzcrew' && (
          <div className="col-md-6 mb-3">
            <label htmlFor="department" className="form-label">
              Department <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Department</option>
              {USER_DEPARTMENTS.map(department => (
                <option key={department.value} value={department.value}>
                  {department.display}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="role" className="form-label">
            Role <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
          >
            {USER_ROLES.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="position" className="form-label">
            Position
          </label>
          <input
            type="text"
            className="form-control"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            maxLength={100}
          />
        </div>
      </div>

      {/* <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            type="tel"
            className="form-control"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
      </div> */}

      {/* <div className="mb-3">
        <label className="form-label">Permissions</label>
        <div className="row">
          {USER_PERMISSIONS.map(permission => (
            <div key={permission} className="col-md-4 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={permission}
                  checked={formData.permissions.includes(permission)}
                  onChange={() => handlePermissionChange(permission)}
                />
                <label className="form-check-label" htmlFor={permission}>
                  {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {editMode ? 'Updating User...' : 'Creating User...'}
            </>
          ) : (
            editMode ? 'Update User' : 'Create User'
          )}
        </button>
        
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push('/dashboard')}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 