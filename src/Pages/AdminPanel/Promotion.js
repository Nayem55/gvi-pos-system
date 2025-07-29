import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import { FaSave, FaTrash, FaFileDownload, FaFileImport } from "react-icons/fa";
import * as XLSX from "xlsx";

// Configure dayjs to handle date formats consistently
dayjs.locale("en");

export default function PromotionalPage() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedPromotions, setSelectedPromotions] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let productsData = [];
      let allProductsData = [];

      if (debouncedSearch.trim()) {
        const response = await axios.get(
          `http://192.168.0.30:5000/search-product?search=${debouncedSearch}`
        );
        productsData = response.data;
        setTotalPages(1);
      } else {
        const res = await axios.get(
          `http://192.168.0.30:5000/products?page=${currentPage}`
        );
        const res2 = await axios.get(`http://192.168.0.30:5000/all-products`);
        productsData = res.data.products;
        allProductsData = res2.data;
        setTotalPages(res.data.totalPages);
      }

      setProducts(productsData);
      setAllProducts(allProductsData);

      const initialPromotions = {};
      productsData.forEach((product) => {
        let type = "quantity";
        let promo = null;
        let paid = 0;
        let free = 0;
        let percentage = 0;

        if (product.promoType === "percentage") {
          type = "percentage";
          percentage = product.promoPercentage || 0;
        } else if (product.promoPlan && product.promoPlan !== "None") {
          const [p, f] = product.promoPlan.split("+").map(Number);
          promo = { paid: p, total: p + f };
          paid = p;
          free = f;
        }

        initialPromotions[product._id] = {
          type,
          promo,
          paid,
          free,
          percentage,
          startDate: product.promoStartDate
            ? dayjs(product.promoStartDate).format("YYYY-MM-DD")
            : "",
          endDate: product.promoEndDate
            ? dayjs(product.promoEndDate).format("YYYY-MM-DD")
            : "",
        };
      });

      setSelectedPromotions(initialPromotions);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionChange = (productId, field, value) => {
    setSelectedPromotions((prev) => {
      const current = prev[productId] || {};
      let updated = { ...current };

      if (field === "type") {
        updated = {
          ...updated,
          type: value,
          paid: 0,
          free: 0,
          percentage: 0,
          promo: null,
        };
      } else if (field === "paid" || field === "free") {
        const numValue = parseInt(value) || 0;
        updated = {
          ...updated,
          [field]: numValue,
        };

        if (updated.type === "quantity") {
          const paid = field === "paid" ? numValue : updated.paid;
          const free = field === "free" ? numValue : updated.free;
          updated.promo =
            paid > 0 || free > 0 ? { paid, free, total: paid + free } : null;
        }
      } else if (field === "percentage") {
        updated = {
          ...updated,
          percentage: parseFloat(value) || 0,
        };
      } else {
        updated[field] = value;
      }

      return {
        ...prev,
        [productId]: updated,
      };
    });
  };

  const calculatePromotionalPrice = (original, promotion) => {
    if (!promotion) return original;

    if (promotion.type === "percentage") {
      return (original * (1 - (promotion.percentage || 0) / 100)).toFixed(2);
    }

    if (promotion.type === "quantity" && promotion.promo) {
      if (promotion.promo.paid === 0 || promotion.promo.total === 0) {
        return original;
      }
      return (
        (original * promotion.promo.paid) /
        promotion.promo.total
      ).toFixed(2);
    }

    return original;
  };

  const savePromotion = async (product) => {
    const promotion = selectedPromotions[product._id];
    const promo = promotion?.promo;

    const updatedProduct = {
      ...product,
      promoType: promotion?.type,
      promoPlan:
        promotion.type === "quantity" && promo
          ? `${promo.paid}+${promo.total - promo.paid}`
          : "None",
      promoPercentage:
        promotion.type === "percentage" ? promotion.percentage || 0 : 0,
      promoDP: calculatePromotionalPrice(product.dp, promotion),
      promoTP: calculatePromotionalPrice(product.tp, promotion),
      promoStartDate: promotion?.startDate || null,
      promoEndDate: promotion?.endDate || null,
    };

    try {
      await axios.put(
        `http://192.168.0.30:5000/products/${product._id}`,
        updatedProduct
      );
      toast.success("Promotion saved successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error("Failed to save promotion");
    }
  };

  const removePromotion = async (product) => {
    const updatedProduct = {
      ...product,
      promoType: "none",
      promoPlan: "None",
      promoPercentage: 0,
      promoDP: product.dp,
      promoTP: product.tp,
      promoStartDate: null,
      promoEndDate: null,
    };

    try {
      await axios.put(
        `http://192.168.0.30:5000/products/${product._id}`,
        updatedProduct
      );
      toast.success("Promotion removed successfully!");
      setSelectedPromotions((prev) => ({
        ...prev,
        [product._id]: {
          type: "quantity",
          promo: null,
          paid: 0,
          free: 0,
          percentage: 0,
          startDate: null,
          endDate: null,
        },
      }));
      fetchProducts();
    } catch (error) {
      console.error("Error removing promotion:", error);
      toast.error("Failed to remove promotion");
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
    let successCount = 0;
    let errorCount = 0;
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dateErrors = [];

    for (const [index, row] of data.entries()) {
      try {
        // Skip instruction rows or empty rows
        if (!row["Product ID"] && !row["Product Name"]) continue;

        const product = products.find(
          (p) => p._id === row["Product ID"] || p.name === row["Product Name"]
        );
        if (!product) {
          errorCount++;
          continue;
        }

        // Validate and format dates
        let startDate = "";
        if (row["Start Date"]) {
          if (
            typeof row["Start Date"] === "string" &&
            dateFormatRegex.test(row["Start Date"])
          ) {
            startDate = row["Start Date"];
          } else if (row["Start Date"] instanceof Date) {
            startDate = dayjs(row["Start Date"]).format("YYYY-MM-DD");
          } else {
            throw new Error(
              `Invalid date format for Start Date: ${row["Start Date"]}`
            );
          }
        }

        let endDate = "";
        if (row["End Date"]) {
          if (
            typeof row["End Date"] === "string" &&
            dateFormatRegex.test(row["End Date"])
          ) {
            endDate = row["End Date"];
          } else if (row["End Date"] instanceof Date) {
            endDate = dayjs(row["End Date"]).format("YYYY-MM-DD");
          } else {
            throw new Error(
              `Invalid date format for End Date: ${row["End Date"]}`
            );
          }
        }

        // Validate start date is before end date if both exist
        if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
          throw new Error("Start date must be before end date");
        }

        const promotion = {
          type: row["Promo Type"] || "quantity",
          paid: parseInt(row["Paid Quantity"] || 0),
          free: parseInt(row["Free Quantity"] || 0),
          percentage: parseFloat(row["Percentage"] || 0),
          startDate,
          endDate,
        };

        if (promotion.type === "quantity") {
          promotion.promo = {
            paid: promotion.paid,
            free: promotion.free,
            total: promotion.paid + promotion.free,
          };
        }

        const updatedProduct = {
          ...product,
          promoType: promotion.type,
          promoPlan:
            promotion.type === "quantity" && promotion.promo
              ? `${promotion.paid}+${promotion.free}`
              : "None",
          promoPercentage:
            promotion.type === "percentage" ? promotion.percentage : 0,
          promoDP: calculatePromotionalPrice(product.dp, promotion),
          promoTP: calculatePromotionalPrice(product.tp, promotion),
          promoStartDate: promotion.startDate || null,
          promoEndDate: promotion.endDate || null,
        };

        await axios.put(
          `http://192.168.0.30:5000/products/${product._id}`,
          updatedProduct
        );

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${index + 2}:`, error);
        dateErrors.push(`Row ${index + 2}: ${error.message}`);
        errorCount++;
      }
    }

    if (dateErrors.length > 0) {
      toast.error(
        `Date format errors detected in ${dateErrors.length} rows. Please use YYYY-MM-DD format.`,
        { duration: 5000 }
      );
    }

    return { successCount, errorCount };
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error("Please select a file first");
      return;
    }

    setImportLoading(true);

    try {
      const data = await readExcelFile(importFile);
      const { successCount, errorCount } = await processExcelData(data);

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} promotions`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} promotions`);
      }

      fetchProducts();
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(
        "Failed to process the file. Please check the format and try again."
      );
    } finally {
      setImportLoading(false);
      setImportFile(null);
      document.getElementById("import-file").value = "";
    }
  };

  const downloadDemoFile = () => {
    const demoData = allProducts.map((product) => ({
      "Product ID": product._id,
      "Product Name": product.name,
      "Price DP": product.dp,
      "Price TP": product.tp,
      "Promo Type": "quantity",
      "Paid Quantity": "",
      "Free Quantity": "",
      Percentage: "",
      "Start Date": "",
      "End Date": "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(demoData);

    // Add date format instructions to the worksheet
    if (!worksheet["!cols"]) worksheet["!cols"] = [];
    worksheet["!cols"][6] = {
      // Start Date column (G)
      wch: 12,
      t: "d",
      z: "yyyy-mm-dd", // Excel format code for dates
    };
    worksheet["!cols"][7] = {
      // End Date column (H)
      wch: 12,
      t: "d",
      z: "yyyy-mm-dd",
    };

    // Add instructions as the first row
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "IMPORTANT: Date columns must use YYYY-MM-DD format (e.g., 2023-12-31)",
        ],
      ],
      { origin: -1 }
    );

    // Add example data
    if (allProducts.length > 0) {
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [["", "", "", "", "", "", "2023-12-01", "2023-12-31"]],
        { origin: 1 }
      );
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Promotions");

    // Create a custom date for the filename
    const today = dayjs().format("YYYY-MM-DD");
    XLSX.writeFile(workbook, `Promotions_Template_${today}.xlsx`);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          Promotional Management
        </h2>

        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full max-w-md shadow-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={downloadDemoFile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FaFileDownload /> Download Template
            </button>

            <div className="relative">
              <input
                id="import-file"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="import-file"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer"
              >
                <FaFileImport /> Import Promotions
              </label>
              {/* {importFile && (
                <span className="ml-2 text-sm text-gray-600">{importFile.name}</span>
              )} */}
            </div>

            {importFile && (
              <button
                onClick={handleBulkImport}
                disabled={importLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:bg-gray-400"
              >
                {importLoading ? "Processing..." : "Apply Import"}
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <h3 className="font-medium text-yellow-800">Import Instructions:</h3>
          <ol className="list-decimal pl-5 text-sm text-yellow-700 space-y-1">
            <li>Download the template file to get the correct format</li>
            <li>
              Fill in the promotion details (either Paid+Free quantities or
              Percentage)
            </li>
            <li>
              <strong>Date format must be YYYY-MM-DD (e.g., 2023-12-31)</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>
                  In Excel, right-click the date cell → Format Cells → Custom →
                  Type: yyyy-mm-dd
                </li>
                <li>
                  Or enter dates directly in this format (text format also
                  works)
                </li>
                <li>Example dates are provided in the template</li>
              </ul>
            </li>
            <li>Start date must be before end date</li>
            <li>Do not modify the "Product ID" or "Product Name" columns</li>
            <li>Upload the completed file</li>
          </ol>
        </div>

        <div className="overflow-x-auto shadow-md rounded-lg bg-white">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-center">DP</th>
                <th className="p-3 text-center">TP</th>
                <th className="p-3 text-center">Promo Type</th>
                <th className="p-3 text-center">Promotion</th>
                <th className="p-3 text-center">Promo DP</th>
                <th className="p-3 text-center">Promo TP</th>
                <th className="p-3 text-center">Validity</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-6 text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-6 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const promotion = selectedPromotions[product._id] || {};
                  return (
                    <tr
                      key={product._id}
                      className="border-b hover:bg-gray-50 transition duration-200"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {product.name}
                      </td>
                      <td className="p-3 text-center">{product.dp}</td>
                      <td className="p-3 text-center">{product.tp}</td>
                      <td className="p-3 text-center">
                        <select
                          value={promotion.type}
                          onChange={(e) =>
                            handlePromotionChange(
                              product._id,
                              "type",
                              e.target.value
                            )
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="quantity">Quantity</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        {promotion.type === "quantity" ? (
                          <div className="flex justify-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              value={promotion.paid || ""}
                              onChange={(e) =>
                                handlePromotionChange(
                                  product._id,
                                  "paid",
                                  e.target.value
                                )
                              }
                              className="w-12 text-center border rounded"
                            />
                            <span className="self-center">+</span>
                            <input
                              type="number"
                              min="0"
                              value={promotion.free || ""}
                              onChange={(e) =>
                                handlePromotionChange(
                                  product._id,
                                  "free",
                                  e.target.value
                                )
                              }
                              className="w-12 text-center border rounded"
                            />
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={promotion.percentage || ""}
                            onChange={(e) =>
                              handlePromotionChange(
                                product._id,
                                "percentage",
                                e.target.value
                              )
                            }
                            className="w-16 text-center border rounded"
                            placeholder="%"
                          />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {calculatePromotionalPrice(product.dp, promotion)}
                      </td>
                      <td className="p-3 text-center">
                        {calculatePromotionalPrice(product.tp, promotion)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col space-y-1">
                          <input
                            type="date"
                            value={promotion.startDate || ""}
                            onChange={(e) =>
                              handlePromotionChange(
                                product._id,
                                "startDate",
                                e.target.value
                              )
                            }
                            className="text-sm p-1 border rounded"
                          />
                          <input
                            type="date"
                            value={promotion.endDate || ""}
                            onChange={(e) =>
                              handlePromotionChange(
                                product._id,
                                "endDate",
                                e.target.value
                              )
                            }
                            className="text-sm p-1 border rounded"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => savePromotion(product)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center space-x-1"
                          >
                            <FaSave />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => removePromotion(product)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center space-x-1"
                          >
                            <FaTrash />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!debouncedSearch && !loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-200 rounded">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
