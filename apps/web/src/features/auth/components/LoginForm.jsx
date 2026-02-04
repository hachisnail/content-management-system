import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '@repo/validation';
import { Link } from 'react-router-dom';

export const LoginForm = ({ onSubmit, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({ 
    resolver: yupResolver(loginSchema) 
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in duration-300">
      <div className="form-control">
        <label className="label" htmlFor="email"><span className="label-text">Email</span></label>
        <input
          id="email" type="email" placeholder="email@example.com"
          className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
          {...register("email")}
        />
        {errors.email && (
          <span className="label-text-alt text-error mt-1">{errors.email.message}</span>
        )}
      </div>

      <div className="form-control">
        <label className="label" htmlFor="password"><span className="label-text">Password</span></label>
        <div className="relative">
          <input
            id="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Enter password"
            className={`input input-bordered w-full pr-12 ${errors.password ? 'input-error' : ''}`}
            {...register("password")}
          />
          <button 
            type="button" 
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle" 
            onClick={() => setShowPassword(!showPassword)}
          >
             {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="label justify-between">
           {errors.password && <span className="label-text-alt text-error">{errors.password.message}</span>}
          <Link to="/forgot-password" className="label-text-alt link link-hover ml-auto">Forgot password?</Link>
        </div>
      </div>

      <div className="form-control mt-6">
        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
          {isLoading && <span className="loading loading-spinner"></span>} Sign in
        </button>
      </div>
    </form>
  );
};