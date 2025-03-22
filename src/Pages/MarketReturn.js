import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function MarketReturn({ user, stock, setStock }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [marketReturnItems, setMarketReturnItems] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch search results
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

        // Fetch current stock for each product in search results
        const stockData = {};
        const stockRequests = response.data.map(async (product) => {
          try {
            const stockResponse = await axios.get(
              `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${user.outlet}`
            );
            stockData[product.barcode] = {
              openingStock: stockResponse.data.stock || 0, // Current stock
              marketReturn: 0, // Stock to deduct
            };
          } catch (error) {
            stockData[product.barcode] = {
              openingStock: 0,
              marketReturn: 0,
            };
          }
        });

        await Promise.all(stockRequests);
        setMarketReturnItems((prev) => ({ ...prev, ...stockData }));
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]); // Clear search results if query is too short
    }
  };

  // Handle market return input change
  const handleMarketReturnChange = (barcode, value) => {
    setMarketReturnItems((prev) => ({
      ...prev,
      [barcode]: {
        ...prev[barcode],
        marketReturn: parseInt(value) || 0, // Ensure value is a number
      },
    }));
  };

  // Update market return stock
  const handleUpdateStock = async (barcode) => {
    try {
      const { openingStock, marketReturn } = marketReturnItems[barcode];
      const newStock = openingStock - marketReturn; // Deduct market return from opening stock

      await axios.put("https://gvi-pos-server.vercel.app/update-outlet-stock", {
        barcode,
        outlet: user.outlet,
        newStock,
      });

      toast.success("Market return updated successfully!");
      setMarketReturnItems((prev) => ({
        ...prev,
        [barcode]: {
          openingStock: newStock, // Update opening stock to reflect the new total
          marketReturn: 0, // Reset market return input
        },
      }));
    } catch (error) {
      console.error("Error updating market return:", error);
      toast.error("Failed to update market return.");
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
        <h2 className="text-xl font-semibold mb-4">Market Return</h2>

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
                <th className="border p-2">Product Name</th>
                <th className="border p-2">Opening Stock</th>
                <th className="border p-2">Market Return</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((product) => (
                <tr key={product.barcode} className="border">
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">
                    {marketReturnItems[product.barcode]?.openingStock || 0}
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={marketReturnItems[product.barcode]?.marketReturn || 0}
                      onChange={(e) =>
                        handleMarketReturnChange(product.barcode, e.target.value)
                      }
                      className="border p-1 w-full text-center"
                    />
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleUpdateStock(product.barcode)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md w-full"
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