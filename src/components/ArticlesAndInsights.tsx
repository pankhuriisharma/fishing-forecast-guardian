
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Newspaper, Globe, Brain } from "lucide-react";

const articles = [
  {
    title: "AI Powers New Era of Ocean Protection",
    description: "A roundup of how AI, remote sensing, and big data analytics are helping governments and NGOs track and prevent illegal fishing worldwide.",
    date: "2025-06-01",
    tag: "AI Innovation",
    icon: <Brain className="w-5 h-5 text-purple-600" />
  },
  {
    title: "Landmark Treaty for Marine Biodiversity",
    description: "Nations unite to sign historic high-seas treaty, aiming to safeguard endangered marine species and establish protected areas.",
    date: "2025-05-24",
    tag: "Global Efforts",
    icon: <Globe className="w-5 h-5 text-sky-600" />
  },
  {
    title: "Breaking Down: How FishGuard Detects Illegal Activity",
    description: "A deep dive into the machine learning techniques and models behind FishGuard’s predictive technology.",
    date: "2025-04-29",
    tag: "Inside FishGuard",
    icon: <Newspaper className="w-5 h-5 text-ocean" />
  },
  {
    title: "Ocean Conservation in 2025: Trends & Success Stories",
    description: "A look at community-driven initiatives, tech collaborations, and success stories inspiring future conservation movements.",
    date: "2025-05-12",
    tag: "Conservation",
    icon: <CalendarDays className="w-5 h-5 text-green-600" />
  },
];

const ArticlesAndInsights = () => {
  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-4 text-slate-800 flex gap-3 items-center">
        <Newspaper className="w-7 h-7 text-ocean" />
        Articles & Insights
      </h2>
      <p className="mb-8 text-slate-600 text-lg max-w-2xl">
        Stay informed with the latest in ocean conservation, AI innovation, and global efforts to combat illegal fishing.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, idx) => (
          <Card key={idx} className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              {article.icon}
              <div>
                <CardTitle className="text-base">{article.title}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(article.date).toLocaleDateString()}
                  <Badge variant="outline" className="ml-2">{article.tag}</Badge>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{article.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ArticlesAndInsights;
