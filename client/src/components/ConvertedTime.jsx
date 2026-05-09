export default function ConvertedTime({ convertedTime, toTZ }) {
  if (!convertedTime) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
      <span className="font-medium">Converted Time: </span>
      {convertedTime} <span className="text-green-600">({toTZ})</span>
    </div>
  );
}
