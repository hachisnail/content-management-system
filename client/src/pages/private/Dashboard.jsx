import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
const { user,error, loading } = useAuth();

  console.log(user)

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Dashboard</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Welcome back, {user.firstName}.</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
         {/* Dashboard Content */}
      </div>
    </div>
  );
};
export default Dashboard;