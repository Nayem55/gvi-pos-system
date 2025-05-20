import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../Component/AdminSidebar";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";

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
  const isAdmin = true;
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (user && selectedOutlet) {
      getStockValue(selectedOutlet); // Pass outlet name from the user object
    }
  }, [selectedOutlet]);

  const getStockValue = async (outletName) => {
    try {
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/api/stock-value/${outletName}`
      );
      const stockValue = response.data.totalCurrentDP;
      setStock({dp:response.data.totalCurrentDP,tp:response.data.totalCurrentTP}); // Update the stock state with the received value
    } catch (error) {
      console.error("Error fetching stock value:", error);
    }
  };

  const renderContent = () => {
    if (!selectedOutlet) {
      return (
        <div className="text-center text-red-500 font-medium mt-10">
          Please select an outlet to manage stock.
        </div>
      );
    }

    const outletUser = { ...user, outlet: selectedOutlet };

    switch (selectedTab) {
      case "opening":
        return <OpeningStock user={outletUser} stock={stock} setStock={setStock} getStockValue={getStockValue} />;
      case "primary":
        return <Primary user={outletUser} stock={stock} setStock={setStock} getStockValue={getStockValue} />;
      case "secondary":
        return <Secondary user={outletUser} stock={stock} setStock={setStock} getStockValue={getStockValue} />;
      case "officeReturn":
        return <OfficeReturn user={outletUser} stock={stock} setStock={setStock} getStockValue={getStockValue} />;
      case "marketReturn":
        return <MarketReturn user={outletUser} stock={stock} setStock={setStock} getStockValue={getStockValue} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Stock</h1>

          <div className="bg-white p-6 rounded-xl shadow-md">
            {isAdmin && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Select Outlet
                </label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => {
                    setSelectedOutlet(e.target.value);
                    setSelectedTab("");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose an outlet --</option>
                  {outlets.map((outlet) => (
                    <option key={outlet} value={outlet}>
                      {outlet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedOutlet && (
              <>
                <div className="mb-4 text-blue-600 font-semibold text-lg">
                  Total Stock Value (DP): ৳ {stock?.toFixed(2)}
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Select Stock Operation
                  </label>
                  <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Operation --</option>
                    <option value="opening">Opening Stock</option>
                    <option value="primary">Primary</option>
                    {/* <option value="secondary">Secondary</option> */}
                    <option value="officeReturn">Office Return</option>
                    <option value="marketReturn">Market Return</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Tab content */}
          {selectedTab && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              {renderContent()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageStock;
