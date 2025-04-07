import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Secondary({stock,setStock}) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name"); // Default search type is 'name'
  const [cart, setCart] = useState(
    () => JSON.parse(localStorage.getItem("cart")) || []
  );
  // const [stock, setStock] = useState(0);
  const [route, setRoute] = useState("");
  const [menu, setMenu] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD")); // Default to today's date
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("pos-user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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

  // Search products from the backend based on search type
  const handleSearch = async (query) => {
    if (query.length > 2) {
      // Search only if input has more than 2 characters
      setIsLoading(true);
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/search-product",
          {
            params: { search: query, type: searchType },
          }
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]); // Clear search results if less than 3 characters
    }
  };

  const addToCart = async (product) => {
    try {
      // Fetch outlet stock for this product using its barcode and outlet name
      const stockResponse = await axios.get(
        "https://gvi-pos-server.vercel.app/outlet-stock",
        {
          params: { barcode: product.barcode, outlet: user.outlet },
        }
      );
      const outletStock = stockResponse.data.stock;

      // Check if stock is 0, and if so, show an error toast and return
      if (outletStock === 0) {
        toast.error(`${product.name} is out of stock!`);
        return;
      }

      // Append the outlet stock to the product data as a new property
      const productWithStock = { ...product, stock: outletStock };
      const existingItem = cart.find(
        (item) => item._id === productWithStock._id
      );

      if (existingItem) {
        if (existingItem.pcs < outletStock) {
          setCart(
            cart.map((item) =>
              item._id === productWithStock._id
                ? {
                    ...item,
                    pcs: item.pcs + 1,
                    total: (item.pcs + 1) * item.promoTP,
                  }
                : item
            )
          );
        } else {
          toast.error(
            `Cannot add more ${product.name}. Only ${outletStock} left.`
          );
        }
      } else {
        setCart([
          ...cart,
          {
            ...productWithStock,
            pcs: 1,
            total: productWithStock.promoTP,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching outlet stock:", error);
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
              pcs: Math.max(1, Math.min(item.pcs + change, item.stock)), // Ensure pcs is within available stock
              total:
                Math.max(1, Math.min(item.pcs + change, item.stock)) * item.promoTP,
            }
          : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("No item selected");
      return;
    }
    try {
      setIsSubmitting(true);

      // Create a single sale entry with all cart items as an array of products
      const saleEntry = {
        user: user._id,
        outlet: user.outlet,
        route: route,
        menu: menu,
        sale_date: dayjs(selectedDate).format("YYYY-MM-DD HH:mm:ss"), // Use selected date
        total_tp: cart.reduce((sum, item) => sum + item.promoTP * item.pcs, 0),
        total_mrp: cart.reduce((sum, item) => sum + item.mrp * item.pcs, 0),
        products: cart.map((item) => ({
          product_name: item.name,
          category: item.category,
          barcode: item.barcode,
          quantity: item.pcs,
          tp: item.promoTP * item.pcs,
          mrp: item.mrp * item.pcs,
        })),
      };

      // Send the sale entry to the backend
      await axios.post(
        "https://gvi-pos-server.vercel.app/add-sale-report",
        saleEntry
      );

      // Optionally update the stock in the UI
      const totalSold = cart.reduce((sum, item) => sum + item.pcs, 0);
      setStock((prevStock) => Math.max(0, prevStock - totalSold));

      setCart([]);
      localStorage.removeItem("cart");
      toast.success("Sales report submitted");
    } catch (error) {
      console.error("Error updating outlet stock:", error);
      toast.error("Failed to submit sales report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto bg-gray-100 min-h-screen">
      {/* Date & Outlet Stock */}
      <div className="flex justify-between bg-white p-4 shadow rounded-lg mb-4 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-sm font-semibold border rounded p-1"
        />
        {user && user.outlet && (
          <span className="text-sm font-semibold">
          Stock (DP) : {stock.toLocaleString()}
          </span>
        )}
      </div>

      {/* Route & Menu Inputs */}
      <div className="flex justify-between w-[100%] gap-4">
        <input
          onChange={(e) => {
            setRoute(e.target.value);
          }}
          name="route"
          type="text"
          placeholder="Enter route name"
          className="w-[50%] py-1 px-2 rounded my-2 border border-gray-200"
        />
        <input
          onChange={(e) => {
            setMenu(e.target.value);
          }}
          name="memo"
          type="number"
          placeholder="Enter memo count"
          className="w-[50%] py-1 px-2 rounded my-2 border border-gray-200"
        />
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
          className="absolute right-[0px] top-[0px] p-[7px] mt-[1px] mr-[1px] bg-white border rounded-lg"
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
                <td className="p-2 w-2/6 text-left break-words whitespace-normal">
                  {item.name} {item.stock ? `(${item.stock})` : ""}
                </td>
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
                <td className="p-2 w-1/6 text-center">{item.promoTP} BDT</td>
                <td className="p-2 w-1/6 text-center">{item.total} BDT</td>
                <td className="p-2 w-1/6 text-center">
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="mt-1 rounded"
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
      </div>

      {/* Overall Total & Submit Button */}
      <div className="flex justify-between items-center bg-white p-4 shadow rounded-lg">
        <span className="text-lg font-bold">
          Total: {cart.reduce((sum, item) => sum + item.total, 0)} BDT
        </span>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center justify-center w-[140px] h-[40px]"
        >
          {isSubmitting ? (
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
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}