import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">CMS MIS Portal</h2>
        <p className="mt-2 text-sm text-gray-600">Please sign in to continue</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;