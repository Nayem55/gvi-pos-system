import { useEffect, useState, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../Component/AdminSidebar";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const CategoryTargetPage = () => {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [targets, setTargets] = useState({});
  const [tempTargets, setTempTargets] = useState({});
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const tableContainerRef = useRef(null);

  // Mouse events for horizontal scrolling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, categoriesRes] = await Promise.all([
          axios.get("https://gvi-pos-server.vercel.app/getAllUser"),
          axios.get("https://gvi-pos-server.vercel.app/categories"),
        ]);
        setUsers(usersRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to load users and categories");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTargets = async () => {
      if (!year || !month) return;

      try {
        const res = await axios.get(
          "https://gvi-pos-server.vercel.app/categoryTargets",
          {
            params: { year, month },
          }
        );

        // Transform targets into a more usable structure
        const targetsMap = {};
        res.data.forEach((userDoc) => {
          userDoc.targets.forEach((monthlyTarget) => {
            if (
              monthlyTarget.year === parseInt(year) &&
              monthlyTarget.month === parseInt(month)
            ) {
              const categoryMap = {};
              monthlyTarget.targets.forEach((target) => {
                categoryMap[target.category] = target.target;
              });
              targetsMap[userDoc.userID] = categoryMap;
            }
          });
        });

        setTargets(targetsMap);
        setTempTargets(targetsMap);
      } catch (error) {
        console.error("Failed to fetch targets", error);
        toast.error("Failed to load targets");
      }
    };

    fetchTargets();
  }, [year, month]);

  const handleTargetChange = (userID, category, value) => {
    setTempTargets((prev) => ({
      ...prev,
      [userID]: {
        ...(prev[userID] || {}),
        [category]: value,
      },
    }));
  };

  const saveTargets = async (userID) => {
    if (!tempTargets[userID]) return;

    setLoading(true);

    try {
      const targetsArray = Object.entries(tempTargets[userID])
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([category, target]) => ({
          category,
          target: parseFloat(target),
        }));

      await axios.post("https://gvi-pos-server.vercel.app/categoryTargets", {
        userID,
        year: parseInt(year),
        month: parseInt(month),
        targets: targetsArray,
      });

      toast.success("Targets saved successfully");

      // Refresh targets
      const res = await axios.get(
        "https://gvi-pos-server.vercel.app/categoryTargets",
        {
          params: { year, month },
        }
      );

      const updatedTargets = {};
      res.data.forEach((userDoc) => {
        userDoc.targets.forEach((monthlyTarget) => {
          if (
            monthlyTarget.year === parseInt(year) &&
            monthlyTarget.month === parseInt(month)
          ) {
            const categoryMap = {};
            monthlyTarget.targets.forEach((target) => {
              categoryMap[target.category] = target.target;
            });
            updatedTargets[userDoc.userID] = categoryMap;
          }
        });
      });

      setTargets(updatedTargets);
    } catch (error) {
      console.error("Failed to save targets", error);
      toast.error("Error saving targets");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Save all targets from the imported Excel
  const saveAllTargets = async () => {
    setLoading(true);

    try {
      // Prepare all user updates
      const updates = Object.entries(tempTargets)
        .filter(
          ([userID, targets]) => targets && Object.keys(targets).length > 0
        )
        .map(([userID, targets]) => {
          const targetsArray = Object.entries(targets)
            .filter(([_, value]) => value !== undefined && value !== "")
            .map(([category, target]) => ({
              category,
              target: parseFloat(target),
            }));

          return axios.post(
            "https://gvi-pos-server.vercel.app/categoryTargets",
            {
              userID,
              year: parseInt(year),
              month: parseInt(month),
              targets: targetsArray,
            }
          );
        });

      // Execute all updates
      await Promise.all(updates);
      toast.success("All targets saved successfully");

      // Refresh targets
      const res = await axios.get(
        "https://gvi-pos-server.vercel.app/categoryTargets",
        {
          params: { year, month },
        }
      );

      const updatedTargets = {};
      res.data.forEach((userDoc) => {
        userDoc.targets.forEach((monthlyTarget) => {
          if (
            monthlyTarget.year === parseInt(year) &&
            monthlyTarget.month === parseInt(month)
          ) {
            const categoryMap = {};
            monthlyTarget.targets.forEach((target) => {
              categoryMap[target.category] = target.target;
            });
            updatedTargets[userDoc.userID] = categoryMap;
          }
        });
      });

      setTargets(updatedTargets);
    } catch (error) {
      console.error("Failed to save all targets", error);
      toast.error("Error saving some targets");
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
        (u) => u.name === row["User Name"] || u._id === row["User ID"]
      );
      if (!user) return;

      categories.forEach((category) => {
        if (row[category] !== undefined && row[category] !== "") {
          const targetValue = parseFloat(row[category]);
          if (!isNaN(targetValue)) {
            newTempTargets[user._id] = newTempTargets[user._id] || {};
            newTempTargets[user._id][category] = targetValue.toString();
            processedCount++;
          }
        }
      });
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
        toast.success(`Processed ${processedCount} category targets from file`);
      } else {
        toast.error("No valid targets found in the file");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file");
    } finally {
      setImportLoading(false);
      setFile(null);
      document.getElementById("file-upload").value = "";
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
    const demoData = users.map((user) => {
      const row = {
        "User ID": user._id,
        "User Name": user.name,
      };
      categories.forEach((category) => {
        row[category] = "";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(demoData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Category Targets");
    XLSX.writeFile(workbook, "Category_Targets_Template.xlsx");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Category-wise Targets
              </h2>

              {/* Control Panel */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Year"
                    />
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {dayjs().month(i).format("MMMM")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={downloadDemoFile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Template
                    </button>
                    {Object.keys(tempTargets).length > 0 && (
                      <button
                        onClick={saveAllTargets}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md text-white transition-colors flex items-center justify-center ${
                          loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            Saving All...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save All
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Bulk Import
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <label className="block">
                        <span className="sr-only">Choose Excel file</span>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileUpload}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                      </label>
                    </div>
                    <button
                      onClick={handleBulkImport}
                      disabled={!file || importLoading}
                      className={`px-4 py-2 rounded-md text-white transition-colors flex items-center justify-center ${
                        !file || importLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {importLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          Import Targets
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div
                ref={tableContainerRef}
                className="relative rounded-lg border border-gray-200 overflow-auto"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  maxHeight: "calc(100vh - 300px)", // NEW: Limit table height
                  minHeight: "200px", // NEW: Ensure minimum height
                }}
              >
                <div className="min-w-max">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th
                          scope="col"
                          className="sticky left-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="sticky left-12 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                        >
                          Outlet
                        </th>
                        {categories.map((category) => (
                          <th
                            key={category}
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {category}
                          </th>
                        ))}
                        <th
                          scope="col"
                          className="sticky right-0 z-10 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="sticky left-0 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-white">
                            {user.name}
                          </td>
                          <td className="sticky left-12 px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-white">
                            {user.outlet}
                          </td>
                          {categories.map((category) => (
                            <td
                              key={`${user._id}-${category}`}
                              className="px-2 py-1 whitespace-nowrap"
                            >
                              <input
                                type="number"
                                className="block w-full min-w-[100px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={tempTargets[user._id]?.[category] || ""}
                                onChange={(e) =>
                                  handleTargetChange(
                                    user._id,
                                    category,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          ))}
                          <td className="sticky right-0 px-4 py-4 whitespace-nowrap text-center bg-white">
                            <button
                              onClick={() => saveTargets(user._id)}
                              disabled={loading}
                              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                targets[user._id]
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-green-600 hover:bg-green-700"
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                loading ? "opacity-75 cursor-not-allowed" : ""
                              }`}
                            >
                              {loading ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                  Saving...
                                </>
                              ) : targets[user._id] ? (
                                "Update"
                              ) : (
                                "Save"
                              )}
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
        </div>
      </div>
    </div>
  );
};

export default CategoryTargetPage;
