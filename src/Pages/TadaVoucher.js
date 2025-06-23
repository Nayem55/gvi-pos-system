import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TadaVoucher = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  
  // Daily expense data structure
  const [dailyExpense, setDailyExpense] = useState({
    from: '',
    to: '',
    hq: '',
    exHq: '',
    transport: { bus: '', cng: '', train: '' },
    hotelBill: '',
    totalExpense: '',
    imsOnDay: ''
  });

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field.includes('transport.')) {
      const [parent, child] = field.split('.');
      setDailyExpense(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setDailyExpense(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Calculate total expense
  const calculateTotal = () => {
    const transportTotal = Object.values(dailyExpense.transport).reduce(
      (sum, val) => sum + (parseFloat(val) || 0), 0
    );
    const hotel = parseFloat(dailyExpense.hotelBill) || 0;
    const total = transportTotal + hotel;
    
    setDailyExpense(prev => ({
      ...prev,
      totalExpense: total.toFixed(2)
    }));
    
    return total;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate total before submission
    calculateTotal();
    
    if (!dailyExpense.from || !dailyExpense.to) {
      toast.error("Please fill in visited places");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submissionData = {
        userId: user._id,
        name: user.name,
        designation: user.role,
        area: user.zone,
        date: selectedDate,
        month: selectedMonth,
        dailyExpense: dailyExpense
      };

      // Replace with your actual API endpoint
      const response = await fetch('https://gvi-pos-server.vercel.app/tdda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos-token')}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit TD/DA voucher');
      }

      // Reset form after successful submission
      setDailyExpense({
        from: '',
        to: '',
        hq: '',
        exHq: '',
        transport: { bus: '', cng: '', train: '' },
        hotelBill: '',
        totalExpense: '',
        imsOnDay: ''
      });
      
      toast.success("TD/DA voucher submitted successfully!");
      
    } catch (error) {
      console.error('Error submitting TD/DA voucher:', error);
      toast.error("Failed to submit voucher. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow mb-4">
        <h1 className="text-xl font-bold text-center">TD/DA Voucher</h1>
        <div className="flex justify-between items-center mt-2">
          <div className="flex flex-col space-y-2 w-full">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm bg-white text-black border rounded p-1"
            />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm bg-white text-black border rounded p-1"
            />
          </div>
        </div>
      </div>

      {/* Voucher Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visited Places */}
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h2 className="text-md font-semibold text-blue-700 mb-2">Visited Places</h2>
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={dailyExpense.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              placeholder="From"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={dailyExpense.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="To"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={dailyExpense.hq}
              onChange={(e) => handleInputChange('hq', e.target.value)}
              placeholder="HQ"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={dailyExpense.exHq}
              onChange={(e) => handleInputChange('exHq', e.target.value)}
              placeholder="Ex-HQ"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Transport Expenses */}
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h2 className="text-md font-semibold text-blue-700 mb-2">Transport Expenses</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bus</label>
              <input
                type="number"
                value={dailyExpense.transport.bus}
                onChange={(e) => handleInputChange('transport.bus', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onBlur={calculateTotal}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">CNG</label>
              <input
                type="number"
                value={dailyExpense.transport.cng}
                onChange={(e) => handleInputChange('transport.cng', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onBlur={calculateTotal}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Train</label>
              <input
                type="number"
                value={dailyExpense.transport.train}
                onChange={(e) => handleInputChange('transport.train', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onBlur={calculateTotal}
              />
            </div>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h2 className="text-md font-semibold text-blue-700 mb-2">Other Expenses</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hotel Bill</label>
              <input
                type="number"
                value={dailyExpense.hotelBill}
                onChange={(e) => handleInputChange('hotelBill', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onBlur={calculateTotal}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Total Expense</label>
              <input
                type="text"
                value={dailyExpense.totalExpense}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm text-gray-600 mb-1">IMS On Day</label>
            <input
              type="text"
              value={dailyExpense.imsOnDay}
              onChange={(e) => handleInputChange('imsOnDay', e.target.value)}
              placeholder="Any notes about IMS"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Voucher"
          )}
        </button>
      </form>
    </div>
  );
};

export default TadaVoucher;