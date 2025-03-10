import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";

const outlets = [
  "Madina Trade International: New Market",
  "Shamima Akter: New Market",
  "Sheikh Enterprise: Mirpur",
  "Rafi Rafsan Trade International: Mirpur",
  "Aminur Enterprise: Mirpur",
  "Mamun Trade Int.: Mohammadpur",
  "Alok Trade Express: Mohammadpur",
  "S.R Enterprise: Savar",
  "Bismillah Enterprise: Manikgonj",
  "Tasnim Enterprise: Uttara",
  "Juthi Enterprise: Mawna",
  "S.A Enterprise: Mymensingh",
  "Brothers Enterprise: Rajshahi",
  "Ruchita Cosmetics: Khulna",
  "Faruk Traders: Gulshan",
  "Tamim Enterprise: Narayangonj",
  "Maa Enterprise: Joypara Dohar",
  "Usha Enterprise: Barisal",
  "S.M Enterprise: Shibchar",
  "A.C Enterprise: Comilla",
  "Aban Fashion & Accessories: Sylhet",
  "Bismilla Traders: Bondorthila",
  "S.S Distribution: Cox's Bazar",
  "Rahman Enterprise: Chittagong",
];

const ManageStock = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedOutlet, setSelectedOutlet] = useState(user?.outlet || "");
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState(false);


  useEffect(() => {
    if (selectedOutlet) {
      fetchProducts();
    }
  }, [selectedOutlet, page, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let response;
      let fetchedProducts;

      if (searchQuery) {
        response = await axios.get(
          `https://gvi-pos-server.vercel.app/search-product?search=${searchQuery}&type=name`
        );
        fetchedProducts = response.data; // Search API returns a list directly
      } else {
        response = await axios.get(
          `https://gvi-pos-server.vercel.app/products?page=${page}`
        );
        fetchedProducts = response.data.products;
        setTotalPages(response.data.totalPages);
      }

      setProducts(fetchedProducts);

      // Fetch stock for each product
      const stockData = {};
      const stockRequests = fetchedProducts.map(async (product) => {
        try {
          const stockResponse = await axios.get(
            `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${selectedOutlet}`
          );
          stockData[product.barcode] = stockResponse.data.stock || 0;
        } catch (error) {
          console.error(`Error fetching stock for ${product.barcode}:`, error);
          stockData[product.barcode] = 0;
        }
      });

      await Promise.all(stockRequests);
      setStocks(stockData);
    } catch (error) {
      console.error("Error fetching products or stocks:", error);
    }
    setLoading(false);
  };

  const handleStockChange = (barcode, value) => {
    setStocks((prevStocks) => ({
      ...prevStocks,
      [barcode]: value,
    }));
  };

  const updateStock = async (barcode) => {
    setUpdating(true)
    try {
      await axios.put("https://gvi-pos-server.vercel.app/update-outlet-stock", {
        barcode,
        outlet: selectedOutlet,
        newStock: stocks[barcode],
      });
      toast.success("Stock updated successfully");
      setUpdating(false)
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
      setUpdating(false)
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Manage Stock</h2>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <label className="font-medium">Select Outlet: </label>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">Select an outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet} value={outlet}>
                  {outlet}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by product name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded w-64"
            />
            <button
              onClick={() => setSearchQuery(search)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Outlet</th>
                  <th className="border p-2">Barcode</th>
                  <th className="border p-2">Product Name</th>
                  <th className="border p-2">Stock</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.barcode} className="border">
                    <td className="border p-2">{selectedOutlet}</td>
                    <td className="border p-2">{product.barcode}</td>
                    <td className="border p-2">{product.name}</td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={stocks[product.barcode] || 0}
                        onChange={(e) =>
                          handleStockChange(
                            product.barcode,
                            parseInt(e.target.value)
                          )
                        }
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                    <button
                        onClick={() => updateStock(product.barcode)}
                        disabled={updating}
                        className="bg-green-500 text-white px-3 py-1 rounded-md"
                      >
                        {updating ? (
                          <svg
                            className="animate-spin h-5 w-5 text-white"
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        ) : (
                          "Update Stock"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageStock;
