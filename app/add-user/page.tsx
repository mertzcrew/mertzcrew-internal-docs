import AddUserForm from '../../components/admin/AddUserForm';
import AuthGuard from '../../components/auth-guard';

export default function AddUserPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="h3 mb-0">Add New User</h1>
            </div>
            <div className="card">
              <div className="card-body">
                <AddUserForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 