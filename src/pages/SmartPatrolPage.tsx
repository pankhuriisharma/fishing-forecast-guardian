
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Map as MapIcon, Ship, Gauge } from "lucide-react";

const RLGridExample = () => (
  <div className="relative p-4 max-w-lg mx-auto">
    <div className="grid grid-cols-6 gap-1 bg-blue-50 rounded-md border border-blue-200">
      {[...Array(36)].map((_, idx) => (
        <div
          key={idx}
          className={
            "w-9 h-9 flex items-center justify-center rounded border text-xs font-bold " +
            (idx === 0 ? "bg-green-100 border-green-300" : // base
            idx === 20 ? "bg-orange-100 border-orange-300" : // high-risk zone
            idx === 22 ? "bg-red-200 border-red-300 animate-pulse" : // caught illegal activity
            idx === 7 ? "bg-yellow-100 border-yellow-300" : // weather zone
            idx === 13 ? "bg-blue-200 border-blue-300" : // ocean
            idx === 5 ? "bg-gray-200 border-gray-300" : // edge
            "bg-white border-blue-100"
            )
          }
        >
          {(idx === 0) && <span title="Patrol Base"><Ship className="w-4 h-4 text-green-700" /></span>}
          {(idx === 20) && <span title="High Risk"><MapIcon className="w-4 h-4 text-orange-600" /></span>}
          {(idx === 22) && <span title="Illegal Activity"><Gauge className="w-4 h-4 text-red-700" /></span>}
        </div>
      ))}
    </div>
    <div className="mt-2 text-center text-xs text-slate-500">* Example grid: <span className="text-green-600">Base</span>, <span className="text-orange-500">Hotspot</span>, <span className="text-red-600">Detected event</span></div>
  </div>
);

const SmartPatrolPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          ← Back to Dashboard
        </Button>
        <div className="mb-4 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-ocean" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Smart Patrol AI: RL for Ocean Surveillance</h1>
        </div>
        <p className="text-lg text-slate-600 mb-6">
          Train an AI agent (like a virtual patrol boat or drone) to patrol oceans, maximizing illegal activity detection while minimizing costs.
        </p>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">🎯 Real-World Use Case</h2>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Coast guards leverage AI to plan efficient patrols using historical and real-time data</li>
            <li>Limited resources (fuel, vessel time) emphasize algorithmic efficiency</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">🧠 How It Works</h2>
          <div className="mb-3">
            <strong>1. Environment (State):</strong>
            <ul className="list-inside ml-4 text-slate-600">
              <li>Sea divided into a grid; each cell = predicted risk, weather, distance, etc.</li>
              <li>State: patrol location, remaining fuel/time</li>
            </ul>
            <RLGridExample />
          </div>
          <div className="mb-3">
            <strong>2. Actions:</strong>
            <ul className="list-inside ml-4 text-slate-600">
              <li>Move: North, South, East, West, Stay/Wait</li>
              <li>Return to base/refuel</li>
              <li>Trigger drone/alert (optional)</li>
            </ul>
          </div>
          <div className="mb-3">
            <strong>3. Rewards:</strong>
            <ul className="list-inside ml-4 text-slate-600">
              <li>+10 for patrolling high-risk zones</li>
              <li>+50 for catching illegal activity</li>
              <li>-10 for wasting fuel/time in low-risk areas</li>
              <li>-100 if running out of fuel before return</li>
            </ul>
          </div>
          <div className="mb-3">
            <strong>4. RL Algorithms:</strong>
            <ul className="list-inside ml-4 text-slate-600">
              <li>Q-learning, Deep Q-Networks (DQN) for grids</li>
              <li>Policy Gradients, PPO for complex or multi-agent settings</li>
            </ul>
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">🧱 Tech Stack Suggestion</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 bg-white rounded">
              <thead>
                <tr className="bg-ocean text-white">
                  <th className="p-2 text-left">Component</th>
                  <th className="p-2 text-left">Tool</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-2">RL Environment</td><td className="p-2">Custom (OpenAI Gym style)</td></tr>
                <tr><td className="p-2">RL Agent</td><td className="p-2">Stable-Baselines3 (PPO, DQN)</td></tr>
                <tr><td className="p-2">Training Data</td><td className="p-2">Your vessel/prediction dataset</td></tr>
                <tr><td className="p-2">Visualization</td><td className="p-2">Mapbox/Leaflet.js, animated overlays</td></tr>
                <tr><td className="p-2">Integration</td><td className="p-2">Python backend, REST API for patrol plans</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">🖼️ Bonus: Visual Output</h2>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>
              <strong>Animated patrol paths:</strong> See patrol strategies play out on a simulated map grid
            </li>
            <li>
              <strong>Heatmap overlay:</strong> Coverage vs detected illegal activity
            </li>
            <li>
              <strong>Efficiency score:</strong> "This plan covers 82% of hotspots using 68% of fuel"
            </li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">🔁 Future Enhancements</h2>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Multi-agent RL: Coordinate several patrol units</li>
            <li>Adversarial RL: Simulate smart, adaptive illegal actors</li>
            <li>Live re-training: Adapt as new patterns/data emerge</li>
          </ul>
        </section>
        <div className="flex justify-center">
          <Button size="lg" onClick={() => navigate("/")}>Return to Dashboard</Button>
        </div>
      </div>
    </div>
  );
};

export default SmartPatrolPage;
