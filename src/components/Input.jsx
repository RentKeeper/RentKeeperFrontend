export default function Input({ label, type, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
      />
    </div>
  );
}
