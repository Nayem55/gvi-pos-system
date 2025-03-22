import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function OpeningStock({ user, stock, setStock }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [stocks, setStocks] = useState({});
  const [originalStocks, setOriginalStocks] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle product search
  const handleSearch = async (query) => {
    if (query.length > 2) {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/search-product",
          {
            params: { search: query, type: "name" },
          }
        );
        setSearchResults(response.data);

        // Fetch stock data for each product in the search results
        const stockData = {};
        const originalStockData = {};
        const stockRequests = response.data.map(async (product) => {
          try {
            const stockResponse = await axios.get(
              `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${user.outlet}`
            );
            const stockValue = stockResponse.data.stock || 0;
            stockData[product.barcode] = stockValue;
            originalStockData[product.barcode] = stockValue;
          } catch (error) {
            stockData[product.barcode] = 0;
            originalStockData[product.barcode] = 0;
          }
        });

        await Promise.all(stockRequests);
        setStocks((prev) => ({ ...prev, ...stockData }));
        setOriginalStocks((prev) => ({ ...prev, ...originalStockData }));
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]); // Clear search results if query is too short
    }
  };

  // Handle stock input change
  const handleStockChange = (barcode, value) => {
    setStocks((prevStocks) => ({
      ...prevStocks,
      [barcode]: value,
    }));
  };

  // Update stock for a product
  const updateStock = async (barcode) => {
    try {
      await axios.put("https://gvi-pos-server.vercel.app/update-outlet-stock", {
        barcode,
        outlet: user.outlet,
        newStock: stocks[barcode],
      });
      toast.success("Stock updated successfully");
      setOriginalStocks((prev) => ({ ...prev, [barcode]: stocks[barcode] }));
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto bg-gray-100 min-h-screen">
      <div className="flex justify-between bg-white p-4 shadow rounded-lg mb-4">
        <span className="text-sm font-semibold">
          {dayjs().format("DD MMM, YYYY")}
        </span>
        {user && user.outlet && (
          <span className="text-sm font-semibold">
            Outlet Stock: {stock.toLocaleString()}
          </span>
        )}
      </div>

      <div className="bg-white p-4 shadow rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-4">Add Opening Stock</h2>

        {/* Search Box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by product name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleSearch(e.target.value);
            }}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {/* <th className="border p-2">Barcode</th> */}
                <th className="border p-2">Product Name</th>
                <th className="border p-2">Opening Stock</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((product) => (
                <tr key={product.barcode} className="border">
                  {/* <td className="border p-2">{product.barcode}</td> */}
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
                      className="border p-1 w-full text-center"
                    />
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => updateStock(product.barcode)}
                      disabled={originalStocks[product.barcode] > 0}
                      className={`px-3 text-white py-1 rounded-md w-full sm:w-auto ${
                        originalStocks[product.barcode] > 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-gray-800"
                      }`}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}