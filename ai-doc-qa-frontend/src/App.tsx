import UploadCard from "./components/ui/UploadCard";
import Chat from "./components/ui/chat";

export default function App() {
  return (
    <div className="h-screen bg-background text-foreground p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <UploadCard />
      <div className="md:col-span-2 flex">
        <Chat />
      </div>
    </div>
  );
}
