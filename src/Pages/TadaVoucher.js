import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const TadaVoucher = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  // Daily expense data structure
  const [dailyExpense, setDailyExpense] = useState({
    from: "",
    to: "",
    hq: false,
    exHq: false,
    hqExHqAmount: "", // Combined amount field for HQ/Ex-HQ
    transportType: "bus", // Default transport type
    transportAmount: "",
    hotelBill: "",
    totalExpense: "",
  });

  // Transport options
  const transportOptions = [
    { value: "bus", label: "Bus" },
    { value: "cng", label: "CNG" },
    { value: "train", label: "Train" },
    { value: "other", label: "Other" },
  ];

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setDailyExpense((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle checkbox values
  const toggleCheckbox = (field) => {
    setDailyExpense((prev) => ({
      ...prev,
      [field]: !prev[field],
      // Reset amount when both are unchecked
      hqExHqAmount:
        (field === "hq" && !prev.exHq) || (field === "exHq" && !prev.hq)
          ? ""
          : prev.hqExHqAmount,
    }));
  };

  // Calculate total expense
  const calculateTotal = () => {
    const transport = parseFloat(dailyExpense.transportAmount) || 0;
    const hotel = parseFloat(dailyExpense.hotelBill) || 0;
    const hqExHq =
      dailyExpense.hq || dailyExpense.exHq
        ? parseFloat(dailyExpense.hqExHqAmount) || 0
        : 0;
    const total = transport + hotel + hqExHq;

    setDailyExpense((prev) => ({
      ...prev,
      totalExpense: total.toFixed(2),
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
        dailyExpense: {
          ...dailyExpense,
          transport: {
            [dailyExpense.transportType]: dailyExpense.transportAmount,
            type: dailyExpense.transportType,
          },
        },
      };

      const response = await fetch("http://192.168.0.30:5000/tdda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit TD/DA voucher");
      }

      // Reset form after successful submission
      setDailyExpense({
        from: "",
        to: "",
        hq: false,
        exHq: false,
        hqExHqAmount: "",
        transportType: "bus",
        transportAmount: "",
        hotelBill: "",
        totalExpense: "",
      });

      toast.success("TD/DA voucher submitted successfully!");
    } catch (error) {
      console.error("Error submitting TD/DA voucher:", error);
      toast.error("Failed to submit voucher. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-6">
        <h1 className="text-xl font-bold text-center">TD/DA Voucher</h1>
        <div className="flex flex-col space-y-3 mt-3">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 text-sm bg-white text-gray-800 border rounded p-2"
            />
          </div>
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 text-sm bg-white text-gray-800 border rounded p-2"
            />
          </div>
        </div>
      </div>

      {/* Voucher Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visited Places */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Visited Places
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="text"
                value={dailyExpense.from}
                onChange={(e) => handleInputChange("from", e.target.value)}
                placeholder="Starting location"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="text"
                value={dailyExpense.to}
                onChange={(e) => handleInputChange("to", e.target.value)}
                placeholder="Destination"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* HQ/Ex-HQ Expenses */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
            HQ/Ex-HQ Expenses
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={dailyExpense.hq}
                  onChange={() => toggleCheckbox("hq")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">HQ</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={dailyExpense.exHq}
                  onChange={() => toggleCheckbox("exHq")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Ex-HQ</span>
              </label>
            </div>
            {(dailyExpense.hq || dailyExpense.exHq) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {dailyExpense.hq && dailyExpense.exHq
                    ? "HQ & Ex-HQ"
                    : dailyExpense.hq
                    ? "HQ"
                    : "Ex-HQ"}{" "}
                  Amount (৳)
                </label>
                <input
                  type="number"
                  value={dailyExpense.hqExHqAmount}
                  onChange={(e) =>
                    handleInputChange("hqExHqAmount", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onBlur={calculateTotal}
                  placeholder="Enter amount"
                />
              </div>
            )}
          </div>
        </div>

        {/* Transport Expenses */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h.5a1.5 1.5 0 001.5-1.5V6.621c0-.418-.105-.83-.305-1.197l-1.11-1.999A1.5 1.5 0 0010.5 3H13V1.5a.5.5 0 011 0V3h1.5a.5.5 0 010 1H14v8.5a.5.5 0 00.5.5h.5a1 1 0 001-1V5a1 1 0 00-1-1h-3.5a.5.5 0 01-.447-.276L11 3.5H9.553l-.276.553A.5.5 0 019 4H3z" />
            </svg>
            Transport Expenses
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Type
              </label>
              <select
                value={dailyExpense.transportType}
                onChange={(e) =>
                  handleInputChange("transportType", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {transportOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (৳)
              </label>
              <input
                type="number"
                value={dailyExpense.transportAmount}
                onChange={(e) =>
                  handleInputChange("transportAmount", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onBlur={calculateTotal}
                placeholder="Enter amount"
              />
            </div>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Other Expenses
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Bill (৳)
              </label>
              <input
                type="number"
                value={dailyExpense.hotelBill}
                onChange={(e) => handleInputChange("hotelBill", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onBlur={calculateTotal}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Expense (৳)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dailyExpense.totalExpense || "0.00"}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 font-medium text-gray-700"
                />
                <span className="absolute right-3 top-2 text-gray-500">৳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center transition-colors duration-200 shadow-md"
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
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Submit Voucher
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TadaVoucher;
