import React, { useState } from 'react';

export default function BookingForm({ defaultType = 'general' }) {
  const [visitType, setVisitType] = useState(defaultType); // 'general' or 'school'

  return (
    <div className="bg-neutral-950 p-8 border border-white/10 shadow-2xl">
      
      {/* Toggle Type */}
      <div className="flex border-b border-white/10 mb-8">
        <button 
          onClick={() => setVisitType('general')}
          className={`flex-1 pb-4 text-sm uppercase tracking-widest font-bold transition-colors ${visitType === 'general' ? 'text-museum-gold border-b-2 border-museum-gold' : 'text-gray-500 hover:text-white'}`}
        >
          General Visit
        </button>
        <button 
          onClick={() => setVisitType('school')}
          className={`flex-1 pb-4 text-sm uppercase tracking-widest font-bold transition-colors ${visitType === 'school' ? 'text-museum-gold border-b-2 border-museum-gold' : 'text-gray-500 hover:text-white'}`}
        >
          School Tour
        </button>
      </div>

      <form className="space-y-6">
        
        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-gray-400">First Name / Contact Person</legend>
            <input type="text" className="input w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" required />
          </fieldset>
          
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-gray-400">Last Name</legend>
            <input type="text" className="input w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" required />
          </fieldset>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-gray-400">Email Address</legend>
          <input type="email" className="input w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" required />
        </fieldset>

        {/* School Specific Fields */}
        {visitType === 'school' && (
          <div className="animate-fade-in-up space-y-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-gray-400">School / Institution Name</legend>
              <input type="text" className="input w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" required />
            </fieldset>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-gray-400">Grade Level</legend>
                <select className="select w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none">
                  <option>K-6</option>
                  <option>High School (7-12)</option>
                  <option>College / University</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend text-gray-400">Est. Student Count</legend>
                <input type="number" className="input w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" />
              </fieldset>
            </div>
            
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-gray-400">Tour Focus</legend>
              <select className="select w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none">
                <option>General History</option>
                <option>Gold & Metallurgy</option>
                <option>Pre-Colonial Trade</option>
                <option>Custom (Specify in message)</option>
              </select>
            </fieldset>
          </div>
        )}

        {/* General Specific Fields */}
        {visitType === 'general' && (
           <fieldset className="fieldset animate-fade-in-up">
              <legend className="fieldset-legend text-gray-400">Group Size</legend>
              <select className="select w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none">
                <option>Individual (1)</option>
                <option>Couple (2)</option>
                <option>Small Group (3-5)</option>
                <option>Large Group (6+)</option>
              </select>
           </fieldset>
        )}

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-gray-400">Preferred Date</legend>
          <input type="date" className="input w-full bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" required />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend text-gray-400">Special Requests / Message</legend>
          <textarea className="textarea w-full h-32 bg-white/5 border-white/10 text-white focus:outline-museum-gold rounded-none" placeholder="Accessibility needs, specific interests, etc."></textarea>
        </fieldset>

        <div className="pt-4">
          <button className="btn bg-museum-gold text-black hover:bg-white border-none rounded-none w-full uppercase tracking-widest font-bold">
            {visitType === 'school' ? 'Request School Tour' : 'Book Appointment'}
          </button>
          <p className="text-xs text-center text-gray-600 mt-4">
            Confirmation will be sent to your email within 24 hours.
          </p>
        </div>

      </form>
    </div>
  );
}