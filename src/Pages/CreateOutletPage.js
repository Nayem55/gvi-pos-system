import { useState } from "react";
import axios from "axios";
import { PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const CreateOutletPage = () => {
  const [outletName, setOutletName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outletName.trim()) {
      toast.error("Outlet name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://gvi-pos-server.vercel.app/add-new-outlet",
        { name: outletName }
      );
      
      toast.success(response.data.message || "Outlet created successfully!");
      setOutletName("");
    } catch (error) {
      console.error("Error creating outlet:", error);
      toast.error(error.response?.data?.message || "Failed to create outlet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-6">Create New Outlet</h2>

        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Outlet Name
              </label>
              <input
                type="text"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter outlet name"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <PlusCircle size={18} />
              {loading ? "Creating..." : "Create Outlet"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOutletPage;