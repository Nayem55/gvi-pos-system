import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const MonthlyTargetPage = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Keep full list
  const [targets, setTargets] = useState({});
  const [tempTargets, setTempTargets] = useState({});
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState("all"); // Zone filter

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://175.29.181.245:5000/getAllUser");
        const fetchedUsers = res.data;
        setAllUsers(fetchedUsers);
        setUsers(fetchedUsers); // Initially show all
      } catch (error) {
        console.error("Failed to fetch users", error);
        toast.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  // Apply zone filter
  useEffect(() => {
    if (selectedZone === "all") {
      setUsers(allUsers);
    } else {
      setUsers(allUsers.filter((user) => user.zone === selectedZone));
    }
  }, [selectedZone, allUsers]);

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

  // Updated: Filter users in template
  const downloadDemoFile = () => {
    const exportUsers = selectedZone === "all" ? allUsers : users;

    const demoData = exportUsers.map((user) => ({
      "User ID": user._id,
      "User Name": user.name,
      "User Number": user.number,
      "User Zone": user.zone || "",
      "DP Target": "",
      "TP Target (Auto Calculated)": "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(demoData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Targets");
    XLSX.writeFile(workbook, `Monthly_Targets_Template_${year}_${month}_${selectedZone === "all" ? "AllZones" : selectedZone}.xlsx`);
  };

  // Updated: Export only filtered users
  const handleExportTargets = () => {
    const exportUsers = selectedZone === "all" ? allUsers : users;

    const exportData = exportUsers.map((user) => ({
      "User ID": user._id,
      "User Name": user.name,
      "User Number": user.number,
      "User Zone": user.zone || "",
      "DP Target": tempTargets[user._id]?.dp || "",
      "TP Target (Auto Calculated)": tempTargets[user._id]?.tp || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Targets");
    XLSX.writeFile(workbook, `Monthly_Targets_${year}_${month}_${selectedZone === "all" ? "AllZones" : selectedZone}.xlsx`);
  };

  // Updated: Summary based on filtered users
  const calculateTotalTargets = () => {
    let totalDP = 0;
    let totalTP = 0;
    let userCountWithTarget = 0;

    users.forEach((user) => {
      const target = tempTargets[user._id];
      if (target) {
        const dp = parseFloat(target.dp) || 0;
        const tp = parseFloat(target.tp) || 0;
        totalDP += dp;
        totalTP += tp;
        if (dp > 0) userCountWithTarget += 1;
      }
    });

    return {
      totalDP: totalDP.toFixed(2),
      totalTP: totalTP.toFixed(2),
      userCountWithTarget,
    };
  };

  // Extract unique zones
  const zones = Array.from(new Set(allUsers.map((u) => u.zone).filter(Boolean)));

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 bg-gray-100 min-h-screen flex-1">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">
            Monthly Target Management
          </h2>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-inner border border-purple-200">
            <h3 className="text-lg font-medium mb-2 text-purple-800">
              Summary for{" "}
              {dayjs().month(month - 1).format("MMMM")} {year}{" "}
              {selectedZone !== "all" && `(${selectedZone})`}
            </h3>
            <div className="flex flex-wrap gap-6 text-gray-700">
              <p>
                <span className="font-bold text-purple-700">Total DP:</span>{" "}
                {calculateTotalTargets().totalDP}
              </p>
              <p>
                <span className="font-bold text-purple-700">Total TP:</span>{" "}
                {calculateTotalTargets().totalTP}
              </p>
              <p>
                <span className="font-bold text-purple-700">Users with Target:</span>{" "}
                {calculateTotalTargets().userCountWithTarget}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
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

              {/* Zone Filter */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="border border-gray-300 rounded p-2 w-48 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="all">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBulkSave}
              disabled={loading || Object.keys(tempTargets).length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? "Saving All..." : "Save All Changes"}
            </button>
          </div>

          <div className="mb-6 p-5 border border-purple-200 rounded-lg bg-purple-50 shadow-inner">
            <h3 className="text-lg font-medium mb-4 text-purple-800">
              Bulk Import/Export Targets
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <button
                  onClick={downloadDemoFile}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Download Template
                </button>
                <button
                  onClick={handleExportTargets}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Export Current Targets
                </button>
                <div className="flex-1">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  onClick={handleBulkImport}
                  disabled={!file || importLoading || loading}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {importLoading ? "Importing..." : "Import File"}
                </button>
              </div>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                <p className="font-semibold text-purple-700 mb-1">Instructions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Download template → Fill only "DP Target" column</li>
                  <li>TP is auto-calculated (DP × 1.07)</li>
                  <li>Do not modify User ID, Name, Number, or Zone</li>
                  <li>Export downloads current targets for selected zone</li>
                </ul>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mb-4 text-center text-purple-600 font-medium animate-pulse">
              Loading data... Please wait.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-lg bg-white">
            <table className="w-full table-auto">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">User Name</th>
                  <th className="p-4 text-left font-semibold">Outlet</th>
                  <th className="p-4 text-left font-semibold">Number</th>
                  <th className="p-4 text-left font-semibold">Zone</th>
                  <th className="p-4 text-center font-semibold">TP Target</th>
                  <th className="p-4 text-center font-semibold">DP Target</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-purple-50 transition-all border-b"
                  >
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.outlet || "-"}</td>
                    <td className="p-4 text-gray-600">{user.number}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {user.zone || "No Zone"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="text"
                        className="border border-gray-300 p-2 rounded w-32 text-center bg-gray-100 font-medium"
                        value={tempTargets[user._id]?.tp || ""}
                        disabled
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        className="border border-purple-300 p-2 rounded w-32 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                        value={tempTargets[user._id]?.dp || ""}
                        onChange={(e) =>
                          handleTargetChange(user._id, e.target.value, "dp")
                        }
                        placeholder="Enter DP"
                      />
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