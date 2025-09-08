import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import { toast } from "react-hot-toast";

const DailyReport = () => {
  const { userId } = useParams();
  const { search } = useLocation();

  // Extract query parameters
  const queryParams = new URLSearchParams(search);
  const initialMonth = queryParams.get("month") || dayjs().format("YYYY-MM");
  const initialStartDate = queryParams.get("startDate") || "";
  const initialEndDate = queryParams.get("endDate") || "";

  // UI Input States
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Filtered Values (used when button is clicked)
  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterStartDate, setFilterStartDate] = useState(initialStartDate);
  const [filterEndDate, setFilterEndDate] = useState(initialEndDate);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);

  useEffect(() => {
    // Fetch current user details to check role
    const fetchUserDetails = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("pos-user"));
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details");
      }
    };

    const fetchViewedUser = async () => {
      try {
        setUserLoading(true);
        const response = await axios.get(
          `http://175.29.181.245:5000/getUser/${userId}`
        );
        setViewedUser(response.data);
      } catch (error) {
        console.error("Error fetching viewed user details:", error);
        toast.error("Failed to load viewed user details");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserDetails();
    fetchViewedUser();
  }, [userId]);

  useEffect(() => {
    // Fetch reports even if viewedUser is not available, using user.outlet as fallback
    fetchDailyReports();
  }, [userId, filterMonth, filterStartDate, filterEndDate]);

  const fetchDailyReports = async () => {
    try {
      setLoading(true);
      let params = {};

      if (filterStartDate && filterEndDate) {
        params.startDate = filterStartDate;
        params.endDate = filterEndDate;
      } else {
        params.month = filterMonth;
      }

      const response = await axios.get(
        `http://175.29.181.245:5000/sales-reports/${userId}`,
        { params }
      );
      setReports(
        Array.isArray(response.data) ? response.data : [response.data]
      );
    } catch (error) {
      console.error("Error fetching daily reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductStock = async (barcode) => {
    try {
      const outlet = viewedUser?.outlet || user?.outlet;
      if (!outlet) {
        throw new Error("Outlet information not available");
      }
      const response = await axios.get(
        "http://175.29.181.245:5000/outlet-stock",
        {
          params: { barcode, outlet },
        }
      );
      return response.data.stock || 0;
    } catch (error) {
      console.error("Error fetching stock:", error);
      toast.error("Failed to fetch stock information");
      return 0;
    }
  };

  const handleEditReport = async (report) => {
    try {
      const productsWithOriginalValues = await Promise.all(
        report.products.map(async (product) => {
          const currentStock = await fetchProductStock(product.barcode);
          return {
            ...product,
            originalQuantity: product.quantity,
            originalDP: product.quantity ? product.dp / product.quantity : 0,
            originalTP: product.quantity ? product.tp / product.quantity : 0,
            originalMRP: product.quantity ? product.mrp / product.quantity : 0,
            currentStock,
          };
        })
      );

      setEditingReport({
        ...report,
        products: productsWithOriginalValues,
      });
      setIsEditing(true);
    } catch (error) {
      console.error("Error preparing edit:", error);
      toast.error("Failed to prepare report for editing");
    }
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      const outlet = viewedUser?.outlet || user?.outlet;
      if (!outlet) {
        throw new Error("Outlet information not available");
      }

      const stockUpdates = await Promise.all(
        editingReport.products.map(async (product) => {
          const stockRes = await axios.get(
            "http://175.29.181.245:5000/outlet-stock",
            { params: { barcode: product.barcode, outlet } }
          );

          const currentStock = stockRes.data.stock.currentStock || 0;
          const currentDPValue = stockRes.data.stock.currentStockValueDP || 0;
          const currentTPValue = stockRes.data.stock.currentStockValueTP || 0;

          const quantityChange = product.quantity - product.originalQuantity;
          const dpValueChange =
            product.dp - product.originalQuantity * product.originalDP;
          const tpValueChange =
            product.tp - product.originalQuantity * product.originalTP;

          return {
            barcode: product.barcode,
            newStock: currentStock - quantityChange,
            currentStockValueDP: currentDPValue - dpValueChange,
            currentStockValueTP: currentTPValue - tpValueChange,
          };
        })
      );

      await Promise.all(
        stockUpdates.map(
          ({ barcode, newStock, currentStockValueDP, currentStockValueTP }) => {
            return axios.put("http://175.29.181.245:5000/update-outlet-stock", {
              barcode,
              outlet,
              newStock,
              currentStockValueDP,
              currentStockValueTP,
            });
          }
        )
      );

      const updatedReport = {
        ...editingReport,
        updatedAt: new Date().toISOString(),
      };

      await axios.put(
        `http://175.29.181.245:5000/update-sales-report/${editingReport._id}`,
        updatedReport
      );

      toast.success("Report and stock updated successfully");
      fetchDailyReports();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(error.response?.data?.message || "Failed to update report");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this report? This will restore the stock quantities."
      )
    )
      return;

    try {
      const outlet = viewedUser?.outlet || user?.outlet;
      if (!outlet) {
        throw new Error("Outlet information not available");
      }

      // Fetch the report to validate
      const reportResponse = await axios.get(
        `http://175.29.181.245:5000/sales-reports/report/${reportId}`
      );
      const report = reportResponse.data;

      if (!Array.isArray(report.products)) {
        throw new Error(
          "Invalid report: products array missing or not iterable"
        );
      }

      // Delete the sales report (backend handles stock restoration)
      await axios.delete(
        `http://175.29.181.245:5000/delete-sales-report/${reportId}`
      );

      toast.success(
        "Report deleted and stock quantities restored successfully"
      );
      fetchDailyReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete report"
      );
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...editingReport.products];
    const product = { ...updatedProducts[index] };

    if (field === "quantity") {
      const newQuantity = parseInt(value) || 0;
      // Scale total values using original unit prices
      product.quantity = newQuantity;
      product.dp = newQuantity * (product.originalDP || 0);
      product.tp = newQuantity * (product.originalTP || 0);
      product.mrp = newQuantity * (product.originalMRP || 0);
    } else {
      // Update total value based on user-entered unit price
      const newValue = parseFloat(value) || 0;
      product[field] = newValue * product.quantity;
      // Update original unit price when user manually changes it
      if (field === "dp") product.originalDP = newValue;
      if (field === "tp") product.originalTP = newValue;
      if (field === "mrp") product.originalMRP = newValue;
    }

    updatedProducts[index] = product;

    const total_tp = updatedProducts.reduce(
      (sum, product) => sum + (product.tp || 0),
      0
    );
    const total_dp = updatedProducts.reduce(
      (sum, product) => sum + (product.dp || 0),
      0
    );
    const total_mrp = updatedProducts.reduce(
      (sum, product) => sum + (product.mrp || 0),
      0
    );

    setEditingReport((prev) => ({
      ...prev,
      products: updatedProducts,
      total_tp,
      total_dp,
      total_mrp,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleFieldChange = (field, value) => {
    setEditingReport((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate totals
  const totalMRP = reports.reduce(
    (sum, report) => sum + (report.total_mrp || 0),
    0
  );
  const totalTP = reports.reduce(
    (sum, report) => sum + (report.total_tp || 0),
    0
  );
  const totalProductsSold = reports.reduce(
    (sum, report) =>
      sum +
      report.products.reduce(
        (prodSum, product) => prodSum + (product.quantity || 0),
        0
      ),
    0
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Daily Sales Report
          </h2>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end">
            <div>
              <label className="font-medium">Select Month: </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setStartDate("");
                  setEndDate("");
                }}
                className="border rounded p-2 ml-2"
                disabled={startDate && endDate}
              />
            </div>
            <div>
              <label className="font-medium">Start Date: </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedMonth("");
                }}
                className="border rounded p-2"
              />
            </div>
            <div>
              <label className="font-medium">End Date: </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedMonth("");
                }}
                className="border rounded p-2"
              />
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => {
                setFilterMonth(selectedMonth);
                setFilterStartDate(startDate);
                setFilterEndDate(endDate);
              }}
            >
              Filter Reports
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedMonth(dayjs().format("YYYY-MM"));
                setFilterMonth(dayjs().format("YYYY-MM"));
                setFilterStartDate("");
                setFilterEndDate("");
              }}
            >
              Reset Dates
            </button>
          </div>

          {/* Report Summary */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Report Summary
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex gap-2">
                <span className="text-gray-600">Total Products Sold:</span>
                <span className="font-semibold text-gray-800">
                  {totalProductsSold}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Total MRP:</span>
                <span className="font-semibold text-gray-800">
                  ৳{totalMRP.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Total TP:</span>
                <span className="font-semibold text-gray-800">
                  ৳{totalTP.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Report Table */}
          {loading || userLoading ? (
            <div className="flex justify-center items-center my-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center text-gray-600">
              No sales found for the selected period.
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Daily Sales
              </h3>
              <table className="min-w-full table-auto border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-700">
                      Date
                    </th>
                    <th className="p-4 text-left font-medium text-gray-700">
                      Products Sold
                    </th>
                    <th className="p-4 text-left font-medium text-gray-700">
                      Route
                    </th>
                    <th className="p-4 text-left font-medium text-gray-700">
                      Memo
                    </th>
                    <th className="p-4 text-left font-medium text-gray-700">
                      Total TP
                    </th>
                    {user?.role === "super admin" && (
                      <th className="p-4 text-left font-medium text-gray-700">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-gray-800">
                        {dayjs(report.sale_date).format("YYYY-MM-DD")}
                      </td>
                      <td className="p-4 text-gray-600">
                        {report.products.map((product, productIndex) => (
                          <div key={productIndex}>
                            {product.product_name} (Qty: {product.quantity})
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-gray-800">
                        {report.route || "N/A"}
                      </td>
                      <td className="p-4 text-gray-800">
                        {report.memo || "N/A"}
                      </td>
                      <td className="p-4 text-gray-800">
                        ৳{report.total_tp.toFixed(2)}
                      </td>
                      {user?.role === "super admin" && (
                        <td className="p-4 text-gray-800">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditReport(report)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={userLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={userLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Edit Sales Report
                  </h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateReport} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date & Time
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      {dayjs(editingReport.sale_date).format(
                        "DD MMM YYYY, h:mm A"
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Products
                    </label>
                    <div className="space-y-3">
                      {editingReport.products.map((product, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="font-medium mb-2">
                            {product.product_name}
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            {/* Quantity */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                value={product.quantity}
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border rounded"
                                min="0"
                              />
                            </div>

                            {/* Unit DP */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Unit DP
                              </label>
                              <input
                                type="number"
                                value={
                                  product.quantity
                                    ? (product.dp / product.quantity).toFixed(2)
                                    : 0
                                }
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "dp",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border rounded"
                                step="0.01"
                              />
                            </div>

                            {/* Unit TP */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Unit TP
                              </label>
                              <input
                                type="number"
                                value={
                                  product.quantity
                                    ? (product.tp / product.quantity).toFixed(2)
                                    : 0
                                }
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "tp",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border rounded"
                                step="0.01"
                              />
                            </div>

                            {/* Unit MRP */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Unit MRP
                              </label>
                              <input
                                type="number"
                                value={
                                  product.quantity
                                    ? (product.mrp / product.quantity).toFixed(
                                        2
                                      )
                                    : 0
                                }
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "mrp",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border rounded"
                                step="0.01"
                              />
                            </div>
                          </div>

                          {/* Line Totals */}
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            <div className="bg-gray-100 p-1 rounded text-center">
                              <div>DP: {product.dp.toFixed(2)}</div>
                            </div>
                            <div className="bg-gray-100 p-1 rounded text-center">
                              <div>TP: {product.tp.toFixed(2)}</div>
                            </div>
                            <div className="bg-gray-100 p-1 rounded text-center">
                              <div>MRP: {product.mrp.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-500">Total TP</div>
                      <div className="text-xl font-bold">
                        {editingReport.total_tp.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total DP</div>
                      <div className="text-xl font-bold">
                        {editingReport.total_dp.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white"
                      disabled={userLoading}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
