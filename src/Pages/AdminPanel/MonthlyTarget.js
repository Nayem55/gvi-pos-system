import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const MonthlyTargetPage = () => {
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState({});
  const [tempTargets, setTempTargets] = useState({});
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://175.29.181.245:5000/getAllUser");
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users", error);
        toast.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTargets = async () => {
      if (!year || !month) return;

      try {
        setLoading(true);
        const res = await axios.get("http://175.29.181.245:5000/targets", {
          params: { year, month },
        });

        const targetsMap = {};
        res.data.forEach((targetEntry) => {
          targetEntry.targets.forEach((target) => {
            if (
              target.year === parseInt(year) &&
              target.month === parseInt(month)
            ) {
              targetsMap[targetEntry.userID] = {
                dp: target.dp,
                tp: (target.dp * 1.07).toFixed(2),
                userName: targetEntry.userName,
                userNumber: targetEntry.userNumber,
                userZone: targetEntry.userZone,
              };
            }
          });
        });

        setTargets(targetsMap);
        setTempTargets(targetsMap);
      } catch (error) {
        console.error("Failed to fetch targets", error);
        toast.error("Failed to fetch targets");
      } finally {
        setLoading(false);
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
          ...prev[userID],
          dp: value,
          tp,
        },
      }));
    }
  };

  const handleUserTargetSaveOrUpdate = async (user) => {
    const { tp, dp } = tempTargets[user._id] || {};

    if (tp === undefined || dp === undefined || tp === "" || dp === "") {
      return toast.error("Please enter a valid DP value");
    }

    setLoading(true);

    try {
      const targetData = {
        userID: user._id,
        userName: user.name,
        userNumber: user.number,
        userZone: user.zone,
        year: parseInt(year),
        month: parseInt(month),
        tp,
        dp,
      };

      const targetExists = targets[user._id] !== undefined;
      if (targetExists) {
        await axios.put("http://175.29.181.245:5000/targets", targetData);
        toast.success("Target updated successfully");
      } else {
        await axios.post("http://175.29.181.245:5000/targets", targetData);
        toast.success("Target created successfully");
      }

      const res = await axios.get("http://175.29.181.245:5000/targets", {
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
              userName: targetEntry.userName,
              userNumber: targetEntry.userNumber,
              userZone: targetEntry.userZone,
            };
          }
        });
      });

      setTargets(updatedTargetsMap);
      setTempTargets(updatedTargetsMap);
    } catch (error) {
      console.error("Failed to save or update target", error.response?.data || error);
      toast.error(error.response?.data?.message || "Error saving target");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSave = async () => {
    if (Object.keys(tempTargets).length === 0) {
      return toast.error("No targets to save");
    }

    setLoading(true);

    try {
      const targetsToSave = users
        .filter((user) => tempTargets[user._id]?.dp)
        .map((user) => ({
          userID: user._id,
          userName: user.name,
          userNumber: user.number,
          userZone: user.zone,
          year: parseInt(year),
          month: parseInt(month),
          tp: tempTargets[user._id].tp,
          dp: tempTargets[user._id].dp,
        }));

      await axios.post("http://175.29.181.245:5000/targets/bulk", targetsToSave);

      toast.success(`Successfully saved ${targetsToSave.length} targets`);

      const res = await axios.get("http://175.29.181.245:5000/targets", {
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
              userName: targetEntry.userName,
              userNumber: targetEntry.userNumber,
              userZone: targetEntry.userZone,
            };
          }
        });
      });

      setTargets(updatedTargetsMap);
      setTempTargets(updatedTargetsMap);
    } catch (error) {
      console.error("Bulk save failed:", error);
      toast.error(error.response?.data?.message || "Bulk save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
  };

  const processExcelData = (data) => {
    const newTempTargets = { ...tempTargets };
    let processedCount = 0;

    data.forEach((row) => {
      const user = users.find(
        (u) =>
          u.name === row["User Name"] ||
          u._id === row["User ID"] ||
          u.number === row["User Number"]
      );

      if (user && row["DP Target"]) {
        const dp = parseFloat(row["DP Target"]);
        if (!isNaN(dp)) {
          newTempTargets[user._id] = {
            dp: dp.toString(),
            tp: (dp * 1.07).toFixed(2),
            userName: user.name,
            userNumber: user.number,
            userZone: user.zone,
          };
          processedCount++;
        }
      }
    });

    setTempTargets(newTempTargets);
    return processedCount;
  };

  const handleBulkImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setImportLoading(true);

    try {
      const data = await readExcelFile(file);
      const processedCount = processExcelData(data);

      if (processedCount > 0) {
        toast.success(`Imported and processed ${processedCount} targets. Review and save.`);
      } else {
        toast.error("No valid targets found in the file");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file");
    } finally {
      setImportLoading(false);
      setFile(null);
      if (document.getElementById("file-upload")) {
        document.getElementById("file-upload").value = "";
      }
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadDemoFile = () => {
    const demoData = users.map((user) => ({
      "User ID": user._id,
      "User Name": user.name,
      "User Number": user.number,
      "User Zone": user.zone,
      "DP Target": "",
      "TP Target (Auto Calculated)": "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(demoData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Targets");
    XLSX.writeFile(workbook, `Monthly_Targets_Template_${year}_${month}.xlsx`);
  };

  const calculateTotalTargets = () => {
    let totalDP = 0;
    let totalTP = 0;
    let userCountWithTarget = 0;

    Object.values(tempTargets).forEach((target) => {
      const dp = parseFloat(target.dp) || 0;
      const tp = parseFloat(target.tp) || 0;
      totalDP += dp;
      totalTP += tp;
      if (dp > 0) {
        userCountWithTarget += 1;
      }
    });

    return {
      totalDP: totalDP.toFixed(2),
      totalTP: totalTP.toFixed(2),
      userCountWithTarget,
    };
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 bg-gray-100 min-h-screen flex-1">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Monthly Target Management</h2>

          {/* Total Targets Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-lg font-medium mb-2">
              Summary for {dayjs().month(month - 1).format("MMMM")} {year}
            </h3>
            <div className="flex gap-8">
              <p>
                <span className="font-semibold">Total DP Target:</span>{" "}
                {calculateTotalTargets().totalDP}
              </p>
              <p>
                <span className="font-semibold">Total TP Target:</span>{" "}
                {calculateTotalTargets().totalTP}
              </p>
              <p>
                <span className="font-semibold">Users with Targets:</span>{" "}
                {calculateTotalTargets().userCountWithTarget}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border border-gray-300 rounded p-2 w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Year"
                min="2000"
                max="2100"
              />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-gray-300 rounded p-2 w-40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {dayjs().month(i).format("MMMM")}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBulkSave}
                disabled={loading || Object.keys(tempTargets).length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving All..." : "Save All Changes"}
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
            <h3 className="text-lg font-medium mb-3">Bulk Import Targets from Excel</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <button
                  onClick={downloadDemoFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Download Template
                </button>
                <div className="flex-1 w-full">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  onClick={handleBulkImport}
                  disabled={!file || importLoading || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {importLoading ? "Importing..." : "Import File"}
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Import Instructions:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Download the template to ensure correct format.</li>
                  <li>Enter values only in the "DP Target" column (TP is auto-calculated).</li>
                  <li>Do not alter "User ID", "User Name", "User Number", or "User Zone" columns.</li>
                  <li>Upload the file to load data into the table.</li>
                  <li>Review changes and use "Save All Changes" to persist.</li>
                </ol>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mb-4 text-center text-purple-600 font-medium">
              Loading data... Please wait.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border-b p-3 text-left font-medium">User Name</th>
                  <th className="border-b p-3 text-left font-medium">Outlet</th>
                  <th className="border-b p-3 text-left font-medium">Number</th>
                  <th className="border-b p-3 text-left font-medium">Zone</th>
                  <th className="border-b p-3 text-center font-medium">TP Target</th>
                  <th className="border-b p-3 text-center font-medium">DP Target</th>
                  <th className="border-b p-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="border-b p-3">{user.name}</td>
                    <td className="border-b p-3">{user.outlet}</td>
                    <td className="border-b p-3">{user.number}</td>
                    <td className="border-b p-3">{user.zone}</td>
                    <td className="border-b p-3 text-center">
                      <input
                        type="text"
                        className="border border-gray-300 p-2 rounded w-32 text-center bg-gray-100"
                        value={tempTargets[user._id]?.tp || ""}
                        disabled
                      />
                    </td>
                    <td className="border-b p-3 text-center">
                      <input
                        type="number"
                        className="border border-gray-300 p-2 rounded w-32 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={tempTargets[user._id]?.dp || ""}
                        onChange={(e) =>
                          handleTargetChange(user._id, e.target.value, "dp")
                        }
                        placeholder="Enter DP"
                      />
                    </td>
                    <td className="border-b p-3 text-center">
                      <button
                        className={`px-4 py-2 rounded w-[100px] text-white transition-colors ${
                          targets[user._id]
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-green-500 hover:bg-green-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() => handleUserTargetSaveOrUpdate(user)}
                        disabled={loading}
                      >
                        {loading
                          ? "Processing..."
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
    </div>
  );
};

export default MonthlyTargetPage;