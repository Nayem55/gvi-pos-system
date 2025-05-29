import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

export default function PaymentVoucher({
  user,
  currentDue,
  stock,
  setStock,
  getStockValue,
}) {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMode: "cash",
    bank: "",
    remarks: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false); // ✅ Loading state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Start loading
    const formattedDateTime = dayjs(formData.date).format("YYYY-MM-DD HH:mm:ss");

    try {
      const dueResponse = await axios.put(
        "https://gvi-pos-server.vercel.app/update-due",
        {
          outlet: user.outlet,
          currentDue: currentDue - parseFloat(formData.amount),
        }
      );

      if (!dueResponse.data.success) {
        throw new Error("Failed to update due amount");
      }

      await axios.post("https://gvi-pos-server.vercel.app/money-transfer", {
        outlet: user.outlet,
        amount: parseFloat(formData.amount),
        asm: user.asm,
        rsm: user.rsm,
        zone: user.zone,
        type: "payment",
        paymentMode: formData.paymentMode,
        bank: formData.bank || "",
        date: formattedDateTime,
        createdBy: user.name,
      });

      toast.success("Payment voucher submitted successfully!");
      getStockValue(user.outlet);
      setFormData({
        amount: "",
        paymentMode: "cash",
        bank: "",
        remarks: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast.error("Failed to submit payment");
      console.error("Error:", error);
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-green-800">Payment Voucher</h2>
      <div className="mb-4 p-3 bg-green-50 rounded">
        <p className="font-semibold">Current Due: {currentDue?.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter amount"
              step="0.01"
              min="0"
              max={currentDue}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Payment Mode</label>
          <select
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        {formData.paymentMode === "bank" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Bank</label>
            <select
              name="bank"
              value={formData.bank}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">Select Bank</option>
              <option value="city_bank">City Bank</option>
              <option value="brac_bank">BRAC Bank</option>
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            rows="3"
            placeholder="Enter remarks (optional)"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-200 flex justify-center items-center"
          disabled={
            loading || (formData.paymentMode === "bank" && !formData.bank)
          }
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
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
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
          ) : (
            "Submit Payment Request"
          )}
        </button>
      </form>
    </div>
  );
}
