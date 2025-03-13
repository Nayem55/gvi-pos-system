import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";

const outlets = [
  "Madina Trade International: New Market",
  "Shamima Akter: New Market",
  "Sheikh Enterprise: Mirpur",
  "Rafi Rafsan Trade International: Mirpur",
  "Aminur Enterprise: Mirpur",
  "Mamun Trade Int.: Mohammadpur",
  "Alok Trade Express: Mohammadpur",
  "S.R Enterprise: Savar",
  "Bismillah Enterprise: Manikgonj",
  "Bismillah Enterprise: Manikgonj 2",
  "Tasnim Enterprise: Uttara",
  "Tasnim Enterprise: Uttara 2",
  "Rayhan Enterprise: Uttara",
  "Turin General Store: Tongi",
  "Babul Enterprise: Tongi",
  "M.S Enterprise: Gazipur",
  "Fahad Enterprise: Gazipur",
  "Juthi Enterprise: Mawna",
  "S.A Enterprise: Mymensingh",
  "Orko Shop: Sherpur",
  "M Enterprise: Tangail",
  "Sumaiya & Suraiya Ent.: Netrokona",
  "SH Enterprise: Jamalpur",
  "Shahanaz Cosmetics: Kishorgonj",
  "RS Enterprise: Ghatail",
  "Brothers Enterprise: Rajshahi",
  "Sabbir Cosmetics: Chapainababgonj",
  "Sadiq Sabir Cosmetics: Bogura",
  "Sajeeb Store: Neogeon",
  "Mawantha Traders: Natore",
  "Sanaullah Trading Agency: Pabna",
  "Saad & Sinha: Sirajgonj",
  "Tiha Enterprise: Joypurhaat",
  "Arafat Traders: Sirajgonj",
  "Latif Store: Sirajgonj",
  "Islam Distribution : Rajshahi-CLOSED",
  "Apurbo Store: Neogeon",
  "Alam General Store: Rangpur",
  "Owais Enterprise: Rangpur",
  "Nishat Enterprise: Dinajpur",
  "Shatabdi Enterprise: Syedpur",
  "R.B Enterprise: Kurigram",
  "Sadia Enterprise: Lalmonirhaat",
  "Sohel Traders: Thakurgeon",
  "Bhattacharjo Strore: Thakurgoan",
  "Manik Enterprise: Gaibanda",
  "Parul Cosmetics: Gobindogonj",
  "Ruchita Cosmetics: Khulna",
  "Bhai Bhai Enterprise : Khulna",
  "Akhi Asma Biponi and Stationary: Jenaidah",
  "Tahsin Enterprise: Satkhira",
  "Makeup House: Kushtia",
  "Jannat Store: Jessore",
  "Tangil Traders: Meherpur",
  "Food Park & Coffee House: Chuadanga",
  "Chetona The Leather House: Jessore",
  "Mondol Traders: Rajbari",
  "R.M Traders: Dumoria, Khulna",
  "Rahman Cosmetics: Norail",
  "Biswas Store: Magura",
  "Betikrom Fasion: Kushtia",
  "Faruk Traders: Gulshan",
  "Harun Enterprise: Gulshan",
  "Ishika Enterprise: Fakirapool",
  "Nuraj Traders: Gulistan",
  "Tania Enterprise: Jatrabari",
  "Rahman Enterprise: Khilgaon",
  "Dream Traders: Keranigonj",
  "Tamim Enterprise: Narayangonj",
  "Muslim Enterprise: Sonargaon",
  "Jannat Traders: Munshigonj",
  "Maa Enterprise: Joypara Dohar",
  "Maa Varieties Store: Narayangonj#02",
  "Majharul Enterprise: Norshindi",
  "Bismillah Enterprise: Norshindi",
  "Usha Enterprise: Barisal",
  "Baba Mayer Dua Traders: Madaripur",
  "Raj Enterprise: Gopalgonj",
  "Jannati Enterprise : Bagerhat",
  "Mollah Distribution Point: Faridpur",
  "Giashuddin Ent: Shariatpur",
  "Maa Enterprise: Pirojpur",
  "Ashraf Store: Barguna",
  "Brothers International: Faridpur",
  "Sonali Store: Bhola",
  "Choiti Enterprise: Barisal",
  "Sabit Enterprise: Patuakhali",
  "S M Enterprise : Shibchar",
  "A.C Enterprise: Comilla",
  "Rajlaxmi Vandar: Maijdee, Noakhali",
  "Jamal Traders: Noakhali",
  "Tijarah United: Feni",
  "Tamim Enterprise : Chandpur",
  "Macca Enterprise: Laxsham",
  "Taqwa Enterprise: Laxipur",
  "Anowar & Ayan Sanitary House: Gauripur",
  "Prottasha Enterprise: Feni",
  "Rofik Enterprise: Laxsham",
  "Sazin Enterprise: Bancharampur",
  "Aban Fashion & Accessories: Sylhet",
  "MS Lalu Accessories: B-Baria",
  "Al Korim Trading & Distribution: Hobigonj",
  "Tuhi Store: Sylhet",
  "Tinni Enterprise: Moulvi Bazar, Sylhet",
  "Maa General Store: Muradfpur",
  "Priti Enterprise: Pahar Toli",
  "Bilash Biponi: Rangamati",
  "Bismilla Traders: Bondorthila",
  "Maa Babar Doa Enterprise: Khagrachori",
  "S.S Distribution: Cox's Bazar",
  "Rashid Enterprise: Reazuddin Bazar, Ctg",
  "Tafseer Enterprise: Reazuddin Bazar, Ctg",
  "Rahman Enterprise: Chittagong",
  "Riyad Enterprise: Shitakundo",
  "M.J Enterprise: Hathazari",
  "Rokeya Enterprise: Reazuddin Bazar",
  "N Huda & Sons: Reazuddin Bazar",
  "K.S Traders: Chittagong",
];


const ManageStock = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedOutlet, setSelectedOutlet] = useState(user?.outlet || "");
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (selectedOutlet) {
      fetchProducts();
    }
  }, [selectedOutlet, page, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let response;
      let fetchedProducts;

      if (searchQuery) {
        response = await axios.get(
          `https://gvi-pos-server.vercel.app/search-product?search=${searchQuery}&type=name`
        );
        fetchedProducts = response.data; // Search API returns a list directly
      } else {
        response = await axios.get(
          `https://gvi-pos-server.vercel.app/products?page=${page}`
        );
        fetchedProducts = response.data.products;
        setTotalPages(response.data.totalPages);
      }

      setProducts(fetchedProducts);

      // Fetch stock for each product
      const stockData = {};
      const stockRequests = fetchedProducts.map(async (product) => {
        try {
          const stockResponse = await axios.get(
            `https://gvi-pos-server.vercel.app/outlet-stock?barcode=${product.barcode}&outlet=${selectedOutlet}`
          );
          stockData[product.barcode] = stockResponse.data.stock || 0;
        } catch (error) {
          console.error(`Error fetching stock for ${product.barcode}:`, error);
          stockData[product.barcode] = 0;
        }
      });

      await Promise.all(stockRequests);
      setStocks(stockData);
    } catch (error) {
      console.error("Error fetching products or stocks:", error);
    }
    setLoading(false);
  };

  const handleStockChange = (barcode, value) => {
    setStocks((prevStocks) => ({
      ...prevStocks,
      [barcode]: value,
    }));
  };

  const updateStock = async (barcode) => {
    setUpdating(true);
    try {
      await axios.put("https://gvi-pos-server.vercel.app/update-outlet-stock", {
        barcode,
        outlet: selectedOutlet,
        newStock: stocks[barcode],
      });
      toast.success("Stock updated successfully");
      setUpdating(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
      setUpdating(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Manage Stock</h2>
        <div className="mb-4 flex justify-between items-center">
          {user.role === "super admin" && (
            <div>
              <label className="font-medium">Select Outlet: </label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="border rounded p-2 ml-2"
              >
                <option value="">Select an outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet} value={outlet}>
                    {outlet}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 ms-auto">
            <input
              type="text"
              placeholder="Search by product name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded w-64"
            />
            <button
              onClick={() => setSearchQuery(search)}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Outlet</th>
                  <th className="border p-2">Barcode</th>
                  <th className="border p-2">Product Name</th>
                  <th className="border p-2">Opening Stock</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.barcode} className="border">
                    <td className="border p-2">{selectedOutlet}</td>
                    <td className="border p-2">{product.barcode}</td>
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
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => updateStock(product.barcode)}
                        disabled={updating}
                        className="bg-green-500 hover:bg-gray-800 ease-in-out duration-200 text-white px-3 py-1 rounded-md"
                      >
                        {updating ? (
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
                          "Update Stock"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex gap-4 justify-center">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageStock;
