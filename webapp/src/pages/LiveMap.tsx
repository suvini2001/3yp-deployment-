import BottomNav from "@/components/BottomNav";
import MapComponent from "@/components/Map";
import PageHeader from "@/components/PageHeader";

const LiveMap = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <PageHeader title="Live Map" />
      <main className="flex-1 overflow-hidden">
        <MapComponent markers={[]} />
      </main>
      <BottomNav />
    </div>
  );
};

export default LiveMap;
