import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminSidebar from "../Component/AdminSidebar";

const SlabDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
    setFilteredCustomers(filtered);
  }, [roleFilter, zoneFilter, customers]);

  const getSlab = (lifetimeQuantity = 0) => {
    if (lifetimeQuantity >= 800) return "Slab 8";
    if (lifetimeQuantity >= 400) return "Slab 7";
    if (lifetimeQuantity >= 192) return "Slab 6";
    if (lifetimeQuantity >= 96) return "Slab 5";
    if (lifetimeQuantity >= 48) return "Slab 4";
    if (lifetimeQuantity >= 24) return "Slab 3";
    if (lifetimeQuantity >= 12) return "Slab 2";
    if (lifetimeQuantity >= 6) return "Slab 1";
    return "No Slab";
  };

  const handleRoleChange = (e) => setRoleFilter(e.target.value);
  const handleZoneChange = (e) => setZoneFilter(e.target.value);

  const uniqueRoles = [
    "All",
    ...new Set(customers.map((c) => c.so_role).filter(Boolean)),
  ];
  const uniqueZones = [
    "All",
    ...new Set(customers.map((c) => c.so_zone).filter(Boolean)),
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCustomers.map((customer) => ({
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
        "Earned Slab": customer.current_slab || getSlab(customer.lifetime_quantity),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Summary");
    XLSX.writeFile(workbook, "Customer_Summary_Lifetime.xlsx");
  };

  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCustomer(null);
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
        </div>

        <div className="mb-4 flex justify-end gap-4">
          <button
            onClick={exportToExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow-md transition"
          >
            Export to Excel
          </button>
          {selectedCustomer && (
            <button
              onClick={() => openModal(selectedCustomer)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded shadow-md transition"
            >
              Slabs
            </button>
          )}
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
                  <th className="p-3 text-left">Achieved Slab</th>
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
                      <td className="p-3">{customer.lifetime_quantity?.toLocaleString() ?? "0"}</td>
                      <td className="p-3">{customer.current_slab || getSlab(customer.lifetime_quantity)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => openModal(customer)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded transition"
                        >
                          Slabs
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="15" className="p-6 text-center text-gray-500">
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
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Slab History for {selectedCustomer.owner_name}
              </h2>
              <div className="max-h-60 overflow-y-auto">
                {Object.entries(selectedCustomer.slab_history).length > 0 ? (
                  <ul className="text-sm text-gray-700">
                    {Object.entries(selectedCustomer.slab_history).map(([slab, date]) => (
                      <li key={slab} className="mb-2">
                        <span className="font-medium">{slab.replace("slab", "Slab #")}: </span>
                        {date || "No date recorded"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No slab history available.</p>
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