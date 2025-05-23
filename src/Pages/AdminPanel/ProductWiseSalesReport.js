import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart2, FileDown } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ProductWiseSalesReport = () => {
    const [salesData, setSalesData] = useState([]);
    const [summary, setSummary] = useState({ totalSold: 0, totalTP: 0, totalMRP: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchSalesData = async (params) => {
        try {
            setLoading(true);
            const response = await axios.get("https://gvi-pos-server.vercel.app/api/sales/product-wise", { params });
            setSalesData(response.data);
            calculateSummary(response.data);
        } catch (err) {
            setError("Failed to fetch sales data");
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const totalSold = data.reduce((sum, item) => sum + item.total_quantity, 0);
        const totalTP = data.reduce((sum, item) => sum + item.total_tp, 0);
        const totalMRP = data.reduce((sum, item) => sum + item.total_mrp, 0);
        setSummary({ totalSold, totalTP, totalMRP });
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
        const currentMonth = dayjs().format("YYYY-MM");
        setMonth(currentMonth);
        fetchSalesData({ month: currentMonth });
    };

    const handleExportToExcel = () => {
        const dataToExport = salesData.map((product) => ({
            "Product Name": product._id,
            "Barcode": product.barcode || "N/A",
            "Total Sold (PCS)": product.total_quantity,
            "Total TP": product.total_tp,
            "Total MRP": product.total_mrp,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(fileData, `ProductWiseSalesReport-${dayjs().format("YYYY-MM-DD")}.xlsx`);
    };

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="p-6 bg-gray-100 min-h-screen w-full">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 size={24} />
                        <h2 className="text-xl font-semibold">Product-wise Sales Report</h2>
                    </div>

                    {/* Summary Report */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-100 p-4 rounded-lg text-center shadow-md">
                            <h3 className="text-lg font-semibold text-blue-800">Total Sales</h3>
                            <p className="text-2xl font-bold">{summary.totalSold} PCS</p>
                        </div>
                        <div className="bg-green-100 p-4 rounded-lg text-center shadow-md">
                            <h3 className="text-lg font-semibold text-green-800">Total TP</h3>
                            <p className="text-2xl font-bold">৳{summary.totalTP.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-100 p-4 rounded-lg text-center shadow-md">
                            <h3 className="text-lg font-semibold text-red-800">Total MRP</h3>
                            <p className="text-2xl font-bold">৳{summary.totalMRP}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="font-medium">Select Month: </label>
                            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded p-2 ml-2" disabled={startDate && endDate} />
                        </div>
                        <div>
                            <label className="font-medium">Start Date: </label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded p-2 ml-2" />
                        </div>
                        <div>
                            <label className="font-medium">End Date: </label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded p-2 ml-2" />
                        </div>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-2" onClick={handleFilter}>Filter Reports</button>
                        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={handleResetFilters}>Reset Filters</button>
                        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto" onClick={handleExportToExcel}>
                            <FileDown size={18} /> Export to Excel
                        </button>
                    </div>

                    {/* Sales Report Table */}
                    {loading ? (
                        <p className="text-center text-gray-500">Loading sales data...</p>
                    ) : error ? (
                        <p className="text-center text-red-500">{error}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border p-2 text-left">Product Name</th>
                                        <th className="border p-2 text-left">Barcode</th>
                                        <th className="border p-2 text-center">Total Sold (PCS)</th>
                                        <th className="border p-2 text-center">Total TP</th>
                                        <th className="border p-2 text-center">Total MRP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesData.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50">
                                            <td className="border p-2">{product._id}</td>
                                            <td className="border p-2">{product.barcode || "N/A"}</td>
                                            <td className="border p-2 text-center">{product.total_quantity}</td>
                                            <td className="border p-2 text-center">৳{product.total_tp}</td>
                                            <td className="border p-2 text-center">৳{product.total_mrp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductWiseSalesReport;
