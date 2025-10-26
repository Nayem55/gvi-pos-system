import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminSidebar from "../Component/AdminSidebar";

const SlabDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [soFilter, setSoFilter] = useState("All"); // New state for SO filter
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://175.29.181.245:5000/customer-sale-summary");
        const data = await response.json();
        console.log("Fetched data:", data); // Debug log
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];
    if (roleFilter !== "All") {
      filtered = filtered.filter((c) => c.so_role === roleFilter);
    }
    if (zoneFilter !== "All") {
      filtered = filtered.filter((c) => c.so_zone === zoneFilter);
    }
    if (soFilter !== "All") {
      filtered = filtered.filter((c) => c.so_name === soFilter); // Apply SO filter
    }
    setFilteredCustomers(filtered);
  }, [roleFilter, zoneFilter, soFilter, customers]); // Added soFilter to dependencies

  const handleRoleChange = (e) => setRoleFilter(e.target.value);
  const handleZoneChange = (e) => setZoneFilter(e.target.value);
  const handleSoChange = (e) => setSoFilter(e.target.value); // Handler for SO filter

  const uniqueRoles = [
    "All",
    ...new Set(customers.map((c) => c.so_role).filter(Boolean)),
  ];
  const uniqueZones = [
    "All",
    ...new Set(customers.map((c) => c.so_zone).filter(Boolean)),
  ];
  const uniqueSoNames = [
    "All",
    ...new Set(customers.map((c) => c.so_name).filter(Boolean)), // Unique SO names
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCustomers.map((customer) => {
        return {
          "Customer Name": customer.owner_name || "-",
          "Customer Phone": customer.owner_number || "-",
          "Shop Name": customer.shop_name || "-",
          "Shop Address": customer.shop_address || "-",
          "Dealer Name": customer.dealer_name || "-",
          "SO Name": customer.so_name || "-",
          Role: customer.so_role || "-",
          Zone: customer.so_zone || "-",
          "SO Number": customer.so_number || "-",
          ASM: customer.asm || "-",
          RSM: customer.rsm || "-",
          SOM: customer.som || "-",
          "Lifetime Quantity": customer.lifetime_quantity || 0,
        };
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Summary");
    XLSX.writeFile(workbook, "Customer_Summary_Lifetime.xlsx");
  };

  const openModal = async (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    try {
      const response = await fetch(
        `http://175.29.181.245:5000/customer-transactions?owner_number=${customer.owner_number}`
      );
      const data = await response.json();
      // Merge transactions by sale_date
      const mergedTransactions = data.reduce((acc, tx) => {
        const saleDate = tx.sale_date.split(' ')[0]; // Extract date part (YYYY-MM-DD)
        const existing = acc.find((t) => t.sale_date === saleDate);
        if (existing) {
          existing.purchase_quantity += tx.purchase_quantity;
          tx.products.forEach((prod) => {
            const existingProd = existing.products.find(
              (p) => p.product_name === prod.product_name
            );
            if (existingProd) {
              existingProd.quantity += prod.quantity;
            } else {
              existing.products.push(prod);
            }
          });
        } else {
          acc.push({
            sale_date: saleDate,
            purchase_quantity: tx.purchase_quantity,
            products: [...tx.products],
          });
        }
        return acc;
      }, []);
      setTransactions(mergedTransactions);
    } catch (error) {
      console.error("Fetch transactions failed", error);
    }
  };

  const closeModal = () => {
    setSelectedCustomer(null);
    setTransactions([]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Lifetime Customer Summary</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-40 rounded border-gray-300 p-2 shadow-sm focus:ring focus:ring-blue-200"
            >
              {uniqueRoles.map((role, idx) => (
                <option key={idx} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Belt</label>
            <select
              value={zoneFilter}
              onChange={handleZoneChange}
              className="w-40 rounded border-gray-300 p-2 shadow-sm focus:ring focus:ring-blue-200"
            >
              {uniqueZones.map((zone, idx) => (
                <option key={idx} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by SO Name</label>
            <select
              value={soFilter}
              onChange={handleSoChange}
              className="w-40 rounded border-gray-300 p-2 shadow-sm focus:ring focus:ring-blue-200"
            >
              {uniqueSoNames.map((soName, idx) => (
                <option key={idx} value={soName}>
                  {soName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 flex justify-end gap-4">
          <button
            onClick={exportToExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow-md transition"
          >
            Export to Excel
          </button>
        </div>

        <div className="overflow-auto bg-white rounded-lg shadow p-4">
          {loading ? (
            <div className="text-center text-gray-500 p-10">Loading...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3 text-left">Customer Shop Name</th>
                  <th className="p-3 text-left">Customer Address</th>
                  <th className="p-3 text-left">Customer Name</th>
                  <th className="p-3 text-left">Customer Phone</th>
                  <th className="p-3 text-left">Dealer Name</th>
                  <th className="p-3 text-left">SO Name</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">SO Zone</th>
                  <th className="p-3 text-left">SO Number</th>
                  <th className="p-3 text-left">ASM</th>
                  <th className="p-3 text-left">RSM</th>
                  <th className="p-3 text-left">SOM</th>
                  <th className="p-3 text-left">Lifetime Quantity</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3">{customer.shop_name || "-"}</td>
                      <td className="p-3">{customer.shop_address || "-"}</td>
                      <td className="p-3">{customer.owner_name || "-"}</td>
                      <td className="p-3">{customer.owner_number || "-"}</td>
                      <td className="p-3">{customer.dealer_name || "-"}</td>
                      <td className="p-3">{customer.so_name || "-"}</td>
                      <td className="p-3">{customer.so_role || "-"}</td>
                      <td className="p-3">{customer.so_zone || "-"}</td>
                      <td className="p-3">{customer.so_number || "-"}</td>
                      <td className="p-3">{customer.asm || "-"}</td>
                      <td className="p-3">{customer.rsm || "-"}</td>
                      <td className="p-3">{customer.som || "-"}</td>
                      <td className="p-3">{customer.lifetime_quantity}</td>
                      <td className="p-3">
                        <button
                          onClick={() => openModal(customer)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="14" className="p-6 text-center text-gray-500">
                      No customers found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {isModalOpen && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px]">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Transaction Details for {selectedCustomer.owner_name}
              </h2>
              <div className="max-h-96 overflow-y-auto">
                {transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <div key={idx} className="mb-4 border-b pb-2 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Invoice Date:</span> {tx.sale_date}
                      </p>
                      <p>
                        <span className="font-medium">Total Quantity:</span> {tx.purchase_quantity}
                      </p>
                      <p className="font-medium">Products:</p>
                      <ul className="list-disc pl-5">
                        {tx.products.map((prod, pidx) => (
                          <li key={pidx}>
                            {prod.product_name}: {prod.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No transactions found.</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlabDashboard;