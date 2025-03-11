import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart2 } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";

const ProductWiseSalesReport = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const response = await axios.get("https://gvi-pos-server.vercel.app/api/sales/product-wise");
                setSalesData(response.data);
            } catch (err) {
                setError("Failed to fetch sales data");
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    return (
        <div className="flex">
            {/* Sidebar */}
            <AdminSidebar />    

            {/* Main Content */}
            <div className="p-6 bg-gray-100 min-h-screen w-full">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 size={24} />
                        <h2 className="text-xl font-semibold">Product-wise Sales Report</h2>
                    </div>

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
