import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { onboardingSchema } from '@repo/validation';

export const OnboardingForm = ({ onSubmit, isLoading }) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({ 
    resolver: yupResolver(onboardingSchema) 
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">First Name</span></label>
          <input 
            type="text" 
            className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`} 
            {...register("firstName")} 
          />
          {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName.message}</span>}
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Last Name</span></label>
          <input 
            type="text" 
            className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`} 
            {...register("lastName")} 
          />
          {errors.lastName && <span className="text-error text-xs mt-1">{errors.lastName.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="form-control">
            <label className="label"><span className="label-text">Birth Date</span></label>
            <input 
              type="date" 
              className={`input input-bordered w-full ${errors.birthDate ? 'input-error' : ''}`} 
              {...register("birthDate")} 
            />
            {errors.birthDate && <span className="text-error text-xs mt-1">{errors.birthDate.message}</span>}
         </div>
         <div className="form-control">
            <label className="label"><span className="label-text">Contact #</span></label>
            <input 
              type="tel" 
              className={`input input-bordered w-full ${errors.contactNumber ? 'input-error' : ''}`} 
              placeholder="+123..." 
              {...register("contactNumber")} 
            />
            {errors.contactNumber && <span className="text-error text-xs mt-1">{errors.contactNumber.message}</span>}
         </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Email</span></label>
        <input 
          type="email" 
          className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} 
          {...register("email")} 
        />
        {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Password</span></label>
          <input 
            type="password" 
            className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`} 
            {...register("password")} 
          />
          {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Confirm Password</span></label>
          <input 
            type="password" 
            className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`} 
            {...register("confirmPassword")} 
          />
          {errors.confirmPassword && <span className="text-error text-xs mt-1">{errors.confirmPassword.message}</span>}
        </div>
      </div>

      <div className="form-control mt-6">
        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
          {isLoading && <span className="loading loading-spinner"></span>} Create Superadmin & Login
        </button>
      </div>
    </form>
  );
};