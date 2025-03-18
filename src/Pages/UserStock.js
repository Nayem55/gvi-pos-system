import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ManageUserStock = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedOutlet, setSelectedOutlet] = useState(user?.outlet || "");
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState({});
  const [originalStocks, setOriginalStocks] = useState({}); // Store initial stocks
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
        fetchedProducts = response.data;
      } else {
        response = await axios.get(
          `https://gvi-pos-server.vercel.app/products?page=${page}`
        );
        fetchedProducts = response.data.products;
        setTotalPages(response.data.totalPages);
      }

      setProducts(fetchedProducts);

      const stockData = {};
      const originalStockData = {};

      const stockRequests = fetchedProducts.map(async (product) => {
        try {
          const stockResponse = await axios.get(
            `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${selectedOutlet}`
          );
          const stockValue = stockResponse.data.stock || 0;
          stockData[product.barcode] = stockValue;
          originalStockData[product.barcode] = stockValue; // Store original stock
        } catch (error) {
          console.error(`Error fetching stock for ${product.barcode}:`, error);
          stockData[product.barcode] = 0;
          originalStockData[product.barcode] = 0;
        }
      });

      await Promise.all(stockRequests);
      setStocks(stockData);
      setOriginalStocks(originalStockData); // Save original stocks
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
    setUpdating(true);
    try {
      await axios.put("https://gvi-pos-server.vercel.app/update-outlet-stock", {
        barcode,
        outlet: selectedOutlet,
        newStock: stocks[barcode],
      });
  
      toast.success("Stock updated successfully");
  
      setOriginalStocks((prevOriginalStocks) => ({
        ...prevOriginalStocks,
        [barcode]: stocks[barcode],
      }));
  
      setUpdating(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
      setUpdating(false);
    }
  };
  

  return (
    <div className="flex sm:p-10 p-4">
      <div className="w-full">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-left sm:text-left">
            Manage Stock: {selectedOutlet}
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by product name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded w-full sm:w-64"
            />
            <button
              onClick={() => setSearchQuery(search)}
              className="bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border p-2">Barcode</th>
                    <th className="border p-2">Product Name</th>
                    <th className="border p-2">Opening Stock</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.barcode} className="border">
                      <td className="border p-2">{product.barcode}</td>
                      <td className="border p-2">{product.name}</td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={stocks[product.barcode]}
                          onChange={(e) =>
                            handleStockChange(
                              product.barcode,
                              parseInt(e.target.value)
                            )
                          }
                          className="border p-1 w-full text-center"
                        />
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => updateStock(product.barcode)}
                          disabled={originalStocks[product.barcode] > 0 || updating} 
                          className={`px-3 py-1 rounded-md w-full sm:w-auto ${
                            originalStocks[product.barcode] > 0 || updating
                              ? "bg-gray-400 cursor-not-allowed text-white"
                              : "bg-green-500 hover:bg-gray-800 text-white"
                          }`}
                        >
                          {updating ? (
                            <svg
                              className="animate-spin h-5 w-5 text-white mx-auto"
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
                            "Update"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-4 justify-center">
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

export default ManageUserStock;
