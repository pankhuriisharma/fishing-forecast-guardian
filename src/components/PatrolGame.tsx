
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Flag, Ship, Flame } from "lucide-react";

const GRID_SIZE = 7;
const MAX_FUEL = 18;
const MAX_STEPS = 15;

type Cell = {
  risk: number; // 0 (low) – 1 (high)
  illegal: boolean; // if there's illegal activity
};

type Coords = { x: number; y: number };

function randomInt(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function generateGrid(): Cell[][] {
  // Generate 2D grid with randomized risks
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // Make a few random "hotspots"
      let risk = Math.random() < 0.12 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4;
      row.push({
        risk: +(risk.toFixed(2)),
        illegal: false,
      });
    }
    grid.push(row);
  }
  // Place several illegal activity spots in high-risk cells
  let placed = 0;
  while (placed < 4) {
    let y = randomInt(0, GRID_SIZE - 1);
    let x = randomInt(0, GRID_SIZE - 1);
    if (grid[y][x].risk > 0.7 && !grid[y][x].illegal) {
      grid[y][x].illegal = true;
      placed += 1;
    }
  }
  return grid;
}

const directions = [
  { name: "North", dx: 0, dy: -1, icon: "↑" },
  { name: "South", dx: 0, dy: 1, icon: "↓" },
  { name: "West", dx: -1, dy: 0, icon: "←" },
  { name: "East", dx: 1, dy: 0, icon: "→" },
  { name: "Stay", dx: 0, dy: 0, icon: "•" },
];

