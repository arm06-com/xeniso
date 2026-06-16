type AdBannerProps = {
  slot?: string;
  className?: string;
};

export default function AdBanner({
  slot = "ADVERTISEMENT",
  className = "",
}: AdBannerProps) {
  return (
    <div className={`my-8 flex justify-center ${className}`}>
      <div className="w-full min-h-22.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        {slot}
      </div>
    </div>
  );
}