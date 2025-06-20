import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart2,
  ClipboardCheck,
  ShoppingCart,
  DollarSign,
  X,
} from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

const CategoryWiseSalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState({
    totalCategories: 0,
    totalQuantity: 0,
    totalTP: 0,
    totalMRP: 0,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [modalSummary, setModalSummary] = useState({
    totalQuantity: 0,
    totalTP: 0,
    totalMRP: 0,
    totalOutlets: 0,
  });

  const fetchSalesData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/sales/category-wise",
        { params }
      );
      setSalesData(response.data);

      const totalCategories = response.data.length;
      const totalQuantity = response.data.reduce(
        (acc, cat) => acc + cat.total_quantity,
        0
      );
      const totalTP = response.data.reduce((acc, cat) => acc + cat.total_tp, 0);
      const totalMRP = response.data.reduce(
        (acc, cat) => acc + cat.total_mrp,
        0
      );

      setSummary({ totalCategories, totalQuantity, totalTP, totalMRP });
    } catch (err) {
      setError("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutletDetails = async (category) => {
    try {
      setModalLoading(true);
      setSelectedCategory(category);
      const params = {};

      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (month) {
        params.month = month;
      }

      params.category = category;

      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/sales/category-wise/outlet-details",
        { params }
      );

      setModalData(response.data);

      // Calculate modal summary
      const totalQuantity = response.data.reduce(
        (sum, outlet) => sum + outlet.total_quantity,
        0
      );
      const totalTP = response.data.reduce(
        (sum, outlet) => sum + outlet.total_tp,
        0
      );
      const totalMRP = response.data.reduce(
        (sum, outlet) => sum + outlet.total_mrp,
        0
      );
      const totalOutlets = response.data.length;

      setModalSummary({ totalQuantity, totalTP, totalMRP, totalOutlets });
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching outlet details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData({ month });
  }, []);

  const handleFilter = () => {
    const params = {};
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else if (month) {
      params.month = month;
    }
    fetchSalesData(params);
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setMonth(dayjs().format("YYYY-MM"));
    fetchSalesData({ month: dayjs().format("YYYY-MM") });
  };

  const handleExportToExcel = () => {
    const exportData = salesData.map((category) => ({
      Category: category._id,
      "Total PCS": category.total_quantity,
      "Total TP": category.total_tp,
      "Total MRP": category.total_mrp,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Category Wise Sales");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `CategoryWiseSales-${dayjs().format(
      "YYYY-MM-DD_HH-mm"
    )}.xlsx`;
    saveAs(fileData, fileName);
  };

  const handleExportModalToExcel = () => {
    try {
      const exportData = modalData.map((outlet) => ({
        Category: selectedCategory, // Add category column
        Outlet: outlet._id,
        "PCS Sold": outlet.total_quantity,
        "Total TP": outlet.total_tp,
        "Total MRP": outlet.total_mrp,
      }));

      // Add summary row with category info
      exportData.push({
        Category: `${selectedCategory} - TOTAL`,
        Outlet: "",
        "PCS Sold": modalSummary.totalQuantity,
        "Total TP": modalSummary.totalTP,
        "Total MRP": modalSummary.totalMRP,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();

      // Create safe sheet name
      const sheetName = `Sales-${selectedCategory}`
        .substring(0, 28)
        .replace(/[\\/*?:[\]]/g, "")
        .trim();

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Auto-size columns
      const wscols = [
        { wch: Math.max(20, selectedCategory.length + 5) }, // Category column
        { wch: 20 }, // Outlet column
        { wch: 10 }, // PCS Sold
        { wch: 15 }, // Total TP
        { wch: 15 }, // Total MRP
      ];
      worksheet["!cols"] = wscols;

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileName = `OutletSales-${selectedCategory}-${dayjs().format(
        "YYYY-MM-DD"
      )}.xlsx`;

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, fileName);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 bg-gray-100 min-h-screen w-full">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={24} />
            <h2 className="text-2xl font-semibold">
              Category-wise Sales Report
            </h2>
          </div>

          {/* Summary Cards */}
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
                <p className="text-gray-600 text-sm">Total PCS Sold</p>
                <h3 className="text-lg font-bold">{summary.totalQuantity}</h3>
              </div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg flex items-center gap-3">
              <DollarSign size={28} className="text-yellow-500" />
              <div>
                <p className="text-gray-600 text-sm">Total TP</p>
                <h3 className="text-lg font-bold">
                  {summary.totalTP.toFixed(2)}
                </h3>
              </div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg flex items-center gap-3">
              <DollarSign size={28} className="text-red-500" />
              <div>
                <p className="text-gray-600 text-sm">Total MRP</p>
                <h3 className="text-lg font-bold">
                  {summary.totalMRP.toFixed(2)}
                </h3>
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
                className="border rounded p-2 ml-2"
                disabled={startDate && endDate}
              />
            </div>
            <div>
              <label className="font-medium">Start Date: </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-2 ml-2"
              />
            </div>
            <div>
              <label className="font-medium">End Date: </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-2 ml-2"
              />
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-2"
              onClick={handleFilter}
            >
              Filter Reports
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Category</th>
                  <th className="border p-2 text-center">PCS</th>
                  <th className="border p-2 text-center">Total TP</th>
                  <th className="border p-2 text-center">Total MRP</th>
                  <th className="border p-2 text-center">View Details</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="border p-2">{category._id}</td>
                    <td
                      className="border p-2 text-center cursor-pointer text-blue-600 hover:underline"
                      onClick={() => fetchOutletDetails(category._id)}
                    >
                      {category.total_quantity}
                    </td>
                    <td className="border p-2 text-center">
                      {category.total_tp.toFixed(2)}
                    </td>
                    <td className="border p-2 text-center">
                      {category.total_mrp.toFixed(2)}
                    </td>
                    <td className="border p-2 text-center">
                      <Link
                        className="bg-gray-700 text-white rounded px-2 py-1"
                        to={`/admin/sales-movement/category-wise/detail/${category._id}`}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Outlet Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">
                Outlet-wise Sales for: {selectedCategory}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportModalToExcel}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Export to Excel
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border-b">
              <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-3">
                <ClipboardCheck size={20} className="text-blue-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total Outlets</p>
                  <h3 className="text-md font-bold">
                    {modalSummary.totalOutlets}
                  </h3>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg flex items-center gap-3">
                <ShoppingCart size={20} className="text-green-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total PCS Sold</p>
                  <h3 className="text-md font-bold">
                    {modalSummary.totalQuantity}
                  </h3>
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg flex items-center gap-3">
                <DollarSign size={20} className="text-yellow-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total TP</p>
                  <h3 className="text-md font-bold">
                    {modalSummary.totalTP.toFixed(2)}
                  </h3>
                </div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg flex items-center gap-3">
                <DollarSign size={20} className="text-red-500" />
                <div>
                  <p className="text-gray-600 text-xs">Total MRP</p>
                  <h3 className="text-md font-bold">
                    {modalSummary.totalMRP.toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Date Range Info */}
            <div className="p-4 text-sm text-gray-600">
              <p>
                Date Range:{" "}
                {startDate && endDate
                  ? `${dayjs(startDate).format("DD MMM YYYY")} - ${dayjs(
                      endDate
                    ).format("DD MMM YYYY")}`
                  : month
                  ? dayjs(month).format("MMMM YYYY")
                  : "All time"}
              </p>
            </div>

            <div className="p-4">
              {modalLoading ? (
                <p className="text-center text-gray-500">
                  Loading outlet details...
                </p>
              ) : modalData.length === 0 ? (
                <p className="text-center text-gray-500">
                  No outlet data found
                </p>
              ) : (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 text-left">SO</th>
                      <th className="border p-2 text-left">Outlet</th>
                      <th className="border p-2 text-center">PCS Sold</th>
                      <th className="border p-2 text-center">Total TP</th>
                      <th className="border p-2 text-center">Total MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((outlet) => (
                      <tr key={outlet._id} className="hover:bg-gray-50">
                        <td className="border p-2">{outlet._id.so}</td>
                        <td className="border p-2">{outlet._id.outlet}</td>
                        <td className="border p-2 text-center">
                          {outlet.total_quantity}
                        </td>
                        <td className="border p-2 text-center">
                          {outlet.total_tp.toFixed(2)}
                        </td>
                        <td className="border p-2 text-center">
                          {outlet.total_mrp.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryWiseSalesReport;
