"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  Plus, 
  Users, 
  Building2, 
  Star, 
  Shield, 
  Briefcase, 
  Heart, 
  Zap,
  BookOpen,
  Settings,
  Globe,
  Home,
  Award
} from "lucide-react";

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  tags: string[];
  created_at: string;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CategoryStats {
  name: string;
  count: number;
  icon: React.ElementType;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Icon mapping for categories
  const getCategoryIcon = (categoryName: string) => {
    const category = categoryName.toLowerCase();
    if (category.includes('hr') || category.includes('human')) return Users;
    if (category.includes('safety') || category.includes('security')) return Shield;
    if (category.includes('training') || category.includes('education')) return BookOpen;
    if (category.includes('culture') || category.includes('values')) return Heart;
    if (category.includes('technology') || category.includes('tech')) return Zap;
    if (category.includes('operations') || category.includes('ops')) return Settings;
    if (category.includes('finance') || category.includes('accounting')) return Briefcase;
    if (category.includes('marketing') || category.includes('brand')) return Star;
    if (category.includes('legal') || category.includes('compliance')) return Building2;
    if (category.includes('general') || category.includes('company')) return Home;
    if (category.includes('award') || category.includes('recognition')) return Award;
    if (category.includes('international') || category.includes('global')) return Globe;
    return FileText; // Default icon
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    // Group policies by category and create stats
    const categoryCounts = policies.reduce((acc, policy) => {
      const category = policy.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const stats = Object.keys(categoryCounts).map(category => ({
      name: category,
      count: categoryCounts[category],
      icon: getCategoryIcon(category)
    }));

    setCategoryStats(stats);
  }, [policies]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/policies');
      const result = await response.json();

      if (response.ok) {
        setPolicies(result.data);
      } else {
        setError(result.message || 'Failed to fetch policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setError('An error occurred while fetching policies');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categoryStats.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (categoryName: string) => {
    const encodedCategory = encodeURIComponent(categoryName);
    router.push(`/policies/${encodedCategory}`);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow-1">
      {/* Header */}
      <div className="bg-white border-bottom p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Policy Categories</h4>
            <small className="text-muted">
              {policies.length} total polic{policies.length !== 1 ? 'ies' : 'y'} across {categoryStats.length} categor{categoryStats.length !== 1 ? 'ies' : 'y'}
            </small>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/new_policy')}
          >
            <Plus size={16} className="me-2" />
            New Policy
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="position-relative">
            <Search
              size={16}
              className="position-absolute text-muted"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Cards */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-5">
            <FileText size={48} className="text-muted mb-3" />
            <h5 className="text-muted">
              {searchTerm ? 'No categories found matching your search' : 'No policy categories found'}
            </h5>
            {!searchTerm && (
              <button 
                className="btn btn-primary mt-3"
                onClick={() => router.push('/new_policy')}
              >
                <Plus size={16} className="me-2" />
                Create Your First Policy
              </button>
            )}
          </div>
        ) : (
          <div className="row">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.name} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                  <div 
                    className="card h-100 border-0 shadow-sm cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCategoryClick(category.name)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                          style={{
                            width: "64px",
                            height: "64px",
                            backgroundColor: "#f8f9fa",
                            color: "#ca1f27"
                          }}
                        >
                          <Icon size={32} />
                        </div>
                      </div>
                      
                      <h5 className="card-title mb-2">{category.name}</h5>
                      
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="badge bg-primary fs-6">
                          {category.count} polic{category.count !== 1 ? 'ies' : 'y'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 