// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

// User-related constants
export const USER_ROLES = ['admin', 'manager', 'associate'] as const;
export type UserRole = typeof USER_ROLES[number];

export const USER_PERMISSIONS = [
    'create_policy',
    'edit_policy', 
    'delete_policy',
    'view_policy',
    'manage_users',
    'view_analytics',
    'export_data'
] as const;
export type UserPermission = typeof USER_PERMISSIONS[number];

export const ORGANIZATIONS = [{
    value: 'mertzcrew',
    display: 'Mertzcrew'
}, {
    value: 'mertz_production',
    display: 'Mertz Production'
}] as const;
export type Organization = typeof ORGANIZATIONS[number];


export const DEPARTMENTS = [{value: "tech_team", display: "Tech Team Only"}, 
    {value: "customer_support", display: "Customer Support Only"}, 
    {value: "all", display: "All"}
] as const;
export type Department = typeof DEPARTMENTS[number];

// User departments (excludes "all" option)
export const USER_DEPARTMENTS = [{value: "tech_team", display: "Tech Team Only"}, 
    {value: "customer_support", display: "Customer Support Only"}
] as const;
export type UserDepartment = typeof USER_DEPARTMENTS[number];

// Policy-related constants
export const POLICY_STATUSES = ['draft', 'active', 'inactive', 'archived'] as const;
export type PolicyStatus = typeof POLICY_STATUSES[number];

export const POLICY_CATEGORIES = [
    "HR",
    "Culture",
    "Documentation",
    "Process",
    "Safety",
    "Quality",
    "Other"
] as const;
export type PolicyCategory = typeof POLICY_CATEGORIES[number];

export const POLICY_ORGANIZATIONS = [
    {
        value: 'all',
        display: 'All Organizations'
    }, {
        value: 'mertzcrew',
        display: 'Mertzcrew'
    }, {
        value: 'mertz_production',
        display: 'Mertz Production'
    }
] as const;
export type PolicyOrganization = typeof POLICY_ORGANIZATIONS[number];

// Notification-related constants
export const NOTIFICATION_TYPES = [
    'policy_created',
    'policy_updated', 
    'policy_assigned'
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// File-related constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
];

export const FILE_SIZE_LABELS = ['Bytes', 'KB', 'MB', 'GB'];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

// Email validation
export function isValidEmail(email: string): boolean {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
}

// Password validation
export function isValidPassword(password: string): boolean {
    return password.length >= 8;
}

// Phone number validation
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
}

// File validation
export function isValidFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return { 
            isValid: false, 
            error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
        };
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return { 
            isValid: false, 
            error: 'File type not allowed. Please upload PDF, Word, text, or image files.' 
        };
    }
    
    return { isValid: true };
}

// Policy validation
export function validatePolicy(data: {
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    organization?: string;
    attachments?: any[];
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Title validation
    if (!data.title?.trim()) {
        errors.title = 'Title is required';
    } else if (data.title.length > 200) {
        errors.title = 'Title cannot be more than 200 characters';
    }

    // Content validation (required if no attachments)
    if (!data.content?.trim() && (!data.attachments || data.attachments.length === 0)) {
        errors.content = 'Content is required when no attachments are provided';
    }

    // Description validation
    if (data.description && data.description.length > 500) {
        errors.description = 'Description cannot be more than 500 characters';
    }

    // Category validation
    if (!data.category) {
        errors.category = 'Category is required';
    } else if (!POLICY_CATEGORIES.includes(data.category as PolicyCategory)) {
        errors.category = 'Invalid category selected';
    }

    // Organization validation
    if (!data.organization) {
        errors.organization = 'Organization is required';
    } else if (!POLICY_ORGANIZATIONS.some(org => org.value === data.organization)) {
        errors.organization = 'Invalid organization selected';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// User validation
export function validateUser(data: {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    organization?: string;
    department?: string;
    phone?: string;
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Email validation
    if (!data.email?.trim()) {
        errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
        errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!data.password?.trim()) {
        errors.password = 'Password is required';
    } else if (!isValidPassword(data.password)) {
        errors.password = 'Password must be at least 8 characters long';
    }

    // First name validation
    if (!data.first_name?.trim()) {
        errors.first_name = 'First name is required';
    } else if (data.first_name.length > 50) {
        errors.first_name = 'First name cannot be more than 50 characters';
    }

    // Last name validation
    if (!data.last_name?.trim()) {
        errors.last_name = 'Last name is required';
    } else if (data.last_name.length > 50) {
        errors.last_name = 'Last name cannot be more than 50 characters';
    }

    // Role validation
    if (data.role && !USER_ROLES.includes(data.role as UserRole)) {
        errors.role = 'Invalid role selected';
    }

    // Organization validation
    if (!data.organization?.trim()) {
        errors.organization = 'Organization is required';
    } else if (!ORGANIZATIONS.some(org => org.value === data.organization)) {
        errors.organization = 'Invalid organization selected';
    }

    // Department validation
    if (data.organization === 'mertzcrew' && !data.department?.trim()) {
        errors.department = 'Department is required for Mertzcrew users';
    } else if (data.department && !DEPARTMENTS.some(dept => dept.value === data.department)) {
        errors.department = 'Invalid department selected';
    }

    // Phone validation
    if (data.phone && !isValidPhone(data.phone)) {
        errors.phone = 'Please enter a valid phone number';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + FILE_SIZE_LABELS[i];
}

// Format date
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function formatDateMMDDYYYY(input: Date | string | number | null | undefined): string {
    if (!input) return '';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${yyyy}`;
}

// Get status badge class
export function getStatusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-success';
        case 'draft':
            return 'bg-warning';
        case 'inactive':
            return 'bg-secondary';
        case 'archived':
            return 'bg-dark';
        default:
            return 'bg-light text-dark';
    }
}

// Get status text
export function getStatusText(status: string): string {
    switch (status) {
        case 'active':
            return 'Published';
        case 'draft':
            return 'Draft';
        case 'inactive':
            return 'Inactive';
        case 'archived':
            return 'Archived';
        default:
            return status;
    }
}

// Check if user has permission
export function hasPermission(userPermissions: string[], requiredPermission: UserPermission): boolean {
    return userPermissions.includes(requiredPermission);
}

// Check if user is admin
export function isAdmin(userRole?: string): boolean {
    return userRole === 'admin';
}

// Check if user can create policies
export function canCreatePolicy(userRole?: string, userPermissions?: string[]): boolean {
    return isAdmin(userRole) || hasPermission(userPermissions || [], 'create_policy');
}

// Check if user can edit policies
export function canEditPolicy(userRole?: string, userPermissions?: string[]): boolean {
    return isAdmin(userRole) || hasPermission(userPermissions || [], 'edit_policy');
}

// Check if user can delete policies
export function canDeletePolicy(userRole?: string, userPermissions?: string[]): boolean {
    return isAdmin(userRole) || hasPermission(userPermissions || [], 'delete_policy');
}

// Check if user can manage users
export function canManageUsers(userRole?: string, userPermissions?: string[]): boolean {
    return isAdmin(userRole) || hasPermission(userPermissions || [], 'manage_users');
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export interface FileValidationResult {
    isValid: boolean;
    error?: string;
} 