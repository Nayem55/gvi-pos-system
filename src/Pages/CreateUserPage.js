import { useState, useEffect } from "react";
import axios from "axios";
import { PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const CreateUserPage = () => {
  const [newUser, setNewUser] = useState({
    name: "",
    number: "",
    password: "",
    role: "",
    group: "",
    zone: "",
    outlet: "",
    asm: "",
    rsm: "",
    som: "",
  });
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    roles: ["SO", "ASM", "RSM", "SOM"], // Hardcoded roles
    groups: [],
    zones: [],
    outlets: [],
    asms: [],
    rsms: [],
    soms: []
  });
  const [fetchingData, setFetchingData] = useState({
    groups: false,
    zones: false,
    outlets: false,
    asms: false,
    rsms: false,
    soms: false
  });

  // Fetch dropdown data when component mounts
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch groups
        setFetchingData(prev => ({...prev, groups: true}));
        const groups = await axios.get("https://gvi-pos-server.vercel.app/get-user-field-values?field=group");
        setDropdownData(prev => ({...prev, groups: groups.data}));

        // Fetch zones
        setFetchingData(prev => ({...prev, zones: true}));
        const zones = await axios.get("https://gvi-pos-server.vercel.app/get-user-field-values?field=zone");
        setDropdownData(prev => ({...prev, zones: zones.data}));

        // Fetch outlets
        setFetchingData(prev => ({...prev, outlets: true}));
        const outlets = await axios.get("https://gvi-pos-server.vercel.app/get-outlets");
        setDropdownData(prev => ({...prev, outlets: outlets.data}));

        // Fetch ASMs
        setFetchingData(prev => ({...prev, asms: true}));
        const asms = await axios.get("https://gvi-pos-server.vercel.app/get-user-field-values?field=asm");
        setDropdownData(prev => ({...prev, asms: asms.data}));

        // Fetch RSMs
        setFetchingData(prev => ({...prev, rsms: true}));
        const rsms = await axios.get("https://gvi-pos-server.vercel.app/get-user-field-values?field=rsm");
        setDropdownData(prev => ({...prev, rsms: rsms.data}));

        // Fetch SOMs
        setFetchingData(prev => ({...prev, soms: true}));
        const soms = await axios.get("https://gvi-pos-server.vercel.app/get-user-field-values?field=som");
        setDropdownData(prev => ({...prev, soms: soms.data}));

      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown options");
      } finally {
        setFetchingData({
          groups: false,
          zones: false,
          outlets: false,
          asms: false,
          rsms: false,
          soms: false
        });
      }
    };

    fetchDropdownData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("https://gvi-pos-server.vercel.app/api/users", newUser);
      toast.success("User created successfully!");
      setNewUser({
        name: "",
        number: "",
        password: "",
        role: "",
        group: "",
        zone: "",
        outlet: "",
        asm: "",
        rsm: "",
        som: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  // Helper component for dropdown fields
  const DropdownField = ({ label, field, options, isLoading }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      {isLoading ? (
        <select className="w-full p-2 border rounded bg-gray-100" disabled>
          <option>Loading {label}...</option>
        </select>
      ) : (
        <select
          value={newUser[field]}
          onChange={(e) => setNewUser({...newUser, [field]: e.target.value})}
          className="w-full p-2 border rounded"
          required={field === 'role'} // Make role required
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Create New User</h2>

        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text input fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={newUser.number}
                onChange={(e) => setNewUser({...newUser, number: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Dropdown fields */}
            <DropdownField
              label="Role"
              field="role"
              options={dropdownData.roles}
              isLoading={false} // Hardcoded, no loading
            />

            <DropdownField
              label="Group"
              field="group"
              options={dropdownData.groups}
              isLoading={fetchingData.groups}
            />

            <DropdownField
              label="Zone"
              field="zone"
              options={dropdownData.zones}
              isLoading={fetchingData.zones}
            />

            <DropdownField
              label="Outlet"
              field="outlet"
              options={dropdownData.outlets}
              isLoading={fetchingData.outlets}
            />

            <DropdownField
              label="ASM"
              field="asm"
              options={dropdownData.asms}
              isLoading={fetchingData.asms}
            />

            <DropdownField
              label="RSM"
              field="rsm"
              options={dropdownData.rsms}
              isLoading={fetchingData.rsms}
            />

            <DropdownField
              label="SOM"
              field="som"
              options={dropdownData.soms}
              isLoading={fetchingData.soms}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            <PlusCircle size={18} />
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;