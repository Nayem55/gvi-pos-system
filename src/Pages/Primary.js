import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function Primary({ user, stock, setStock }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [primaryItems, setPrimaryItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState({});
  // const [stock, setStock] = useState(0);

  // useEffect(() => {
  //   if (user && user.outlet) {
  //     getStockValue(user.outlet); // Pass outlet name from the user object
  //   }
  // }, [user]);

  // const getStockValue = async (outletName) => {
  //   try {
  //     const response = await axios.get(
  //       `https://gvi-pos-server.vercel.app/api/stock-value/${outletName}`
  //     );
  //     const stockValue = response.data.totalStockValue;
  //     setStock(stockValue); // Update the stock state with the received value
  //   } catch (error) {
  //     console.error("Error fetching stock value:", error);
  //   }
  // };

  // Fetch search results
  const handleSearch = async (query) => {
    if (query.length > 2) {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/search-product",
          { params: { search: query, type: "name" } }
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
              openingStock: stockResponse.data.stock || 0,
              primary: 0,
            };
          } catch (error) {
            stockData[product.barcode] = { openingStock: 0, primary: 0 };
          }
        });

        await Promise.all(stockRequests);
        setPrimaryItems((prev) => ({ ...prev, ...stockData }));
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Handle primary stock input change
  const handlePrimaryChange = (barcode, value) => {
    setPrimaryItems((prev) => ({
      ...prev,
      [barcode]: {
        ...prev[barcode],
        primary: parseInt(value),
      },
    }));
  };

  // Update primary stock & log transaction
  const handleUpdateStock = async (barcode) => {
    try {
      setUpdating((prev) => ({ ...prev, [barcode]: true }));
      const { openingStock, primary } = primaryItems[barcode];
      if (primary <= 0) {
        toast.error("Enter a valid primary stock quantity.");
        return;
      }

      const newStock = openingStock + primary;

      // Update Outlet Stock
      await axios.put("https://gvi-pos-server.vercel.app/update-outlet-stock", {
        barcode,
        outlet: user.outlet,
        newStock,
      });

      // Store Primary Stock Transaction
      await axios.post("https://gvi-pos-server.vercel.app/stock-transactions", {
        barcode,
        outlet: user.outlet,
        type: "primary",
        quantity: primary,
        date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        user: user.name, // Tracking who performed the transaction
      });

      toast.success("Primary stock updated successfully!");
      setPrimaryItems((prev) => ({
        ...prev,
        [barcode]: { openingStock: newStock, primary: 0 },
      }));
    } catch (error) {
      console.error("Error updating primary stock:", error);
      toast.error("Failed to update primary stock.");
    } finally {
      setUpdating((prev) => ({ ...prev, [barcode]: false }));
    }
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto bg-gray-100 min-h-screen">
      <div className="flex justify-between bg-white p-4 shadow rounded-lg mb-4">
        <span className="text-sm font-semibold">
          {dayjs().format("DD MMM, YYYY")}
        </span>
        {user?.outlet && (
          <span className="text-sm font-semibold">
            Stock (DP) : {stock.toLocaleString()}
          </span>
        )}
      </div>

      <div className="bg-white p-4 shadow rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-4">Primary Stock</h2>

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
                <th className="border p-2">Value (DP)</th>
                <th className="border p-2">Primary</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((product) => (
                <tr key={product.barcode} className="border">
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">
                    {primaryItems[product.barcode]?.openingStock || 0}
                  </td>
                  <td className="border p-2">
                    {primaryItems[product.barcode]?.openingStock * (product.promoDP || product.dp) || 0}
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={primaryItems[product.barcode]?.primary}
                      onChange={(e) =>
                        handlePrimaryChange(product.barcode, e.target.value)
                      }
                      className="border p-1 w-full text-center"
                    />
                  </td>
  
                  <td className="border p-2">
                    <button
                      onClick={() => handleUpdateStock(product.barcode)}
                      disabled={updating[product.barcode]}
                      className={`${
                        updating[product.barcode]
                          ? "bg-gray-400"
                          : "bg-green-500"
                      } text-white px-3 py-1 rounded-md w-full`}
                    >
                      {updating[product.barcode] ? (
                        <div className="animate-spin h-4 w-4 border-t-2 border-white rounded-full mx-auto"></div>
                      ) : (
                        "Update"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
