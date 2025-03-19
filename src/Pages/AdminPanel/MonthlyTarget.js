import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";

const MonthlyTargetPage = () => {
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState({}); // Store targets fetched from the database
  const [tempTargets, setTempTargets] = useState({}); // Store temporary input values
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().format("MM"));
  const [loading, setLoading] = useState(false);

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("https://gvi-pos-server.vercel.app/getAllUser");
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  // Fetch targets for the selected year and month
  useEffect(() => {
    const fetchTargets = async () => {
      if (!year || !month) return;

      try {
        const res = await axios.get("https://gvi-pos-server.vercel.app/targets", {
          params: { year, month },
        });

        // Map the targets data to associate each userID with their target
        const targetsMap = {};
        res.data.forEach((targetEntry) => {
          targetEntry.targets.forEach((target) => {
            if (
              target.year === parseInt(year) &&
              target.month === parseInt(month)
            ) {
              targetsMap[targetEntry.userID] = target.target;
            }
          });
        });

        setTargets(targetsMap); // Update the targets state
        setTempTargets(targetsMap); // Initialize tempTargets with fetched targets
      } catch (error) {
        console.error("Failed to fetch targets");
      }
    };

    fetchTargets();
  }, [year, month]);

  // Handle target input change
  const handleTargetChange = (userID, value) => {
    setTempTargets((prev) => ({ ...prev, [userID]: value }));
  };

  // Save or update target for a user
  const handleUserTargetSaveOrUpdate = async (userID) => {
    const target = tempTargets[userID]; // Get the target value from tempTargets

    if (target === undefined || target === "") {
      return alert("Please enter a valid target");
    }

    setLoading(true); // Show loading indicator

    try {
      // Check if the target already exists for the user in the database
      const targetExists = targets[userID] !== undefined;

      if (targetExists) {
        // PUT request to update the existing target
        await axios.put("https://gvi-pos-server.vercel.app/targets", {
          userID,
          year: parseInt(year),
          month: parseInt(month),
          target,
        });
        toast.success("Target updated successfully");
      } else {
        // POST request to create a new target
        await axios.post("https://gvi-pos-server.vercel.app/targets", {
          year: parseInt(year),
          month: parseInt(month),
          targets: [{ userID, target }],
        });
        toast.success("Target created successfully");
      }

      // Refresh targets after saving or updating
      const res = await axios.get("https://gvi-pos-server.vercel.app/targets", {
        params: { year, month },
      });
      const updatedTargetsMap = {};
      res.data.forEach((targetEntry) => {
        targetEntry.targets.forEach((target) => {
          if (
            target.year === parseInt(year) &&
            target.month === parseInt(month)
          ) {
            updatedTargetsMap[targetEntry.userID] = target.target;
          }
        });
      });
      setTargets(updatedTargetsMap);
      setTempTargets(updatedTargetsMap); // Sync tempTargets with the updated targets
    } catch (error) {
      console.error("Failed to save or update target", error.response?.data || error);
      toast.error("Error saving or updating target");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="p-6 bg-gray-100 min-h-screen flex-1">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Set Monthly Targets</h2>

          <div className="mb-6 flex gap-4 items-center">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded p-2 w-32"
              placeholder="Year"
            />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded p-2 w-40"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {dayjs().month(i).format("MMMM")}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-3 text-left">User</th>
                <th className="border p-3 text-center">Target</th>
                <th className="border p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="border p-3">{user.name}</td>
                  <td className="border p-3 text-center">
                    <input
                      type="number"
                      className="border p-2 rounded w-32"
                      value={tempTargets[user._id] || ""}
                      onChange={(e) =>
                        handleTargetChange(user._id, e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-3 text-center">
                    <button
                      className={`px-4 py-2 rounded ${
                        targets[user._id]
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                      onClick={() => handleUserTargetSaveOrUpdate(user._id)}
                      disabled={loading}
                    >
                      {loading
                        ? "Saving..."
                        : targets[user._id]
                        ? "Update"
                        : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTargetPage;