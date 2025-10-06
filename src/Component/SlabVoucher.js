import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SlabVoucher({ stock, setStock }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerNumber, setOwnerNumber] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl1, setImageUrl1] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("pos-user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (search.length > 2) {
        setLoadingSearch(true);
        try {
          const res = await axios.get(
            "http://175.29.181.245:5000/search-product",
            { params: { search, type: "name" } }
          );
          setSearchResults(res.data);
        } catch (err) {
          toast.error("Search failed");
          setSearchResults([]);
        } finally {
          setLoadingSearch(false);
        }
      } else {
        setSearchResults([]);
      }
    };
    fetchSearchResults();
  }, [search]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (ownerNumber.length > 2) {
        setLoadingCustomer(true);
        try {
          const res = await axios.get(
            `http://175.29.181.245:5000/search-customer?search=${ownerNumber}`
          );
          setCustomerSuggestions(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingCustomer(false);
        }
      } else {
        setCustomerSuggestions([]);
      }
    };
    fetchCustomers();
  }, [ownerNumber]);

  const addToCart = (product, pcs) => {
    pcs = parseInt(pcs);
    if (isNaN(pcs)) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (pcs <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === product._id ? { ...item, pcs: existing.pcs + pcs } : item
        )
      );
    } else {
      setCart([...cart, { ...product, pcs }]);
    }

    setQuantities((prev) => ({ ...prev, [product._id]: "" }));
    setSearch("");
    setSearchResults([]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const updateCartQuantity = (id, newQty) => {
    newQty = parseInt(newQty);
    if (isNaN(newQty) || newQty <= 0) {
      toast.error("Enter a valid quantity greater than 0");
      return;
    }

    setCart(
      cart.map((item) =>
        item._id === id ? { ...item, pcs: newQty } : item
      )
    );
  };

  const handleCustomerSelect = (customer) => {
    setOwnerNumber(customer.owner_number);
    setShopName(customer.shop_name);
    setOwnerName(customer.owner_name);
    setShopAddress(customer.shop_address);
    setCustomerSuggestions([]);
  };

  const compressImage = (file, maxWidth, maxHeight, quality) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
              );
            },
            "image/jpeg",
            quality
          );
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleShopImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      toast.loading("Processing image...", { id: "image-upload" });
      const compressedFile = await compressImage(file, 250, 250, 0.7);
      setImageFile(compressedFile);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", "ebay-memo");

      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dodxop7lz/image/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            toast.loading(`Uploading: ${percentCompleted}%`, {
              id: "image-upload",
            });
          },
        }
      );

      toast.success("Image uploaded successfully", { id: "image-upload" });
      setImageUrl(res.data.secure_url);
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed", { id: "image-upload" });
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      toast.loading("Processing image...", { id: "image-upload" });
      const compressedFile = await compressImage(file, 250, 250, 0.7);
      setImageFile(compressedFile);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", "ebay-memo");

      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dodxop7lz/image/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            toast.loading(`Uploading: ${percentCompleted}%`, {
              id: "image-upload",
            });
          },
        }
      );

      toast.success("Image uploaded successfully", { id: "image-upload" });
      setImageUrl1(res.data.secure_url);
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed", { id: "image-upload" });
    }
  };

  const validateForm = () => {
    if (
      !ownerNumber ||
      ownerNumber.length !== 11 ||
      !/^\d{11}$/.test(ownerNumber)
    ) {
      toast.error("Owner number must be exactly 11 digits");
      return false;
    }
    if (!shopName) {
      toast.error("Shop name is required");
      return false;
    }
    if (!ownerName) {
      toast.error("Owner name is required");
      return false;
    }
    if (!shopAddress) {
      toast.error("Shop address is required");
      return false;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty. Please add products.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      toast.loading("Submitting sale...", { id: "sale-submission" });

      const totalQuantity = cart.reduce((sum, item) => sum + item.pcs, 0);
      const saleDateTime = dayjs(selectedDate).format("YYYY-MM-DD HH:mm:ss");

      const payload = {
        user: user._id,
        outlet: user.outlet,
        shop_name: shopName,
        owner_name: ownerName,
        owner_number: ownerNumber,
        shop_address: shopAddress,
        shop_image: imageUrl,
        product_image: imageUrl1 || "",
        sale_date: saleDateTime,
        purchase_quantity: totalQuantity,
        products: cart.map((item) => ({
          product_name: item.name,
          quantity: item.pcs,
        })),
      };

      await axios.post("http://175.29.181.245:5000/add-slab-report", payload);

      await axios.post("http://175.29.181.245:5000/upsert-customer", {
        owner_name: ownerName,
        owner_number: ownerNumber,
        shop_name: shopName,
        shop_address: shopAddress,
        purchase_quantity: totalQuantity,
        purchase_date: saleDateTime,
        dealer_name: user.outlet,
        dealer_id: user._id,
        so_name: user.name,
        so_role: user.role,
        so_zone: user.zone,
        so_number: user.number,
        asm: user.asm || "",
        rsm: user.rsm || "",
        som: user.som || "",
      });

      setCart([]);
      setShopName("");
      setOwnerName("");
      setOwnerNumber("");
      setShopAddress("");
      setImageFile(null);
      setImageUrl("");
      setImageUrl1("");
      setSelectedDate(dayjs().format("YYYY-MM-DD"));
      setSearch("");
      setSearchResults([]);
      setQuantities({});

      toast.success("Sale submitted successfully", { id: "sale-submission" });
    } catch (err) {
      console.error(err);
      toast.error("Submit failed", { id: "sale-submission" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-gray-100 min-h-screen space-y-6">
      <div className="font-bold text-lg text-gray-800">
        <p>SO: {user?.name}</p>
        <p>Dealer: {user?.outlet}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner Number <span className="text-red-500">*</span>
          </label>
          <input
            value={ownerNumber}
            onChange={(e) => setOwnerNumber(e.target.value)}
            placeholder="Enter 11-digit number"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {loadingCustomer && (
          <p className="text-sm text-gray-500">Searching customer...</p>
        )}
        {customerSuggestions.length > 0 && (
          <div className="bg-white rounded-md shadow-md p-2 max-h-40 overflow-y-auto">
            {customerSuggestions.map((customer) => (
              <div
                key={customer._id}
                onClick={() => handleCustomerSelect(customer)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-md border-b"
              >
                <p className="font-medium">{customer.owner_name}</p>
                <p className="text-xs text-gray-600">{customer.shop_name}</p>
                <p className="text-xs text-gray-500">{customer.shop_address}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop Name <span className="text-red-500">*</span>
          </label>
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Enter shop name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner Name <span className="text-red-500">*</span>
          </label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Enter owner name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop Address <span className="text-red-500">*</span>
          </label>
          <input
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            placeholder="Enter shop address"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Products
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {loadingSearch ? (
          <p className="text-center text-gray-500 py-2">Searching...</p>
        ) : searchResults.length > 0 && (
          <div className="bg-white rounded-md shadow-md p-2 mt-2 max-h-40 overflow-y-auto">
            {searchResults.map((product) => {
              const lowerName = product.name;
              const brand = product.brand;
              if (
                lowerName.includes("Layer'r Shot 18ML") ||
                brand !== "Adjavis Venture Ltd."
              )
                return null;
              return (
                <div
                  key={product._id}
                  className="flex items-center justify-between border-b py-2"
                >
                  <p className="font-medium text-sm">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={quantities[product._id] || ""}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product._id]: e.target.value,
                        }))
                      }
                      className="w-16 p-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Qty"
                      min="1"
                    />
                    <button
                      onClick={() =>
                        addToCart(product, quantities[product._id] || 1)
                      }
                      className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded-md shadow-md">
        <h2 className="font-bold text-lg mb-2 text-gray-800">
          Cart <span className="text-red-500">*</span>
        </h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-sm">No items added</p>
        ) : (
          <div>
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center border-b py-2"
              >
                <p className="font-medium text-sm">{item.name}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.pcs}
                    onChange={(e) => updateCartQuantity(item._id, e.target.value)}
                    className="w-16 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                    min={1}
                  />
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path
                        fill="currentColor"
                        d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <p className="text-right font-medium mt-2 text-gray-700">
              Total Qty: {cart.reduce((sum, item) => sum + item.pcs, 0)}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-2 rounded-md text-white font-medium transition-colors ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Sale"
        )}
      </button>
    </div>
  );
}