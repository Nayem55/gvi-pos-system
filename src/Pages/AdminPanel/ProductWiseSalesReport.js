import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart2 } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import dayjs from "dayjs";

const ProductWiseSalesReport = () => {
    const [salesData, setSalesData] = useState([]);
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
        } catch (err) {
            setError("Failed to fetch sales data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesData({ month }); // Fetch initial month-wise data
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

    return (
        <div className="flex">
            <AdminSidebar />    
            <div className="p-6 bg-gray-100 min-h-screen w-full">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 size={24} />
                        <h2 className="text-xl font-semibold">Product-wise Sales Report</h2>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 flex gap-4 items-end">
                        <div>
                            <label className="font-medium">Select Month: </label>
                            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded p-2 ml-2" disabled={startDate && endDate} />
                        </div>
                        <div>
                            <label className="font-medium">Start Date: </label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded p-2" />
                        </div>
                        <div>
                            <label className="font-medium">End Date: </label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded p-2"/>
                        </div>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={handleFilter}>Filter Reports</button>
                        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={handleResetFilters}>Reset Filters</button>
                    </div>

                    {/* Sales Report Table */}
                    {loading ? (
                        <p className="text-center text-gray-500">Loading sales data...</p>
                    ) : error ? (
                        <p className="text-center text-red-500">{error}</p>
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductWiseSalesReport;