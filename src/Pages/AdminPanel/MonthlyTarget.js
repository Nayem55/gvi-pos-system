import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";

const MonthlyTargetPage = () => {
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState({});
  const [tempTargets, setTempTargets] = useState({});
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1); // dayjs().month() is 0-indexed
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          "https://gvi-pos-server.vercel.app/getAllUser"
        );
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTargets = async () => {
      if (!year || !month) return;

      try {
        const res = await axios.get(
          "https://gvi-pos-server.vercel.app/targets",
          {
            params: { year, month },
          }
        );

        const targetsMap = {};
        res.data.forEach((targetEntry) => {
          targetEntry.targets.forEach((target) => {
            if (
              target.year === parseInt(year) &&
              target.month === parseInt(month)
            ) {
              targetsMap[targetEntry.userID] = {
                dp: target.dp,
                tp: (target.dp * 1.07).toFixed(2), // Auto calculate TP here too for display
              };
            }
          });
        });

        setTargets(targetsMap);
        setTempTargets(targetsMap);
      } catch (error) {
        console.error("Failed to fetch targets");
      }
    };

    fetchTargets();
  }, [year, month]);

  const handleTargetChange = (userID, value, field) => {
    if (field === "dp") {
      const dp = parseFloat(value);
      const tp = isNaN(dp) ? "" : (dp * 1.07).toFixed(2);
      setTempTargets((prev) => ({
        ...prev,
        [userID]: {
          dp: value,
          tp,
        },
      }));
    }
  };

  const handleUserTargetSaveOrUpdate = async (userID) => {
    const { tp, dp } = tempTargets[userID];

    if (tp === undefined || dp === undefined || tp === "" || dp === "") {
      return alert("Please enter a valid DP value");
    }

    setLoading(true);

    try {
      const targetExists = targets[userID] !== undefined;
      if (targetExists) {
        await axios.put("https://gvi-pos-server.vercel.app/targets", {
          userID,
          year: parseInt(year),
          month: parseInt(month),
          tp,
          dp,
        });
        toast.success("Target updated successfully");
      } else {
        await axios.post("https://gvi-pos-server.vercel.app/targets", {
          year: parseInt(year),
          month: parseInt(month),
          targets: [{ userID, tp, dp }],
        });
        toast.success("Target created successfully");
      }

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
            updatedTargetsMap[targetEntry.userID] = {
              dp: target.dp,
              tp: (target.dp * 1.07).toFixed(2),
            };
          }
        });
      });

      setTargets(updatedTargetsMap);
      setTempTargets(updatedTargetsMap);
    } catch (error) {
      console.error(
        "Failed to save or update target",
        error.response?.data || error
      );
      toast.error("Error saving or updating target");
    } finally {
      setLoading(false);
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
                <th className="border p-3 text-left">Outlet</th>
                <th className="border p-3 text-center">Target (TP)</th>
                <th className="border p-3 text-center">Target (DP)</th>
                <th className="border p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="border p-3">{user.name}</td>
                  <td className="border p-3">{user.outlet}</td>
                  <td className="border p-3 text-center">
                    <input
                      type="number"
                      className="border p-2 rounded w-32"
                      value={tempTargets[user._id]?.tp || ""}
                      disabled
                    />
                  </td>
                  <td className="border p-3 text-center">
                    <input
                      type="number"
                      className="border p-2 rounded w-32"
                      value={tempTargets[user._id]?.dp || ""}
                      onChange={(e) =>
                        handleTargetChange(user._id, e.target.value, "dp")
                      }
                    />
                  </td>
                  <td className="border p-3 text-center">
                    <button
                      className={`px-4 py-2 rounded w-[100px] ${
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
