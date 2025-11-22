import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart2,
  ClipboardCheck,
  ShoppingCart,
  DollarSign,
  X,
  Target,
  Trophy,
  FileDown,
} from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ClipLoader } from "react-spinners";
import toast from "react-hot-toast";

const CategoryWiseSalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [zones, setZones] = useState([]);
  const [summary, setSummary] = useState({
    totalCategories: 0,
    totalQuantity: 0,
    totalTP: 0,
    totalMRP: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [modalZone, setModalZone] = useState("");
  const [targetsData, setTargetsData] = useState({});
  const [modalSummary, setModalSummary] = useState({
    totalQuantity: 0,
    totalTP: 0,
    totalMRP: 0,
    totalOutlets: 0,
    totalTarget: 0,
    totalAchievement: 0,
  });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await axios.get("http://175.29.181.245:5000/sales/zone-wise", {
          params: { month },
        });
        const uniqueZones = [...new Set(response.data.map((item) => item._id))].sort();
        setZones(uniqueZones);
      } catch (error) {
        toast.error("Failed to fetch zones");
      }
    };
    fetchZones();
  }, [month]);

  useEffect(() => {
    const fetchTargets = async () => {
      const currentYear = month ? dayjs(month).year() : dayjs().year();
      const currentMonth = month ? dayjs(month).month() + 1 : dayjs().month() + 1;
      try {
        const res = await axios.get("http://175.29.181.245:5000/categoryTargets", {
          params: { year: currentYear, month: currentMonth },
        });
        const targetsMap = {};
        res.data.forEach((userDoc) => {
          userDoc.targets.forEach((monthlyTarget) => {
            if (monthlyTarget.year === currentYear && monthlyTarget.month === currentMonth) {
              const categoryMap = {};
              monthlyTarget.targets.forEach((t) => {
                categoryMap[t.category] = t.target;
              });
              targetsMap[userDoc.userID] = categoryMap;
            }
          });
        });
        setTargetsData(targetsMap);
      } catch (error) {
        toast.error("Failed to fetch targets");
      }
    };
    fetchTargets();
  }, [month]);

  const fetchSalesData = async (params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://175.29.181.245:5000/sales/category-wise", { params });
      const adjustedData = response.data.map((cat) => ({
        ...cat,
        net_quantity: cat.total_quantity - (cat.return_quantity || 0),
      }));
      const sortedData = adjustedData.sort((a, b) => a._id.localeCompare(b._id));
      setSalesData(sortedData);
      const totalQuantity = sortedData.reduce((acc, cat) => acc + cat.net_quantity, 0);
      const totalTP = sortedData.reduce((acc, cat) => acc + cat.total_tp, 0);
      const totalMRP = sortedData.reduce((acc, cat) => acc + cat.total_mrp, 0);
      setSummary({
        totalCategories: sortedData.length,
        totalQuantity,
        totalTP,
        totalMRP,
      });
    } catch (err) {
      setError("Failed to fetch sales data.");
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutletDetails = async (category, overrideZone = null) => {
    try {
      setModalLoading(true);
      if (overrideZone === null) {
        setIsModalOpen(true);
        setSelectedCategory(category);
        setModalZone(selectedZone);
      }
      const zoneToUse = overrideZone !== null ? overrideZone : selectedZone;
      const params = { category };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (month) {
        params.month = month;
      }
      if (zoneToUse) params.zone = zoneToUse;

      const res = await axios.get("http://175.29.181.245:5000/sales/category-wise/outlet-details", { params });
      const enhanced = res.data.map((outlet) => {
        const userTargets = targetsData[outlet._id.userID] || {};
        const target = userTargets[category] || 0;
        const net_quantity = outlet.total_quantity - (outlet.return_quantity || 0);
        const achievement = target > 0 ? (net_quantity / target) * 100 : 0;
        return { ...outlet, net_quantity, target, achievement };
      });
      const sorted = enhanced.sort((a, b) => a._id.outlet.localeCompare(b._id.outlet));
      setModalData(sorted);

      const totalQty = sorted.reduce((s, o) => s + o.net_quantity, 0);
      const totalTP = sorted.reduce((s, o) => s + o.total_tp, 0);
      const totalMRP = sorted.reduce((s, o) => s + o.total_mrp, 0);
      const totalTarget = sorted.reduce((s, o) => s + o.target, 0);
      const totalAchievement = totalTarget > 0 ? (totalQty / totalTarget) * 100 : 0;

      setModalSummary({
        totalQuantity: totalQty,
        totalTP,
        totalMRP,
        totalOutlets: sorted.length,
        totalTarget,
        totalAchievement,
      });
    } catch (err) {
      toast.error("Failed to load outlet details");
      if (overrideZone === null) setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFilter = () => {
    if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
      toast.error("Start date cannot be after end date");
      return;
    }
    const params = {};
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else if (month) params.month = month;
    if (selectedZone) params.zone = selectedZone;
    fetchSalesData(params);
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    const current = dayjs().format("YYYY-MM");
    setMonth(current);
    setSelectedZone("");
    fetchSalesData({ month: current });
  };

  const handleExportToExcel = () => {
    const exportData = salesData.map((c) => ({
      Category: c._id,
      "Net Pcs (After Returns)": c.net_quantity,
      "Total TP": c.total_tp.toFixed(2),
      "Total MRP": c.total_mrp.toFixed(2),
    }));
    exportData.push({
      Category: "TOTAL",
      "Net Pcs (After Returns)": summary.totalQuantity,
      "Total TP": summary.totalTP.toFixed(2),
      "Total MRP": summary.totalMRP.toFixed(2),
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Category Wise Sales");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `CategoryWiseSales-Net-${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`);
    toast.success("Exported successfully");
  };

  const handleExportModalToExcel = () => {
    const exportData = modalData.map((o) => ({
      Category: selectedCategory,
      SO: o._id.so,
      Outlet: o._id.outlet,
      "Net Pcs (After Returns)": o.net_quantity,
      "Total TP": o.total_tp.toFixed(2),
      "Total MRP": o.total_mrp.toFixed(2),
      Target: o.target,
      "Achievement %": o.achievement.toFixed(2),
    }));
    exportData.push({
      Category: `${selectedCategory} - TOTAL`,
      SO: "",
      Outlet: "",
      "Net Pcs (After Returns)": modalSummary.totalQuantity,
      "Total TP": modalSummary.totalTP.toFixed(2),
      "Total MRP": modalSummary.totalMRP.toFixed(2),
      Target: modalSummary.totalTarget,
      "Achievement %": modalSummary.totalAchievement.toFixed(2),
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const safeName = selectedCategory.substring(0, 28).replace(/[\\/*?:[\]]/g, "");
    ws["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, safeName || "Sales");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `OutletSales-Net-${selectedCategory}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
    toast.success("Outlet details exported");
  };

  useEffect(() => {
    fetchSalesData({ month });
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 bg-gray-100 min-h-screen w-full">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={24} />
            <h2 className="text-2xl font-semibold">Category-wise Sales Report</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg flex items-center gap-3">
              <ClipboardCheck size={28} className="text-blue-500" />
              <div>
                <p className="text-gray-600 text-sm">Total Categories</p>
                <h3 className="text-lg font-bold">{summary.totalCategories}</h3>
              </div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg flex items-center gap-3">
              <ShoppingCart size={28} className="text-green-500" />
              <div>
                <p className="text-gray-600 text-sm">Net Pcs Sold (After Returns)</p>
                <h3 className="text-lg font-bold">{summary.totalQuantity}</h3>
              </div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg flex items-center gap-3">
              <DollarSign size={28} className="text-yellow-500" />
              <div>
                <p className="text-gray-600 text-sm">Total TP</p>
                <h3 className="text-lg font-bold">{summary.totalTP.toFixed(2)}</h3>
              </div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg flex items-center gap-3">
              <DollarSign size={28} className="text-red-500" />
              <div>
                <p className="text-gray-600 text-sm">Total MRP</p>
                <h3 className="text-lg font-bold">{summary.totalMRP.toFixed(2)}</h3>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="font-medium">Select Month: </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded p-2 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={startDate && endDate}
              />
            </div>
            <div>
              <label className="font-medium">Start Date: </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-2 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-medium">End Date: </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-2 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-medium">Select Zone: </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="border rounded p-2 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Zones</option>
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={handleFilter}>
              Filter Reports
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={handleResetFilters}>
              Reset Filters
            </button>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleExportToExcel}>
              <FileDown size={18} /> Export to Excel
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader color="#4F46E5" size={40} />
              <span className="ml-3 text-gray-600">Loading sales data...</span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : salesData.length === 0 ? (
            <p className="text-center text-gray-500">No sales data found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Category</th>
                    <th className="border p-2 text-center">Net Pcs (After Returns)</th>
                    <th className="border p-2 text-center">Total TP</th>
                    <th className="border p-2 text-center">Total MRP</th>
                    <th className="border p-2 text-center">View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((cat) => (
                    <tr key={cat._id} className="hover:bg-gray-50">
                      <td className="border p-2">{cat._id}</td>
                      <td className="border p-2 text-center cursor-pointer text-blue-600 hover:underline" onClick={() => fetchOutletDetails(cat._id)}>
                        {cat.net_quantity}
                      </td>
                      <td className="border p-2 text-center">{cat.total_tp.toFixed(2)}</td>
                      <td className="border p-2 text-center">{cat.total_mrp.toFixed(2)}</td>
                      <td className="border p-2 text-center">
                        <button className="bg-gray-700 text-white rounded px-2 py-1 hover:bg-gray-800" onClick={() => fetchOutletDetails(cat._id)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">Outlet-wise Sales for: {selectedCategory}</h3>
              <div className="flex gap-2">
                <button onClick={handleExportModalToExcel} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                  Export to Excel
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-4 border-b">
              <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-3">
                <ClipboardCheck size={20} className="text-blue-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total Outlets</p>
                  <h3 className="text-md font-bold">{modalSummary.totalOutlets}</h3>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg flex items-center gap-3">
                <ShoppingCart size={20} className="text-green-500" />
                <div>
                  <p className="text-gray-600 text-xs">Net Pcs Sold (After Returns)</p>
                  <h3 className="text-md font-bold">{modalSummary.totalQuantity}</h3>
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg flex items-center gap-3">
                <DollarSign size={20} className="text-yellow-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total TP</p>
                  <h3 className="text-md font-bold">{modalSummary.totalTP.toFixed(2)}</h3>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg flex items-center gap-3">
                <Target size={20} className="text-purple-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total Target</p>
                  <h3 className="text-md font-bold">{modalSummary.totalTarget}</h3>
                </div>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg flex items-center gap-3">
                <Trophy size={20} className="text-indigo-500" />
                <div>
                  <p className="text-gray-600 text-xs">Achievement</p>
                  <h3 className="text-md font-bold">{modalSummary.totalAchievement.toFixed(2)}%</h3>
                </div>
              </div>
            </div>

            <div className="p-4 border-b flex gap-4 items-end">
              <div>
                <label className="font-medium">Select Zone: </label>
                <select value={modalZone} onChange={(e) => setModalZone(e.target.value)} className="border rounded p-2 ml-2">
                  <option value="">All Zones</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => fetchOutletDetails(selectedCategory, modalZone)}>
                Apply Zone Filter
              </button>
            </div>

            <div className="p-4 text-sm text-gray-600">
              <p>Date Range: {startDate && endDate ? `${dayjs(startDate).format("DD MMM YYYY")} - ${dayjs(endDate).format("DD MMM YYYY")}` : dayjs(month).format("MMMM YYYY")}</p>
              <p>Zone: {modalZone || "All Zones"}</p>
            </div>

            <div className="p-4">
              {modalLoading ? (
                <div className="flex justify-center items-center h-64">
                  <ClipLoader color="#4F46E5" size={40} />
                  <span className="ml-3 text-gray-600">Loading outlet details...</span>
                </div>
              ) : modalData.length === 0 ? (
                <p className="text-center text-gray-500">No outlet data found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left">SO</th>
                        <th className="border p-2 text-left">Outlet</th>
                        <th className="border p-2 text-center">Net Pcs (After Returns)</th>
                        <th className="border p-2 text-center">Total TP</th>
                        <th className="border p-2 text-center">Total MRP</th>
                        <th className="border p-2 text-center">Target</th>
                        <th className="border p-2 text-center">Achievement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((o) => (
                        <tr key={`${o._id.so}-${o._id.outlet}`} className="hover:bg-gray-50">
                          <td className="border p-2">{o._id.so}</td>
                          <td className="border p-2">{o._id.outlet}</td>
                          <td className="border p-2 text-center">{o.net_quantity}</td>
                          <td className="border p-2 text-center">{o.total_tp.toFixed(2)}</td>
                          <td className="border p-2 text-center">{o.total_mrp.toFixed(2)}</td>
                          <td className="border p-2 text-center">{o.target}</td>
                          <td className="border p-2 text-center">
                            <span className={`px-2 py-1 rounded ${o.achievement >= 100 ? "bg-green-100 text-green-800" : o.achievement >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                              {o.achievement.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryWiseSalesReport;