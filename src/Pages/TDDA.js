import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const TDDA = () => {
    const user = JSON.parse(localStorage.getItem("pos-user"));
    const currentDate = dayjs();
    
    // Initial form state
    const initialFormData = {
        userId: user?._id || '',
        name: user?.name || '',
        designation: user?.role || '',
        area: user?.zone || '',
        target: '',
        secondary: '',
        collection: '',
        date: currentDate.format('YYYY-MM-DD'), // Format for date input
        month: currentDate.format('YYYY-MM'),    // Format for month input
        region: '',
        dailyExpenses: Array(31).fill({
            from: '',
            to: '',
            hq: '',
            exHq: '',
            transport: { bus: '', cng: '', train: '' },
            hotelBill: '',
            totalExpense: '',
            imsOnDay: ''
        }),
        summary: {
            totalWorkingDay: '',
            dailyAllowance: '',
            hotelBill: '',
            others: '',
            totalExpense: '',
            salary: '',
            grandTotalExpense: ''
        },
        sales: {
            primarySales: '',
            expensePercentSecondary: '',
            expensePercentPrimary: ''
        },
        signature: {
            employee: '',
            recommendedBy: '',
            approvedBy: ''
        }
    };

    const [formData, setFormData] = useState(initialFormData);

    // Set user data on component mount
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                userId: user._id,
                name: user.name,
                designation: user.role,
                area: user.zone
            }));
        }
    }, [user]);

    // Handle input changes for employee info
    const handleEmployeeInfoChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle daily expense changes
    const handleDailyExpenseChange = (dayIndex, field, value) => {
        const updatedExpenses = [...formData.dailyExpenses];
        
        if (field.includes('.')) {
            // Handle nested fields like transport.bus
            const [parent, child] = field.split('.');
            updatedExpenses[dayIndex] = {
                ...updatedExpenses[dayIndex],
                [parent]: {
                    ...updatedExpenses[dayIndex][parent],
                    [child]: value
                }
            };
        } else {
            updatedExpenses[dayIndex] = {
                ...updatedExpenses[dayIndex],
                [field]: value
            };
        }

        setFormData(prev => ({
            ...prev,
            dailyExpenses: updatedExpenses
        }));
    };

    // Handle summary changes
    const handleSummaryChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            summary: {
                ...prev.summary,
                [name]: value
            }
        }));
    };

    // Handle sales changes
    const handleSalesChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            sales: {
                ...prev.sales,
                [name]: value
            }
        }));
    };

    // Handle signature changes
    const handleSignatureChange = (type, value) => {
        setFormData(prev => ({
            ...prev,
            signature: {
                ...prev.signature,
                [type]: value
            }
        }));
    };

    // Calculate totals (you can expand this with actual calculations)
    const calculateTotals = () => {
        // Example calculation - you should implement your actual business logic here
        const totalExpense = formData.dailyExpenses.reduce((sum, day) => {
            return sum + (parseFloat(day.totalExpense) || 0);
        }, 0);

        setFormData(prev => ({
            ...prev,
            summary: {
                ...prev.summary,
                totalExpense: totalExpense.toFixed(2)
            }
        }));
    };

    // Submit form to backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Calculate any final totals before submission
            calculateTotals();

            const response = await fetch('https://gvi-pos-server.vercel.app/tdda', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pos-token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit TDDA form');
            }

            const result = await response.json();
            alert('TDDA form submitted successfully!');
            console.log('Submission result:', result);
            
            // Optionally reset form or redirect
            // setFormData(initialFormData);
            
        } catch (error) {
            console.error('Error submitting TDDA form:', error);
            alert('Error submitting form. Please try again.');
        }
    };

    // Fetch existing TDDA data (if editing)
    const fetchTDDA = async () => {
        try {
            const response = await fetch(`/api/tdda?userId=${user._id}&month=${formData.month}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('pos-token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    setFormData(data[0]); // Load the first matching TDDA record
                }
            }
        } catch (error) {
            console.error('Error fetching TDDA data:', error);
        }
    };

    // Load existing data for the current month on mount
    useEffect(() => {
        if (user?._id) {
            fetchTDDA();
        }
    }, [user?._id, formData.month]);

    return (
        <div className="bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg overflow-hidden p-6">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold">TA/DA BILL (RL)</h2>
                    </div>

                    {/* Employee Info */}
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Name:</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Target:</label>
                                <input 
                                    type="text" 
                                    name="target"
                                    value={formData.target}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Designation:</label>
                                <input 
                                    type="text" 
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Secondary:</label>
                                <input 
                                    type="text" 
                                    name="secondary"
                                    value={formData.secondary}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Area:</label>
                                <input 
                                    type="text" 
                                    name="area"
                                    value={formData.area}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Collection:</label>
                                <input 
                                    type="text" 
                                    name="collection"
                                    value={formData.collection}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Date:</label>
                                <input 
                                    type="date" 
                                    name="date"
                                    value={formData.date}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Month:</label>
                                <input 
                                    type="month" 
                                    name="month"
                                    value={formData.month}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="w-24 font-medium">Region:</label>
                                <input 
                                    type="text" 
                                    name="region"
                                    value={formData.region}
                                    onChange={handleEmployeeInfoChange}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Expense Table */}
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th rowSpan={2} className="border border-gray-300 p-2">Date</th>
                                    <th colSpan={2} className="border border-gray-300 p-2">Visited Place</th>
                                    <th rowSpan={2} className="border border-gray-300 p-2">HQ</th>
                                    <th rowSpan={2} className="border border-gray-300 p-2">Ex. HQ</th>
                                    <th colSpan={3} className="border border-gray-300 p-2">TRANSPORT BILL</th>
                                    <th rowSpan={2} className="border border-gray-300 p-2">Hotel Bill</th>
                                    <th rowSpan={2} className="border border-gray-300 p-2">Total Expense</th>
                                    <th rowSpan={2} className="border border-gray-300 p-2">IMS On Day</th>
                                </tr>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2">From</th>
                                    <th className="border border-gray-300 p-2">TO</th>
                                    <th className="border border-gray-300 p-2">Bus</th>
                                    <th className="border border-gray-300 p-2">CNG</th>
                                    <th className="border border-gray-300 p-2">Train</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.dailyExpenses.map((dayExpense, dayIndex) => (
                                    <tr key={dayIndex + 1}>
                                        <td className="border border-gray-300 p-2">{dayIndex + 1}</td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.from}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'from', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.to}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'to', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.hq}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'hq', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.exHq}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'exHq', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.transport.bus}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'transport.bus', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.transport.cng}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'transport.cng', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.transport.train}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'transport.train', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.hotelBill}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'hotelBill', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.totalExpense}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'totalExpense', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input 
                                                type="text" 
                                                value={dayExpense.imsOnDay}
                                                onChange={(e) => handleDailyExpenseChange(dayIndex, 'imsOnDay', e.target.value)}
                                                className="w-full border-none focus:ring-0 p-1" 
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={10} className="border border-gray-300 p-2 font-medium">Grand Total</td>
                                    <td className="border border-gray-300 p-2">{formData.summary.totalExpense}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Total Working Day</label>
                                <input 
                                    type="text" 
                                    name="totalWorkingDay"
                                    value={formData.summary.totalWorkingDay}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Daily Allowance</label>
                                <input 
                                    type="text" 
                                    name="dailyAllowance"
                                    value={formData.summary.dailyAllowance}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Hotel Bill</label>
                                <input 
                                    type="text" 
                                    name="hotelBill"
                                    value={formData.summary.hotelBill}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Others</label>
                                <input 
                                    type="text" 
                                    name="others"
                                    value={formData.summary.others}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Total Expense</label>
                                <input 
                                    type="text" 
                                    name="totalExpense"
                                    value={formData.summary.totalExpense}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Salary</label>
                                <input 
                                    type="text" 
                                    name="salary"
                                    value={formData.summary.salary}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Grand Total Expense</label>
                                <input 
                                    type="text" 
                                    name="grandTotalExpense"
                                    value={formData.summary.grandTotalExpense}
                                    onChange={handleSummaryChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Primary Sales</label>
                                <input 
                                    type="text" 
                                    name="primarySales"
                                    value={formData.sales.primarySales}
                                    onChange={handleSalesChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Expense % On Secondary</label>
                                <input 
                                    type="text" 
                                    name="expensePercentSecondary"
                                    value={formData.sales.expensePercentSecondary}
                                    onChange={handleSalesChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Expense % On Primary</label>
                                <input 
                                    type="text" 
                                    name="expensePercentPrimary"
                                    value={formData.sales.expensePercentPrimary}
                                    onChange={handleSalesChange}
                                    className="border border-gray-300 rounded px-3 py-2" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Signature</label>
                                <input 
                                    type="text" 
                                    value={formData.signature.employee}
                                    onChange={(e) => handleSignatureChange('employee', e.target.value)}
                                    className="h-16 border border-gray-300 rounded" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Recommended by</label>
                                <input 
                                    type="text" 
                                    value={formData.signature.recommendedBy}
                                    onChange={(e) => handleSignatureChange('recommendedBy', e.target.value)}
                                    className="h-16 border border-gray-300 rounded" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium mb-1">Approved By</label>
                                <input 
                                    type="text" 
                                    value={formData.signature.approvedBy}
                                    onChange={(e) => handleSignatureChange('approvedBy', e.target.value)}
                                    className="h-16 border border-gray-300 rounded" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-end">
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
                        >
                            Submit TA/DA Bill
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TDDA;