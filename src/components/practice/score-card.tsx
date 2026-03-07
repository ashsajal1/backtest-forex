import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  label: string;
  score: { correct: number; total: number };
  accuracy: number;
}

export default function ScoreCard({ label, score, accuracy }: ScoreCardProps) {
  return (
    <Card className="px-2 sm:px-4 py-2 min-w-[90px] sm:min-w-[110px]">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          {label}
        </Badge>
        <div className="text-right">
          <div className="font-bold text-sm">
            {score.correct}/{score.total}
          </div>
          <div
            className={`text-xs ${
              accuracy >= 60
                ? "text-green-500"
                : accuracy >= 40
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            {accuracy}%
          </div>
        </div>
      </div>
      {score.total > 0 && <Progress value={accuracy} className="h-1 mt-2" />}
    </Card>
  );
}
