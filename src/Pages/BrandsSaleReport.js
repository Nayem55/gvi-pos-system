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
} from "lucide-react";
import AdminSidebar from "../Component/AdminSidebar";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

const BrandWiseSalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [zones, setZones] = useState([]);
  const [summary, setSummary] = useState({
    totalBrands: 0,
    totalQuantity: 0,
    totalTP: 0,
    totalMRP: 0,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
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
    const fetchTargets = async () => {
      const currentYear = month ? dayjs(month).year() : dayjs().year();
      const currentMonth = month ? dayjs(month).month() + 1 : dayjs().month() + 1;

      try {
        const res = await axios.get("http://175.29.181.245:2001/brandTargets", {
          params: { year: currentYear, month: currentMonth },
        });

        const targetsMap = {};
        res.data.forEach((userDoc) => {
          userDoc.targets.forEach((monthlyTarget) => {
            if (monthlyTarget.year === currentYear && monthlyTarget.month === currentMonth) {
              const brandMap = {};
              monthlyTarget.targets.forEach((target) => {
                brandMap[target.brand] = target.target;
              });
              targetsMap[userDoc.userID] = brandMap;
            }
          });
        });

        setTargetsData(targetsMap);
      } catch (error) {
        console.error("Failed to fetch brand targets:", error);
        toast.error("Failed to load brand targets");
      }
    };

    const fetchZones = async () => {
      try {
        const response = await axios.get("http://175.29.181.245:2001/sales/zone-wise", {
          params: { month },
        });
        const uniqueZones = [...new Set(response.data.map((item) => item._id))].sort();
        setZones(uniqueZones);
      } catch (error) {
        console.error("Failed to fetch zones:", error);
        toast.error("Failed to fetch zones");
      }
    };

    fetchTargets();
    fetchZones();
  }, [month]);

  const fetchSalesData = async (params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://175.29.181.245:2001/sales/brand-wise", {
        params,
      });

      // Deduct market returns from quantity
      const adjustedData = response.data.map((brand) => ({
        ...brand,
        net_quantity: brand.total_quantity - (brand.return_quantity || 0),
      }));

      setSalesData(adjustedData);

      const totalBrands = adjustedData.length;
      const totalQuantity = adjustedData.reduce((acc, brand) => acc + brand.net_quantity, 0);
      const totalTP = adjustedData.reduce((acc, brand) => acc + brand.total_tp, 0);
      const totalMRP = adjustedData.reduce((acc, brand) => acc + brand.total_mrp, 0);

      setSummary({ totalBrands, totalQuantity, totalTP, totalMRP });
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError("Failed to fetch sales data. Please try again.");
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutletDetails = async (brand) => {
    try {
      setModalLoading(true);
      setIsModalOpen(true);
      setSelectedBrand(brand);
      const params = { brand };

      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (month) {
        params.month = month;
      }

      if (selectedZone) {
        params.zone = selectedZone;
      }

      const outletSalesRes = await axios.get(
        "http://175.29.181.245:2001/sales/brand-wise/outlet-details",
        { params }
      );

      const outletSales = outletSalesRes.data;

      if (outletSales.length === 0) {
        toast.warn(`No outlet data found for ${brand}${selectedZone ? ` in zone ${selectedZone}` : ""}`);
      }

      const enhancedOutletData = outletSales.map((outlet) => {
        const userTargets = targetsData[outlet._id.userID] || {};
        const target = userTargets[brand] || 0;

        // Net quantity after deducting market returns
        const net_quantity = outlet.total_quantity - (outlet.return_quantity || 0);
        const achievement = target > 0 ? (net_quantity / target) * 100 : 0;

        return {
          ...outlet,
          net_quantity,
          target,
          achievement,
        };
      });

      setModalData(enhancedOutletData);

      const totalQuantity = enhancedOutletData.reduce((sum, o) => sum + o.net_quantity, 0);
      const totalTP = enhancedOutletData.reduce((sum, o) => sum + o.total_tp, 0);
      const totalMRP = enhancedOutletData.reduce((sum, o) => sum + o.total_mrp, 0);
      const totalOutlets = enhancedOutletData.length;
      const totalTarget = enhancedOutletData.reduce((sum, o) => sum + o.target, 0);
      const totalAchievement = totalTarget > 0 ? (totalQuantity / totalTarget) * 100 : 0;

      setModalSummary({
        totalQuantity,
        totalTP,
        totalMRP,
        totalOutlets,
        totalTarget,
        totalAchievement,
      });
    } catch (err) {
      console.error("Error fetching outlet details:", err);
      toast.error("Failed to load outlet details. Please try again.");
      setIsModalOpen(false);
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
    } else if (month) {
      params.month = month;
    }
    if (selectedZone) {
      params.zone = selectedZone;
    }
    fetchSalesData(params);
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setMonth(dayjs().format("YYYY-MM"));
    setSelectedZone("");
    fetchSalesData({ month: dayjs().format("YYYY-MM") });
  };

  const handleExportToExcel = () => {
    try {
      const exportData = salesData.map((brand) => ({
        Brand: brand._id,
        "Total Pcs (Net)": brand.net_quantity,
        "Total TP": brand.total_tp.toFixed(2),
        "Total MRP": brand.total_mrp.toFixed(2),
      }));

      exportData.push({
        Brand: "TOTAL",
        "Total Pcs (Net)": summary.totalQuantity,
        "Total TP": summary.totalTP.toFixed(2),
        "Total MRP": summary.totalMRP.toFixed(2),
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Brand Wise Sales");

      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const fileName = `BrandWiseSales-Net-${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`;
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
      toast.success("Sales report (Net Pcs) exported successfully");
    } catch (error) {
      console.error("Error exporting sales data:", error);
      toast.error("Failed to export sales data");
    }
  };

  const handleExportModalToExcel = () => {
    try {
      const exportData = modalData.map((outlet) => ({
        Brand: selectedBrand,
        SO: outlet._id.so,
        Outlet: outlet._id.outlet,
        "Pcs Sold (Net)": outlet.net_quantity,
        "Total TP": outlet.total_tp.toFixed(2),
        "Total MRP": outlet.total_mrp.toFixed(2),
        Target: outlet.target,
        "Achievement %": outlet.achievement.toFixed(2),
      }));

      exportData.push({
        Brand: `${selectedBrand} - TOTAL`,
        SO: "",
        Outlet: "",
        "Pcs Sold (Net)": modalSummary.totalQuantity,
        "Total TP": modalSummary.totalTP.toFixed(2),
        "Total MRP": modalSummary.totalMRP.toFixed(2),
        Target: modalSummary.totalTarget.toFixed(2),
        "Achievement %": modalSummary.totalAchievement.toFixed(2),
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      const sheetName = `Sales-${selectedBrand}`.substring(0, 28).replace(/[\\/*?:[\]]/g, "").trim();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      worksheet["!cols"] = [
        { wch: Math.max(20, selectedBrand.length + 5) },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const fileName = `OutletSales-Net-${selectedBrand}-${dayjs().format("YYYY-MM-DD")}.xlsx`;
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
      toast.success("Outlet details (Net Pcs) exported successfully");
    } catch (error) {
      console.error("Error exporting outlet details:", error);
      toast.error("Failed to export outlet details");
    }
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
            <h2 className="text-2xl font-semibold">Brand-wise Sales Report</h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg flex items-center gap-3">
              <ClipboardCheck size={28} className="text-blue-500" />
              <div>
                <p className="text-gray-600 text-sm">Total Brands</p>
                <h3 className="text-lg font-bold">{summary.totalBrands}</h3>
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

          {/* Filter Controls */}
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
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ml-2"
              onClick={handleFilter}
            >
              Filter Reports
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              onClick={handleExportToExcel}
            >
              Export to Excel
            </button>
          </div>

          {/* Main Table */}
          {loading ? (
            <p className="text-center text-gray-500">Loading sales data...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : salesData.length === 0 ? (
            <p className="text-center text-gray-500">No sales data found for the selected filters</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Brand</th>
                    <th className="border p-2 text-center">Net Pcs (After Returns)</th>
                    <th className="border p-2 text-center">Total TP</th>
                    <th className="border p-2 text-center">Total MRP</th>
                    <th className="border p-2 text-center">View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((brand) => (
                    <tr key={brand._id} className="hover:bg-gray-50">
                      <td className="border p-2">{brand._id}</td>
                      <td
                        className="border p-2 text-center cursor-pointer text-blue-600 hover:underline"
                        onClick={() => fetchOutletDetails(brand._id)}
                      >
                        {brand.net_quantity}
                      </td>
                      <td className="border p-2 text-center">{brand.total_tp.toFixed(2)}</td>
                      <td className="border p-2 text-center">{brand.total_mrp.toFixed(2)}</td>
                      <td className="border p-2 text-center">
                        <button
                          className="bg-gray-700 text-white rounded px-2 py-1 hover:bg-gray-800 transition-colors"
                          onClick={() => fetchOutletDetails(brand._id)}
                        >
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

      {/* Outlet Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">
                Outlet-wise Sales for: {selectedBrand}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportModalToExcel}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Export to Excel
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {modalLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading outlet details and targets...</p>
              </div>
            ) : (
              <>
                {/* Modal Summary Cards */}
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

                <div className="p-4 text-sm text-gray-600">
                  <p>
                    Date Range:{" "}
                    {startDate && endDate
                      ? `${dayjs(startDate).format("DD MMM YYYY")} - ${dayjs(endDate).format("DD MMM YYYY")}`
                      : month
                      ? dayjs(month).format("MMMM YYYY")
                      : "All time"}
                  </p>
                  {selectedZone && <p>Zone: {selectedZone}</p>}
                </div>

                <div className="p-4">
                  {modalData.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No outlet data found for {selectedBrand}
                      {selectedZone ? ` in zone ${selectedZone}` : ""}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border p-2 text-left">SO</th>
                            <th className="border p-2 text-left">Outlet</th>
                            <th className="border p-2 text-center">Net Pcs (After Returns)</th>
                            <th className="border p-2 text-center">Total TP</th>
                            <th className="border p-2 text-center">Target</th>
                            <th className="border p-2 text-center">Achievement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalData.map((outlet) => (
                            <tr
                              key={`${outlet._id.so}-${outlet._id.outlet}`}
                              className="hover:bg-gray-50"
                            >
                              <td className="border p-2">{outlet._id.so}</td>
                              <td className="border p-2">{outlet._id.outlet}</td>
                              <td className="border p-2 text-center">{outlet.net_quantity}</td>
                              <td className="border p-2 text-center">{outlet.total_tp.toFixed(2)}</td>
                              <td className="border p-2 text-center">{outlet.target}</td>
                              <td className="border p-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded ${
                                    outlet.achievement >= 100
                                      ? "bg-green-100 text-green-800"
                                      : outlet.achievement >= 80
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {outlet.achievement.toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandWiseSalesReport;