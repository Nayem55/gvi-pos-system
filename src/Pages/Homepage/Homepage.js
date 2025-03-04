import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";

export default function TodaysSale() {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name"); // Default search type is 'name'
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart")) || []);
  const [stock, setStock] = useState(500);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Search products from the backend based on search type
  const handleSearch = async (query) => {
    if (query) {
      setIsLoading(true);
      try {
        const response = await axios.get("https://gvi-pos-server.vercel.app/search-product", {
          params: { search: query, type: searchType }, // Send search type with the query
        });
        setSearchResults(response.data); // Set search results from the server
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]); // Clear search results if search is empty
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, pcs: item.pcs + 1, total: (item.pcs + 1) * item.mrp }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, pcs: 1, total: product.mrp }]);
    }
    setSearch(""); // Clear search when product is added to cart
    setSearchResults([]); // Clear search results
  };

  const updateQuantity = (id, change) => {
    setCart(
      cart.map((item) =>
        item._id === id
          ? {
              ...item,
              pcs: Math.max(1, item.pcs + change),
              total: Math.max(1, item.pcs + change) * item.mrp,
            }
          : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const handleSubmit = () => {
    const totalSold = cart.reduce((sum, item) => sum + item.pcs, 0);
    setStock((prevStock) => Math.max(0, prevStock - totalSold));
    setCart([]);
    localStorage.removeItem("cart");
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto bg-gray-100 min-h-screen">
      {/* Date & Outlet Stock */}
      <div className="flex justify-between bg-white p-4 shadow rounded-lg mb-4">
        <span className="text-sm font-semibold">{dayjs().format("DD MMM, YYYY")}</span>
        <span className="text-sm font-semibold">Outlet Stock: {stock}</span>
      </div>

      {/* Search Box */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleSearch(e.target.value); // Trigger search on input change
          }}
          placeholder="Search product..."
          className="w-full p-2 border rounded-lg"
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="absolute right-[1px] top-[2px] p-[7px] bg-white border rounded-lg"
        >
          <option value="name">By Name</option>
          <option value="barcode">By Barcode</option>
        </select>
        {search && (
          <ul className="absolute bg-white w-full border rounded-lg mt-1 shadow">
            {isLoading ? (
              <li className="p-2">Loading...</li>
            ) : (
              searchResults.map((p) => (
                <li
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                >
                  {p.name}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white p-4 shadow rounded-lg mb-4">
        <table className="w-full text-sm table-fixed border-collapse">
          <thead>
            <tr className="border-b bg-gray-200">
              <th className="p-2 w-2/6 text-left">Product</th>
              <th className="p-2 w-1/6">Pcs</th>
              <th className="p-2 w-1/6">MRP</th>
              <th className="p-2 w-1/6">TP</th>
              <th className="p-2 w-1/6">Total</th>
              <th className="p-2 w-1/6"></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item._id} className="border-b">
                <td className="p-2 w-2/6 text-left break-words whitespace-normal">{item.name}</td>

                <td className="p-2 w-1/6">
                  <div className="flex flex-col-reverse justify-center items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item._id, -1)}
                      className="bg-gray-900 text-white font-bold rounded h-6 w-6"
                    >
                      -
                    </button>
                    <span className="px-2">{item.pcs}</span>
                    <button
                      onClick={() => updateQuantity(item._id, 1)}
                      className="bg-[#F16F24] text-white font-bold rounded h-6 w-6"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-2 w-1/6 text-center">{item.mrp} BDT</td>
                <td className="p-2 w-1/6 text-center">{item.tp} BDT</td>
                <td className="p-2 w-1/6 text-center">{item.total} BDT</td>
                <td className="p-2 w-1/6 text-center">
                  <button onClick={() => removeFromCart(item._id)} className="mt-1 rounded">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                      <path fill="#FD0032" d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overall Total & Submit Button */}
      <div className="flex justify-between items-center bg-white p-4 shadow rounded-lg">
        <span className="text-lg font-bold">
          Total: {cart.reduce((sum, item) => sum + item.total, 0)} BDT
        </span>
        <button
          onClick={handleSubmit}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg"
        >
          Submit
        </button>
      </div>
    </div>
  );
}


// https://gvi-pos-server.vercel.app/