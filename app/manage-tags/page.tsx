"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Edit, Trash2, X, Check } from 'lucide-react';

interface TagData {
  _id: string;
  name: string;
  color: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

const TAG_COLORS = [
  '#dc3545', // Red
  '#fd7e14', // Orange
  '#ffc107', // Yellow
  '#198754', // Green
  '#0dcaf0', // Cyan
  '#0d6efd', // Blue
  '#6f42c1', // Purple
  '#d63384', // Pink
  '#6c757d', // Gray
  '#212529', // Dark
  '#20c997', // Teal
  '#e83e8c', // Magenta
];

// Color picker component for reusability
const ColorPicker = ({ selectedColor, onColorSelect }: { selectedColor: string; onColorSelect: (color: string) => void }) => {
  return (
    <div className="d-flex flex-wrap gap-2">
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="btn btn-sm position-relative"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: color,
            border: selectedColor === color ? '3px solid #000' : '1px solid #dee2e6',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onColorSelect(color)}
          title={color}
          onMouseEnter={(e) => {
            if (selectedColor !== color) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.border = '2px solid #666';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedColor !== color) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.border = '1px solid #dee2e6';
            }
          }}
        >
          {selectedColor === color && (
            <Check 
              size={16} 
              className="position-absolute top-50 start-50 translate-middle text-white"
              style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default function ManageTags() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newTagDescription, setNewTagDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchTags();
  }, [session, status, router]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags/manage');
      const result = await response.json();
      
      if (response.ok) {
        setTags(result.data);
      } else {
        setError(result.message || 'Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('An error occurred while fetching tags');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/tags/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: newTagDescription.trim() || undefined,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setTags([...tags, result.data]);
        setShowAddModal(false);
        resetForm();
      } else {
        setError(result.message || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('An error occurred while creating the tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/tags/manage/${editingTag._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: newTagDescription.trim() || undefined,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setTags(tags.map(tag => 
          tag._id === editingTag._id ? result.data : tag
        ));
        setEditingTag(null);
        resetForm();
      } else {
        setError(result.message || 'Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setError('An error occurred while updating the tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      setDeletingTag(tagId);
      
      const response = await fetch(`/api/tags/manage/${tagId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok) {
        setTags(tags.filter(tag => tag._id !== tagId));
      } else {
        setError(result.message || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('An error occurred while deleting the tag');
    } finally {
      setDeletingTag(null);
    }
  };

  const resetForm = () => {
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
    setNewTagDescription('');
    setError(null);
  };

  const openEditModal = (tag: TagData) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagDescription(tag.description || '');
  };

  const closeEditModal = () => {
    setEditingTag(null);
    resetForm();
  };

  // Filter tags based on search query
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Tags</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="me-2" />
          Add Tag
        </button>
      </div>

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <Tag size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search tags by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-6 d-flex align-items-center">
              <small className="text-muted">
                {filteredTags.length} of {tags.length} tags
              </small>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {tags.length === 0 ? (
            <div className="text-center text-muted py-4">
              <Tag size={48} className="mb-3" />
              <p>No tags found. Create your first tag to get started.</p>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="text-center text-muted py-4">
              <Tag size={48} className="mb-3" />
              <p>No tags match your search criteria.</p>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Description</th>
                    <th>Usage Count</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => (
                    <tr key={tag._id}>
                      <td>
                        <span
                          className="badge text-white"
                          style={{
                            backgroundColor: tag.color,
                            fontSize: '0.875rem',
                            padding: '0.5rem 0.75rem'
                          }}
                        >
                          {tag.name}
                        </span>
                      </td>
                      <td>
                        {tag.description || (
                          <span className="text-muted">No description</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {tag.usage_count} policies
                        </span>
                      </td>
                      <td>
                        {new Date(tag.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEditModal(tag)}
                            title="Edit tag"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTag(tag._id)}
                            disabled={deletingTag === tag._id}
                            title="Delete tag"
                          >
                            {deletingTag === tag._id ? (
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Tag Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Tag</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tag Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    maxLength={50}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Color</label>
                  <ColorPicker 
                    selectedColor={newTagColor}
                    onColorSelect={setNewTagColor}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    placeholder="Enter tag description"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddTag}
                  disabled={submitting || !newTagName.trim()}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Tag'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Tag</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditModal}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tag Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    maxLength={50}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Color</label>
                  <ColorPicker 
                    selectedColor={newTagColor}
                    onColorSelect={setNewTagColor}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    placeholder="Enter tag description"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEditTag}
                  disabled={submitting || !newTagName.trim()}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Tag'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 