export default function PatrolGame() {
  const [grid, setGrid] = useState(() => generateGrid());
  const [boat, setBoat] = useState<Coords>({ x: 0, y: 0 });
  const [fuel, setFuel] = useState(MAX_FUEL);
  const [steps, setSteps] = useState(MAX_STEPS);
  const [score, setScore] = useState(0);
  const [visited, setVisited] = useState(new Set(["0,0"]));
  const [intercepted, setIntercepted] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Returns true if at base (0,0)
  const atBase = boat.x === 0 && boat.y === 0;

  // Memoized rendering of grid for perf
  const gameGrid = useMemo(() => {
    return grid.map((row, y) => (
      <div key={y} className="flex flex-row">
        {row.map((cell, x) => {
          const isBoat = boat.x === x && boat.y === y;
          const isBase = x === 0 && y === 0;
          const wasHere = visited.has(`${x},${y}`);
          let cellColor =
            cell.risk > 0.65
              ? "bg-red-200 border-red-500"
              : cell.risk > 0.35
              ? "bg-orange-100 border-orange-400"
              : "bg-blue-50 border-blue-200";
          if (isBoat && !isBase) cellColor += " ring-2 ring-sky-700 animate-pulse";
          if (isBase) cellColor = "bg-green-100 border-green-400";
          return (
            <div
              key={x}
              className={`relative w-10 h-10 md:w-12 md:h-12 border ${cellColor} flex items-center justify-center rounded-md m-0.5`}
            >
              {isBoat ? (
                <Ship className="text-sky-800 w-7 h-7 drop-shadow" />
              ) : null}
              {isBase && !isBoat ? (
                <Flag className="text-green-700 w-5 h-5 opacity-75" />
              ) : null}
              {!isBoat && !isBase && cell.risk > 0.65 && (
                <Flame className="absolute bottom-0 right-0 text-red-500 w-3 h-3 animate-bounce" />
              )}
              {/* Risk value */}
              <span className="absolute top-0 left-0 text-xs text-gray-500 p-0.5">
                {cell.risk >= 0.7 ? "🔥" : cell.risk >= 0.4 ? "⛱️" : ""}
              </span>
              {/* Already visited overlay */}
              {wasHere && !isBoat && (
                <span className="absolute inset-0 rounded-md bg-gray-300/30 pointer-events-none"></span>
              )}
            </div>
          );
        })}
      </div>
    ));
  }, [grid, boat, visited]);

  function move(dx: number, dy: number) {
    if (gameOver) return;
    if (fuel <= 0 || steps <= 0) {
      setGameOver(true);
      toast.error("You ran out of fuel or patrol steps!");
      return;
    }
    let newX = Math.max(0, Math.min(GRID_SIZE - 1, boat.x + dx));
    let newY = Math.max(0, Math.min(GRID_SIZE - 1, boat.y + dy));
    const coordKey = `${newX},${newY}`;
    setBoat({ x: newX, y: newY });
    setFuel(fuel - (dx !== 0 || dy !== 0 ? 1 : 0));
    setSteps(steps - 1);
    setVisited(prev => new Set(prev).add(coordKey));

    // Scoring logic
    const cell = grid[newY][newX];
    let reward = 0;
    if (cell.risk > 0.7) reward += 10;
    if (cell.illegal) {
      reward += 50;
      cell.illegal = false;
      setIntercepted(i => i + 1);
      toast.success("Intercepted illegal fishing!", { description: `+50 score for catching illegal fishing!` });
    }
    if (cell.risk < 0.3) reward -= 10;
    if ((dx !== 0 || dy !== 0) && cell.risk < 0.3) {
      toast.message("Wasted fuel in low-risk zone", { description: "-10 penalty" });
    }
    setScore(score + reward);

    // Out of fuel/steps or at base (end)
    if (fuel - 1 <= 0 || steps - 1 <= 0) {
      if (newX === 0 && newY === 0) {
        setGameOver(true);
        toast.success("Returned to base – Game finished!");
      } else {
        setGameOver(true);
        setScore(s => s - 100);
        toast.error("Ran out of fuel/patrol before returning to base! -100 penalty");
      }
    }
  }

  function restartGame() {
    setGrid(generateGrid());
    setBoat({ x: 0, y: 0 });
    setFuel(MAX_FUEL);
    setSteps(MAX_STEPS);
    setScore(0);
    setIntercepted(0);
    setVisited(new Set(["0,0"]));
    setGameOver(false);
  }

  return (
    <section className="mt-12 mb-16 w-full max-w-2xl mx-auto p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold text-ocean mb-2 flex items-center gap-2">
        <Ship className="w-7 h-7" />
        Ocean Patrol Minigame
      </h2>
      <p className="mb-2 text-gray-700">Can you maximize your patrol impact? Intercept as much illegal fishing as you can and return to base before you run out of fuel!</p>
      <div className="flex flex-wrap items-center gap-4 mb-3 text-base">
        <span className="px-2 py-1 bg-blue-100 rounded font-medium">Fuel: <span className={fuel <= 4 ? "text-red-500" : ""}>{fuel}</span></span>
        <span className="px-2 py-1 bg-slate-100 rounded font-medium">Steps left: <span className={steps <= 2 ? "text-red-500" : ""}>{steps}</span></span>
        <span className="px-2 py-1 bg-yellow-100 rounded font-medium">Score: <span className="text-yellow-700">{score}</span></span>
        <span className="px-2 py-1 bg-red-100 rounded font-medium">Catches: <span className="text-red-600">{intercepted}</span></span>
        <span className="px-2 py-1 bg-green-50 rounded font-medium">At base: <span className="text-green-700">{atBase ? "✔️" : "❌"}</span></span>
      </div>
      {!gameOver && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {directions.map(dir => (
            <Button
              key={dir.name}
              onClick={() => move(dir.dx, dir.dy)}
              size="sm"
              className="font-semibold"
              disabled={gameOver}
              variant={dir.name === "Stay" ? "secondary" : "default"}
            >
              {dir.icon} {dir.name}
            </Button>
          ))}
        </div>
      )}
      <div className="flex flex-col items-center my-3">
        {/* The game grid */}
        <div className="inline-block border-2 border-gray-300 bg-gradient-to-br from-blue-50 to-blue-200 rounded-lg p-2 shadow-lg mb-2">
          {gameGrid}
        </div>
        <div className="text-xs text-gray-600 flex flex-wrap gap-x-2">
          <span className="mr-2"><Flame className="inline w-3 h-3 text-red-500" /> High-risk cell</span>
          <span className="mr-2">⛱️ Medium-risk</span>
          <span className="mr-2">Blue = low risk</span>
          <span className="mr-2"><Flag className="inline w-3 h-3 text-green-600" /> Base</span>
          <span className="mr-2"><Ship className="inline w-3 h-3 text-sky-800" /> Boat</span>
        </div>
      </div>
      {gameOver && (
        <div className="my-3">
          <p className="font-black text-lg text-ocean">{score >= 50 ? "Mission success!" : score > 0 ? "Decent effort!" : "Mission failed."}</p>
          <p className="mb-2 text-gray-800">
            Final score: <span className="font-bold">{score}</span>
            {" "}(Catches: {intercepted})
          </p>
          <Button onClick={restartGame} size="lg" className="bg-ocean hover:bg-ocean-dark text-white font-bold mt-1">
            Restart Game
          </Button>
        </div>
      )}
    </section>
  );
}
