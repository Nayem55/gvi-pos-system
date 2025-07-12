import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { FaFileDownload, FaFileImport } from "react-icons/fa";

export default function MarketReturn({ user, stock, getStockValue }) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Check if promo price is valid based on current date
  const isPromoValid = (product) => {
    if (!product.promoStartDate || !product.promoEndDate) return false;

    const today = dayjs();
    const startDate = dayjs(product.promoStartDate);
    const endDate = dayjs(product.promoEndDate);

    return today.isAfter(startDate) && today.isBefore(endDate);
  };

  // Get the appropriate DP price based on promo validity
  const getCurrentDP = (product) => {
    return isPromoValid(product) ? product.promoDP : product.dp;
  };
  const getCurrentTP = (product) => {
    return isPromoValid(product) ? product.promoTP : product.tp;
  };

  // Handle product search
  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length > 2) {
      setIsLoading(true);
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/search-product",
          { params: { search: query, type: searchType } }
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search products");
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Add product to cart with current stock
  const addToCart = async (product) => {
    const alreadyAdded = cart.find((item) => item.barcode === product.barcode);
    if (alreadyAdded) {
      toast.error("Already added to cart!");
      return;
    }

    try {
      const stockRes = await axios.get(
        `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${user.outlet}`
      );
      const currentStock = stockRes.data.stock.currentStock || 0;
      const currentStockDP = stockRes.data.stock.currentStockValueDP || 0;
      const currentStockTP = stockRes.data.stock.currentStockValueTP || 0;
      const currentDP = getCurrentDP(product);
      const currentTP = getCurrentTP(product);

      setCart((prev) => [
        ...prev,
        {
          ...product,
          openingStock: currentStock,
          marketReturn: 0,
          currentDP,
          currentTP,
          currentStockDP,
          currentStockTP,
          editableDP: currentDP,
          editableTP: currentTP,
          total: 0,
        },
      ]);
      setSearch("");
    } catch (err) {
      console.error("Stock fetch error:", err);
      toast.error("Failed to fetch stock.");
    }
  };

  // Excel Import Functions
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
          // Skip empty rows or instruction rows
          if (!row["Barcode"] && !row["Product Name"]) continue;

          const productResponse = await axios.get(
            "https://gvi-pos-server.vercel.app/search-product",
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
            "https://gvi-pos-server.vercel.app/outlet-stock",
            { params: { barcode: product.barcode, outlet: user.outlet } }
          );

          const currentStock = stockRes.data.stock.currentStock || 0;
          const currentStockDP = stockRes.data.stock.currentStockValueDP || 0;
          const currentStockTP = stockRes.data.stock.currentStockValueTP || 0;
          const currentDP = row["DP"] || getCurrentDP(product);
          const currentTP = row["TP"] || getCurrentTP(product);
          const returnQty = parseInt(row["Return Quantity"] || 0);

          // Validate return quantity doesn't exceed stock
          const validReturnQty = Math.min(returnQty, currentStock);

          setCart((prev) => [
            ...prev.filter((item) => item.barcode !== product.barcode),
            {
              ...product,
              openingStock: currentStock,
              marketReturn: validReturnQty,
              currentDP,
              currentTP,
              currentStockDP,
              currentStockTP,
              editableDP: currentDP,
              editableTP: currentTP,
              total: validReturnQty * currentDP,
            },
          ]);

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
        "Return Quantity": "5",
        DP: "100.00",
        TP: "120.00",
      },
      {
        Barcode: "987654321",
        "Product Name": "Another Product",
        "Return Quantity": "3",
        DP: "150.00",
        TP: "180.00",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(demoData);

    // Add instructions as the first row
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "IMPORTANT: Maintain this exact format. Only edit the values (not column names)",
        ],
        ["Barcode and Product Name must match existing products"],
        ["Return Quantity cannot exceed current stock"],
        ["DP/TP are optional - will use current prices if omitted"],
      ],
      { origin: -1 }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Market Returns");
    XLSX.writeFile(workbook, "Market_Returns_Template.xlsx");
  };

  // Update market return value in cart
  const updateMarketReturnValue = (barcode, value) => {
    const returnValue = parseInt(value) || 0;
    setCart((prev) =>
      prev.map((item) =>
        item.barcode === barcode
          ? {
              ...item,
              marketReturn: returnValue,
              total: returnValue * item.editableDP,
            }
          : item
      )
    );
  };

  // Handle price change for DP/TP
  const handlePriceChange = (barcode, field, value) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.barcode === barcode) {
          const newValue = parseFloat(value) || 0;
          return {
            ...item,
            [field]: newValue,
            total:
              field === "editableDP"
                ? newValue * item.marketReturn
                : item.total,
          };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const removeFromCart = (barcode) => {
    setCart((prev) => prev.filter((item) => item.barcode !== barcode));
  };

  // Submit all market returns at once
  const handleSubmit = async () => {
    if (cart.length === 0) return;

    // Validate all market return quantities
    const hasInvalid = cart.some(
      (item) => item.marketReturn <= 0 || item.marketReturn > item.openingStock
    );

    if (hasInvalid) {
      toast.error(
        "All items must have valid return quantity (greater than 0 and not exceeding current stock)"
      );
      return;
    }

    setIsSubmitting(true);

    // Combine selected date with current time
    const formattedDateTime = dayjs(selectedDate).format("YYYY-MM-DD HH:mm:ss");

    try {
      const requests = cart.map(async (item) => {
        // Update stock for market returns
        await axios.put(
          "https://gvi-pos-server.vercel.app/update-outlet-stock",
          {
            barcode: item.barcode,
            outlet: user.outlet,
            newStock: item.openingStock + item.marketReturn,
            currentStockValueDP:
              item.currentStockDP + item.marketReturn * item.editableDP,
            currentStockValueTP:
              item.currentStockTP + item.marketReturn * item.editableTP,
          }
        );

        // Log transaction with selected date
        await axios.post(
          "https://gvi-pos-server.vercel.app/stock-transactions",
          {
            barcode: item.barcode,
            outlet: user.outlet,
            type: "market return",
            asm: user.asm,
            rsm: user.rsm,
            zone: user.zone,
            quantity: item.marketReturn,
            date: formattedDateTime,
            user: user.name,
            userID: user._id,
            dp: item.editableDP,
            tp: item.editableTP,
          }
        );
      });

      await Promise.all(requests);
      toast.success("All market returns processed successfully!");
      getStockValue(user.outlet);
      setCart([]);
      setSearch("");
      setSearchResults([]);
    } catch (err) {
      console.error("Bulk update error:", err);
      toast.error("Failed to process market returns.");
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
          max={dayjs().format("YYYY-MM-DD")}
        />
        {user?.outlet && (
          <span className="text-sm font-semibold">
            <p>Stock (DP): {stock.dp?.toLocaleString()}</p>
            <p>Stock (TP): {stock.tp?.toLocaleString()}</p>
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

      {/* Market Return Table */}
      <div className="bg-white p-4 shadow rounded-lg mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-200">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-center">Stock</th>
                <th className="p-2 text-center">Prices</th>
                <th className="p-2 text-center">Return</th>
                <th className="p-2 text-center">New Stock</th>
                <th className="p-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.barcode} className="border-b">
                  <td className="p-2 text-left break-words max-w-[120px] whitespace-normal">
                    {item.name}
                  </td>
                  <td className="p-2 text-center">{item.openingStock}</td>
                  <td className="p-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number"
                        value={item.editableDP}
                        onChange={(e) =>
                          handlePriceChange(
                            item.barcode,
                            "editableDP",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border rounded text-center text-xs"
                      />
                      <input
                        type="number"
                        value={item.editableTP}
                        onChange={(e) =>
                          handlePriceChange(
                            item.barcode,
                            "editableTP",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border rounded text-center text-xs"
                      />
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      value={item.marketReturn}
                      onChange={(e) =>
                        updateMarketReturnValue(item.barcode, e.target.value)
                      }
                      className="w-full p-1 border rounded text-center"
                      min="0"
                      max={item.openingStock}
                    />
                  </td>
                  <td className="p-2 text-center">
                    {item.openingStock + item.marketReturn}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeFromCart(item.barcode)}
                      className="text-red-500"
                    >
                      <svg
                        className="w-4 h-4 mx-auto"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                      >
                        <path
                          fill="currentColor"
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
          Total: {cart.reduce((sum, item) => sum + item.total, 0).toFixed(2)}{" "}
          BDT
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
