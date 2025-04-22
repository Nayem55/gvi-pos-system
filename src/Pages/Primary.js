import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function Primary({ user, stock, setStock }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Search for products
  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length > 2) {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/search-product",
          { params: { search: query, type: "name" } }
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Add product to cart
  const addToCart = async (product) => {
    const alreadyAdded = cartItems.find(
      (item) => item.barcode === product.barcode
    );
    if (alreadyAdded) {
      toast.error("Already added to cart!");
      return;
    }

    try {
      const stockRes = await axios.get(
        `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${user.outlet}`
      );

      const openingStock = stockRes.data.stock || 0;

      setCartItems((prev) => [
        ...prev,
        {
          ...product,
          openingStock,
          primary: 0,
        },
      ]);
    } catch (err) {
      console.error("Stock fetch error:", err);
      toast.error("Failed to fetch stock.");
    }
  };

  // Update primary value in cart
  const updatePrimaryValue = (barcode, value) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.barcode === barcode
          ? { ...item, primary: parseInt(value) || 0 }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (barcode) => {
    setCartItems((prev) => prev.filter((item) => item.barcode !== barcode));
  };

  // Submit all items at once
  const handleSubmit = async () => {
    if (cartItems.length === 0) return;

    const hasInvalid = cartItems.some((item) => item.primary <= 0);
    if (hasInvalid) {
      toast.error("All items must have valid quantity.");
      return;
    }

    setSubmitting(true);

    const formattedDateTime = dayjs(selectedDate + " " + dayjs().format("HH:mm:ss")).format("YYYY-MM-DD HH:mm:ss");

    try {
      const requests = cartItems.map(async (item) => {
        const newStock = item.openingStock + item.primary;

        // Update stock
        await axios.put(
          "https://gvi-pos-server.vercel.app/update-outlet-stock",
          {
            barcode: item.barcode,
            outlet: user.outlet,
            newStock,
          }
        );

        // Log transaction
        await axios.post(
          "https://gvi-pos-server.vercel.app/stock-transactions",
          {
            barcode: item.barcode,
            outlet: user.outlet,
            type: "primary",
            quantity: item.primary,
            date: formattedDateTime,
            user: user.name,
          }
        );
      });

      await Promise.all(requests);
      toast.success("All primary stocks updated!");
      setCartItems([]);
      setSearch("");
      setSearchResults([]);
    } catch (err) {
      console.error("Bulk update error:", err);
      toast.error("Failed to update stock.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 w-full max-w-xl mx-auto bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow rounded-lg mb-4">
        <div className="flex items-center">
          {/* <label className="font-semibold">Date</label> */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        {user?.outlet && (
          <span className="text-sm font-semibold ">
            Stock (DP): {stock.toLocaleString()}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="rounded-lg mb-4">
        <input
          type="text"
          placeholder="Search product name"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 rounded w-full"
        />

        {/* Search Results */}
        {searchResults.length > 0 && (
          <ul className="mt-2 border rounded max-h-48 overflow-y-auto">
            {searchResults.map((product) => (
              <li
                key={product.barcode}
                onClick={() => addToCart(product)}
                className="p-2 hover:bg-gray-100 cursor-pointer border-b"
              >
                {product.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cart Table */}
      {cartItems.length > 0 && (
        <div className="bg-white p-4 shadow rounded-lg mb-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Primary Voucher</h2>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">Opening</th>
                <th className="border p-2">DP Value</th>
                <th className="border p-2">Primary</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.barcode}>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.openingStock}</td>
                  <td className="border p-2">
                    {(item.openingStock * (item.promoDP || item.dp)).toFixed(2)}
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.primary}
                      onChange={(e) =>
                        updatePrimaryValue(item.barcode, e.target.value)
                      }
                      className="border p-1 w-full text-center"
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => removeFromCart(item.barcode)}
                      className="text-red-500 text-lg"
                      title="Remove"
                    >
                      <svg
                        className="w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                      >
                        <path
                          fill="#FD0032"
                          d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total DP Value */}
          <div className="text-right font-semibold mt-4">
            Total DP:{" "}
            {cartItems
              .reduce(
                (acc, item) => acc + item.primary * (item.promoDP || item.dp),
                0
              )
              .toFixed(2)}
          </div>

          {/* Submit All */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            {submitting ? "Processing..." : "Add Primary"}
          </button>
        </div>
      )}
    </div>
  );
}
