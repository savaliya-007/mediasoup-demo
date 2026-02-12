export default function Avatar({ name }) {
  const url = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;

  return (
    <div className="flex flex-col items-center bg-gray-900/70 border border-gray-700 backdrop-blur-xl rounded-2xl p-6 w-64 shadow-2xl">
      <img src={url} className="w-28 h-28 rounded-xl mb-4" alt="avatar" />
    </div>
  );
}
