export default function Header({ title, room }) {
  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between">
      <h2 className="font-bold">{title}</h2>
      <span>Room: {room}</span>
    </div>
  );
}
