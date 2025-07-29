import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { FaFileDownload, FaFileImport } from "react-icons/fa";

export default function Secondary({ user, stock, setStock, getStockValue }) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name");
  // const [cart, setCart] = useState(
  //   () => JSON.parse(localStorage.getItem("cart")) || []
  // );
  const [cart, setCart] = useState([]);
  const [route, setRoute] = useState("");
  const [menu, setMenu] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  // useEffect(() => {
  //   localStorage.setItem("cart", JSON.stringify(cart));
  // }, [cart]);

  const isPromoValid = (product) => {
    if (!product.promoStartDate || !product.promoEndDate) return false;

    const today = dayjs();
    const startDate = dayjs(product.promoStartDate);
    const endDate = dayjs(product.promoEndDate);

    return today.isAfter(startDate) && today.isBefore(endDate);
  };

  const getCurrentTP = (product) => {
    return isPromoValid(product) ? product.promoTP : product.tp;
  };

  const getCurrentDP = (product) => {
    return isPromoValid(product) ? product.promoDP : product.dp;
  };

  const handleSearch = async (query) => {
    if (query.length > 2) {
      setIsLoading(true);
      try {
        const response = await axios.get(
          "http://192.168.0.30:5000/search-product",
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
      setSearchResults([]);
    }
  };

  const addToCart = async (product) => {
    try {
      const stockResponse = await axios.get(
        "http://192.168.0.30:5000/outlet-stock",
        {
          params: { barcode: product.barcode, outlet: user.outlet },
        }
      );
      const outletStock = stockResponse.data.stock.currentStock;

      if (outletStock === 0) {
        toast.error(`${product.name} is out of stock!`);
        return;
      }

      const currentTP = getCurrentTP(product);
      const currentDP = getCurrentDP(product);

      const productWithStock = {
        ...product,
        stock: outletStock,
        currentTP: currentTP,
        currentDP: currentDP,
        editableTP: currentTP,
        editableDP: currentDP,
      };

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
                    total: (item.pcs + 1) * parseFloat(item.editableTP),
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
            total: parseFloat(currentTP),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching outlet stock:", error);
    }
    setSearch("");
    setSearchResults([]);
  };

  const updateQuantity = (id, change) => {
    setCart(
      cart.map((item) =>
        item._id === id
          ? {
              ...item,
              pcs: Math.max(1, Math.min(item.pcs + change, item.stock)),
              total:
                Math.max(1, Math.min(item.pcs + change, item.stock)) *
                item.editableTP,
            }
          : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const handlePriceChange = (id, field, value) => {
    setCart(
      cart.map((item) => {
        if (item._id === id) {
          const newValue = parseFloat(value) || 0;
          return {
            ...item,
            [field]: newValue,
            total: field === "editableTP" ? newValue * item.pcs : item.total,
          };
        }
        return item;
      })
    );
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("No item selected");
      return;
    }
    try {
      setIsSubmitting(true);

      const saleEntry = {
        user: user._id,
        so: user.name,
        asm: user.asm,
        rsm: user.rsm,
        som: user.som,
        zone: user.zone,
        outlet: user.outlet,
        route: route,
        memo: menu,
        sale_date: dayjs(selectedDate).format("YYYY-MM-DD HH:mm:ss"),
        total_tp: cart.reduce(
          (sum, item) => sum + item.editableTP * item.pcs,
          0
        ),
        total_mrp: cart.reduce((sum, item) => sum + item.mrp * item.pcs, 0),
        total_dp: cart.reduce(
          (sum, item) => sum + item.editableDP * item.pcs,
          0
        ),
        products: cart.map((item) => ({
          product_name: item.name,
          category: item.category,
          brand: item.brand,
          barcode: item.barcode,
          quantity: item.pcs,
          tp: item.editableTP * item.pcs,
          mrp: item.mrp * item.pcs,
          dp: item.editableDP * item.pcs,
        })),
      };

      await axios.post("http://192.168.0.30:5000/add-sale-report", saleEntry);

      const updatePromises = cart.map(async (item) => {
        await axios.post("http://192.168.0.30:5000/stock-transactions", {
          barcode: item.barcode,
          outlet: user.outlet,
          type: "secondary",
          asm: user.asm,
          rsm: user.rsm,
          som: user.som,
          zone: user.zone,
          quantity: item.pcs,
          date: dayjs(selectedDate).format("YYYY-MM-DD HH:mm:ss"),
          user: user.name,
          userID: user._id,
          dp: item.editableDP,
          tp: item.editableTP,
        });
      });

      await Promise.all(updatePromises);

      const totalSold = cart.reduce((sum, item) => sum + item.pcs, 0);
      setStock((prevStock) => Math.max(0, prevStock - totalSold));

      setCart([]);
      // localStorage.removeItem("cart");
      toast.success("Sales report submitted");
      getStockValue(user.outlet);
    } catch (error) {
      console.error("Error updating outlet stock:", error);
      toast.error("Failed to submit sales report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setImportFile(uploadedFile);
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const processExcelData = async (data) => {
    setImportLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of data) {
        try {
          if (!row["Barcode"] && !row["Product Name"]) continue;

          const productResponse = await axios.get(
            "http://192.168.0.30:5000/search-product",
            {
              params: {
                search: row["Barcode"] || row["Product Name"],
                type: "barcode",
              },
            }
          );

          const product = productResponse.data[0];
          if (!product) {
            errorCount++;
            continue;
          }

          const stockRes = await axios.get(
            "http://192.168.0.30:5000/outlet-stock",
            { params: { barcode: product.barcode, outlet: user.outlet } }
          );

          const outletStock = stockRes.data.stock.currentStock || 0;
          const currentTP = row["TP"] || getCurrentTP(product);
          const currentDP = row["DP"] || getCurrentDP(product);
          const quantity = parseInt(row["Quantity"] || 0);

          const validQuantity = Math.min(quantity, outletStock);

          if (validQuantity <= 0) {
            errorCount++;
            continue;
          }

          const existingItemIndex = cart.findIndex(
            (item) => item._id === product._id
          );

          if (existingItemIndex >= 0) {
            const existingItem = cart[existingItemIndex];
            const newQuantity = Math.min(
              existingItem.pcs + validQuantity,
              outletStock
            );

            setCart((prev) =>
              prev.map((item, index) =>
                index === existingItemIndex
                  ? {
                      ...item,
                      pcs: newQuantity,
                      total: newQuantity * item.editableTP,
                    }
                  : item
              )
            );
          } else {
            setCart((prev) => [
              ...prev,
              {
                ...product,
                stock: outletStock,
                currentTP: currentTP,
                currentDP: currentDP,
                editableTP: currentTP,
                editableDP: currentDP,
                pcs: validQuantity,
                total: validQuantity * currentTP,
              },
            ]);
          }

          successCount++;
        } catch (error) {
          console.error(`Error processing row:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Imported ${successCount} products successfully`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} products`);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file");
    } finally {
      setImportLoading(false);
      setImportFile(null);
      document.getElementById("import-file").value = "";
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error("Please select a file first");
      return;
    }
    try {
      const data = await readExcelFile(importFile);
      await processExcelData(data);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import file");
    }
  };

  const downloadDemoFile = () => {
    const demoData = [
      {
        Barcode: "123456789",
        "Product Name": "Sample Product",
        Quantity: "5",
        DP: "100.00",
        TP: "120.00",
      },
      {
        Barcode: "987654321",
        "Product Name": "Another Product",
        Quantity: "3",
        DP: "150.00",
        TP: "180.00",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(demoData);

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "IMPORTANT: Maintain this exact format. Only edit the values (not column names)",
        ],
        ["Barcode and Product Name must match existing products"],
        ["Quantity cannot exceed current stock"],
        ["DP/TP are optional - will use current prices if omitted"],
      ],
      { origin: -1 }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Secondary Sales");
    XLSX.writeFile(workbook, "Secondary_Sales_Template.xlsx");
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
            <p>Stock (DP): {stock.dp?.toFixed(2)}</p>
            <p>Stock (TP): {stock.tp?.toFixed(2)}</p>
          </span>
        )}
      </div>

      {/* Import/Export Controls */}
      <div className="flex gap-4 my-4">
        <button
          onClick={downloadDemoFile}
          className="bg-blue-600 hover:bg-blue-700 w-[200px] font-bold text-white px-3 py-2 rounded flex items-center gap-1 text-sm"
        >
          <FaFileDownload /> Template
        </button>
        <input
          id="import-file"
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label
          htmlFor="import-file"
          className="bg-green-600 hover:bg-green-700 w-[200px] font-bold text-white px-3 py-2 rounded flex items-center gap-1 cursor-pointer text-sm w-full"
        >
          <FaFileImport /> Import
        </label>
        <button
          onClick={handleBulkImport}
          disabled={importLoading || !importFile}
          className="bg-purple-600 hover:bg-purple-700 w-[200px] font-bold text-white px-3 py-2 rounded flex items-center gap-1 text-sm disabled:bg-gray-400"
        >
          {importLoading ? "Processing..." : "Add To Cart"}
        </button>
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
            handleSearch(e.target.value);
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
                  {p.name} {isPromoValid(p) && "(Promo)"}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white p-4 shadow rounded-lg mb-4">
        <div className="overflow-x-hidden w-full">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-200 text-xs">
                <th className="p-2 text-left w-1/3">Product</th>
                <th className="p-2 w-[60px] text-center">Pcs</th>
                <th className="p-2 w-[100px] text-center">Price</th>
                <th className="p-2 w-[60px] text-center">Total (TP)</th>
                <th className="p-2 w-[40px] text-center"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item._id} className="border-b text-xs">
                  <td className="p-2 text-left break-words max-w-[120px] whitespace-normal">
                    {item.name} {item.stock ? `(${item.stock})` : ""}
                  </td>

                  <td className="p-2 text-center">
                    <div className="flex flex-col-reverse justify-center items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="bg-gray-900 text-white text-xs rounded h-5 w-5"
                      >
                        -
                      </button>
                      <span className="text-sm">{item.pcs}</span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="bg-[#F16F24] text-white text-xs rounded h-5 w-5"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="p-1 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number"
                        value={item.editableDP}
                        onChange={(e) =>
                          handlePriceChange(
                            item._id,
                            "editableDP",
                            e.target.value
                          )
                        }
                        className="border rounded px-1 py-0.5 text-center text-xs w-full max-w-[70px]"
                      />
                      <input
                        type="number"
                        value={item.editableTP}
                        onChange={(e) =>
                          handlePriceChange(
                            item._id,
                            "editableTP",
                            e.target.value
                          )
                        }
                        className="border rounded px-1 py-0.5 text-center text-xs w-full max-w-[70px]"
                      />
                    </div>
                  </td>

                  <td className="p-2 text-center text-xs">
                    {(item.editableTP * item.pcs).toFixed(2)}
                  </td>

                  <td className="text-center">
                    <button onClick={() => removeFromCart(item._id)}>
                      <svg
                        className="w-4 h-4 mx-auto"
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
      </div>

      {/* Overall Total & Submit Button */}
      <div className="flex justify-between items-center bg-white p-4 shadow rounded-lg">
        <span className="text-lg font-bold">
          Total (TP) :{" "}
          {cart
            .reduce((sum, item) => sum + item.editableTP * item.pcs, 0)
            .toFixed(2)}{" "}
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
